import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderReadyEmail } from "./email";
import { sendKarzounWhatsApp } from "./whatsapp-karzoun";

/**
 * Multi-channel notification dispatcher.
 *
 * Per-product channel toggles live on `products.notification_channels`
 * (jsonb shape: `{email, whatsapp, sms, telegram}`). Per-store provider
 * credentials live on `notification_channels` table, one row per channel.
 *
 * The dispatcher fans out to every enabled+configured channel and records
 * which channels actually fired on `orders.notification_channels_used`.
 *
 * Failures on one channel never block the others — best-effort delivery
 * is the right policy here. If WhatsApp fails the customer still gets the
 * email; if both fail the admin sees red flags in the orders table and
 * can manually resend.
 */

export type NotifyArgs = {
  orderId: string;
  storeId: number;
  customerName: string;
  customerEmail: string | null;
  customerMobile: string | null;
  orderNumber: string;
  productName: string;
  productNotificationChannels: {
    email?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
    telegram?: boolean;
  };
  pickupUrl: string;
};

export type NotifyResult = {
  attempted: string[];
  succeeded: string[];
  failed: Array<{ channel: string; error: string }>;
};

export async function notifyOrderReady(args: NotifyArgs): Promise<NotifyResult> {
  const result: NotifyResult = { attempted: [], succeeded: [], failed: [] };
  const sb = createServiceClient();

  // Resolve which channels to attempt. A channel runs only if BOTH:
  //   - the product has it enabled (`product.notification_channels.<key>`)
  //   - the store has it configured + enabled (`notification_channels` row)
  const channels: Array<"email" | "whatsapp" | "sms" | "telegram"> = [];
  if (args.productNotificationChannels.email && args.customerEmail) channels.push("email");
  if (args.productNotificationChannels.whatsapp && args.customerMobile) channels.push("whatsapp");
  if (args.productNotificationChannels.sms && args.customerMobile) channels.push("sms");
  if (args.productNotificationChannels.telegram) channels.push("telegram");

  if (channels.length === 0) return result;

  // Fetch store-level provider configs in one shot
  const { data: configs } = await sb
    .from("notification_channels")
    .select("channel, enabled, config")
    .eq("store_id", args.storeId)
    .in("channel", channels);

  const configByChannel = new Map<string, Record<string, unknown>>();
  for (const row of configs ?? []) {
    if (row.enabled) {
      configByChannel.set(row.channel as string, (row.config as Record<string, unknown>) ?? {});
    }
  }

  // ─── Email ──────────────────────────────────────────────────────────────
  if (channels.includes("email") && args.customerEmail) {
    result.attempted.push("email");
    const r = await sendOrderReadyEmail({
      to: args.customerEmail,
      customerName: args.customerName,
      orderNumber: args.orderNumber,
      productName: args.productName,
      pickupUrl: args.pickupUrl,
    });
    r.ok ? result.succeeded.push("email") : result.failed.push({ channel: "email", error: r.error ?? "unknown" });
  }

  // ─── WhatsApp via Karzoun Chat ──────────────────────────────────────────
  if (channels.includes("whatsapp") && args.customerMobile) {
    result.attempted.push("whatsapp");
    const cfg = configByChannel.get("whatsapp");
    const appToken = cfg?.app_token as string | undefined;
    const integrationId = cfg?.integration_id as string | undefined;
    const host = cfg?.host as string | undefined;
    const defaultTemplate = (cfg?.default_template as string | undefined) ?? "order_cancel";
    const language = (cfg?.language as string | undefined) ?? "ar";
    // Per-template positional param mapping. Keys are template names; values
    // are arrays of placeholder positions matching `{{1}} {{2}} ...` order.
    // The dispatcher fills this from the order at runtime.
    const paramMap = (cfg?.param_map as Record<string, string[]> | undefined) ?? {
      // Default mapping for the merchant's `order_cancel` template:
      //   1 = customer name, 2 = order#, 3 = product, 4 = pickup link, 5 = ""
      // (we abuse the cancel template as the only working positional one)
      order_cancel: [
        "customer_name",
        "order_number",
        "product_name",
        "pickup_url",
        "store_name",
      ],
    };

    if (cfg?.provider !== "karzoun" || !appToken || !integrationId) {
      result.failed.push({ channel: "whatsapp", error: "Karzoun Chat not configured for this store" });
    } else {
      // Source values for placeholder substitution.
      const src: Record<string, string> = {
        customer_name: args.customerName,
        order_number: args.orderNumber,
        product_name: args.productName,
        pickup_url: args.pickupUrl,
        store_name: "PortalIosa",
      };
      const positions = paramMap[defaultTemplate] ?? [
        "customer_name",
        "order_number",
        "product_name",
        "pickup_url",
        "store_name",
      ];
      const params = positions.map((k) => src[k] ?? "");

      const r = await sendKarzounWhatsApp({
        to: args.customerMobile,
        params,
        template: defaultTemplate,
        config: { host, appToken, integrationId, defaultTemplate, language },
      });
      r.ok ? result.succeeded.push("whatsapp") : result.failed.push({ channel: "whatsapp", error: r.error });
    }
  }

  // ─── SMS / Telegram ─────────────────────────────────────────────────────
  // SMS still stubbed (Sprint 3 wires Unifonic / Mobily).
  if (channels.includes("sms")) {
    result.failed.push({ channel: "sms", error: "SMS provider not yet wired" });
  }

  if (channels.includes("telegram")) {
    result.attempted.push("telegram");
    const tg = configByChannel.get("telegram");
    const botToken = tg?.bot_token as string | undefined;
    const chatId = tg?.chat_id as string | undefined;
    const mirror = (tg?.mirror_orders as boolean | undefined) ?? true;
    if (!botToken || !chatId) {
      result.failed.push({ channel: "telegram", error: "Telegram bot not configured" });
    } else if (!mirror) {
      // Channel exists but mirroring disabled; treat as a no-op success.
      result.succeeded.push("telegram");
    } else {
      const { sendTelegramMessage } = await import("./telegram");
      const text = renderTelegramOrderText({
        customerName: args.customerName,
        orderNumber: args.orderNumber,
        productName: args.productName,
        pickupUrl: args.pickupUrl,
      });
      const r = await sendTelegramMessage({
        text,
        config: { botToken, chatId },
        buttons: [{ text: "📦 صفحة الاستلام", url: args.pickupUrl }],
      });
      r.ok
        ? result.succeeded.push("telegram")
        : result.failed.push({ channel: "telegram", error: r.error });
    }
  }

  // Persist what fired so admin can see it on the orders page
  await sb
    .from("orders")
    .update({
      notification_sent_at: new Date().toISOString(),
      notification_channels_used: {
        attempted: result.attempted,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    })
    .eq("id", args.orderId);

  return result;
}

/**
 * Localized WhatsApp body — kept for reference if we wire a free-text
 * provider later. Karzoun Chat's GraphQL API only accepts pre-approved
 * templates with positional params, so this body isn't sent today.
 */
function renderWhatsAppText(args: {
  customerName: string;
  orderNumber: string;
  productName: string;
  pickupUrl: string;
}): string {
  return [
    `مرحباً ${args.customerName} 👋`,
    "",
    `طلبك #${args.orderNumber} جاهز للاستلام ✅`,
    `المنتج: ${args.productName}`,
    "",
    "اضغط على الرابط أدناه لاستلام بيانات حسابك:",
    args.pickupUrl,
    "",
    "ملاحظة: لا تشارك بيانات الحساب مع أحد.",
  ].join("\n");
}

/**
 * Telegram HTML message body for the merchant mirror feed. Plain HTML
 * is the safest parse mode here — escapes are minimal and emoji pass
 * through cleanly.
 */
function renderTelegramOrderText(args: {
  customerName: string;
  orderNumber: string;
  productName: string;
  pickupUrl: string;
}): string {
  const safeName = escapeHtml(args.customerName || "—");
  const safeOrder = escapeHtml(args.orderNumber || "—");
  const safeProduct = escapeHtml(args.productName || "—");
  return [
    `📦 <b>طلب جاهز للاستلام</b>`,
    ``,
    `👤 العميل: <b>${safeName}</b>`,
    `🔖 رقم الطلب: <code>${safeOrder}</code>`,
    `🛒 المنتج: ${safeProduct}`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
