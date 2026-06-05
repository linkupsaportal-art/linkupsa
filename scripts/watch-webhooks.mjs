#!/usr/bin/env node
/**
 * 🔴 LIVE Webhook Watcher
 *
 * Polls the webhook_events inbox every 3 seconds and prints new events
 * as they arrive. Run this, then go place an order on the store.
 *
 * Usage:  node scripts/watch-webhooks.mjs
 * Stop:   Ctrl+C
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(here, "..", ".env"), "utf8")
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
const PROCESS_URL = "https://www.portaliosa.com/api/salla/process";

async function sb(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
      "content-type": "application/json",
    },
  });
  return r.json();
}

// ── State ─────────────────────────────────────────────────────────────────
const seenIds = new Set();
let startTime = new Date().toISOString();
let orderCount = 0;

// Pre-load existing IDs so we only show NEW events
const existing = await sb(
  `webhook_events?select=id&order=received_at.desc&limit=50`,
);
for (const row of existing ?? []) seenIds.add(row.id);

// ── Banner ────────────────────────────────────────────────────────────────
console.clear();
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   🔴  LIVE WEBHOOK WATCHER — Portalio SA               ║");
console.log("║                                                        ║");
console.log("║   Watching for incoming Salla webhooks...               ║");
console.log("║   Go place an order on the store now!                   ║");
console.log("║                                                        ║");
console.log("║   Press Ctrl+C to stop                                 ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\n⏱️   Started at: ${new Date().toLocaleTimeString()}`);
console.log(`📡  Polling inbox every 3 seconds...\n`);

// ── Poll loop ─────────────────────────────────────────────────────────────
let tick = 0;
const POLL_INTERVAL = 3000;

async function poll() {
  tick++;
  try {
    const rows = await sb(
      `webhook_events?select=id,event,merchant,status,error,received_at,payload&order=received_at.desc&limit=10`,
    );

    if (!rows?.length) return;

    for (const row of rows.reverse()) {
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      orderCount++;

      const payload = row.payload ?? {};
      const data = payload.data ?? {};
      const customer = data.customer ?? {};
      const items = data.items ?? [];
      const status = data.status ?? {};

      console.log("═".repeat(60));
      console.log(`🚨  NEW WEBHOOK #${orderCount}  —  ${new Date().toLocaleTimeString()}`);
      console.log("═".repeat(60));
      console.log(`   Event:        ${row.event}`);
      console.log(`   Merchant:     ${row.merchant}`);
      console.log(`   Inbox Status: ${row.status}`);
      console.log(`   Received:     ${row.received_at}`);

      if (row.event?.startsWith("order.")) {
        console.log(`\n   📦 ORDER DETAILS:`);
        console.log(`   Salla Order ID:  ${data.id ?? "?"}`);
        console.log(`   Reference ID:    ${data.reference_id ?? "?"}`);
        console.log(`   Order Status:    ${status.slug ?? status.name ?? "?"}`);
        console.log(`   Payment Method:  ${data.payment_method ?? "?"}`);
        console.log(`   Total:           ${data.total?.amount ?? data.amounts?.total?.amount ?? "?"} ${data.total?.currency ?? data.currency ?? "SAR"}`);

        console.log(`\n   👤 CUSTOMER:`);
        console.log(`   Name:   ${customer.full_name ?? customer.first_name ?? "?"}`);
        console.log(`   Email:  ${customer.email ?? "?"}`);
        console.log(`   Mobile: ${customer.mobile_code ?? ""}${customer.mobile ?? "?"}`);

        if (items.length) {
          console.log(`\n   🛒 ITEMS (${items.length}):`);
          for (const item of items) {
            console.log(`   - ${item.name ?? item.product?.name ?? "?"} x${item.quantity ?? 1}`);
            console.log(`     Product ID: ${item.product?.id ?? item.id ?? "?"}`);
          }
        }
      } else if (row.event === "app.store.authorize") {
        console.log(`\n   🔑 AUTH EVENT — new store installed the app!`);
        console.log(`   Access Token: ${(data.access_token ?? "").slice(0, 20)}...`);
      } else {
        console.log(`\n   📋 Raw data keys: ${Object.keys(data).join(", ")}`);
      }

      if (row.error) {
        console.log(`\n   ❌ Error: ${row.error}`);
      }

      console.log("");

      // Auto-trigger processor for order events
      if (row.event?.startsWith("order.") && row.status === "pending") {
        console.log("   ⚙️  Auto-triggering order processor...");
        try {
          const processRes = await fetch(PROCESS_URL, {
            method: "POST",
            headers: { authorization: `Bearer ${TOKEN}` },
            signal: AbortSignal.timeout(30_000),
          });
          const result = await processRes.json();
          console.log(`   📊 Processor result: ${JSON.stringify(result)}`);

          // Check if order was created in our DB
          if (data.id) {
            await new Promise((r) => setTimeout(r, 2000));
            const orders = await sb(
              `orders?salla_order_id=eq.${data.id}&select=id,salla_reference_id,customer_name,customer_mobile,payment_status,fulfillment_status,account_id`,
            );
            const ord = orders?.[0];
            if (ord) {
              console.log(`\n   ✅ ORDER IN OUR DB:`);
              console.log(`      ID:          ${ord.id}`);
              console.log(`      Reference:   ${ord.salla_reference_id}`);
              console.log(`      Customer:    ${ord.customer_name}`);
              console.log(`      Mobile:      ${ord.customer_mobile}`);
              console.log(`      Payment:     ${ord.payment_status}`);
              console.log(`      Fulfillment: ${ord.fulfillment_status}`);
              console.log(`      Account:     ${ord.account_id ?? "not allocated yet"}`);

              if (ord.account_id) {
                const acc = await sb(`accounts?id=eq.${ord.account_id}&select=label,email`);
                if (acc?.[0]) {
                  console.log(`\n   🎉 ACCOUNT ALLOCATED!`);
                  console.log(`      Label: ${acc[0].label}`);
                  console.log(`      Email: ${acc[0].email}`);
                  console.log(`\n   🔗 Pickup: https://www.portaliosa.com/pickup`);
                  console.log(`      Order#:  ${ord.salla_reference_id}`);
                  console.log(`      Last 4:  ${(ord.customer_mobile ?? "").slice(-4)}`);
                }
              }
            } else {
              console.log(`   ⏳ Order not in DB yet (may need more time or Salla API may be slow)`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Processor error: ${err.message}`);
        }
        console.log("");
      }
    }
  } catch (err) {
    // Silent retry on network errors
    if (tick % 10 === 0) {
      console.log(`   ⚠️  Poll error: ${err.message} (retrying...)`);
    }
  }
}

// Run the loop
const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinIdx = 0;

setInterval(async () => {
  await poll();
  spinIdx = (spinIdx + 1) % spinner.length;
  process.stdout.write(`\r   ${spinner[spinIdx]}  Listening... (${orderCount} events caught, ${Math.round((Date.now() - new Date(startTime).getTime()) / 1000)}s elapsed)`);
}, POLL_INTERVAL);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log(`\n\n👋  Stopped. Caught ${orderCount} events in this session.\n`);
  process.exit(0);
});
