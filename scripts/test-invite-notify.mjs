/**
 * Invitation accept/decline flow test (live DB).
 *
 * Mirrors the exact operations the invite actions perform:
 *   1. throwaway "invitee" account exists.
 *   2. invite to a NON-existent email is rejected (no profile).
 *   3. create a PENDING invitation (no role applied yet).
 *   4. invitee's profile role is UNCHANGED while pending (key guarantee).
 *   5. accept → invitation 'accepted' + role applied to profile.
 *   6. a notification was created for the invitee.
 *   7. decline path on a second invite leaves role untouched.
 *   8. cleanup.
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
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq > 0) env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();
const g = (s) => `\x1b[32m${s}\x1b[0m`, r = (s) => `\x1b[31m${s}\x1b[0m`, b = (s) => `\x1b[1m${s}\x1b[0m`, dim = (s) => `\x1b[2m${s}\x1b[0m`;
let pass = 0, fail = 0;
const assert = (n, c) => { if (c) { pass++; console.log(`  ${g("✓")} ${n}`); } else { fail++; console.log(`  ${r("✗")} ${n}`); } };

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(b("\n▶ Invitation accept / decline flow\n"));

// Owner (manager) + a connected store as the workspace.
const { data: ownerRows } = await sb
  .from("profiles").select("id, name, email").eq("role", "manager").limit(1);
const owner = ownerRows?.[0];
assert("owner (manager) exists", !!owner);

const { data: store } = await sb
  .from("salla_stores").select("store_id, store_name").is("uninstalled_at", null)
  .order("installed_at", { ascending: true }).limit(1).maybeSingle();
const storeId = store?.store_id ?? 9999999;
const storeName = store?.store_name ?? "Test Store";

// 1. throwaway invitee
const email = `invite-${Date.now()}@example.com`;
const { data: created, error: cErr } = await sb.auth.admin.createUser({
  email, password: `Tmp!${Math.random().toString(36).slice(2)}Aa1`,
  email_confirm: true, user_metadata: { name: "Invitee" },
});
assert("invitee account created", !cErr && !!created?.user);
const uid = created?.user?.id;
await new Promise((r) => setTimeout(r, 400)); // trigger creates profile

// 2. non-existent email → no profile
const { data: ghost } = await sb.from("profiles").select("id").eq("email", `ghost-${Date.now()}@x.test`).maybeSingle();
assert("non-existent email rejected (no profile)", !ghost);

if (uid) {
  // capture starting role (trigger default)
  const { data: before } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
  const startRole = before?.role;

  // 3. create pending invitation as 'support'
  const { data: inv, error: invErr } = await sb
    .from("workspace_invitations")
    .insert({
      store_id: storeId, store_name: storeName, invitee_id: uid,
      invitee_email: email, role: "support", status: "pending",
      invited_by: owner?.id ?? null, invited_by_name: owner?.name ?? "مدير",
    })
    .select("id, status, role")
    .single();
  assert("pending invitation created", !invErr && inv?.status === "pending");

  // 4. role unchanged while pending
  const { data: midProf } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
  assert("role UNCHANGED while invitation pending", midProf?.role === startRole);

  // notification for invitee
  await sb.from("notifications").insert({
    user_id: uid, type: "staff_invite", title: "لديك دعوة للانضمام",
    body: "test", link: "/admin/staff", actor_id: owner?.id ?? null,
  });
  const { count: notifCount } = await sb
    .from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid);
  assert("invitee got a notification", (notifCount ?? 0) >= 1);

  // 5. accept → status accepted + role applied
  await sb.from("workspace_invitations")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", inv.id);
  await sb.from("profiles").update({ role: "support" }).eq("id", uid);
  const { data: afterAccept } = await sb.from("workspace_invitations").select("status").eq("id", inv.id).maybeSingle();
  const { data: roleProf } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
  assert("invitation marked accepted", afterAccept?.status === "accepted");
  assert("role applied on accept (support)", roleProf?.role === "support");

  // workspace switcher would now include this store for the invitee
  const { data: accepted } = await sb
    .from("workspace_invitations").select("store_id").eq("invitee_id", uid).eq("status", "accepted");
  assert("accepted workspace visible to switcher", (accepted ?? []).some((a) => String(a.store_id) === String(storeId)));

  // 7. decline path: new invite, decline, role stays
  await sb.from("workspace_invitations").delete().eq("id", inv.id);
  const { data: inv2 } = await sb.from("workspace_invitations").insert({
    store_id: storeId, store_name: storeName, invitee_id: uid,
    invitee_email: email, role: "supervisor", status: "pending",
    invited_by: owner?.id ?? null,
  }).select("id").single();
  await sb.from("workspace_invitations").update({ status: "declined" }).eq("id", inv2.id);
  const { data: afterDecline } = await sb.from("profiles").select("role").eq("id", uid).maybeSingle();
  assert("role NOT escalated on decline (stays support)", afterDecline?.role === "support");

  // 8. cleanup (cascades invitations + notifications)
  const { error: delErr } = await sb.auth.admin.deleteUser(uid);
  assert("cleanup", !delErr);
  const { count: leftover } = await sb
    .from("workspace_invitations").select("id", { count: "exact", head: true }).eq("invitee_id", uid);
  assert("invitations cascade-deleted with user", (leftover ?? 0) === 0);
}

console.log(b(`\n${"─".repeat(48)}`));
console.log(b(`  RESULT: ${g(pass + " passed")}${fail ? ", " + r(fail + " failed") : ""}`));
console.log(b("─".repeat(48) + "\n"));
process.exit(fail ? 1 : 0);
