"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { generateTotpCode } from "@/lib/handlers/totp";

/**
 * Generates a fresh TOTP code for an already-verified order.
 *
 * Security:
 *   1. Re-verifies (orderId, last4) on every call — a stolen orderId alone
 *      is useless without the phone last 4.
 *   2. Enforces per-order daily limit (`otp_request_limit`).
 *   3. Logs IP + result to otp_logs for audit + abuse detection.
 *   4. NEVER returns the TOTP secret itself.
 *
 * Returns: 6-digit code + countdown, OR an error string.
 */
export async function getTotpCodeAction(input: {
  orderId: string;
  lastFour: string;
}): Promise<
  | { code: string; expiresInSeconds: number; totalPeriod: number; remaining: number }
  | { error: string }
> {
  if (!/^\d{4}$/.test(input.lastFour)) {
    return { error: "آخر 4 أرقام غير صحيحة" };
  }

  const sb = createServiceClient();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim()
    ?? h.get("x-real-ip")
    ?? "0.0.0.0";

  // Re-verify the order belongs to this caller
  const { data: order } = await sb
    .from("orders")
    .select(`
      id,
      customer_mobile_last4,
      payment_status,
      fulfillment_status,
      otp_request_count,
      otp_request_limit,
      account:accounts(
        id,
        status,
        totp_secret_encrypted,
        otp_cooldown_seconds
      )
    `)
    .eq("id", input.orderId)
    .single();

  if (!order) {
    await logOtp(sb, ip, "order_not_found");
    return { error: "الطلب غير موجود" };
  }

  if (order.customer_mobile_last4 !== input.lastFour) {
    await logOtp(sb, ip, "phone_mismatch", order.id);
    return { error: "آخر 4 أرقام لا تطابق الطلب" };
  }

  if (order.payment_status !== "paid" || order.fulfillment_status !== "fulfilled") {
    return { error: "الطلب غير جاهز للتسليم" };
  }

  // Limit check
  if (order.otp_request_count >= order.otp_request_limit) {
    await logOtp(sb, ip, "limit_exceeded", order.id);
    return { error: "تجاوزت الحد الأقصى لطلبات الكود. تواصل مع المتجر." };
  }

  const accountData = Array.isArray(order.account) ? order.account[0] : order.account;
  if (!accountData?.totp_secret_encrypted) {
    return { error: "الحساب لا يدعم رمز التحقق" };
  }

  // Cooldown check — the most recent successful OTP must be >= cooldown ago
  const cooldown = accountData.otp_cooldown_seconds ?? 30;
  const { data: recent } = await sb
    .from("otp_logs")
    .select("requested_at")
    .eq("order_id", order.id)
    .eq("result", "success")
    .order("requested_at", { ascending: false })
    .limit(1);

  if (recent?.length) {
    const elapsed = (Date.now() - new Date(recent[0].requested_at).getTime()) / 1000;
    if (elapsed < cooldown) {
      await logOtp(sb, ip, "cooldown", order.id);
      return { error: `انتظر ${Math.ceil(cooldown - elapsed)} ثانية قبل طلب كود جديد` };
    }
  }

  // Decrypt the secret (bytea hex → utf8)
  const raw = accountData.totp_secret_encrypted as unknown as string;
  const secret = raw.startsWith("\\x")
    ? Buffer.from(raw.slice(2), "hex").toString("utf8")
    : raw;

  // Generate
  let code: string, expiresInSeconds: number, totalPeriod: number;
  try {
    ({ code, expiresInSeconds, totalPeriod } = generateTotpCode(secret));
  } catch {
    await logOtp(sb, ip, "totp_error", order.id);
    return { error: "خطأ في توليد الكود. تواصل مع المتجر." };
  }

  // Increment counter + log success
  await sb
    .from("orders")
    .update({ otp_request_count: order.otp_request_count + 1 })
    .eq("id", order.id);

  await logOtp(sb, ip, "success", order.id, accountData.id);

  return {
    code,
    expiresInSeconds,
    totalPeriod,
    remaining: order.otp_request_limit - (order.otp_request_count + 1),
  };
}

async function logOtp(
  sb: ReturnType<typeof createServiceClient>,
  ip: string,
  result: string,
  orderId?: string,
  accountId?: string,
) {
  if (!orderId) return;
  await sb.from("otp_logs").insert({
    order_id: orderId,
    account_id: accountId ?? null,
    ip_address: ip,
    result,
  });
}
