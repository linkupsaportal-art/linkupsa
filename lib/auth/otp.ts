import "server-only";

import { randomBytes, createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 6-digit email OTP service. Codes are hashed with a per-row salt so the
 * plaintext code never lives in the DB.
 *
 *   - issueOtp(email, purpose)   → returns the plaintext code (mail it!)
 *   - verifyOtp(email, code)     → consumes a valid OTP, locks others out
 */

const CODE_LEN = 6;
const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_PER_HOUR = 5;

function generateCode(): string {
  // Cryptographically secure 6-digit code, no leading-zero collapse.
  const bytes = randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(CODE_LEN, "0");
}

function hashCode(salt: string, code: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

export type OtpPurpose = "signup" | "recovery" | "email_change";

export type IssueResult =
  | { ok: true; code: string; expiresAt: Date }
  | { ok: false; error: "rate_limited" | "internal" };

export async function issueOtp(
  email: string,
  purpose: OtpPurpose = "signup",
  userId?: string,
): Promise<IssueResult> {
  const sb = createServiceClient();
  const normalized = email.trim().toLowerCase();

  // Rate-limit: max 5 codes per hour per email+purpose.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await sb
    .from("email_otps")
    .select("id", { count: "exact", head: true })
    .eq("email", normalized)
    .eq("purpose", purpose)
    .gte("created_at", oneHourAgo);

  if (countError) return { ok: false, error: "internal" };
  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) return { ok: false, error: "rate_limited" };

  const code = generateCode();
  const salt = randomBytes(16).toString("hex");
  const codeHash = hashCode(salt, code);
  const expiresAt = new Date(Date.now() + TTL_MS);

  const { error: insertError } = await sb.from("email_otps").insert({
    email: normalized,
    user_id: userId ?? null,
    purpose,
    code_hash: codeHash,
    salt,
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) return { ok: false, error: "internal" };

  return { ok: true, code, expiresAt };
}

export type VerifyResult =
  | { ok: true; userId: string | null }
  | {
      ok: false;
      error: "expired" | "invalid_code" | "too_many_attempts" | "not_found" | "internal";
    };

/**
 * Consumes the latest unconsumed OTP for (email, purpose). Increments attempts
 * on every wrong guess. Returns the userId that the OTP was bound to (if any).
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose = "signup",
): Promise<VerifyResult> {
  const sb = createServiceClient();
  const normalized = email.trim().toLowerCase();

  const { data: row, error } = await sb
    .from("email_otps")
    .select("id, code_hash, salt, attempts, expires_at, consumed_at, user_id")
    .eq("email", normalized)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: "internal" };
  if (!row) return { ok: false, error: "not_found" };

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "too_many_attempts" };
  }

  const expected = hashCode(row.salt, code);
  if (expected !== row.code_hash) {
    await sb.from("email_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return { ok: false, error: "invalid_code" };
  }

  // Burn the code so it can't be replayed. The `.is("consumed_at", null)`
  // filter makes this atomic at the DB layer — if a concurrent verify already
  // consumed the row, this UPDATE affects 0 rows and we reject.
  const { data: consumed, error: consumeError } = await sb
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("consumed_at", null)
    .select("id");

  if (consumeError) return { ok: false, error: "internal" };
  if (!consumed || consumed.length === 0) {
    // Row was consumed by another request between our SELECT and UPDATE.
    return { ok: false, error: "internal" };
  }

  return { ok: true, userId: row.user_id };
}
