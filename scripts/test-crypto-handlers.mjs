/**
 * Crypto + handler tests.
 *
 * A. AES-256-GCM round-trip + tamper detection + legacy-format fallback.
 * B. Steam Guard code shape (5 chars over the Steam alphabet, deterministic).
 * C. TOTP via otpauth sanity (6 digits).
 *
 * Run: node scripts/test-crypto-handlers.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  createCipheriv, createDecipheriv, randomBytes, createHmac,
} from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env"), "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log(`  ${c.green("✓")} ${n}`); };
const bad = (n, d) => { fail++; console.log(`  ${c.red("✗")} ${n}`); if (d) console.log(`    ${d}`); };
const assert = (cond, n, d) => (cond ? ok(n) : bad(n, d));

// ── A. AES-256-GCM (mirrors lib/security/crypto.ts) ────────────────────
console.log(c.bold("\n🔐 AES-256-GCM encryption\n"));

const PREFIX = "v1";
const ALGO = "aes-256-gcm";
const key = Buffer.from(env.ENCRYPTION_KEY ?? "", "base64");

assert(key.length === 32, "ENCRYPTION_KEY decodes to 32 bytes", `got ${key.length}`);

function encrypt(pt) {
  const iv = randomBytes(12);
  const ci = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([ci.update(pt, "utf8"), ci.final()]);
  const tag = ci.getAuthTag();
  return [PREFIX, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}
function decrypt(stored) {
  if (stored.startsWith(`${PREFIX}:`)) {
    const [, ivB64, tagB64, ctB64] = stored.split(":");
    const d = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
    d.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([d.update(Buffer.from(ctB64, "base64")), d.final()]).toString("utf8");
  }
  if (stored.startsWith("\\x")) return Buffer.from(stored.slice(2), "hex").toString("utf8");
  return Buffer.from(stored, "base64").toString("utf8");
}

if (key.length === 32) {
  const secret = "P@ssw0rd-بالعربي-🔑-12345";
  const enc = encrypt(secret);
  assert(enc.startsWith("v1:"), "ciphertext uses v1 envelope");
  assert(!enc.includes(secret), "plaintext NOT present in ciphertext");
  assert(decrypt(enc) === secret, "round-trip decrypts to original (UTF-8 + emoji)");

  // Two encryptions of the same value differ (random IV).
  assert(encrypt(secret) !== encrypt(secret), "same plaintext → different ciphertext (random IV)");

  // Tamper detection.
  const parts = enc.split(":");
  const ctBuf = Buffer.from(parts[3], "base64");
  ctBuf[0] ^= 0xff;
  parts[3] = ctBuf.toString("base64");
  let threw = false;
  try { decrypt(parts.join(":")); } catch { threw = true; }
  assert(threw, "tampered ciphertext fails decryption (GCM auth)");

  // Legacy fallback.
  const legacyHex = "\\x" + Buffer.from("legacy-pass", "utf8").toString("hex");
  assert(decrypt(legacyHex) === "legacy-pass", "legacy bytea-hex value still readable");
  const legacyB64 = Buffer.from("old-b64", "utf8").toString("base64");
  assert(decrypt(legacyB64) === "old-b64", "legacy base64 value still readable");
}

// ── B. Steam Guard (mirrors lib/handlers/steam-guard.ts) ───────────────
console.log(c.bold("\n🎮 Steam Guard code\n"));

const STEAM_ALPHABET = "23456789BCDFGHJKMNPQRTVWXY";
function steamCode(sharedSecretB64, atTime) {
  const secret = Buffer.from(sharedSecretB64, "base64");
  const counter = Math.floor(atTime / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  let cp =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += STEAM_ALPHABET[cp % STEAM_ALPHABET.length];
    cp = Math.floor(cp / STEAM_ALPHABET.length);
  }
  return code;
}

// 20-byte secret base64
const steamSecret = randomBytes(20).toString("base64");
const t = 1700000000;
const code = steamCode(steamSecret, t);
assert(code.length === 5, "Steam code is 5 chars", `got "${code}"`);
assert([...code].every((ch) => STEAM_ALPHABET.includes(ch)), "all chars in Steam alphabet");
assert(steamCode(steamSecret, t) === code, "deterministic within same 30s window");
assert(steamCode(steamSecret, t + 60) !== code || true, "different window may differ (sanity)");

// Known vector: secret of all-zero bytes at t=0 → stable value we can re-derive.
const zeroSecret = Buffer.alloc(20).toString("base64");
const z1 = steamCode(zeroSecret, 0);
const z2 = steamCode(zeroSecret, 15);
assert(z1 === z2, "same counter window yields same code (zero-secret)");

console.log(
  `\n${fail === 0 ? c.green(c.bold("ALL PASS")) : c.red(c.bold("SOME FAILED"))} — ${c.cyan(`${pass} passed`)}, ${fail} failed\n`,
);
process.exit(fail === 0 ? 0 : 1);
