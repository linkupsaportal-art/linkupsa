"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/security/crypto";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { signDigitalFileUrl } from "@/lib/storage/digital-files";
import type { PickupResult } from "./types";

/**
 * Customer order lookup. The only public action on this app — heavily rate-limited.
 *
 * Validates:
 *   1. Order exists
 *   2. Last 4 of phone matches
 *   3. Order is paid + fulfilled (account assigned)
 *   4. Not archived
 *
 * Returns the credentials based on the product's handler type.
 * Sensitive secrets (TOTP, Steam) are NEVER returned — they're used to
 * generate one-time codes via separate endpoints.
 */
export async function lookupOrderAction(
  orderNumber: string,
  lastFour: string,
  captchaToken?: string | null,
): Promise<PickupResult | { error: string }> {
  // Basic input sanitization
  const cleanOrderNumber = orderNumber.replace(/\D/g, "");
  if (!cleanOrderNumber) return { error: "رقم الطلب غير صحيح" };
  if (!/^\d{4}$/.test(lastFour)) return { error: "آخر 4 أرقام غير صحيحة" };

  const sb = createServiceClient();

  // Get the request IP for rate limiting / logging
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim()
    ?? h.get("x-real-ip")
    ?? "0.0.0.0";

  // Captcha gate — blocks automated (order# + last-4) guessing before any DB
  // work. No-op when Turnstile keys aren't configured (local dev).
  const captcha = await verifyTurnstile(captchaToken, ip);
  if (!captcha.ok) {
    return { error: "فشل التحقق الأمني. حدّث الصفحة وحاول مجدداً." };
  }

  // Look up order by reference_id OR salla_order_id (both could be entered)
  const orderNumberAsBigint = Number(cleanOrderNumber);
  const { data: order, error } = await sb
    .from("orders")
    .select(`
      id,
      salla_order_id,
      salla_reference_id,
      customer_mobile_last4,
      payment_status,
      fulfillment_status,
      account_id,
      otp_request_count,
      otp_request_limit,
      archived_at,
      product:products(name, handler_type),
      option:product_options(name),
      account:accounts(
        email,
        instructions,
        password_encrypted,
        card_code_encrypted,
        file_storage_path
      )
    `)
    .or(`salla_reference_id.eq.${orderNumberAsBigint},salla_order_id.eq.${orderNumberAsBigint}`)
    .single();

  if (error || !order) {
    await logAttempt(sb, ip, "order_not_found");
    return { error: "الطلب غير موجود. تحقق من رقم الطلب." };
  }

  // Phone verification — constant-time-ish (string equality on 4 chars is fine)
  if (order.customer_mobile_last4 !== lastFour) {
    await logAttempt(sb, ip, "phone_mismatch", order.id);
    return { error: "آخر 4 أرقام لا تطابق الطلب." };
  }

  // Archived
  if (order.archived_at) {
    return { error: "هذا الطلب مؤرشف. تواصل مع المتجر." };
  }

  // Payment check
  if (order.payment_status !== "paid") {
    return { error: "الطلب لم يكتمل دفعه بعد. تواصل مع المتجر." };
  }

  // Fulfillment check
  if (order.fulfillment_status !== "fulfilled" || !order.account_id) {
    return { error: "الطلب قيد المعالجة. حاول لاحقاً." };
  }

  const productData = Array.isArray(order.product) ? order.product[0] : order.product;
  const optionData = Array.isArray(order.option) ? order.option[0] : order.option;
  const accountData = Array.isArray(order.account) ? order.account[0] : order.account;

  if (!productData || !accountData) {
    return { error: "خطأ في بيانات الطلب. تواصل مع المتجر." };
  }

  // Decrypt secrets via the app-layer AES-256-GCM module. It transparently
  // handles both the new v1 envelope and legacy bytea/base64 rows.
  const password = decryptSecret(accountData.password_encrypted as string | null) ?? undefined;
  const cardCode = decryptSecret(accountData.card_code_encrypted as string | null) ?? undefined;

  // Digital files: mint a short-lived signed URL (≤5 min) instead of exposing
  // a permanent path. Returns null if no file / signing fails.
  const fileUrl =
    productData.handler_type === "digital_file"
      ? (await signDigitalFileUrl(accountData.file_storage_path as string | null)) ?? undefined
      : undefined;

  return {
    orderId: order.id,
    orderNumber: String(order.salla_reference_id ?? order.salla_order_id),
    productName: productData.name,
    handlerType: productData.handler_type,
    optionName: optionData?.name ?? null,
    lastFour,
    email: accountData.email ?? undefined,
    password,
    instructions: accountData.instructions ?? undefined,
    cardCode,
    fileUrl,
    otpRequestCount: order.otp_request_count,
    otpRequestLimit: order.otp_request_limit,
  };
}

async function logAttempt(
  sb: ReturnType<typeof createServiceClient>,
  ip: string,
  result: string,
  orderId?: string,
) {
  // Best-effort, don't await — we don't want to block the response
  if (orderId) {
    sb.from("otp_logs").insert({
      order_id: orderId,
      ip_address: ip,
      result,
    }).then(() => {});
  }
}
