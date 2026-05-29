/**
 * Replay an existing real Salla order through the full production pipeline:
 *   1. Insert webhook_events row pointing at the real order
 *   2. Hit /api/salla/process to drain it
 *   3. The ingestor fetches from Salla → allocator → notifyOrderReady
 *      → email + Karzoun WhatsApp on the customer's number
 *
 * Pre-requisites:
 *   - The real order in the demo store has a customer with mobile +213672661102
 *     (we already created customer 278112486 — but the Salla order #341613350
 *      uses customer 1109900279 with +971555555555). For this test, we'll
 *      patch our local order's customer_mobile in the DB after the ingestor
 *      runs, so the WhatsApp goes to the right number.
 *
 *   The cleaner way is to place a real order tied to our 278112486 customer,
 *   but Salla's POST /orders requires a full shipping address that's not
 *   easily set up in the demo. So we use this hybrid approach for the test.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(here, "..", ".env"), "utf8").split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_TOKEN = env.SALLA_WEBHOOK_TOKEN;

const SALLA_ORDER_ID = 341613350;   // existing real demo order
const STORE_ID = 1375098081;

async function sb(path, method = "GET", body = null) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SR_KEY, authorization: `Bearer ${SR_KEY}`,
      "content-type": "application/json", prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return JSON.parse(await r.text());
}

console.log(`\n🚀  Replaying real order #${SALLA_ORDER_ID} through production pipeline\n`);

// 1. Insert a webhook_events row
const inserted = await sb("webhook_events", "POST", {
  delivery_hash: `replay-${SALLA_ORDER_ID}-${Date.now()}`,
  event: "order.created",
  merchant: STORE_ID,
  payload: { event: "order.created", merchant: STORE_ID, data: { id: SALLA_ORDER_ID } },
  status: "pending",
  attempts: 0,
});
console.log("Inserted webhook_events:", inserted[0]?.id ?? inserted);

// 2. Drain via production endpoint
const drainRes = await fetch("https://www.portaliosa.com/api/salla/process", {
  method: "POST",
  headers: { authorization: `Bearer ${WEBHOOK_TOKEN}` },
});
const drainText = await drainRes.text();
console.log("\nDrain response:", drainRes.status);
console.log(drainText.slice(0, 500));

// 3. Check the resulting order in our DB
await new Promise((r) => setTimeout(r, 2000));
const orders = await sb(`orders?salla_order_id=eq.${SALLA_ORDER_ID}&select=*`);
const ord = orders[0];
if (!ord) { console.log("❌  No order row — ingestor failed"); process.exit(1); }

console.log(`\n📋  Order in our DB:`);
console.log(`   id:                  ${ord.id}`);
console.log(`   reference:           ${ord.salla_reference_id}`);
console.log(`   payment_status:      ${ord.payment_status}`);
console.log(`   fulfillment_status:  ${ord.fulfillment_status}`);
console.log(`   customer_mobile:     ${ord.customer_mobile}`);
console.log(`   customer_name:       ${ord.customer_name}`);
console.log(`   account_id:          ${ord.account_id ?? "(none)"}`);
console.log(`   notification_sent:   ${ord.notification_sent_at ?? "(no)"}`);
console.log(`   channels_used:       ${JSON.stringify(ord.notification_channels_used)}`);

// 4. If the order was processed but customer_mobile was the demo +971... we re-send to Algeria
if (ord.fulfillment_status === "fulfilled" && !ord.customer_mobile?.includes("213")) {
  console.log(`\n📱  Customer mobile was ${ord.customer_mobile}. Patching to +213672661102 and re-firing notification...`);
  await sb(`orders?id=eq.${ord.id}`, "PATCH", { customer_mobile: "+213672661102" });

  // Direct WhatsApp send to Algeria number using our config
  const cfg = (await sb(`notification_channels?store_id=eq.${STORE_ID}&channel=eq.whatsapp&select=config`))[0];
  const sendQ = `mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) { whatsappSendTemplateMessage(integrationId: $integrationId, templateName: $templateName, recipient: $recipient, language: $language, params: $params) { __typename } }`;

  const product = (await sb(`products?id=eq.${ord.product_id}&select=name`))[0];
  const r = await fetch(`https://${cfg.config.host}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": cfg.config.app_token },
    body: JSON.stringify({
      query: sendQ,
      variables: {
        integrationId: cfg.config.integration_id,
        templateName: cfg.config.default_template,
        recipient: "213672661102",
        language: cfg.config.language ?? "ar",
        params: [
          ord.customer_name,
          String(ord.salla_reference_id),
          product?.name ?? "منتج",
          "PortalIosa",
          "بطاقة بنكية",
        ],
      },
    }),
  });
  console.log("WhatsApp resend HTTP", r.status, (await r.text()).slice(0, 200));
}

console.log(`\n🔗  Pickup test:`);
console.log(`   ${env.NEXT_PUBLIC_APP_URL ?? "https://www.portaliosa.com"}/pickup`);
console.log(`   Order#:  ${ord.salla_reference_id}`);
console.log(`   Last 4:  ${ord.customer_mobile?.slice(-4) ?? "????"}`);
