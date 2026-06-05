#!/usr/bin/env node
/**
 * Webhook Order Simulator — fires a REAL Salla-format webhook at our
 * endpoint and monitors the full pipeline end-to-end.
 *
 * Usage:
 *   node scripts/webhook-order.mjs                       # → hits production
 *   node scripts/webhook-order.mjs --local               # → hits localhost:3000
 *   node scripts/webhook-order.mjs --target https://...   # → custom URL
 *   node scripts/webhook-order.mjs --proxy                # → hits Cloudflare Worker
 *   node scripts/webhook-order.mjs --full                 # → webhook + direct DB insert + allocate
 *
 * Modes:
 *   Default:  Fires webhook only — the order-ingestor will fetch from Salla API
 *             (fails for fake orders since they don't exist in Salla).
 *   --full:   Fires webhook AND inserts the order directly into DB + allocates
 *             an account. This tests the COMPLETE flow including notifications.
 *
 * What it does:
 *   1. Reads .env for SALLA_WEBHOOK_TOKEN + Supabase creds
 *   2. Looks up a real product + store in the DB
 *   3. Crafts a realistic Salla v2 order.created webhook payload
 *   4. POSTs it to the webhook endpoint with correct auth headers
 *   5. (--full) Inserts order into orders table + runs allocator
 *   6. Monitors the webhook_events inbox for processing
 *   7. Prints pickup credentials for manual verification
 *
 * The simulated order uses a unique salla_order_id so it won't collide
 * with real orders. Clean up with the printed command at the end.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac } from "node:crypto";

// ── Parse .env ────────────────────────────────────────────────────────────
const here = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(here, "..", ".env"), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN = env.SALLA_WEBHOOK_TOKEN;

if (!TOKEN) die("SALLA_WEBHOOK_TOKEN missing from .env");
if (!SB_URL || !SR_KEY) die("Supabase creds missing from .env");

// ── CLI flags ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isLocal = args.includes("--local");
const isProxy = args.includes("--proxy");
const isFull = args.includes("--full");
const customIdx = args.indexOf("--target");
const customTarget = customIdx !== -1 ? args[customIdx + 1] : null;

const WEBHOOK_URL = customTarget
  ?? (isLocal ? "http://localhost:3000/api/salla/webhook"
  : isProxy ? "https://salla-webhook-proxy.razexelite.workers.dev"
  : "https://www.portaliosa.com/api/salla/webhook");

const PROCESS_URL = isLocal
  ? "http://localhost:3000/api/salla/process"
  : "https://www.portaliosa.com/api/salla/process";

const APP_HOST = "https://www.portaliosa.com";
const STORE_ID = 1375098081;

// ── Helpers ───────────────────────────────────────────────────────────────
function die(msg) {
  console.error(`\n❌  ${msg}`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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

// ── Step 1: Find a real product ───────────────────────────────────────────
console.log("\n" + "═".repeat(60));
console.log("  🔥  SALLA WEBHOOK ORDER SIMULATOR");
console.log("═".repeat(60));
console.log(`\n📡  Target:   ${WEBHOOK_URL}`);
console.log(`🔄  Mode:     ${isFull ? "FULL (webhook + DB insert + allocate)" : "WEBHOOK ONLY"}`);

const products = await sb(
  "products?status=eq.active&select=id,name,salla_product_id,handler_type,notification_channels&limit=10",
);
if (!products?.length) die("No active products found in DB");

const product = products.find((p) => p.salla_product_id) ?? products[0];
console.log(`📦  Product:  ${product.name} (salla_id: ${product.salla_product_id})`);
console.log(`🔧  Handler:  ${product.handler_type}`);

// Check available accounts
const accounts = await sb(
  `accounts?product_id=eq.${product.id}&status=eq.active&select=id,label&limit=5`,
);
console.log(`🏦  Accounts: ${accounts?.length ?? 0} active`);

// ── Step 2: Craft a realistic Salla v2 order.created payload ──────────────
const SALLA_ORDER_ID = 9_000_000 + Math.floor(Math.random() * 999_999);
const REFERENCE_ID = 8_000_000 + Math.floor(Math.random() * 999_999);
const MOBILE_RAW = "555512345";
const MOBILE_CODE = "+966";
const MOBILE_FULL = `${MOBILE_CODE}${MOBILE_RAW}`;
const CUSTOMER_EMAIL = "razexelite11@gmail.com";
const NOW = new Date().toISOString().replace("T", " ").slice(0, 19);

const sallaPayload = {
  event: "order.created",
  merchant: STORE_ID,
  created_at: NOW,
  data: {
    id: SALLA_ORDER_ID,
    reference_id: REFERENCE_ID,
    date: { date: NOW, timezone_type: 3, timezone: "Asia/Riyadh" },
    status: {
      id: 3,
      name: "بإنتظار المراجعة",
      slug: "under_review",
      customized: { id: 3, name: "بإنتظار المراجعة" },
    },
    payment_method: "mada",
    is_pending_payment: false,
    currency: "SAR",
    total: { amount: 65.0, currency: "SAR" },
    sub_total: { amount: 65.0, currency: "SAR" },
    shipping_cost: { amount: 0, currency: "SAR" },
    customer: {
      id: 700_000 + Math.floor(Math.random() * 99_999),
      first_name: "عبدالله",
      last_name: "الاختبار",
      full_name: "عبدالله الاختبار",
      email: CUSTOMER_EMAIL,
      mobile: parseInt(MOBILE_RAW, 10),
      mobile_code: MOBILE_CODE,
      country: { code: "SA", name: "Saudi Arabia" },
      city: "الرياض",
      avatar: "",
      urls: { customer: `https://s.salla.sa/customers/${SALLA_ORDER_ID}` },
    },
    items: [
      {
        id: 100_000 + Math.floor(Math.random() * 99_999),
        name: product.name,
        sku: `SKU-${product.salla_product_id}`,
        quantity: 1,
        price: { amount: 65.0, currency: "SAR" },
        product: {
          id: product.salla_product_id,
          type: "digital",
          name: product.name,
        },
        options: [],
        codes: [],
      },
    ],
    store: {
      id: STORE_ID,
      name: "Portalio SA Demo",
      url: "https://linkupsasync.com",
    },
    urls: {
      admin: `https://s.salla.sa/orders/${SALLA_ORDER_ID}`,
    },
  },
};

console.log(`\n🆔  Salla Order:  ${SALLA_ORDER_ID}`);
console.log(`📋  Reference:    ${REFERENCE_ID}`);
console.log(`📱  Mobile:       ${MOBILE_FULL}`);
console.log(`📧  Email:        ${CUSTOMER_EMAIL}`);

// ── Step 3: Send the webhook ──────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log("📤  STEP 1 — Firing webhook...\n");

const rawBody = JSON.stringify(sallaPayload);
const hmacSignature = createHmac("sha256", TOKEN).update(rawBody).digest("hex");

const webhookResponse = await fetch(WEBHOOK_URL, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-salla-security-strategy": "Token",
    "authorization": TOKEN,
    "x-salla-token": TOKEN,
    "x-salla-signature": hmacSignature,
    "x-salla-event": "order.created",
    "user-agent": "Salla-Webhooks/2.0 (test-simulator)",
  },
  body: rawBody,
  signal: AbortSignal.timeout(15_000),
});

const webhookResult = await webhookResponse.text();
console.log(`   HTTP ${webhookResponse.status}: ${webhookResult}`);

if (!webhookResponse.ok) {
  die(`Webhook rejected! Status ${webhookResponse.status}`);
}

let parsedResult;
try { parsedResult = JSON.parse(webhookResult); } catch { parsedResult = {}; }

if (parsedResult.duplicate) {
  console.log("   ⚠️  Duplicate delivery (payload already in inbox).");
} else {
  console.log("   ✅  Webhook accepted and stored in inbox!");
}

// ── Step 4: Full mode — insert order + allocate directly ──────────────────
let order = null;

if (isFull) {
  console.log(`\n${"─".repeat(60)}`);
  console.log("📥  STEP 2 — Inserting order into DB (bypass Salla API)...\n");

  const inserted = await sb("orders", "POST", {
    salla_order_id: SALLA_ORDER_ID,
    salla_reference_id: REFERENCE_ID,
    store_id: STORE_ID,
    customer_name: "عبدالله الاختبار",
    customer_email: CUSTOMER_EMAIL,
    customer_mobile: MOBILE_FULL,
    product_id: product.id,
    salla_product_id: product.salla_product_id,
    salla_status: "under_review",
    payment_status: "paid",
    fulfillment_status: "pending",
    otp_request_count: 0,
    otp_request_limit: 10,
  });

  order = Array.isArray(inserted) ? inserted[0] : inserted;
  if (!order?.id) {
    console.error("   ❌  Failed to insert:", JSON.stringify(inserted));
    die("DB insert failed");
  }
  console.log(`   ✅  Order inserted: ${order.id}`);

  // Run allocator
  if (accounts?.length) {
    console.log(`\n${"─".repeat(60)}`);
    console.log("🎰  STEP 3 — Running account allocator...\n");

    const allocRes = await fetch(`${SB_URL}/rest/v1/rpc/allocate_account`, {
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
    const accountId = await allocRes.json();

    if (accountId) {
      console.log(`   ✅  Account allocated: ${accountId}`);

      const acc = (await sb(`accounts?id=eq.${accountId}&select=id,label,email`))[0];
      if (acc) {
        console.log(`       Label: ${acc.label}`);
        console.log(`       Email: ${acc.email}`);
      }

      // Mark the inbox event as succeeded
      if (parsedResult.id) {
        await sb(`webhook_events?id=eq.${parsedResult.id}`, "PATCH", { status: "succeeded" });
      }
    } else {
      console.log("   ⚠️  No eligible account available for allocation.");
    }
  } else {
    console.log("\n   ⏭️   Skipping allocation — no active accounts in pool.");
  }
} else {
  // Webhook-only mode — trigger the processor
  console.log(`\n${"─".repeat(60)}`);
  console.log("⚙️   STEP 2 — Triggering order processor...\n");
  console.log("   Note: For simulated orders, the Salla API lookup will fail");
  console.log("   because the order doesn't exist in Salla's system.");
  console.log("   For REAL orders from Salla, this step succeeds automatically.\n");

  await sleep(1000);

  const processRes = await fetch(PROCESS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });
  const processResult = await processRes.text();
  console.log(`   HTTP ${processRes.status}: ${processResult}`);
}

// ── Step 5: Final status check ────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
console.log("🔍  FINAL STATUS\n");

await sleep(1500);

// Check inbox
const inboxRows = await sb(
  `webhook_events?event=eq.order.created&select=id,event,status,error,received_at&order=received_at.desc&limit=5`,
);
if (inboxRows?.length) {
  console.log("   📬  Recent inbox events (order.created):");
  for (const row of inboxRows) {
    const icon =
      row.status === "succeeded" ? "✅"
      : row.status === "pending" ? "⏳"
      : row.status === "processing" ? "🔄"
      : row.status === "skipped" ? "⏭️" : "❌";
    console.log(`       ${icon}  ${row.status.padEnd(12)} | ${row.received_at?.slice(0, 19)} | ${row.error ?? ""}`);
  }
}

// Check order in DB
if (!order) {
  const orderRows = await sb(
    `orders?salla_order_id=eq.${SALLA_ORDER_ID}&select=id,salla_order_id,salla_reference_id,customer_name,payment_status,fulfillment_status,account_id`,
  );
  order = orderRows?.[0] ?? null;
}

if (order?.id) {
  // Re-fetch latest state
  const fresh = (await sb(`orders?id=eq.${order.id}&select=*`))[0] ?? order;

  if (fresh.fulfillment_status === "fulfilled" || fresh.account_id) {
    console.log(`\n${"═".repeat(60)}`);
    console.log("  🎉  ORDER FULFILLED SUCCESSFULLY!");
    console.log("═".repeat(60));
    console.log(`\n   🔗  Test the pickup page:`);
    console.log(`       URL:           ${APP_HOST}/pickup`);
    console.log(`       Order Number:  ${REFERENCE_ID}`);
    console.log(`       Last 4 digits: ${MOBILE_FULL.slice(-4)}`);
  } else {
    console.log(`\n   📦  Order in DB but not yet fulfilled.`);
    console.log(`       Status: ${fresh.fulfillment_status} / ${fresh.payment_status}`);
  }

  // Cleanup
  console.log(`\n${"─".repeat(60)}`);
  console.log("🧹  Cleanup command:\n");
  console.log(`   node -e "fetch('${SB_URL}/rest/v1/orders?id=eq.${order.id}', {`);
  console.log(`     method: 'DELETE',`);
  console.log(`     headers: { apikey: '${SR_KEY}', authorization: 'Bearer ${SR_KEY}' }`);
  console.log(`   }).then(r => console.log('Deleted:', r.status))"`);
} else {
  console.log("\n   ℹ️  No order in DB (expected for webhook-only mode with fake orders).");
  console.log("       For real Salla orders, the pipeline handles this automatically.");
}

console.log("");
