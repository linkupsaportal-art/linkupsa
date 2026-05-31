/**
 * Auto-login-after-verify test.
 *
 * Proves the magic-link token path verifyEmailAction uses can actually mint a
 * usable session for a just-verified user — i.e. generateLink(magiclink) then
 * verifyOtp(token_hash) returns a session, so the client can land on /admin
 * instead of /login.
 *
 * Run:  node scripts/test-autologin.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env"), "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq > 0) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();
const g = (s) => `\x1b[32m${s}\x1b[0m`, r = (s) => `\x1b[31m${s}\x1b[0m`, b = (s) => `\x1b[1m${s}\x1b[0m`;
let pass = 0, fail = 0;
const assert = (n, c) => { if (c) { pass++; console.log(`  ${g("✓")} ${n}`); } else { fail++; console.log(`  ${r("✗")} ${n}`); } };

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(b("\n▶ Auto-login after email verification\n"));

const email = `autologin-${Date.now()}@example.com`;
const { data: created, error: cErr } = await admin.auth.admin.createUser({
  email,
  password: `Tmp!${Math.random().toString(36).slice(2)}Aa1`,
  email_confirm: true,
  user_metadata: { name: "AutoLogin Test" },
});
assert("throwaway user created", !cErr && !!created?.user);
const uid = created?.user?.id;

// 1. generate magic-link token (what verifyEmailAction does)
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
assert("generateLink(magiclink) succeeds", !linkErr);
const tokenHash = linkData?.properties?.hashed_token;
assert("token hash present", !!tokenHash);

// 2. consume it on a fresh anon client → should return a session
if (tokenHash) {
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: sess, error: otpErr } = await anon.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  assert("verifyOtp returns a session (auto-login works)", !otpErr && !!sess?.session?.access_token);
  assert("session belongs to the right user", sess?.user?.email === email);
}

// cleanup
if (uid) {
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  assert("cleanup", !delErr);
}

console.log(b(`\n${"─".repeat(44)}`));
console.log(b(`  RESULT: ${g(pass + " passed")}${fail ? ", " + r(fail + " failed") : ""}`));
console.log(b("─".repeat(44) + "\n"));
process.exit(fail ? 1 : 0);
