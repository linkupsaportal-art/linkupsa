#!/usr/bin/env node
/**
 * 🔴 LIVE ORDER WATCHER — Portalio SA
 *
 * Watches the webhook_events inbox for new arrivals from the LIVE store,
 * triggers the processor, then monitors the full pipeline:
 *   webhook → order → allocate → notify (WhatsApp + Telegram)
 *
 * Usage:  node scripts/live-order-watcher.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(here, "..", ".env"), "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const WH_TOKEN = env.SALLA_WEBHOOK_TOKEN;
const APP_HOST = "https://www.portaliosa.com";
const LIVE_MERCHANT = 1075453390;
const POLL_MS = 3000;

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

async function sbPatch(path, body) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function triggerProcessor() {
  const r = await fetch(`${APP_HOST}/api/salla/process`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${WH_TOKEN}`,
    },
  });
  return r.json();
}

// ─── Banner ──────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════════╗
║   🔴  LIVE ORDER WATCHER — LinkUp SA (Real Store)       ║
║                                                         ║
║   Merchant: ${LIVE_MERCHANT}                            ║
║   Watching for new webhooks + full pipeline...           ║
║                                                         ║
║   Go place an order on linkup.sa NOW!                   ║
║   Press Ctrl+C to stop                                  ║
╚══════════════════════════════════════════════════════════╝
`);

const seenEvents = new Set();
let eventCount = 0;
let orderCount = 0;
const startTime = Date.now();

// Pre-load known events so we don't re-process old ones
const existing = await sb(
  `webhook_events?merchant=eq.${LIVE_MERCHANT}&select=id&order=received_at.desc&limit=50`,
);
if (Array.isArray(existing)) existing.forEach((e) => seenEvents.add(e.id));
console.log(`⏱️   Started at: ${new Date().toLocaleTimeString()}`);
console.log(`📡  Pre-loaded ${seenEvents.size} existing events (will skip them)`);
console.log(`📡  Polling inbox every ${POLL_MS / 1000}s...\n`);

const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let tick = 0;

async function poll() {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  process.stdout.write(
    `\r   ${spinner[tick++ % spinner.length]}  Listening... (${eventCount} events, ${orderCount} orders, ${elapsed}s elapsed)`,
  );

  try {
    // 1. Check for NEW webhook events
    const events = await sb(
      `webhook_events?merchant=eq.${LIVE_MERCHANT}&select=id,event,status,error,payload,received_at&order=received_at.desc&limit=10`,
    );

    if (!Array.isArray(events)) return;

    const fresh = events.filter((e) => !seenEvents.has(e.id));
    if (!fresh.length) return;

    for (const evt of fresh) {
      seenEvents.add(evt.id);
      eventCount++;

      const data = evt.payload?.data ?? {};
      console.log(`\n\n${"═".repeat(60)}`);
      console.log(`   🆕 NEW WEBHOOK EVENT`);
      console.log(`${"═".repeat(60)}`);
      console.log(`   Event:      ${evt.event}`);
      console.log(`   Status:     ${evt.status}`);
      console.log(`   Received:   ${evt.received_at}`);
      console.log(`   Order ID:   ${data.order_id ?? data.id ?? "—"}`);
      console.log(`   Customer:   ${data.customer?.first_name ?? "—"} ${data.customer?.last_name ?? ""}`);
      console.log(`   Email:      ${data.customer?.email ?? "—"}`);
      console.log(`   Mobile:     ${data.customer?.mobile_code ?? ""}${data.customer?.mobile ?? "—"}`);

      if (data.items) {
        const items = Array.isArray(data.items) ? data.items : [data.items];
        for (const item of items) {
          console.log(`   Product:    ${item.name ?? "—"} (salla_id: ${item.product_id ?? "—"})`);
          console.log(`   Qty:        ${item.quantity ?? 1}`);
          console.log(`   Price:      ${item.price?.amount ?? "—"} ${item.price?.currency ?? ""}`);
        }
      }

      if (data.total) {
        console.log(`   Total:      ${data.total.amount ?? "—"} ${data.total.currency ?? ""}`);
      }

      // 2. If pending, try to process it
      if (evt.status === "pending") {
        console.log(`\n   ⏳ Triggering processor...`);
        const result = await triggerProcessor();
        console.log(`   📊 Processor result: processed=${result.processed}, fulfilled=${result.fulfilled}, skipped=${result.skipped}, errors=${result.errors}`);

        // 3. Re-check this event's status after processing
        const [updated] = await sb(`webhook_events?id=eq.${evt.id}&select=status,error`);
        if (updated) {
          console.log(`   📋 Event status: ${updated.status}${updated.error ? ` (${updated.error})` : ""}`);
        }

        // 4. Check if an order was created
        const sallaOrderId = data.order_id ?? data.id;
        if (sallaOrderId) {
          const orders = await sb(
            `orders?salla_order_id=eq.${sallaOrderId}&select=id,salla_order_id,salla_reference_id,customer_name,customer_email,customer_mobile,product_id,payment_status,fulfillment_status,account_id`,
          );
          if (orders?.length) {
            const ord = orders[0];
            orderCount++;
            console.log(`\n   ✅ ORDER FOUND IN DB:`);
            console.log(`   ├─ ID:          ${ord.id}`);
            console.log(`   ├─ Salla Order: ${ord.salla_order_id}`);
            console.log(`   ├─ Reference:   ${ord.salla_reference_id}`);
            console.log(`   ├─ Customer:    ${ord.customer_name}`);
            console.log(`   ├─ Email:       ${ord.customer_email}`);
            console.log(`   ├─ Mobile:      ${ord.customer_mobile}`);
            console.log(`   ├─ Product ID:  ${ord.product_id ?? "❌ NOT MAPPED"}`);
            console.log(`   ├─ Payment:     ${ord.payment_status}`);
            console.log(`   ├─ Fulfillment: ${ord.fulfillment_status}`);
            console.log(`   └─ Account:     ${ord.account_id ?? "❌ NOT ALLOCATED"}`);

            if (!ord.product_id) {
              // Find which salla product IDs are in the items
              const items = Array.isArray(data.items) ? data.items : [data.items];
              const sallaProductIds = items.map((i) => i.product_id).filter(Boolean);
              console.log(`\n   ⚠️  PRODUCT NOT MAPPED!`);
              console.log(`   Salla product IDs in this order: ${sallaProductIds.join(", ")}`);
              console.log(`   → Go to admin panel and map one of these to a Portaliosa product.`);
              console.log(`   → Then re-trigger: POST /api/salla/process`);
            }

            if (ord.fulfillment_status === "fulfilled" && ord.account_id) {
              console.log(`\n   🎉 ORDER FULFILLED! Account allocated.`);
              console.log(`   WhatsApp + Email + Telegram notifications should have fired!`);

              // Check the account
              const [acc] = await sb(`accounts?id=eq.${ord.account_id}&select=email,status,current_usage,max_usage`);
              if (acc) {
                console.log(`\n   📧 Account: ${acc.email}`);
                console.log(`   Usage: ${acc.current_usage}/${acc.max_usage}`);
                console.log(`   Status: ${acc.status}`);
              }
            }
          } else {
            console.log(`\n   ❌ No order found in DB for salla_order_id=${sallaOrderId}`);
          }
        }
      } else if (evt.status === "failed") {
        console.log(`\n   ❌ Event FAILED: ${evt.error}`);
      } else if (evt.status === "succeeded") {
        console.log(`\n   ✅ Event already succeeded`);
      }

      console.log(`${"═".repeat(60)}\n`);
    }
  } catch (err) {
    // Don't crash on network blips
    if (err.message?.includes("fetch")) return;
    console.error(`\n   ⚠️  Poll error: ${err.message}`);
  }
}

setInterval(poll, POLL_MS);
poll();
