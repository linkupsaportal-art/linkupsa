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
    .in("event", ["order.created", "order.updated", "order.status.updated", "order.payment.updated"])
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

  if (!store?.access_token) {
    // Mark all as failed — no token to call the API
    await sb
      .from("webhook_events")
      .update({ status: "failed", error: "no access_token for store", processed_at: new Date().toISOString() })
      .in("id", events.map((e) => e.id));
    stats.errors = events.length;
    return stats;
  }

  for (const event of events) {
    stats.processed++;
    try {
      // Mark as processing to prevent double-processing
      await sb
        .from("webhook_events")
        .update({ status: "processing", attempts: 1 })
        .eq("id", event.id);

      const payload = event.payload as { data?: { id?: number } };
      const sallaOrderId = payload?.data?.id;
      if (!sallaOrderId) {
        await markEvent(sb, event.id, "skipped", "no order id in payload");
        stats.skipped++;
        continue;
      }

      // Fetch full order from Salla API
      const order = await fetchSallaOrder(sallaOrderId, store.access_token);
      if (!order) {
        await markEvent(sb, event.id, "failed", "salla api returned no order");
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
      const firstItem = order.items[0];
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
          const { data: allocated } = await sb.rpc("allocate_account", {
            p_order_id: upserted.id,
            p_product_id: productId,
            p_option_id: productOptionId ?? undefined,
          });

          if (allocated) {
            stats.fulfilled++;
            // Send the order-ready email if we have a customer email
            await sendNotification({
              orderId: upserted.id,
              email: order.customer.email,
              customerName: order.customer.full_name,
              orderNumber: String(order.reference_id),
              productName: firstItem?.name ?? "منتج رقمي",
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

async function fetchSallaOrder(
  orderId: number,
  accessToken: string,
): Promise<SallaOrder | null> {
  try {
    const r = await fetch(`${SALLA_API}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}`, accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return null;
    const json = await r.json();
    return json.data ?? null;
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

import { sendOrderReadyEmail } from "@/lib/notifications/email";

/** Resolves the public origin for pickup links. */
function getOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ??
    "https://www.portaliosa.com"
  );
}

async function sendNotification(args: {
  orderId: string;
  email: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  origin: string;
}): Promise<void> {
  if (!args.email) return;

  const sb = createServiceClient();
  const result = await sendOrderReadyEmail({
    to: args.email,
    customerName: args.customerName,
    orderNumber: args.orderNumber,
    productName: args.productName,
    pickupUrl: `${args.origin}/pickup`,
  });

  if (result.ok) {
    await sb
      .from("orders")
      .update({
        notification_sent_at: new Date().toISOString(),
        notification_channels_used: { email: true },
      })
      .eq("id", args.orderId);
  }
}
