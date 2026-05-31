"use server";

import { revalidatePath } from "next/cache";
import { createAccount, deleteAccount, updateAccountStatus, getAccountSecret, updateAccountEmailConfig, type Account } from "@/lib/db/accounts";
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
  // Email-code accounts: build the IMAP config JSON from discrete form fields.
  const imap_host = (formData.get("imap_host") as string) || "";
  const imap_user = (formData.get("imap_user") as string) || "";
  const imap_password = (formData.get("imap_password") as string) || "";
  const imap_port = Number(formData.get("imap_port") || 993);
  const imap_from = (formData.get("imap_from") as string) || "";
  let email_auth_config: string | undefined;
  if (handler_type === "email_code_account" && imap_host && imap_user && imap_password) {
    email_auth_config = JSON.stringify({
      host: imap_host.trim(),
      port: imap_port,
      user: imap_user.trim(),
      password: imap_password,
      ...(imap_from.trim() ? { fromFilter: imap_from.trim() } : {}),
    });
  }
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
      email_auth_config,
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

export async function revealAccountSecretsAction(id: string) {
  try {
    const password = await getAccountSecret(id, "password_encrypted");
    const totpSecret = await getAccountSecret(id, "totp_secret_encrypted");
    const steamSharedSecret = await getAccountSecret(id, "steam_shared_secret_encrypted");
    const cardCode = await getAccountSecret(id, "card_code_encrypted");
    return {
      password,
      totpSecret,
      steamSharedSecret,
      cardCode,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Update an email-code account's IMAP settings after creation. Abdullah's
 * mailboxes rotate, so the operator needs a quick way to swap host/user/
 * password/sender-filter/code-regex without recreating the account. Stored
 * encrypted as the email_auth_config JSON.
 */
export async function updateAccountEmailConfigAction(formData: FormData) {
  const id = formData.get("account_id") as string;
  const host = ((formData.get("imap_host") as string) || "").trim();
  const user = ((formData.get("imap_user") as string) || "").trim();
  const password = (formData.get("imap_password") as string) || "";
  const port = Number(formData.get("imap_port") || 993);
  const fromFilter = ((formData.get("imap_from") as string) || "").trim();
  const codeRegex = ((formData.get("imap_code_regex") as string) || "").trim();

  if (!id) return { error: "معرّف الحساب مطلوب" };
  if (!host || !user) return { error: "الخادم والبريد مطلوبان" };

  try {
    // Keep the existing password if the field was left blank (so the operator
    // can tweak the sender filter without re-typing the app password).
    let finalPassword = password;
    if (!finalPassword) {
      const existing = await getAccountSecret(id, "email_auth_config_encrypted");
      if (existing) {
        try {
          const prev = JSON.parse(existing) as { password?: string };
          finalPassword = prev.password ?? "";
        } catch { /* ignore */ }
      }
    }
    if (!finalPassword) return { error: "كلمة مرور التطبيق مطلوبة" };

    const config = JSON.stringify({
      host,
      port,
      user,
      password: finalPassword,
      ...(fromFilter ? { fromFilter } : {}),
      ...(codeRegex ? { codeRegex } : {}),
    });

    await updateAccountEmailConfig(id, config);
    revalidatePath("/admin/accounts");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
