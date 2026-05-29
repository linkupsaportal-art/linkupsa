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

  // ─── WhatsApp via Karzoun (Meta Cloud API) ─────────────────────────────
  if (channels.includes("whatsapp") && args.customerMobile) {
    result.attempted.push("whatsapp");
    const cfg = configByChannel.get("whatsapp");
    const accessToken = cfg?.access_token as string | undefined;
    const phoneNumberId = cfg?.phone_number_id as string | undefined;
    const defaultTemplate = (cfg?.default_template as string | undefined) ?? "order_ready";

    if (cfg?.provider !== "karzoun" || !accessToken || !phoneNumberId) {
      result.failed.push({ channel: "whatsapp", error: "Karzoun (Cloud API) not configured for this store" });
    } else {
      const r = await sendKarzounWhatsApp({
        to: args.customerMobile,
        // Template variables, in the order Meta will substitute them.
        // Default template "order_ready" expects:  param_1 = customer name,
        //   param_2 = order #, param_3 = product name, url_button = pickup link path.
        params: [args.customerName, args.orderNumber, args.productName],
        urlButton: extractUrlButtonPath(args.pickupUrl),
        template: defaultTemplate,
        config: {
          accessToken,
          phoneNumberId,
          defaultTemplate,
        },
      });
      r.ok ? result.succeeded.push("whatsapp") : result.failed.push({ channel: "whatsapp", error: r.error });
    }
  }

  // ─── SMS / Telegram ─────────────────────────────────────────────────────
  // Stubs — Sprint 3 wires actual providers (Unifonic for SMS, Telegram Bot API).
  if (channels.includes("sms")) {
    result.failed.push({ channel: "sms", error: "SMS provider not yet wired" });
  }
  if (channels.includes("telegram")) {
    result.failed.push({ channel: "telegram", error: "Telegram provider not yet wired" });
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
 * Meta URL buttons substitute a *suffix path*, not a full URL — the base URL
 * is fixed at template approval time. We pass just the path segment so any
 * approved template like `https://www.portaliosa.com/{{1}}` resolves to the
 * correct deep-link.
 */
function extractUrlButtonPath(fullUrl: string): string {
  try {
    const u = new URL(fullUrl);
    const path = u.pathname.replace(/^\/+/, "") + (u.search || "");
    return path || "pickup";
  } catch {
    return "pickup";
  }
}

/**
 * Localized WhatsApp body — short, scannable, pickup link as the CTA.
 * Mirrors the merchant's Salla Sync template (the one in his audio note:
 * "إشعار للعميل بالطلب بالتفاصيل على الواتساب").
 *
 * NOTE: This renderer is no longer wired into the Karzoun Cloud API path
 * (which uses pre-approved Meta templates). It's kept around for future
 * free-text providers (Twilio, 360dialog, etc.) so we have one canonical
 * Arabic rendering of the order-ready notification.
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
