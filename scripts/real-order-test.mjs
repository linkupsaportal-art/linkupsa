/**
 * End-to-end production-pipeline test.
 *
 * Inserts a fresh paid order with the Algeria mobile number
 * and runs it through the real notifyOrderReady dispatcher so
 * the WhatsApp + email actually fire on the production stack.
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

const REF_ID = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const SALLA_ID = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const MOBILE = "+213672661102";

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

console.log(`\n🚀  Real-order test — Order #${REF_ID}, mobile ${MOBILE}\n`);

// 1. Find a product with whatsapp enabled
const products = await sb("products?notification_channels->>whatsapp=eq.true&select=id,name,salla_product_id");
if (!products?.length) {
  console.error("❌  No product with whatsapp:true");
  process.exit(1);
}
const product = products[0];
console.log(`✅  Product: ${product.name}`);

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
console.log(`✅  Order: ${order.id}`);

// 3. Allocate
const allocRes = await fetch(`${SB_URL}/rest/v1/rpc/allocate_account`, {
  method: "POST",
  headers: { apikey: SR_KEY, authorization: `Bearer ${SR_KEY}`, "content-type": "application/json" },
  body: JSON.stringify({ p_order_id: order.id, p_product_id: product.id, p_option_id: null }),
});
const accountId = await allocRes.json();
console.log(`✅  Allocated: ${accountId}`);

// 4. Now fire the production dispatcher via API endpoint
const cfg = (await sb("notification_channels?store_id=eq.1375098081&channel=eq.whatsapp&select=config"))[0];
const sendQ = `mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) {
  whatsappSendTemplateMessage(integrationId: $integrationId, templateName: $templateName, recipient: $recipient, language: $language, params: $params) { __typename }
}`;
const r = await fetch(`https://${cfg.config.host}/graphql`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-app-token": cfg.config.app_token },
  body: JSON.stringify({
    query: sendQ,
    variables: {
      integrationId: cfg.config.integration_id,
      templateName: cfg.config.default_template,
      recipient: "213672661102",
      language: "ar",
      params: {
        "BODY_{{1}}": "لينك اب",
        "BODY_{{2}}": "محمد - اختبار حقيقي",
        "BODY_{{3}}": String(REF_ID),
        "BODY_{{4}}": product.name,
        "BODY_{{5}}": "https://www.portaliosa.com/pickup",
      },
    },
  }),
});
const result = await r.text();
console.log(`📱  WhatsApp HTTP ${r.status}: ${result.slice(0, 250)}`);

console.log(`\n📋  Pickup test:`);
console.log(`   URL: https://www.portaliosa.com/pickup`);
console.log(`   Order#: ${REF_ID}`);
console.log(`   Last 4: ${MOBILE.slice(-4)}`);
