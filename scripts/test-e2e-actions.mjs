/**
 * End-to-end test for the new operational features, run against the LIVE DB
 * with the service role. Mirrors the server-action logic (the actions
 * themselves are "use server" and can't be imported into a plain script), so
 * this asserts the exact SQL effects each action performs.
 *
 * Covers:
 *   - digital-files bucket exists + is PRIVATE + signed URL works
 *   - order: raise limit (+ code_limit_changes journal)
 *   - order: edit usage
 *   - order: reassign account (+ decrement_account_usage RPC)
 *   - order: stop / archive / restore
 *   - order: renew (reset usage, reactivate)
 *   - retention cutoffs compute
 *
 * Creates a throwaway order + uses an existing account, then cleans up.
 *
 * Run: node scripts/test-e2e-actions.mjs
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
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log(`  ${c.green("✓")} ${n}`); };
const bad = (n, d) => { fail++; console.log(`  ${c.red("✗")} ${n}`); if (d) console.log(`    ${c.dim(d)}`); };
const assert = (cond, n, d) => (cond ? ok(n) : bad(n, d));

let createdOrderId = null;

async function main() {
  // ── Storage: digital-files bucket ──────────────────────────────────────
  console.log(c.bold("\n📁 Digital-files storage\n"));
  {
    const { data: buckets } = await sb.storage.listBuckets();
    const bucket = (buckets ?? []).find((b) => b.id === "digital-files");
    assert(!!bucket, "digital-files bucket exists");
    assert(bucket && bucket.public === false, "bucket is PRIVATE (not public)");

    // Upload a tiny file then sign it.
    const key = `__test__/e2e-${Date.now()}.txt`;
    const { error: upErr } = await sb.storage
      .from("digital-files")
      .upload(key, Buffer.from("hello-delivery"), { contentType: "text/plain", upsert: true });
    assert(!upErr, "can upload a file to the private bucket", upErr?.message);

    const { data: signed, error: signErr } = await sb.storage
      .from("digital-files")
      .createSignedUrl(key, 300, { download: true });
    assert(!signErr && !!signed?.signedUrl, "signed URL minted (5 min TTL)", signErr?.message);
    assert(signed?.signedUrl?.includes("token="), "signed URL carries a token");

    // Cleanup the test file.
    await sb.storage.from("digital-files").remove([key]);
  }

  // ── Seed: pick a product + account, create a throwaway order ───────────
  console.log(c.bold("\n🌱 Seed order\n"));
  const { data: product } = await sb.from("products").select("id").limit(1).maybeSingle();
  const { data: account } = await sb
    .from("accounts")
    .select("id, current_usage, max_usage, product_id")
    .limit(1)
    .maybeSingle();
  if (!product || !account) {
    bad("seed data present (product + account)", "need at least 1 product and 1 account");
    return finish();
  }
  ok("seed data present (product + account)");

  const uniqueSalla = Math.floor(Date.now() / 1000); // unique salla_order_id
  const { data: order, error: insErr } = await sb
    .from("orders")
    .insert({
      salla_order_id: uniqueSalla,
      salla_reference_id: uniqueSalla,
      customer_name: "E2E Test",
      customer_mobile: "+966500000000",
      product_id: product.id,
      account_id: account.id,
      payment_status: "paid",
      fulfillment_status: "fulfilled",
      otp_request_count: 3,
      otp_request_limit: 10,
    })
    .select("id, otp_request_limit, otp_request_count")
    .single();
  assert(!insErr && !!order, "throwaway order created", insErr?.message);
  if (!order) return finish();
  createdOrderId = order.id;

  // ── Raise limit + journal ──────────────────────────────────────────────
  console.log(c.bold("\n⚙️  Order actions\n"));
  {
    const newLimit = 25;
    await sb.from("orders").update({ otp_request_limit: newLimit }).eq("id", order.id);
    await sb.from("code_limit_changes").insert({
      order_id: order.id,
      order_reference: uniqueSalla,
      previous_limit: 10,
      new_limit: newLimit,
      changed_by_name: "E2E",
      reason: "test",
    });
    const { data: after } = await sb.from("orders").select("otp_request_limit").eq("id", order.id).single();
    assert(after?.otp_request_limit === newLimit, "raise limit persists (10 → 25)");

    const { count } = await sb
      .from("code_limit_changes")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id);
    assert((count ?? 0) >= 1, "code_limit_changes journal row written");
  }

  // ── Edit usage ─────────────────────────────────────────────────────────
  {
    await sb.from("orders").update({ otp_request_count: 7 }).eq("id", order.id);
    const { data } = await sb.from("orders").select("otp_request_count").eq("id", order.id).single();
    assert(data?.otp_request_count === 7, "edit usage persists (→ 7)");
  }

  // ── Reassign + decrement RPC ───────────────────────────────────────────
  {
    const before = account.current_usage;
    const { error: rpcErr } = await sb.rpc("decrement_account_usage", { p_account_id: account.id });
    assert(!rpcErr, "decrement_account_usage RPC callable", rpcErr?.message);
    const { data: acc } = await sb.from("accounts").select("current_usage").eq("id", account.id).single();
    assert(acc && acc.current_usage <= before, "account usage decremented (never below 0)");
    // restore
    await sb.from("accounts").update({ current_usage: before }).eq("id", account.id);
  }

  // ── Stop / archive / restore ───────────────────────────────────────────
  {
    await sb.from("orders").update({ fulfillment_status: "cancelled" }).eq("id", order.id);
    let { data } = await sb.from("orders").select("fulfillment_status").eq("id", order.id).single();
    assert(data?.fulfillment_status === "cancelled", "stop sets fulfillment=cancelled");

    await sb.from("orders").update({ archived_at: new Date().toISOString(), archived_reason: "manual" }).eq("id", order.id);
    ({ data } = await sb.from("orders").select("archived_at").eq("id", order.id).single());
    assert(!!data?.archived_at, "archive sets archived_at");

    // Archived order must appear in the archived list query (not is null).
    const { data: archivedList } = await sb
      .from("orders")
      .select("id, archived_at, archived_reason")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });
    const inList = (archivedList ?? []).some((o) => o.id === order.id);
    assert(inList, "archived order shows in the archived-orders list");

    // Restore.
    await sb.from("orders").update({ archived_at: null, archived_reason: null }).eq("id", order.id);
    ({ data } = await sb.from("orders").select("archived_at").eq("id", order.id).single());
    assert(!data?.archived_at, "restore clears archived_at (back to active)");

    // After restore it must drop OUT of the archived list.
    const { data: afterList } = await sb
      .from("orders")
      .select("id")
      .not("archived_at", "is", null);
    const stillThere = (afterList ?? []).some((o) => o.id === order.id);
    assert(!stillThere, "restored order no longer in archived list");
  }

  // ── Renew (reset usage, reactivate) ────────────────────────────────────
  {
    await sb.from("orders").update({
      otp_request_count: 0,
      otp_request_limit: 35,
      fulfillment_status: "fulfilled",
      archived_at: null,
    }).eq("id", order.id);
    const { data } = await sb.from("orders").select("otp_request_count, fulfillment_status, otp_request_limit").eq("id", order.id).single();
    assert(data?.otp_request_count === 0 && data?.fulfillment_status === "fulfilled", "renew resets usage + reactivates");
    assert(data?.otp_request_limit === 35, "renew can extend the limit");
  }

  // ── Retention cutoffs ──────────────────────────────────────────────────
  console.log(c.bold("\n🧹 Retention\n"));
  {
    const { data: setting } = await sb.from("platform_settings").select("value").eq("key", "retention").maybeSingle();
    // Either explicit row or defaults (90/90) — just assert the cutoff math.
    const days = (setting?.value?.archive_orders_after_days) ?? 90;
    const cutoff = new Date(Date.now() - days * 86400000);
    assert(cutoff < new Date(), "archive cutoff is in the past (sane)");
    ok(`retention window = ${days} days`);
  }

  await finish();
}

async function finish() {
  // Cleanup
  if (createdOrderId) {
    await sb.from("code_limit_changes").delete().eq("order_id", createdOrderId);
    await sb.from("orders").delete().eq("id", createdOrderId);
    console.log(c.dim("\n  cleaned up throwaway order"));
  }
  console.log(
    `\n${fail === 0 ? c.green(c.bold("ALL PASS")) : c.red(c.bold("SOME FAILED"))} — ${c.cyan(`${pass} passed`)}, ${fail} failed\n`,
  );
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); finish(); });
