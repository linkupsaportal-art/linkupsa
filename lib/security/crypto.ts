import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { env } from "@/lib/env";

/**
 * App-layer secret encryption — AES-256-GCM.
 *
 * Why app-layer (not pgsodium): Supabase has deprecated pgsodium for new
 * projects, and the spec's "no vendor lock-in" ownership guarantee is best
 * served by encryption that travels with the app to any Postgres host. The
 * key lives in `ENCRYPTION_KEY` (env), so even a leaked service_role key or a
 * stolen DB backup yields only ciphertext.
 *
 * Format (stored as text in the *_encrypted columns):
 *
 *     v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
 *
 * The `v1:` prefix is a version tag so we can rotate algorithms/keys later
 * without guessing. Anything without a recognized prefix is treated as a
 * legacy plaintext/base64 value and read as-is (migration safety).
 *
 * GCM gives us authenticated encryption: tampering with the ciphertext fails
 * decryption loudly instead of returning garbage.
 */

const PREFIX = "v1";
const ALGO = "aes-256-gcm";
const IV_LEN = 12; // 96-bit nonce, the GCM standard

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is missing. Add a base64-encoded 32-byte key to .env.",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). Regenerate it.`,
    );
  }
  cachedKey = key;
  return key;
}

/** True when the platform has a usable encryption key configured. */
export function isEncryptionConfigured(): boolean {
  try {
    return getKey().length === 32;
  } catch {
    return false;
  }
}

/** True when a stored value is in our v1 envelope (vs legacy plaintext). */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`);
}

/**
 * Encrypt and return the value in the Postgres `bytea` hex wire-format
 * (`\x<hex>`). This is what PostgREST/supabase-js expect for a bytea column —
 * passing a Node Buffer gets JSON-serialized instead of stored as bytes.
 * Returns null for empty input so callers store NULL.
 */
export function encryptSecretForBytea(plaintext: string | null | undefined): string | null {
  const v1 = encryptSecret(plaintext);
  if (v1 == null) return null;
  return "\\x" + Buffer.from(v1, "utf8").toString("hex");
}

/**
 * Encrypt a UTF-8 string into the v1 envelope. Returns null for null/empty
 * input so callers can store NULL for absent secrets.
 */
export function encryptSecret(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ct.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a stored secret back to UTF-8.
 *
 * Storage reality: the *_encrypted columns are `bytea`, so Supabase returns
 * their contents as a hex-escaped string (`\x...`). We therefore decode the
 * bytea layer FIRST, then inspect the inner value:
 *   - inner is a `v1:` envelope  → AES-256-GCM decrypt
 *   - inner is legacy plaintext  → return as-is (pre-encryption rows)
 *
 * Also accepts a direct `v1:`/plaintext string in case a value is ever stored
 * in a text column.
 */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (stored == null || stored === "") return null;

  // 1. Peel the bytea layer if present.
  let inner = stored;
  if (inner.startsWith("\\x")) {
    try {
      inner = Buffer.from(inner.slice(2), "hex").toString("utf8");
    } catch {
      return null;
    }
  }

  // 2. v1 envelope → real decryption.
  if (isEncrypted(inner)) {
    const parts = inner.split(":");
    if (parts.length !== 4) return null;
    const [, ivB64, tagB64, ctB64] = parts;
    try {
      const key = getKey();
      const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
      decipher.setAuthTag(Buffer.from(tagB64, "base64"));
      const pt = Buffer.concat([
        decipher.update(Buffer.from(ctB64, "base64")),
        decipher.final(),
      ]);
      return pt.toString("utf8");
    } catch {
      return null; // wrong key or tampered ciphertext
    }
  }

  // 3. Legacy plaintext (pre-encryption rows). The bytea held the raw UTF-8
  //    secret, which we've already decoded above — return it as-is.
  return inner;
}
