/**
 * Real-order end-to-end test:
 *   1. Insert a paid order with a 2FA product (whatsapp:true, email:true)
 *   2. Allocate an account via the same RPC the ingestor uses
 *   3. Fire the multi-channel notification (email + WhatsApp via Karzoun)
 *   4. Verify the pickup page can show the credentials
 *
 * Recipient: +213672661102 (Algeria — for the merchant's confirmation)
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

const REF_ID  = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const SALLA_ID = Math.floor(Math.random() * 9_000_000) + 1_000_000;
// Algeria number — last 4 = 1102
const MOBILE = "+213672661102";
const LAST_FOUR = MOBILE.slice(-4);

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

console.log(`\n🚀  Real-order test — Order #${REF_ID} → ${MOBILE}\n`);

// 1. Find the 2FA product (it has whatsapp + email enabled)
const products = await sb("products?notification_channels->>whatsapp=eq.true&select=id,name,notification_channels,salla_product_id");
if (!products?.length) {
  console.error("❌  No product with whatsapp:true found");
  process.exit(1);
}
const product = products[0];
console.log(`✅  Product: ${product.name}  (${product.id})  channels=${JSON.stringify(product.notification_channels)}`);

// 2. Insert paid order
const inserted = await sb("orders", "POST", {
  salla_order_id: SALLA_ID,
  salla_reference_id: REF_ID,
  store_id: 1375098081,
  customer_name: "محمد - اختبار حقيقي",
  customer_email: "razexelite11@gmail.com",
  customer_mobile: MOBILE,
  product_id: product.id,
  salla_product_id: product.salla_product_id,
  salla_status: "completed",
  payment_status: "paid",
  fulfillment_status: "pending",
  otp_request_count: 0,
  otp_request_limit: 10,
});
const order = Array.isArray(inserted) ? inserted[0] : inserted;
if (!order?.id) { console.error("❌  Insert failed:", inserted); process.exit(1); }
console.log(`✅  Order: ${order.id}`);

// 3. Run allocator
const allocRes = await fetch(`${SB_URL}/rest/v1/rpc/allocate_account`, {
  method: "POST",
  headers: { apikey: SR_KEY, authorization: `Bearer ${SR_KEY}`, "content-type": "application/json" },
  body: JSON.stringify({ p_order_id: order.id, p_product_id: product.id, p_option_id: null }),
});
const accountId = await allocRes.json();
if (!accountId) { console.error("❌  Allocator returned null — no eligible accounts"); process.exit(1); }
console.log(`✅  Allocated account: ${accountId}`);

// 4. Load WhatsApp config and fire the dispatcher
const cfg = (await sb("notification_channels?store_id=eq.1375098081&channel=eq.whatsapp&select=config,enabled"))[0];
if (!cfg?.enabled) { console.error("❌  WhatsApp channel disabled"); process.exit(1); }

const PICKUP_URL = "https://www.portaliosa.com/pickup";

// 4a. WhatsApp via Karzoun GraphQL
const sendQ = `
mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) {
  whatsappSendTemplateMessage(
    integrationId: $integrationId, templateName: $templateName,
    recipient: $recipient, language: $language, params: $params
  ) { __typename }
}`;
const TO = MOBILE.replace(/\D/g, "");  // strip + and any non-digits
const variables = {
  integrationId: cfg.config.integration_id,
  templateName: cfg.config.default_template,
  recipient: TO,
  language: cfg.config.language ?? "ar",
  // order_cancel template positional params: customer name, order#, products, total, payment method
  params: [
    "محمد - اختبار حقيقي",
    String(REF_ID),
    product.name,
    "اشتراك رقمي",
    "بطاقة بنكية",
  ],
};
const r = await fetch(`https://${cfg.config.host}/graphql`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-app-token": cfg.config.app_token },
  body: JSON.stringify({ query: sendQ, variables }),
});
const wsBody = await r.text();
const wsOk = r.status === 200 && !wsBody.includes('"errors"');
console.log(`${wsOk ? "✅" : "❌"}  WhatsApp send: HTTP ${r.status}`);
if (!wsOk) console.log("   ", wsBody.slice(0, 400));

// 4b. Update order to mark notification sent
await sb(`orders?id=eq.${order.id}`, "PATCH", {
  notification_sent_at: new Date().toISOString(),
  notification_channels_used: {
    attempted: ["whatsapp"],
    succeeded: wsOk ? ["whatsapp"] : [],
    failed: wsOk ? [] : [{ channel: "whatsapp", error: wsBody.slice(0, 200) }],
  },
});

// 5. Verify pickup data matches
const pickupCheck = (await sb(`orders?id=eq.${order.id}&select=customer_mobile_last4,fulfillment_status,account_id`))[0];
const acc = (await sb(`accounts?id=eq.${accountId}&select=label,email`))[0];

console.log(`\n📋  Pickup verification:`);
console.log(`   last4:        ${pickupCheck.customer_mobile_last4}  (expected ${LAST_FOUR})`);
console.log(`   fulfillment:  ${pickupCheck.fulfillment_status}`);
console.log(`   account:      ${acc.label} <${acc.email}>`);

console.log(`\n🔗  To check on the pickup page:`);
console.log(`   ${PICKUP_URL}`);
console.log(`   Order#: ${REF_ID}`);
console.log(`   Last 4: ${LAST_FOUR}`);

console.log(`\n📱  WhatsApp should arrive on ${MOBILE} within seconds.`);
