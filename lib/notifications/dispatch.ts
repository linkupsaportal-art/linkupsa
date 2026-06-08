import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderReadyEmail } from "./email";
import { sendKarzounWhatsApp } from "./whatsapp-karzoun";

/**
 * Multi-channel order-ready notifier.
 *
 * Customer-facing channels (per-product toggles in
 * `products.notification_channels`):
 *   - Email   — Resend, custom HTML template
 *   - WhatsApp — Karzoun Chat, pre-approved template
 *
 * Operator-side mirror (driven by global Telegram bot config in
 * `telegram_bot_settings.mirror_orders`):
 *   - Telegram — posts a copy to the operator's chat regardless of the
 *     per-product flag, so the merchant always sees deliveries.
 *
 * The Telegram bot itself (the one customers interact with for
 * self-service pickup) lives in `app/api/telegram/webhook` and is
 * unrelated to this dispatcher.
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
  };
  pickupUrl: string;
  /** Per-product WhatsApp template override (takes priority over store default). */
  whatsappTemplate?: string;
  /** Per-product email template name (reserved for future multi-template support). */
  emailTemplate?: string;
};

export type NotifyResult = {
  attempted: string[];
  succeeded: string[];
  failed: Array<{ channel: string; error: string }>;
};

export async function notifyOrderReady(args: NotifyArgs): Promise<NotifyResult> {
  const result: NotifyResult = { attempted: [], succeeded: [], failed: [] };
  const sb = createServiceClient();

  // ─── Customer channels ────────────────────────────────────────────────
  const channels: Array<"email" | "whatsapp"> = [];
  if (args.productNotificationChannels.email && args.customerEmail) channels.push("email");
  if (args.productNotificationChannels.whatsapp && args.customerMobile) channels.push("whatsapp");

  let configByChannel = new Map<string, Record<string, unknown>>();
  if (channels.length > 0) {
    const { data: configs } = await sb
      .from("notification_channels")
      .select("channel, enabled, config")
      .eq("store_id", args.storeId)
      .in("channel", channels);
    for (const row of configs ?? []) {
      if (row.enabled) {
        configByChannel.set(row.channel as string, (row.config as Record<string, unknown>) ?? {});
      }
    }
  }

  // ─── Email ────────────────────────────────────────────────────────────
  if (channels.includes("email") && args.customerEmail) {
    result.attempted.push("email");
    const emailCfg = configByChannel.get("email");
    const emailFrom =
      (emailCfg?.from as string | undefined) ||
      (emailCfg?.verified_domain
        ? `LinkUp <noreply@${(emailCfg.verified_domain as string).trim()}>`
        : undefined);
    const r = await sendOrderReadyEmail({
      to: args.customerEmail,
      customerName: args.customerName,
      orderNumber: args.orderNumber,
      productName: args.productName,
      pickupUrl: args.pickupUrl,
      overrides: emailCfg
        ? {
            apiKey: emailCfg.api_key as string | undefined,
            from: emailFrom,
            replyTo: emailCfg.reply_to as string | undefined,
          }
        : undefined,
    });
    r.ok
      ? result.succeeded.push("email")
      : result.failed.push({ channel: "email", error: r.error ?? "unknown" });
  }

  // ─── WhatsApp via Karzoun ─────────────────────────────────────────────
  if (channels.includes("whatsapp") && args.customerMobile) {
    result.attempted.push("whatsapp");
    const cfg = configByChannel.get("whatsapp");
    const appToken = cfg?.app_token as string | undefined;
    const integrationId = cfg?.integration_id as string | undefined;
    const host = cfg?.host as string | undefined;
    const defaultTemplate = args.whatsappTemplate
      || (cfg?.default_template as string | undefined)
      || "order_cancel";
    const language = (cfg?.language as string | undefined) ?? "ar";
    const paramMap = (cfg?.param_map as Record<string, string[]> | undefined) ?? {
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
      // Resolve the merchant's storefront name from `salla_stores` so the
      // WhatsApp body shows the real store at all times. Falls back to
      // anything saved on the WhatsApp config row, then a sane default.
      let storeName = (cfg.store_name as string | undefined) ?? "متجرنا";
      const { data: storeRow } = await sb
        .from("salla_stores")
        .select("store_name")
        .eq("store_id", args.storeId)
        .maybeSingle();
      if (storeRow?.store_name && String(storeRow.store_name).trim()) {
        storeName = String(storeRow.store_name).trim();
      }

      // If the customer-facing Telegram bot is fully configured, append
      // the bot link to the pickup_url param so the customer gets both
      // entry points inside the same approved template.
      let pickupUrlValue = args.pickupUrl;
      const { data: tg } = await sb
        .from("telegram_bot_settings")
        .select("bot_username, enabled, webhook_url, pickup_flow_enabled")
        .limit(1)
        .maybeSingle();
      if (
        tg?.enabled &&
        tg.bot_username &&
        tg.webhook_url &&
        tg.pickup_flow_enabled
      ) {
        const botLink = `https://t.me/${tg.bot_username}`;
        // Single-line, no tabs, ≤3 consecutive spaces — passes Meta validation.
        pickupUrlValue = `${args.pickupUrl} أو عبر تيليجرام ${botLink}`;
      }

      const src: Record<string, string> = {
        customer_name: args.customerName,
        order_number: args.orderNumber,
        product_name: args.productName,
        pickup_url: pickupUrlValue,
        store_name: storeName,
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
      r.ok
        ? result.succeeded.push("whatsapp")
        : result.failed.push({ channel: "whatsapp", error: r.error });
    }
  }

  // ─── Telegram operator mirror (always-on if configured) ────────────────
  await sendOperatorOrderMirror(args).catch(() => {
    /* best-effort */
  });

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
 * Posts a "new order ready" card to the operator's Telegram chat when
 * the bot is configured + `mirror_orders` is on. Independent of the
 * per-product channel toggles.
 */
async function sendOperatorOrderMirror(args: NotifyArgs): Promise<void> {
  const sb = createServiceClient();
  const { data: row } = await sb
    .from("telegram_bot_settings")
    .select("bot_token, operator_chat_id, mirror_orders, enabled")
    .limit(1)
    .maybeSingle();
  if (!row?.enabled || !row?.bot_token || !row?.operator_chat_id) return;
  if (!row.mirror_orders) return;
  const { sendTelegramMessage } = await import("./telegram");
  const text = [
    `📦 <b>طلب جاهز للاستلام</b>`,
    ``,
    `👤 العميل: <b>${escapeHtml(args.customerName || "—")}</b>`,
    `🔖 رقم الطلب: <code>${escapeHtml(args.orderNumber || "—")}</code>`,
    `🛒 المنتج: ${escapeHtml(args.productName || "—")}`,
  ].join("\n");
  await sendTelegramMessage({
    text,
    config: { botToken: row.bot_token, chatId: row.operator_chat_id },
    buttons: [{ text: "📦 صفحة الاستلام", url: args.pickupUrl }],
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
