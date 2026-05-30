import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { sendKarzounWhatsApp } from "./whatsapp-karzoun";
import { sendBanAlertEmail } from "./email";

/**
 * Phone-ban multi-channel notifier.
 *
 * Fired (best-effort, fire-and-forget) whenever a phone gets banned —
 * either manually from the admin Bans tab, or automatically by the
 * threshold evaluator. Fans out to:
 *
 *   - WhatsApp via Karzoun (uses pre-approved template
 *     `phone_ban_alert_v1`, positional placeholders: store_name,
 *     customer_name, reason). Duration is folded into the reason so
 *     we don't need a new approved template per wording change.
 *   - Email via Resend (custom HTML template, supports a separate
 *     "duration" line because email has no length restrictions).
 *   - Telegram mirror to the merchant's chat (operator-side only).
 *
 * Each channel runs independently. A failure in one never blocks
 * the others — banning a phone must never depend on a network call
 * succeeding.
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

  // Resolve the customer's name + email from their most recent order.
  // Phone-only callers (manual ban with no customer record) get a sane
  // default name and skip the email mirror cleanly.
  const { data: orderRow } = await sb
    .from("orders")
    .select("customer_name, customer_email, customer_mobile")
    .ilike("customer_mobile", `%${cleanMobile.slice(-9)}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const customerName =
    args.customerName?.trim() ||
    (orderRow?.customer_name as string | undefined) ||
    "العميل الكريم";
  const customerEmail =
    (orderRow?.customer_email as string | null | undefined) ?? null;

  // Resolve a default store name for the templates.
  let storeName = args.storeName?.trim() ?? "";

  // Pull active store-level WhatsApp config (Karzoun). Single-tenant safe.
  const { data: waRow } = await sb
    .from("notification_channels")
    .select("config")
    .eq("channel", "whatsapp")
    .eq("enabled", true)
    .limit(1)
    .maybeSingle();
  const waCfg = (waRow?.config ?? {}) as Record<string, unknown>;
  if (!storeName) {
    storeName = (waCfg.store_name as string | undefined) ?? "متجرنا";
  }

  // Build the body once, reused across channels.
  const baseReason =
    (args.reason || "").trim() ||
    "تم تقييد الرقم بناءً على سياسة الأمان";
  const flatBaseReason = baseReason.replace(/\s+/g, " ").trim();
  const durationLabel = (args.durationLabel || "").trim();
  // WhatsApp templates can't contain newlines, tabs, or 4+ spaces in a
  // single param (Meta error #100). Inline the duration with an em-dash.
  const reasonForWhatsApp = durationLabel
    ? `${flatBaseReason} — مدة الحظر: ${durationLabel}`
    : flatBaseReason;

  // ─── WhatsApp ──────────────────────────────────────────────────────────
  void sendBanWhatsApp({
    cfg: waCfg,
    mobile: cleanMobile,
    storeName,
    customerName,
    reasonForWhatsApp,
  });

  // ─── Email ─────────────────────────────────────────────────────────────
  void sendBanEmailIfEnabled(sb, {
    customerEmail,
    storeName,
    customerName,
    reason: flatBaseReason,
    durationLabel: durationLabel || null,
  });

  // ─── Telegram mirror (operator-side) ───────────────────────────────────
  void mirrorBanToTelegram(sb, {
    storeName,
    mobile: cleanMobile,
    customerName,
    reason: reasonForWhatsApp,
  });
}

/* ─────────────────────── helpers ─────────────────────── */

async function sendBanWhatsApp(args: {
  cfg: Record<string, unknown>;
  mobile: string;
  storeName: string;
  customerName: string;
  reasonForWhatsApp: string;
}): Promise<void> {
  const c = args.cfg;
  const provider = c.provider as string | undefined;
  const appToken = c.app_token as string | undefined;
  const integrationId = c.integration_id as string | undefined;
  if (provider !== "karzoun" || !appToken || !integrationId) return;
  await sendKarzounWhatsApp({
    to: args.mobile,
    template: (c.ban_template as string | undefined) ?? "phone_ban_alert_v1",
    params: [args.storeName, args.customerName, args.reasonForWhatsApp],
    config: {
      host: c.host as string | undefined,
      appToken,
      integrationId,
      defaultTemplate:
        (c.ban_template as string | undefined) ?? "phone_ban_alert_v1",
      language: (c.language as string | undefined) ?? "ar",
    },
  }).catch(() => {
    /* best-effort */
  });
}

async function sendBanEmailIfEnabled(
  sb: ReturnType<typeof createServiceClient>,
  args: {
    customerEmail: string | null;
    storeName: string;
    customerName: string;
    reason: string;
    durationLabel: string | null;
  },
): Promise<void> {
  if (!args.customerEmail) return;
  // Only send if the merchant enabled the email channel. Treat a missing
  // row as "not configured" — keep it explicit so the operator stays in
  // control.
  const { data: emailRow } = await sb
    .from("notification_channels")
    .select("enabled, config")
    .eq("channel", "email")
    .maybeSingle();
  if (!emailRow?.enabled) return;
  const cfg = (emailRow.config ?? {}) as Record<string, unknown>;
  const fallbackFrom =
    (cfg.from as string | undefined) ||
    (cfg.verified_domain
      ? `LinkUp <noreply@${(cfg.verified_domain as string).trim()}>`
      : undefined);
  await sendBanAlertEmail({
    to: args.customerEmail,
    customerName: args.customerName,
    storeName: args.storeName,
    reason: args.reason,
    durationLabel: args.durationLabel,
    overrides: {
      apiKey: cfg.api_key as string | undefined,
      from: fallbackFrom,
      replyTo: cfg.reply_to as string | undefined,
    },
  }).catch(() => {
    /* best-effort */
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
      .select("config, enabled")
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
