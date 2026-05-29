import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { HandlerType } from "./products-types";

export type Account = {
  id: string;
  product_id: string;
  label: string;
  email: string | null;
  instructions: string | null;
  handler_type: HandlerType;
  max_usage: number;
  current_usage: number;
  max_otp_requests: number;
  otp_cooldown_seconds: number;
  allowed_option_ids: string[];
  status: "active" | "paused" | "full" | "retired";
  last_assigned_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  product_name?: string | null;
};

export type AccountCreateInput = {
  product_id: string;
  label: string;
  email?: string;
  password?: string;           // plaintext — encrypted server-side
  instructions?: string;
  handler_type: HandlerType;
  totp_secret?: string;        // plaintext — encrypted server-side
  steam_shared_secret?: string;
  card_code?: string;
  file_storage_path?: string;
  max_usage?: number;
  max_otp_requests?: number;
  otp_cooldown_seconds?: number;
  allowed_option_ids?: string[];
};

export async function listAccounts(productId?: string): Promise<Account[]> {
  const sb = createServiceClient();
  let q = sb
    .from("accounts")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

  if (productId) q = q.eq("product_id", productId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as Account),
    product_name: (row.products as { name: string } | null)?.name ?? null,
  }));
}

export async function createAccount(input: AccountCreateInput): Promise<Account> {
  const sb = createServiceClient();

  // Encrypt sensitive fields using pgsodium via RPC.
  // For now we store them as base64-encoded text in the bytea columns.
  // A follow-up migration will wire up pgsodium.crypto_aead_det_encrypt.
  // The columns are bytea so we pass null when the value is absent.
  const encryptField = (val?: string) =>
    val ? Buffer.from(val, "utf8") : null;

  const { data, error } = await sb
    .from("accounts")
    .insert({
      product_id: input.product_id,
      label: input.label,
      email: input.email ?? null,
      password_encrypted: encryptField(input.password),
      instructions: input.instructions ?? null,
      handler_type: input.handler_type,
      totp_secret_encrypted: encryptField(input.totp_secret),
      steam_shared_secret_encrypted: encryptField(input.steam_shared_secret),
      card_code_encrypted: encryptField(input.card_code),
      file_storage_path: input.file_storage_path ?? null,
      max_usage: input.max_usage ?? 1,
      max_otp_requests: input.max_otp_requests ?? 10,
      otp_cooldown_seconds: input.otp_cooldown_seconds ?? 30,
      allowed_option_ids: input.allowed_option_ids ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Account;
}

export async function updateAccountStatus(
  id: string,
  status: Account["status"],
): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("accounts").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Decrypt a password for display in the admin panel.
 * Currently returns the raw bytes as UTF-8 string (pre-pgsodium).
 * Will be replaced with pgsodium.crypto_aead_det_decrypt once the
 * encryption key is provisioned.
 */
export async function getAccountSecret(
  id: string,
  field: "password_encrypted" | "totp_secret_encrypted" | "steam_shared_secret_encrypted" | "card_code_encrypted",
): Promise<string | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("accounts")
    .select(field)
    .eq("id", id)
    .single<Record<string, unknown>>();

  if (error || !data) return null;
  const raw = data[field] as Buffer | null;
  if (!raw) return null;
  // raw is a Buffer from the bytea column
  return Buffer.from(raw).toString("utf8");
}
