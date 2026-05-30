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
 * customer_name, reason).
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

  const reasonText = (args.reason || "").trim() || "تم تقييد الرقم بناءً على سياسة الأمان";

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
}
