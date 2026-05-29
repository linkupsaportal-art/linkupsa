"use server";

import { revalidatePath } from "next/cache";
import { createAccount, deleteAccount, updateAccountStatus, type Account } from "@/lib/db/accounts";
import type { HandlerType } from "@/lib/db/products-types";

export async function createAccountAction(formData: FormData) {
  const product_id = formData.get("product_id") as string;
  const label = formData.get("label") as string;
  const email = (formData.get("email") as string) || undefined;
  const password = (formData.get("password") as string) || undefined;
  const instructions = (formData.get("instructions") as string) || undefined;
  const handler_type = formData.get("handler_type") as HandlerType;
  const totp_secret = (formData.get("totp_secret") as string) || undefined;
  const steam_shared_secret = (formData.get("steam_shared_secret") as string) || undefined;
  const card_code = (formData.get("card_code") as string) || undefined;
  const max_usage = Number(formData.get("max_usage") || 1);
  const max_otp_requests = Number(formData.get("max_otp_requests") || 10);
  const otp_cooldown_seconds = Number(formData.get("otp_cooldown_seconds") || 30);
  const allowed_option_ids_raw = formData.get("allowed_option_ids") as string;
  const allowed_option_ids = allowed_option_ids_raw
    ? allowed_option_ids_raw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (!product_id) return { error: "المنتج مطلوب" };
  if (!label?.trim()) return { error: "اسم القاعدة مطلوب" };
  if (!handler_type) return { error: "نوع التحقق مطلوب" };

  try {
    await createAccount({
      product_id,
      label: label.trim(),
      email,
      password,
      instructions,
      handler_type,
      totp_secret,
      steam_shared_secret,
      card_code,
      max_usage,
      max_otp_requests,
      otp_cooldown_seconds,
      allowed_option_ids,
    });
    revalidatePath("/admin/accounts");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateAccountStatusAction(id: string, status: Account["status"]) {
  try {
    await updateAccountStatus(id, status);
    revalidatePath("/admin/accounts");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteAccountAction(id: string) {
  try {
    await deleteAccount(id);
    revalidatePath("/admin/accounts");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
