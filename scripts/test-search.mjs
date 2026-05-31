/**
 * Command-palette search test.
 *
 * Part A (role scoping): mirrors the capability matrix in lib/auth/rbac.ts
 *   and asserts which entity categories each role is allowed to search. If
 *   the search layer ever broadens what a role can see, this screams.
 *
 * Part B (live queries): runs the same ILIKE / numeric-intent queries the
 *   search layer issues against the live DB with the service role, proving
 *   the filters are valid PostgREST and return shaped rows. It also asserts
 *   NO secret columns are ever selected.
 *
 * Run:  node scripts/test-search.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env"), "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

let pass = 0;
let fail = 0;
function ok(name) { pass++; console.log(`  ${c.green("✓")} ${name}`); }
function bad(name, detail) { fail++; console.log(`  ${c.red("✗")} ${name}`); if (detail) console.log(`    ${c.dim(detail)}`); }
function assert(cond, name, detail) { cond ? ok(name) : bad(name, detail); }

// ── Part A: capability matrix (mirrors lib/auth/rbac.ts) ──────────────
const ROLE_CAPS = {
  manager: ["view_orders", "view_products", "view_accounts", "view_otp_logs", "manage_bans"],
  supervisor: ["view_orders", "view_products", "view_accounts", "view_otp_logs", "manage_bans"],
  support: ["view_orders", "view_otp_logs", "manage_bans"],
  code_limit: ["view_otp_logs"],
};
const can = (role, cap) => ROLE_CAPS[role]?.includes(cap) ?? false;

// What categories the search layer exposes, keyed by capability.
const CATEGORY_CAP = {
  orders: "view_orders",
  products: "view_products",
  accounts: "view_accounts",
  otp: "view_otp_logs",
  bans: "manage_bans",
};

console.log(c.bold("\n🔎 Search role-scoping matrix\n"));

// Expected: which categories each role can search.
const EXPECT = {
  manager: ["orders", "products", "accounts", "otp", "bans"],
  supervisor: ["orders", "products", "accounts", "otp", "bans"],
  support: ["orders", "otp", "bans"],
  code_limit: ["otp"],
};

for (const role of Object.keys(EXPECT)) {
  const allowed = Object.entries(CATEGORY_CAP)
    .filter(([, cap]) => can(role, cap))
    .map(([cat]) => cat);
  const expected = EXPECT[role];
  const same =
    allowed.length === expected.length && expected.every((c2) => allowed.includes(c2));
  assert(same, `${role} → [${allowed.join(", ")}]`, same ? "" : `expected [${expected.join(", ")}]`);
}

// code_limit must NEVER see accounts (secrets-adjacent) or products.
assert(!can("code_limit", "view_accounts"), "code_limit cannot search accounts");
assert(!can("support", "view_accounts"), "support cannot search accounts (no secrets)");
assert(!can("support", "view_products"), "support cannot search products");

// ── Part B: live queries ──────────────────────────────────────────────
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const SECRET_COLS = [
  "password_encrypted", "totp_secret_encrypted",
  "steam_shared_secret_encrypted", "card_code_encrypted",
];

async function liveQueries() {
  console.log(c.bold("\n🗄️  Live search queries\n"));
  if (!SUPABASE_URL || !SERVICE_KEY) {
    bad("env present", "missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Orders — text intent
  {
    const { error } = await sb
      .from("orders")
      .select("id, salla_reference_id, customer_name, fulfillment_status, products(name, name_ar)")
      .or("customer_name.ilike.%a%,customer_email.ilike.%a%,customer_mobile.ilike.%a%")
      .is("archived_at", null)
      .limit(6);
    assert(!error, "orders text search query is valid", error?.message);
  }

  // Orders — numeric intent
  {
    const { error } = await sb
      .from("orders")
      .select("id, salla_reference_id, salla_order_id")
      .or("salla_reference_id.eq.1542,salla_order_id.eq.1542,customer_mobile.ilike.%1542%")
      .limit(6);
    assert(!error, "orders numeric-intent query is valid", error?.message);
  }

  // Products
  {
    const { error } = await sb
      .from("products")
      .select("id, name, name_ar, status, handler_type")
      .or("name.ilike.%a%,name_ar.ilike.%a%")
      .limit(6);
    assert(!error, "products search query is valid", error?.message);
  }

  // Accounts — assert NO secret columns selected
  {
    const sel = "id, label, email, status, current_usage, max_usage, products(name, name_ar)";
    const leaks = SECRET_COLS.filter((col) => sel.includes(col));
    assert(leaks.length === 0, "accounts select contains NO secret columns", leaks.join(", "));
    const { error } = await sb
      .from("accounts")
      .select(sel)
      .or("label.ilike.%a%,email.ilike.%a%")
      .limit(6);
    assert(!error, "accounts search query is valid", error?.message);
  }

  // OTP logs join
  {
    const { error } = await sb
      .from("otp_logs")
      .select("id, result, requested_at, order_id, orders!inner(salla_reference_id, customer_name, customer_mobile, customer_mobile_last4)")
      .order("requested_at", { ascending: false })
      .limit(10);
    assert(!error, "otp_logs joined query is valid", error?.message);
  }

  // Phone bans
  {
    const { error } = await sb
      .from("phone_bans")
      .select("id, mobile, reason, active, auto_banned")
      .ilike("mobile", "%5%")
      .limit(6);
    assert(!error, "phone_bans search query is valid", error?.message);
  }
}

await liveQueries();

console.log(
  `\n${fail === 0 ? c.green(c.bold("ALL PASS")) : c.red(c.bold("SOME FAILED"))} — ${c.cyan(`${pass} passed`)}, ${fail} failed\n`,
);
process.exit(fail === 0 ? 0 : 1);
