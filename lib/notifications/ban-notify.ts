import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { sendKarzounWhatsApp } from "./whatsapp-karzoun";

/**
 * Phone-ban WhatsApp notifier.
 *
 * Fired (best-effort, fire-and-forget) whenever a phone gets banned —
 * either manually from the admin Bans tab, or automatically by the
 * threshold evaluator. Uses the merchant's pre-approved template
 * `phone_ban_alert_v1` (positional placeholders: store_name,
 * customer_name, reason). Duration is folded into the reason string so
 * we don't need a brand-new approved template every time the merchant
 * changes their wording.
 *
 * If WhatsApp isn't configured, the merchant's store has no row in
 * `notification_channels`, or the customer's mobile is missing/invalid,
 * the function quietly returns without throwing — banning a phone must
 * never depend on the network call succeeding.
 */
export type NotifyBanArgs = {
  mobile: string;
  reason: string | null;
  customerName?: string | null;
  storeName?: string;
  /**
   * Pre-formatted Arabic duration label, e.g. "ساعة" / "24 ساعة" / "دائم".
   * Caller is expected to pass `humanizeBanDuration(minutes)`.
   */
  durationLabel?: string | null;
};

export async function notifyPhoneBan(args: NotifyBanArgs): Promise<void> {
  const cleanMobile = args.mobile.replace(/[\s+\-()]/g, "");
  if (!/^\d{8,15}$/.test(cleanMobile)) return;

  const sb = createServiceClient();
  // Pull any active store-level Karzoun config. We currently run a single
  // merchant tenant so picking the first enabled row is safe.
  const { data: cfgRow } = await sb
    .from("notification_channels")
    .select("config, store_id")
    .eq("channel", "whatsapp")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();

  const cfg = (cfgRow?.config ?? {}) as Record<string, unknown>;
  const provider = cfg.provider as string | undefined;
  const appToken = cfg.app_token as string | undefined;
  const integrationId = cfg.integration_id as string | undefined;
  const host = cfg.host as string | undefined;
  const language = (cfg.language as string | undefined) ?? "ar";
  const storeName =
    args.storeName ?? (cfg.store_name as string | undefined) ?? "متجرنا";
  const banTemplate =
    (cfg.ban_template as string | undefined) ?? "phone_ban_alert_v1";

  if (provider !== "karzoun" || !appToken || !integrationId) return;

  // Lookup customer name from a recent order if not supplied.
  let customerName = args.customerName?.trim() || "";
  if (!customerName) {
    const { data: orderRow } = await sb
      .from("orders")
      .select("customer_name, customer_mobile")
      .ilike("customer_mobile", `%${cleanMobile.slice(-9)}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    customerName = (orderRow?.customer_name as string | undefined) ?? "العميل الكريم";
  }

  // Fold duration into the reason placeholder so the merchant doesn't have
  // to ask Meta to approve a new template every time wording changes.
  // NOTE: WhatsApp template parameters CANNOT contain newlines, tabs, or
  // 4+ consecutive spaces — those trigger Meta error #100. Use an inline
  // separator instead.
  const baseReason =
    (args.reason || "").trim() ||
    "تم تقييد الرقم بناءً على سياسة الأمان";
  const flatBaseReason = baseReason.replace(/\s+/g, " ").trim();
  const durationLabel = (args.durationLabel || "").trim();
  const reasonText = durationLabel
    ? `${flatBaseReason} — مدة الحظر: ${durationLabel}`
    : flatBaseReason;

  await sendKarzounWhatsApp({
    to: cleanMobile,
    template: banTemplate,
    params: [storeName, customerName, reasonText],
    config: {
      host,
      appToken,
      integrationId,
      defaultTemplate: banTemplate,
      language,
    },
  }).catch(() => {
    /* best-effort: never block ban creation on WhatsApp errors */
  });

  // Mirror the ban event to the Telegram channel if configured.
  void mirrorBanToTelegram(sb, {
    storeName,
    mobile: cleanMobile,
    customerName,
    reason: reasonText,
  });
}

/**
 * Posts a copy of the ban event to the merchant's Telegram channel
 * if `mirror_bans` is enabled in the channel config. Best-effort.
 */
async function mirrorBanToTelegram(
  sb: ReturnType<typeof createServiceClient>,
  args: {
    storeName: string;
    mobile: string;
    customerName: string;
    reason: string;
  },
): Promise<void> {
  try {
    const { data: tgRow } = await sb
      .from("notification_channels")
      .select("config")
      .eq("channel", "telegram")
      .eq("enabled", true)
      .limit(1)
      .maybeSingle();
    const cfg = (tgRow?.config ?? {}) as Record<string, unknown>;
    const botToken = cfg.bot_token as string | undefined;
    const chatId = cfg.chat_id as string | undefined;
    const mirrorBans = (cfg.mirror_bans as boolean | undefined) ?? true;
    if (!botToken || !chatId || !mirrorBans) return;

    const { sendTelegramMessage } = await import("./telegram");
    const text = [
      "🚫 <b>تم حظر رقم</b>",
      "",
      `🏪 المتجر: <b>${escapeHtml(args.storeName)}</b>`,
      `👤 العميل: ${escapeHtml(args.customerName)}`,
      `📱 الرقم: <code>${escapeHtml(args.mobile)}</code>`,
      `📌 السبب: ${escapeHtml(args.reason)}`,
    ].join("\n");
    await sendTelegramMessage({ text, config: { botToken, chatId } });
  } catch {
    /* best-effort */
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
