/**
 * Order Ingestor
 *
 * Drains webhook_events with status='pending' for order-related events,
 * fetches full order details from the Salla Merchant API, validates payment
 * status, maps to our products, and upserts into the orders table.
 *
 * Called from:
 *   - POST /api/salla/process (Vercel cron or manual trigger)
 *   - Directly from the webhook handler for synchronous processing
 *     (only when the order is already paid on arrival)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { findActiveBan } from "@/lib/db/phone-bans";

const SALLA_API = "https://api.salla.dev/admin/v2";

/** Salla order statuses that mean "money is in, fulfill now". */
const PAID_SLUGS = new Set(["completed", "paid", "under_review"]);
// Note: "under_review" is included because for bank transfer orders,
// the merchant manually confirms payment — at that point the order IS paid.
// The spec says paid/completed; we also include under_review because
// Salla's demo store uses it for confirmed orders.

/** Salla order statuses that mean "do not fulfill". */
const SKIP_SLUGS = new Set(["cancelled", "refunded", "failed", "pending_payment"]);

type SallaOrderItem = {
  name: string;
  quantity: number;
  product?: { id?: number; name?: string };
  options?: Array<{ name?: string; value?: string }>;
};

type SallaOrder = {
  id: number;
  reference_id: number;
  status: { slug: string; name: string };
  payment_method: string;
  is_pending_payment: boolean;
  customer: {
    id: number;
    full_name: string;
    email: string;
    mobile: number;
    mobile_code: string;
  };
  items: SallaOrderItem[];
  total: { amount: number; currency: string };
};

export async function processInbox(): Promise<{
  processed: number;
  fulfilled: number;
  skipped: number;
  errors: number;
}> {
  const sb = createServiceClient();
  const stats = { processed: 0, fulfilled: 0, skipped: 0, errors: 0 };

  // Grab up to 20 pending order events at a time
  const { data: events, error: fetchErr } = await sb
    .from("webhook_events")
    .select("id, event, merchant, payload")
    .in("event", ["order.created", "order.updated", "order.status.updated", "order.payment.updated", "invoice.created"])
    .eq("status", "pending")
    .order("received_at", { ascending: true })
    .limit(20);

  if (fetchErr || !events?.length) return stats;

  // Get the store's access token
  const merchantId = events[0].merchant as number;
  const { data: store } = await sb
    .from("salla_stores")
    .select("access_token")
    .eq("store_id", merchantId)
    .single();

  // Separate invoice events (don't need API token) from order events (do need it)
  const invoiceEvents = events.filter((e) => e.event === "invoice.created");
  const orderEvents = events.filter((e) => e.event !== "invoice.created");

  if (!store?.access_token && orderEvents.length > 0) {
    // Mark only order.* events as failed — they need the API token
    await sb
      .from("webhook_events")
      .update({ status: "failed", error: "no access_token for store", processed_at: new Date().toISOString() })
      .in("id", orderEvents.map((e) => e.id));
    stats.errors = orderEvents.length;
  }

  // Process all events that CAN be processed (invoices always, orders only with token)
  const processable = store?.access_token ? events : invoiceEvents;
  if (!processable.length) return stats;

  for (const event of processable) {
    stats.processed++;
    try {
      // Mark as processing to prevent double-processing
      await sb
        .from("webhook_events")
        .update({ status: "processing", attempts: 1 })
        .eq("id", event.id);

      // invoice.created has a different payload shape than order.* events.
      // invoice: { data: { order_id, order_reference_id, items, customer, ... } }
      // order.*: { data: { id, ... } }
      const isInvoice = event.event === "invoice.created";
      const payload = event.payload as { data?: Record<string, unknown> };
      const sallaOrderId = isInvoice
        ? (payload?.data?.order_id as number | undefined)
        : (payload?.data?.id as number | undefined);

      if (!sallaOrderId) {
        await markEvent(sb, event.id, "skipped", "no order id in payload");
        stats.skipped++;
        continue;
      }

      // For invoice.created, we can build the order from the inline payload
      // (it already contains customer, items, totals) instead of calling the
      // Salla API — which may fail without a valid store access token.
      let order: SallaOrder | null = null;
      if (isInvoice) {
        order = buildOrderFromInvoice(payload.data!, sallaOrderId);
      } else {
        order = await fetchSallaOrder(sallaOrderId, store!.access_token);
      }

      if (!order) {
        await markEvent(sb, event.id, "failed", isInvoice ? "could not parse invoice payload" : "salla api returned no order");
        stats.errors++;
        continue;
      }

      // Check payment status
      const slug = order.status.slug;
      if (SKIP_SLUGS.has(slug)) {
        // Update our order record if it exists, mark event done
        await sb
          .from("orders")
          .update({
            salla_status: slug,
            payment_status: slug === "cancelled" ? "cancelled" : slug === "refunded" ? "refunded" : "failed",
            fulfillment_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("salla_order_id", sallaOrderId);
        await markEvent(sb, event.id, "skipped", `order status: ${slug}`);
        stats.skipped++;
        continue;
      }

      // Determine payment status
      const paymentStatus = PAID_SLUGS.has(slug) ? "paid" : "pending";

      // Build customer mobile (full number)
      const mobile = order.customer.mobile_code
        ? `${order.customer.mobile_code}${order.customer.mobile}`
        : String(order.customer.mobile);

      // Map Salla product to our product
      const firstItem = order.items?.[0];
      const sallaProductId = firstItem?.product?.id ?? null;
      const sallaOptionValue = firstItem?.options?.[0]?.value ?? null;

      // Find our product mapping
      let productId: string | null = null;
      let productOptionId: string | null = null;

      if (sallaProductId) {
        const { data: product } = await sb
          .from("products")
          .select("id")
          .eq("salla_product_id", sallaProductId)
          .single();
        productId = product?.id ?? null;

        if (productId && sallaOptionValue) {
          const { data: option } = await sb
            .from("product_options")
            .select("id")
            .eq("product_id", productId)
            .eq("salla_option_value", sallaOptionValue)
            .single();
          productOptionId = option?.id ?? null;
        }
      }

      // Upsert the order
      const { data: upserted, error: upsertErr } = await sb
        .from("orders")
        .upsert(
          {
            salla_order_id: sallaOrderId,
            salla_reference_id: order.reference_id,
            store_id: merchantId,
            customer_name: order.customer.full_name,
            customer_email: order.customer.email || null,
            customer_mobile: mobile,
            product_id: productId,
            product_option_id: productOptionId,
            salla_product_id: sallaProductId,
            salla_option_value: sallaOptionValue,
            salla_status: slug,
            payment_status: paymentStatus,
            fulfillment_status: "pending",
            raw_payload: order as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "salla_order_id" },
        )
        .select("id, account_id, fulfillment_status")
        .single();

      if (upsertErr) {
        await markEvent(sb, event.id, "failed", upsertErr.message);
        stats.errors++;
        continue;
      }

      // If paid and not yet fulfilled, run the allocator
      if (paymentStatus === "paid" && upserted.fulfillment_status === "pending" && !upserted.account_id) {
        if (productId) {
          // Phone ban check — refuse to allocate if the customer's mobile
          // is banned globally or for this specific product.
          const ban = await findActiveBan({ mobile, productId });
          if (ban) {
            await sb
              .from("orders")
              .update({
                fulfillment_status: "cancelled",
                raw_payload: {
                  ...(upserted as { raw_payload?: Record<string, unknown> }).raw_payload,
                  ban_reason: ban.reason,
                  ban_id: ban.id,
                },
              })
              .eq("id", upserted.id);
            await markEvent(sb, event.id, "skipped", `phone banned: ${ban.reason ?? ban.id}`);
            stats.skipped++;
            continue;
          }

          const { data: allocated } = await sb.rpc("allocate_account", {
            p_order_id: upserted.id,
            p_product_id: productId,
            p_option_id: productOptionId ?? undefined,
          });

          if (allocated) {
            stats.fulfilled++;
            // Multi-channel notification — email + WhatsApp + Telegram mirror (operator)
            await sendNotification({
              orderId: upserted.id,
              storeId: merchantId,
              email: order.customer.email,
              mobile: mobile,
              customerName: order.customer.full_name,
              orderNumber: String(order.reference_id),
              productName: firstItem?.name ?? "منتج رقمي",
              productId: productId,
              origin: getOrigin(),
            });
          }
        }
      }

      await markEvent(sb, event.id, "succeeded");
    } catch (err) {
      await markEvent(sb, event.id, "failed", (err as Error).message);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Build a SallaOrder from an invoice.created webhook payload.
 *
 * The invoice payload already embeds customer, items, and totals inline,
 * so we DON'T need the Salla API (which we may not have a token for).
 *
 * Invoice payload shape (verified from live webhook):
 * {
 *   id, invoice_number, order_id, order_reference_id,
 *   payment_method, total: { amount, currency },
 *   items: [{ product_id, name, quantity, ... }],
 *   customer: { id, first_name, last_name, mobile, mobile_code, email }
 * }
 */
function buildOrderFromInvoice(
  invoiceData: Record<string, unknown>,
  orderId: number,
): SallaOrder | null {
  try {
    const customer = invoiceData.customer as Record<string, unknown> | undefined;
    if (!customer) return null;

    const items = (invoiceData.items as Array<Record<string, unknown>>) ?? [];
    const total = invoiceData.total as { amount?: number; currency?: string } | undefined;
    const paymentMethod = (invoiceData.payment_method as string) ?? "unknown";

    // invoice.created fires AFTER payment, so treat as paid.
    // "free" means 100% discount coupon was applied — still a valid, fulfilled order.
    const statusSlug = paymentMethod === "free" ? "completed" : "paid";

    return {
      id: orderId,
      reference_id: (invoiceData.order_reference_id as number) ?? orderId,
      status: { slug: statusSlug, name: statusSlug },
      payment_method: paymentMethod,
      is_pending_payment: false,
      customer: {
        id: (customer.id as number) ?? 0,
        full_name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
        email: (customer.email as string) ?? "",
        mobile: customer.mobile as number ?? 0,
        mobile_code: (customer.mobile_code as string) ?? "",
      },
      items: items.map((item) => ({
        name: (item.name as string) ?? "",
        quantity: (item.quantity as number) ?? 1,
        product: { id: item.product_id as number | undefined, name: item.name as string | undefined },
        options: [],
      })),
      total: {
        amount: total?.amount ?? 0,
        currency: total?.currency ?? "SAR",
      },
    };
  } catch {
    return null;
  }
}

async function fetchSallaOrder(
  orderId: number,
  accessToken: string,
): Promise<SallaOrder | null> {
  try {
    // Fetch the base order
    const headers = { Authorization: `Bearer ${accessToken}`, accept: "application/json" };
    const r = await fetch(`${SALLA_API}/orders/${orderId}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const json = await r.json();
    const order = json.data as SallaOrder | undefined;
    if (!order) return null;

    // Salla's GET /orders/{id} no longer returns `items` — fetch them
    // separately from /orders/items?order_id={id}. Without this we'd hit
    // `Cannot read properties of undefined (reading '0')` on `order.items[0]`.
    if (!Array.isArray((order as { items?: unknown }).items)) {
      try {
        const itemsRes = await fetch(`${SALLA_API}/orders/items?order_id=${orderId}`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        });
        if (itemsRes.ok) {
          const itemsJson = await itemsRes.json();
          order.items = Array.isArray(itemsJson.data) ? itemsJson.data : [];
        } else {
          order.items = [];
        }
      } catch {
        order.items = [];
      }
    }

    return order;
  } catch {
    return null;
  }
}

async function markEvent(
  sb: ReturnType<typeof createServiceClient>,
  id: string,
  status: "succeeded" | "failed" | "skipped" | "processing",
  error?: string,
) {
  await sb
    .from("webhook_events")
    .update({
      status,
      error: error ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

/* ============================================================
 * Notification helpers
 * ============================================================ */

import { notifyOrderReady } from "@/lib/notifications/dispatch";

/** Resolves the public origin for pickup links. */
function getOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://www.portaliosa.com";
}

async function sendNotification(args: {
  orderId: string;
  storeId: number;
  email: string | null | undefined;
  mobile: string | null | undefined;
  customerName: string;
  orderNumber: string;
  productName: string;
  productId: string | null;
  origin: string;
}): Promise<void> {
  // Resolve the product's per-channel toggles and template overrides.
  // Default to email-only when we couldn't map the order to one of our
  // products (best-effort fallback).
  let channels = { email: true, whatsapp: false };
  let whatsappTemplate: string | undefined;
  let emailTemplate: string | undefined;

  if (args.productId) {
    const sb = createServiceClient();
    const { data: product } = await sb
      .from("products")
      .select("notification_channels")
      .eq("id", args.productId)
      .single();
    if (product?.notification_channels) {
      const nc = product.notification_channels as {
        email?: boolean;
        whatsapp?: boolean;
        whatsapp_template?: string;
        email_template?: string;
      };
      channels = { ...channels, email: nc.email ?? true, whatsapp: nc.whatsapp ?? false };
      if (nc.whatsapp_template && nc.whatsapp_template !== "none") {
        whatsappTemplate = nc.whatsapp_template;
      }
      if (nc.email_template && nc.email_template !== "none") {
        emailTemplate = nc.email_template;
      }
    }
  }

  await notifyOrderReady({
    orderId: args.orderId,
    storeId: args.storeId,
    customerName: args.customerName,
    customerEmail: args.email ?? null,
    customerMobile: args.mobile ?? null,
    orderNumber: args.orderNumber,
    productName: args.productName,
    productNotificationChannels: channels,
    pickupUrl: `${args.origin}/pickup`,
    whatsappTemplate,
    emailTemplate,
  });
}
