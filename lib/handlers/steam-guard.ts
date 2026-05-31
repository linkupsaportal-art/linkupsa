import "server-only";
import { createHmac } from "node:crypto";

/**
 * Steam Guard mobile authenticator code generator.
 *
 * Steam does NOT use plain 6-digit TOTP. It's a custom scheme:
 *   - secret is the base64 `shared_secret` from the Steam mobile authenticator
 *   - time counter = floor(unixTime / 30)  (same 30s window as TOTP)
 *   - HMAC-SHA1(secret, counter) → dynamic-truncation to a 32-bit int
 *   - that int is mapped into a 5-character code over Steam's alphabet
 *     "23456789BCDFGHJKMNPQRTVWXY"
 *
 * This matches the code shown in the official Steam mobile app. The shared
 * secret never leaves the server — we only ever return the 5-char code.
 *
 * Reference: the well-documented steam-totp algorithm (re-implemented here
 * with zero external deps to avoid supply-chain risk).
 */

const STEAM_ALPHABET = "23456789BCDFGHJKMNPQRTVWXY";
const PERIOD = 30;

export function generateSteamGuardCode(sharedSecretBase64: string): {
  code: string;
  expiresInSeconds: number;
  totalPeriod: number;
} {
  const secret = decodeSharedSecret(sharedSecretBase64);

  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / PERIOD);

  // 8-byte big-endian counter
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", secret).update(buf).digest();

  // Dynamic truncation (RFC 4226 style)
  const offset = hmac[hmac.length - 1] & 0x0f;
  let codePoint =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Map to 5 chars over the Steam alphabet
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += STEAM_ALPHABET[codePoint % STEAM_ALPHABET.length];
    codePoint = Math.floor(codePoint / STEAM_ALPHABET.length);
  }

  const expiresInSeconds = PERIOD - (now % PERIOD);
  return { code, expiresInSeconds, totalPeriod: PERIOD };
}

/**
 * Steam's shared_secret is base64. Some operators paste it base32 (like a
 * normal TOTP seed) or hex by mistake — accept all three so a wrong format
 * doesn't silently produce garbage codes.
 */
function decodeSharedSecret(input: string): Buffer {
  const cleaned = input.trim();

  // Base64 (standard Steam format) — 28 chars ending with '='
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) && cleaned.length % 4 === 0) {
    const b = Buffer.from(cleaned, "base64");
    if (b.length === 20) return b; // SHA1 secret is 20 bytes
  }

  // Hex (40 chars)
  if (/^[0-9a-fA-F]{40}$/.test(cleaned)) {
    return Buffer.from(cleaned, "hex");
  }

  // Base32 fallback
  const b32 = decodeBase32(cleaned);
  if (b32.length > 0) return b32;

  // Last resort: treat as base64 even if length is odd
  return Buffer.from(cleaned, "base64");
}

function decodeBase32(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/[\s=]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of cleaned) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) return Buffer.alloc(0);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
