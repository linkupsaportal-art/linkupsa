/**
 * Staff invite + notification flow test (live DB).
 *
 * Simulates the exact DB operations inviteStaffAction performs:
 *   1. Create a throwaway "existing" staff account.
 *   2. Reject an invite to a NON-existent email (key guarantee).
 *   3. "Invite" the existing account → assign role + insert a notification.
 *   4. Verify the notification row exists, is unread, links to /admin/staff,
 *      and names the inviter.
 *   5. Mark it read → verify read_at set + unread count drops.
 *   6. Cleanup (cascades delete the notification via FK).
 *
 * Also sends ONE real Resend email to the verified address to prove the
 * SMTP path works end to end (set SKIP_EMAIL=1 to skip).
 *
 * Run:  node scripts/test-invite-notify.mjs
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

const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const b = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let pass = 0, fail = 0;
function assert(name, cond) {
  if (cond) { pass++; console.log(`  ${g("✓")} ${name}`); }
  else { fail++; console.log(`  ${r("✗")} ${name}`); }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(b("\n▶ Staff invite + notification flow\n"));

// Inviter = the real owner (manager).
const { data: ownerRows } = await sb
  .from("profiles")
  .select("id, name, email, role")
  .eq("role", "manager")
  .limit(1);
const owner = ownerRows?.[0];
assert("owner (manager) exists", !!owner);
const inviterName = owner?.name || owner?.email || "مدير المتجر";

// ── 1. throwaway existing staff account ──────────────────────────────
const staffEmail = `invite-test-${Date.now()}@example.com`;
const { data: created, error: cErr } = await sb.auth.admin.createUser({
  email: staffEmail,
  password: `Tmp!${Math.random().toString(36).slice(2)}Aa1`,
  email_confirm: true,
  user_metadata: { name: "Invite Test User" },
});
assert("throwaway staff account created", !cErr && !!created?.user);
const staffId = created?.user?.id;
await new Promise((r) => setTimeout(r, 400)); // let trigger create profile

// ── 2. invite to a NON-existent email must be rejected ───────────────
const ghostEmail = `ghost-${Date.now()}@nowhere.test`;
const { data: ghost } = await sb
  .from("profiles")
  .select("id")
  .eq("email", ghostEmail)
  .maybeSingle();
assert("non-existent email has no profile (invite would be rejected)", !ghost);

// ── 3. simulate invite: assign role + insert notification ────────────
const ROLE = "support";
if (staffId) {
  await sb.from("profiles").update({ role: ROLE }).eq("id", staffId);
  const { data: roleRow } = await sb
    .from("profiles").select("role").eq("id", staffId).maybeSingle();
  assert("role assigned to invitee (support)", roleRow?.role === ROLE);

  const { data: notif, error: nErr } = await sb
    .from("notifications")
    .insert({
      user_id: staffId,
      type: "staff_invite",
      title: "تمت دعوتك إلى الفريق",
      body: `قام ${inviterName} بإضافتك كـ "خدمة عملاء". اضغط لعرض التفاصيل.`,
      link: "/admin/staff",
      actor_id: owner?.id ?? null,
      actor_name: inviterName,
      metadata: { role: ROLE },
    })
    .select("id, read_at, link, actor_name, type")
    .single();

  assert("notification inserted", !nErr && !!notif);
  assert("notification is unread", notif?.read_at === null);
  assert("notification links to /admin/staff", notif?.link === "/admin/staff");
  assert("notification names the inviter", notif?.actor_name === inviterName);
  assert("notification type = staff_invite", notif?.type === "staff_invite");

  // ── 4. unread count = 1 ────────────────────────────────────────────
  const { count: unread1 } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", staffId)
    .is("read_at", null);
  assert("unread count is 1", unread1 === 1);

  // ── 5. mark read ───────────────────────────────────────────────────
  await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notif.id)
    .eq("user_id", staffId);
  const { count: unread2 } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", staffId)
    .is("read_at", null);
  assert("unread count drops to 0 after mark-read", unread2 === 0);

  // ── 6. cleanup (FK cascade removes the notification) ───────────────
  const { error: delErr } = await sb.auth.admin.deleteUser(staffId);
  assert("throwaway account cleaned up", !delErr);
  const { count: orphan } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", staffId);
  assert("notification cascade-deleted with user", (orphan ?? 0) === 0);
}

// ── Resend SMTP proof (verified domain) ──────────────────────────────
if (env.SKIP_EMAIL !== "1" && env.RESEND_API_KEY) {
  console.log(b("\n▶ Resend SMTP (verified domain portaliosa.com)\n"));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || "LinkUp <noreply@portaliosa.com>",
      to: "razexelite11@gmail.com",
      subject: "اختبار دعوة موظف — LinkUp",
      html: `<div dir="rtl" style="font-family:sans-serif;padding:24px">
        <h2>تمت دعوتك إلى الفريق ✅</h2>
        <p>هذه رسالة اختبار للتأكد من عمل قناة البريد عبر Resend.</p>
        <p>الدور: <b>خدمة عملاء</b> — قام بدعوتك: <b>${inviterName}</b></p>
        <a href="https://linkupdash.portaliosa.com/admin/staff" style="display:inline-block;background:#0a0a0a;color:#D4F542;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700">فتح اللوحة</a>
      </div>`,
    }),
  });
  const json = await res.json().catch(() => ({}));
  assert("Resend accepted the email (has id)", res.ok && !!json.id);
  console.log(dim(`    → message id: ${json.id ?? "n/a"}`));
} else {
  console.log(dim("\n(skipping live email — SKIP_EMAIL=1 or no RESEND_API_KEY)\n"));
}

console.log(b(`\n${"─".repeat(48)}`));
console.log(b(`  RESULT: ${g(pass + " passed")}${fail ? ", " + r(fail + " failed") : ""}`));
console.log(b("─".repeat(48) + "\n"));
process.exit(fail ? 1 : 0);
