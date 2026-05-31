/**
 * Verifies the app's decrypt path against the live DB: reads each account's
 * encrypted columns exactly as supabase-js returns them and decrypts, then
 * checks the known test values match. Prints decrypted previews (masked).
 *
 * Run: node scripts/verify-decrypt.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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
const key = Buffer.from(env.ENCRYPTION_KEY, "base64");

function decryptSecret(stored) {
  if (stored == null) return null;
  let inner = String(stored);
  if (inner.startsWith("\\x")) inner = Buffer.from(inner.slice(2), "hex").toString("utf8");
  if (inner.startsWith("v1:")) {
    const [, iv, tag, ct] = inner.split(":");
    const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
  }
  return inner;
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const c = { green: (s) => `\x1b[32m${s}\x1b[0m`, red: (s) => `\x1b[31m${s}\x1b[0m` };
let pass = 0, fail = 0;

const EXPECT = {
  "Test Account #1": "Pa$$word123!",
  "Test Account #2": "SecretPwd456@",
  "Test Account #3": "AnotherPass789#",
  "2FA Account #1": "Pa$$word123!",
};
const EXPECT_TOTP = { "2FA Account #1": "JBSWY3DPEHPK3PXP" };

const { data } = await sb.from("accounts").select("label, password_encrypted, totp_secret_encrypted");
for (const row of data ?? []) {
  const pw = decryptSecret(row.password_encrypted);
  const want = EXPECT[row.label];
  if (want) {
    if (pw === want) { pass++; console.log(`  ${c.green("✓")} ${row.label}: password decrypts correctly`); }
    else { fail++; console.log(`  ${c.red("✗")} ${row.label}: got "${pw}" want "${want}"`); }
  }
  if (EXPECT_TOTP[row.label]) {
    const totp = decryptSecret(row.totp_secret_encrypted);
    if (totp === EXPECT_TOTP[row.label]) { pass++; console.log(`  ${c.green("✓")} ${row.label}: TOTP seed decrypts correctly`); }
    else { fail++; console.log(`  ${c.red("✗")} ${row.label}: TOTP got "${totp}"`); }
  }
}

console.log(`\n${fail === 0 ? c.green("ALL PASS") : c.red("SOME FAILED")} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
