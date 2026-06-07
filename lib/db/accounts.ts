import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { encryptSecretForBytea, decryptSecret } from "@/lib/security/crypto";
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
  /** JSON string with IMAP config for email-code accounts — encrypted. */
  email_auth_config?: string;
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

  // Encrypt sensitive fields with app-layer AES-256-GCM before they ever
  // touch the DB. Stored in the bytea *_encrypted columns as the v1 envelope's
  // bytes via the Postgres `\x` hex wire-format. Absent → NULL.
  const enc = (val?: string) => encryptSecretForBytea(val);

  const { data, error } = await sb
    .from("accounts")
    .insert({
      product_id: input.product_id,
      label: input.label,
      email: input.email ?? null,
      password_encrypted: enc(input.password),
      instructions: input.instructions ?? null,
      handler_type: input.handler_type,
      totp_secret_encrypted: enc(input.totp_secret),
      steam_shared_secret_encrypted: enc(input.steam_shared_secret),
      card_code_encrypted: enc(input.card_code),
      email_auth_config_encrypted: enc(input.email_auth_config),
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

/** Re-encrypt + store an email-code account's IMAP config JSON. */
export async function updateAccountEmailConfig(
  id: string,
  configJson: string,
): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("accounts")
    .update({ email_auth_config_encrypted: encryptSecretForBytea(configJson) })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateAccount(
  id: string,
  input: AccountCreateInput & { status?: Account["status"] }
): Promise<Account> {
  const sb = createServiceClient();
  const enc = (val?: string) => val === undefined ? undefined : encryptSecretForBytea(val);

  const updateData: Record<string, any> = {
    product_id: input.product_id,
    label: input.label,
    email: input.email ?? null,
    instructions: input.instructions ?? null,
    max_usage: input.max_usage ?? 1,
    max_otp_requests: input.max_otp_requests ?? 10,
    otp_cooldown_seconds: input.otp_cooldown_seconds ?? 30,
    allowed_option_ids: input.allowed_option_ids ?? [],
  };

  if (input.status) updateData.status = input.status;
  if (input.password !== undefined) updateData.password_encrypted = enc(input.password);
  if (input.totp_secret !== undefined) updateData.totp_secret_encrypted = enc(input.totp_secret);
  if (input.steam_shared_secret !== undefined) updateData.steam_shared_secret_encrypted = enc(input.steam_shared_secret);
  if (input.card_code !== undefined) updateData.card_code_encrypted = enc(input.card_code);
  if (input.email_auth_config !== undefined) updateData.email_auth_config_encrypted = enc(input.email_auth_config);

  const { data, error } = await sb
    .from("accounts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Account;
}

/**
 * Decrypt a stored secret for display in the admin panel (or for code
 * generation). Uses the app-layer AES-256-GCM module, which also transparently
 * handles legacy (pre-encryption) bytea/base64 rows during the migration window.
 */
export async function getAccountSecret(
  id: string,
  field: "password_encrypted" | "totp_secret_encrypted" | "steam_shared_secret_encrypted" | "card_code_encrypted" | "email_auth_config_encrypted",
): Promise<string | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("accounts")
    .select(field)
    .eq("id", id)
    .single<Record<string, unknown>>();

  if (error || !data) return null;
  const raw = data[field] as string | null;
  if (!raw) return null;
  return decryptSecret(raw);
}
