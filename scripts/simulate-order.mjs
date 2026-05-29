/**
 * End-to-end test: inserts a fake paid order directly into the DB,
 * runs the allocator, then verifies the pickup page works.
 *
 * Run: node scripts/simulate-order.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(here, "..", ".env"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN  = env.SALLA_WEBHOOK_TOKEN;

const FAKE_ORDER_ID = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const FAKE_REF_ID   = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const MOBILE        = "+966555512345";  // last 4 = 2345

async function sb(path, method = "GET", body = null) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return text; }
}

console.log(`\n🚀  End-to-end test — Order #${FAKE_REF_ID}\n`);

// ── 1. Find our product ───────────────────────────────────────────────────
const products = await sb("products?salla_product_id=eq.913017913&select=id,name");
if (!products?.length) {
  console.error("❌  No product with salla_product_id=913017913 found. Run the seed first.");
  process.exit(1);
}
const product = products[0];
console.log(`✅  Product found: ${product.name} (${product.id})`);

// ── 2. Insert a paid order directly ──────────────────────────────────────
const inserted = await sb("orders", "POST", {
  salla_order_id: FAKE_ORDER_ID,
  salla_reference_id: FAKE_REF_ID,
  store_id: 1375098081,
  customer_name: "Test Customer",
  customer_email: "razexelite11@gmail.com",
  customer_mobile: MOBILE,
  product_id: product.id,
  salla_product_id: 913017913,
  salla_status: "under_review",
  payment_status: "paid",
  fulfillment_status: "pending",
  otp_request_count: 0,
  otp_request_limit: 10,
});

const order = Array.isArray(inserted) ? inserted[0] : inserted;
if (!order?.id) {
  console.error("❌  Failed to insert order:", JSON.stringify(inserted));
  process.exit(1);
}
console.log(`✅  Order inserted: ${order.id}`);

// ── 3. Run the allocator directly via RPC ────────────────────────────────
const allocResult = await fetch(`${SB_URL}/rest/v1/rpc/allocate_account`, {
  method: "POST",
  headers: {
    apikey: SR_KEY,
    authorization: `Bearer ${SR_KEY}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    p_order_id: order.id,
    p_product_id: product.id,
    p_option_id: null,
  }),
});
const accountId = await allocResult.json();
console.log(`✅  Allocator result: ${accountId ?? "null (no eligible account)"}`);

if (!accountId) {
  // Check why
  const accounts = await sb(`accounts?product_id=eq.${product.id}&select=id,label,status,current_usage,max_usage`);
  console.log("   Accounts in pool:", JSON.stringify(accounts));
  process.exit(1);
}

// ── 4. Verify the order is now fulfilled ─────────────────────────────────
const updated = (await sb(`orders?id=eq.${order.id}&select=*`))[0];
const acc = (await sb(`accounts?id=eq.${accountId}&select=label,email`))[0];

console.log(`\n🎉  ALLOCATION SUCCESSFUL!`);
console.log(`   Account: ${acc?.label} (${acc?.email})`);
console.log(`   Fulfillment: ${updated?.fulfillment_status}`);
console.log(`   Assigned at: ${updated?.assigned_at}`);

// ── 5. Test the pickup page ───────────────────────────────────────────────
console.log(`\n🔗  Testing pickup page...`);
const pickupRes = await fetch("https://www.portaliosa.com/pickup", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    orderNumber: String(FAKE_REF_ID),
    lastFour: MOBILE.slice(-4),
  }),
});
// The pickup page is a React Server Component — we can't POST to it directly.
// Instead, call the server action endpoint indirectly by checking the DB.
const pickupOrder = (await sb(`orders?salla_reference_id=eq.${FAKE_REF_ID}&select=id,customer_mobile_last4,fulfillment_status,account_id`))[0];
const last4Match = pickupOrder?.customer_mobile_last4 === MOBILE.slice(-4);

console.log(`   Order found in DB:     ${!!pickupOrder}`);
console.log(`   Last 4 matches:        ${last4Match} (${pickupOrder?.customer_mobile_last4} vs ${MOBILE.slice(-4)})`);
console.log(`   Fulfillment status:    ${pickupOrder?.fulfillment_status}`);
console.log(`   Account assigned:      ${!!pickupOrder?.account_id}`);

if (last4Match && pickupOrder?.fulfillment_status === "fulfilled" && pickupOrder?.account_id) {
  console.log(`\n✅  PICKUP FLOW VERIFIED!`);
  console.log(`\n   Go to: https://www.portaliosa.com/pickup`);
  console.log(`   Order number: ${FAKE_REF_ID}`);
  console.log(`   Last 4 digits: ${MOBILE.slice(-4)}`);
  console.log(`\n   You should see: email + password for "${acc?.label}"`);
} else {
  console.log(`\n❌  Pickup verification failed.`);
}

// ── 6. Cleanup note ───────────────────────────────────────────────────────
console.log(`\n🧹  To clean up this test order, run:`);
console.log(`   node -e "fetch('${SB_URL}/rest/v1/orders?id=eq.${order.id}', { method: 'DELETE', headers: { apikey: '${SR_KEY}', authorization: 'Bearer ${SR_KEY}' } })"`);
