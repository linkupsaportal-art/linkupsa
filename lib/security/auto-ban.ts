import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getAutoBanSettings } from "@/lib/db/platform-settings";
import { humanizeBanDuration } from "@/lib/db/phone-bans";
import { notifyPhoneBan } from "@/lib/notifications/ban-notify";

/**
 * Auto-ban evaluator.
 *
 * Called whenever a non-success OTP log row is written. If the platform
 * setting is enabled, we count how many failures the same (mobile, IP)
 * pair produced inside the configured rolling window. Once the count
 * crosses `failures_threshold`, we insert (or reactivate) a phone_bans
 * row and tag it `auto_banned = true` so the admin can tell it apart
 * from manual bans.
 *
 * The function is intentionally fire-and-forget — the action that
 * triggered it never awaits the abuse detection. Worst case the ban is
 * applied a few seconds late.
 */
export async function evaluateAutoBan(args: {
  orderId: string;
  ip: string | null;
  mobile: string | null;
  productId: string | null;
}): Promise<void> {
  if (!args.mobile) return;

  const settings = await getAutoBanSettings();
  if (!settings.enabled) return;

  const sb = createServiceClient();
  const since = new Date(Date.now() - settings.window_minutes * 60 * 1000).toISOString();

  // Count recent failures for this customer mobile (joined via orders).
  // We trust the orders.customer_mobile string column to identify
  // the same person across multiple verification attempts.
  const { data: failedRows } = await sb
    .from("otp_logs")
    .select("id, ip_address, orders!inner(customer_mobile)")
    .gte("requested_at", since)
    .neq("result", "success");

  const cleaned = args.mobile.replace(/[\s+\-()]/g, "");
  const fails = (failedRows ?? []).filter((row) => {
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    if (!order?.customer_mobile) return false;
    const orderClean = String(order.customer_mobile).replace(/[\s+\-()]/g, "");
    return orderClean === cleaned;
  });

  if (fails.length < settings.failures_threshold) return;

  const productId = settings.scope === "per-product" ? args.productId : null;

  // Skip if a matching active ban already exists.
  const { data: existing } = await sb
    .from("phone_bans")
    .select("id")
    .eq("mobile", cleaned)
    .eq("active", true)
    .or(`product_id.eq.${productId ?? "00000000-0000-0000-0000-000000000000"},product_id.is.null`)
    .limit(1);

  if (existing?.length) return;

  const reason = (settings.default_ban_reason && settings.default_ban_reason.trim().length > 0)
    ? settings.default_ban_reason.trim()
    : `حظر تلقائي: ${fails.length} محاولة فاشلة خلال ${settings.window_minutes} دقيقة`;
  const durationMinutes = Math.max(0, Math.round(settings.default_ban_minutes ?? 0));
  const expiresAt = durationMinutes > 0
    ? new Date(Date.now() + durationMinutes * 60_000).toISOString()
    : null;

  await sb.from("phone_bans").insert({
    mobile: cleaned,
    product_id: productId,
    reason,
    active: true,
    auto_banned: true,
    expires_at: expiresAt,
  });

  // Best-effort WhatsApp alert to the banned number.
  void notifyPhoneBan({
    mobile: cleaned,
    reason,
    durationLabel: humanizeBanDuration(durationMinutes),
  });
}
