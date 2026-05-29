/**
 * Karzoun Cloud API smoke test.
 *
 *   Endpoint:  POST https://api.karzoun.app/CloudApi.php
 *   Auth:      query-string params (no headers)
 *
 * What you need from the merchant's Karzoun dashboard:
 *
 *   ACCESS_TOKEN     Meta system-user access_token. Starts with "EAA...".
 *                    Generate: Karzoun → "Karzoun API" →
 *                    "How to add system user and generate Access Tokens".
 *
 *   PHONE_NUMBER_ID  Meta phone_number_id (the numeric one shown next to
 *                    the WhatsApp number inside Meta Business Suite). NOT
 *                    a UUID. NOT the human-readable phone number.
 *
 *   TEMPLATE         Pre-approved Meta template name (e.g. "order_ready").
 *                    Karzoun → "Karzoun API" → "How to creat message
 *                    templates...".
 *
 *   TO               Recipient phone in E.164 *without* `+`. Algeria test:
 *                    `213672661102`.
 *
 * Run:
 *   node scripts/test-karzoun.mjs
 *
 * Set creds via env if you don't want them in the file:
 *   $env:KARZOUN_ACCESS_TOKEN="EAA..."
 *   $env:KARZOUN_PHONE_NUMBER_ID="1234567890..."
 *   $env:KARZOUN_TEMPLATE="order_ready"
 *   $env:KARZOUN_TO="213672661102"
 */

const ACCESS_TOKEN     = process.env.KARZOUN_ACCESS_TOKEN     ?? "REPLACE_WITH_REAL_META_ACCESS_TOKEN";
const PHONE_NUMBER_ID  = process.env.KARZOUN_PHONE_NUMBER_ID  ?? "REPLACE_WITH_REAL_PHONE_NUMBER_ID";
const TEMPLATE         = process.env.KARZOUN_TEMPLATE         ?? "order_ready";
const TO               = process.env.KARZOUN_TO               ?? "213672661102";

const qs = new URLSearchParams({
  token: ACCESS_TOKEN,
  sender_id: PHONE_NUMBER_ID,
  phone: TO,
  template: TEMPLATE,
  param_1: "Mohamed",
  param_2: "257906463",
  param_3: "ChatGPT Plus",
  url_button: "pickup",
});

const url = `https://api.karzoun.app/CloudApi.php?${qs.toString()}`;
console.log("→ POST", url.replace(ACCESS_TOKEN, "***"));

const r = await fetch(url, {
  method: "POST",
  headers: { accept: "application/json" },
});
const text = await r.text();
let body;
try { body = JSON.parse(text); } catch { body = text; }
console.log("← status:", r.status);
console.log("← body  :", JSON.stringify(body, null, 2).slice(0, 800));

if (typeof body === "object" && body?.error) {
  console.error("\n❌ Karzoun rejected the request:", body.error.message ?? body.error);
  console.error("   Most likely: invalid token, wrong phone_number_id, or template not approved.");
  process.exit(1);
}
if (typeof body === "object" && body?.messages?.[0]?.id) {
  console.log("\n✅ Sent. Meta message id:", body.messages[0].id);
}
