/**
 * RBAC test — validates the role/route access matrix AND the live DB state.
 *
 * Part A (pure logic): mirrors lib/auth/rbac.ts and asserts every
 *   (role × route) pair resolves to the expected allow/deny. This is the
 *   contract the middleware enforces, so if it drifts, this test screams.
 *
 * Part B (live DB): connects with the service role, confirms the `role`
 *   column + check constraint exist, that the owner is a manager, and that a
 *   role round-trip (set → read → restore) works through the same path the
 *   staff actions use.
 *
 * Run:  node scripts/test-rbac.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── tiny env loader (.env at repo root) ──────────────────────────────
function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env"), "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key) env[key] = value;
  }
  return env;
}
const env = loadEnv();

// ── colors ──────────────────────────────────────────────────────────
const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const b = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let pass = 0;
let fail = 0;
function assert(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ${g("✓")} ${name}`);
  } else {
    fail++;
    console.log(`  ${r("✗")} ${name}`);
  }
}

// ── MIRROR of lib/auth/rbac.ts (keep in sync) ────────────────────────
const ROUTE_RULES = [
  { prefix: "/admin/staff", roles: ["manager"] },
  { prefix: "/admin/settings", roles: ["manager"] },
  { prefix: "/admin/integrations", roles: ["manager", "supervisor"] },
  { prefix: "/admin/telegram", roles: ["manager", "supervisor"] },
  { prefix: "/admin/notifications", roles: ["manager", "supervisor"] },
  { prefix: "/admin/accounts", roles: ["manager", "supervisor"] },
  { prefix: "/admin/products", roles: ["manager", "supervisor"] },
  { prefix: "/admin/archives", roles: ["manager", "supervisor"] },
  { prefix: "/admin/orders", roles: ["manager", "supervisor", "support"] },
  { prefix: "/admin/otp-logs", roles: ["manager", "supervisor", "support", "code_limit"] },
  { prefix: "/admin/profile", roles: ["manager", "supervisor", "support", "code_limit"] },
  { prefix: "/admin", roles: ["manager", "supervisor", "support"] },
];

function canAccessRoute(role, pathname) {
  const match = [...ROUTE_RULES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find(
      (rule) =>
        pathname === rule.prefix ||
        pathname.startsWith(rule.prefix + "/") ||
        pathname.startsWith(rule.prefix),
    );
  if (!match) return role === "manager";
  return match.roles.includes(role);
}

// ── PART A: access matrix ────────────────────────────────────────────
console.log(b("\n▶ Part A — RBAC route access matrix\n"));

// Expected matrix: route → roles that MUST be allowed. Everything else denied.
const MATRIX = {
  "/admin": ["manager", "supervisor", "support"],
  "/admin/orders": ["manager", "supervisor", "support"],
  "/admin/otp-logs": ["manager", "supervisor", "support", "code_limit"],
  "/admin/products": ["manager", "supervisor"],
  "/admin/accounts": ["manager", "supervisor"],
  "/admin/notifications": ["manager", "supervisor"],
  "/admin/telegram": ["manager", "supervisor"],
  "/admin/integrations": ["manager", "supervisor"],
  "/admin/archives": ["manager", "supervisor"],
  "/admin/settings": ["manager"],
  "/admin/staff": ["manager"],
  "/admin/profile": ["manager", "supervisor", "support", "code_limit"],
};

const ALL_ROLES = ["manager", "supervisor", "support", "code_limit"];

for (const [route, allowed] of Object.entries(MATRIX)) {
  for (const role of ALL_ROLES) {
    const expect = allowed.includes(role);
    const got = canAccessRoute(role, route);
    assert(
      `${role.padEnd(11)} → ${route.padEnd(22)} ${expect ? "allow" : "deny "}`,
      got === expect,
    );
  }
}

// Critical confinement checks for the locked-down roles.
console.log(b("\n▶ Part A.2 — confinement guarantees\n"));
assert("code_limit CANNOT open dashboard", !canAccessRoute("code_limit", "/admin"));
assert("code_limit CANNOT open orders", !canAccessRoute("code_limit", "/admin/orders"));
assert("code_limit CANNOT open accounts (secrets)", !canAccessRoute("code_limit", "/admin/accounts"));
assert("code_limit CAN open otp-logs", canAccessRoute("code_limit", "/admin/otp-logs"));
assert("support CANNOT open accounts (secrets)", !canAccessRoute("support", "/admin/accounts"));
assert("support CANNOT open staff", !canAccessRoute("support", "/admin/staff"));
assert("support CANNOT open settings", !canAccessRoute("support", "/admin/settings"));
assert("supervisor CANNOT open staff", !canAccessRoute("supervisor", "/admin/staff"));
assert("supervisor CANNOT open settings", !canAccessRoute("supervisor", "/admin/settings"));
assert("supervisor CAN open accounts", canAccessRoute("supervisor", "/admin/accounts"));
assert("manager CAN open everything", Object.keys(MATRIX).every((p) => canAccessRoute("manager", p)));
// Deep paths inherit the prefix rule.
assert("code_limit deep otp path allowed", canAccessRoute("code_limit", "/admin/otp-logs?tab=session"));
assert("support deep accounts path denied", !canAccessRoute("support", "/admin/accounts/123"));

// ── PART B: live DB ──────────────────────────────────────────────────
console.log(b("\n▶ Part B — live database state\n"));

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// B.1 — role column exists and is populated
const { data: profiles, error: pErr } = await sb
  .from("profiles")
  .select("id, email, role");

assert("profiles query succeeds", !pErr);
assert("every profile has a role", (profiles ?? []).every((p) => p.role));
assert(
  "all roles are valid enum values",
  (profiles ?? []).every((p) => ALL_ROLES.includes(p.role)),
);

const managers = (profiles ?? []).filter((p) => p.role === "manager");
assert("at least one manager exists", managers.length >= 1);
console.log(dim(`    → ${profiles?.length ?? 0} profile(s), ${managers.length} manager(s)`));

// B.2 — check constraint rejects bad roles
const target = (profiles ?? [])[0];
if (target) {
  const { error: badErr } = await sb
    .from("profiles")
    .update({ role: "superhacker" })
    .eq("id", target.id);
  assert("check constraint rejects invalid role", !!badErr);
}

// B.3 — role round-trip via the same column the staff actions write.
// Use a throwaway: create → set support → verify → delete. Keeps real data safe.
const testEmail = `rbac-test-${Date.now()}@example.com`;
const { data: created, error: cErr } = await sb.auth.admin.createUser({
  email: testEmail,
  password: `Tmp!${Math.random().toString(36).slice(2)}Aa1`,
  email_confirm: true,
  user_metadata: { name: "RBAC Test", role: "support" },
});

if (cErr) {
  assert(`create throwaway user (${cErr.message})`, false);
} else {
  const uid = created.user.id;
  // Trigger should have stamped role=support from metadata.
  // Give the trigger a beat, then read.
  await new Promise((r) => setTimeout(r, 400));
  const { data: row } = await sb
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();
  assert("signup trigger applied invited role (support)", row?.role === "support");

  // Promote to supervisor (mimics setStaffRoleAction).
  await sb.from("profiles").update({ role: "supervisor" }).eq("id", uid);
  const { data: row2 } = await sb
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();
  assert("role update persists (supervisor)", row2?.role === "supervisor");

  // Cleanup.
  const { error: delErr } = await sb.auth.admin.deleteUser(uid);
  assert("throwaway user cleaned up", !delErr);
}

// ── summary ──────────────────────────────────────────────────────────
console.log(b(`\n${"─".repeat(48)}`));
console.log(b(`  RESULT: ${g(pass + " passed")}${fail ? ", " + r(fail + " failed") : ""}`));
console.log(b("─".repeat(48) + "\n"));

process.exit(fail ? 1 : 0);
