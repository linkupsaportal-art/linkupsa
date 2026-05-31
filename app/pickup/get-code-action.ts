"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { generateTotpCode } from "@/lib/handlers/totp";
import { generateSteamGuardCode } from "@/lib/handlers/steam-guard";
import {
  fetchLatestEmailCode,
  parseEmailAuthConfig,
} from "@/lib/handlers/email-code";
import { decryptSecret } from "@/lib/security/crypto";
import { evaluateAutoBan } from "@/lib/security/auto-ban";

/**
 * Generates a fresh verification code for an already-verified order, choosing
 * the algorithm by the account's handler type:
 *
 *   - 2fa_account         → TOTP (RFC 6238), 6 digits
 *   - steam_guard_account → Steam mobile authenticator, 5 chars
 *   - email_code_account  → reads the latest code from the account inbox (IMAP)
 *
 * Security:
 *   1. Re-verifies (orderId, last4) on every call.
 *   2. Enforces per-order limit + per-account cooldown.
 *   3. Logs IP + result to otp_logs for audit + abuse detection.
 *   4. NEVER returns the underlying secret — only the generated code.
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
        handler_type,
        totp_secret_encrypted,
        steam_shared_secret_encrypted,
        email_auth_config_encrypted,
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
  if (!accountData) {
    return { error: "الحساب غير متاح" };
  }
  const handler = accountData.handler_type as string;

  // Cooldown check — the most recent successful code must be >= cooldown ago
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

  // ── Generate by handler type ───────────────────────────────────────────
  let code: string;
  let expiresInSeconds = 30;
  let totalPeriod = 30;

  try {
    if (handler === "steam_guard_account") {
      const secret = decryptSecret(accountData.steam_shared_secret_encrypted as string | null);
      if (!secret) return { error: "الحساب لا يدعم Steam Guard" };
      ({ code, expiresInSeconds, totalPeriod } = generateSteamGuardCode(secret));
    } else if (handler === "email_code_account") {
      const cfgJson = decryptSecret(accountData.email_auth_config_encrypted as string | null);
      const cfg = parseEmailAuthConfig(cfgJson);
      if (!cfg) return { error: "إعدادات بريد الحساب غير مكتملة. تواصل مع المتجر." };
      const res = await fetchLatestEmailCode(cfg);
      if ("error" in res) {
        await logOtp(sb, ip, "totp_error", order.id);
        return { error: res.error };
      }
      code = res.code;
      // Email codes don't rotate on a fixed window; give the UI a sane TTL.
      expiresInSeconds = 0;
      totalPeriod = 0;
    } else {
      // Default: TOTP (2fa_account)
      const secret = decryptSecret(accountData.totp_secret_encrypted as string | null);
      if (!secret) return { error: "الحساب لا يدعم رمز التحقق" };
      ({ code, expiresInSeconds, totalPeriod } = generateTotpCode(secret));
    }
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

  // Fire-and-forget abuse detection. Auto-ban only triggers when the
  // admin enabled it in /admin/otp-logs settings tab.
  if (result !== "success") {
    const { data: order } = await sb
      .from("orders")
      .select("customer_mobile, product_id")
      .eq("id", orderId)
      .maybeSingle();
    if (order) {
      void evaluateAutoBan({
        orderId,
        ip,
        mobile: order.customer_mobile ?? null,
        productId: order.product_id ?? null,
      });
    }
  }
}
