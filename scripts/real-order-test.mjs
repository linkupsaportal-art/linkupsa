/**
 * End-to-end real-order test.
 *
 * Inserts a paid order, lets the allocator pick a real account,
 * triggers the production dispatcher (WhatsApp + Email + Telegram
 * operator mirror), and prints the order number for follow-up testing
 * via the customer Telegram bot.
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

const REF_ID = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const SALLA_ID = Math.floor(Math.random() * 9_000_000) + 1_000_000;
const MOBILE = "+213672661102";
const APP_HOST = "https://www.portaliosa.com";

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
  return JSON.parse(await r.text());
}

console.log(`\n🚀  Real-order test — Order #${REF_ID}, mobile ${MOBILE}\n`);

// 1. Pick a product (prefer one with whatsapp flag, fall back to any active 2FA product)
const products = await sb(
  "products?status=eq.active&select=id,name,salla_product_id,handler_type,notification_channels",
);
if (!products?.length) {
  console.error("❌  No active products");
  process.exit(1);
}
const product =
  products.find((p) => p.notification_channels?.whatsapp) ?? products[0];
console.log(
  `✅  Product: ${product.name} (${product.handler_type})`,
);

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
console.log(`✅  Order created: ${order.id}`);

// 3. Allocate an account (atomic round-robin RPC)
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
if (!accountId) {
  console.error("❌  No accounts available for this product");
  process.exit(1);
}
console.log(`✅  Allocated account: ${accountId}`);

// 4. Mark fulfilled (since we bypassed the order ingestor here)
await sb(`orders?id=eq.${order.id}`, "PATCH", {
  fulfillment_status: "fulfilled",
});

// 5. Fire WhatsApp directly using the Karzoun config so the customer
// gets the order-ready notification on the live Algerian number.
const waCfg = (
  await sb(
    "notification_channels?store_id=eq.1375098081&channel=eq.whatsapp&select=config",
  )
)[0]?.config;
if (waCfg?.app_token) {
  // Pull live store name from salla_stores (matches what production does).
  const storeRow = (
    await sb("salla_stores?store_id=eq.1375098081&select=store_name")
  )[0];
  const storeName =
    storeRow?.store_name ?? waCfg.store_name ?? "متجرنا";

  // Pull bot info to inline its link into the pickup URL parameter.
  const tg = (
    await sb(
      "telegram_bot_settings?select=bot_username,enabled,webhook_url,pickup_flow_enabled&limit=1",
    )
  )[0];
  const includeBot =
    tg?.enabled && tg?.bot_username && tg?.webhook_url && tg?.pickup_flow_enabled;
  const pickupUrlValue = includeBot
    ? `${APP_HOST}/pickup أو عبر تيليجرام https://t.me/${tg.bot_username}`
    : `${APP_HOST}/pickup`;

  const sendQ = `mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) {
    whatsappSendTemplateMessage(integrationId: $integrationId, templateName: $templateName, recipient: $recipient, language: $language, params: $params) { __typename }
  }`;
  const positions = waCfg.param_map?.[waCfg.default_template] ?? [
    "store_name",
    "customer_name",
    "order_number",
    "product_name",
    "pickup_url",
  ];
  const src = {
    store_name: storeName,
    customer_name: "محمد - اختبار حقيقي",
    order_number: String(REF_ID),
    product_name: product.name,
    pickup_url: pickupUrlValue,
  };
  const params = Object.fromEntries(
    positions.map((k, i) => [`BODY_{{${i + 1}}}`, src[k] ?? ""]),
  );
  const r = await fetch(`https://${waCfg.host}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-token": waCfg.app_token,
    },
    body: JSON.stringify({
      query: sendQ,
      variables: {
        integrationId: waCfg.integration_id,
        templateName: waCfg.default_template,
        recipient: "213672661102",
        language: "ar",
        params,
      },
    }),
  });
  const result = await r.text();
  console.log(
    `📱  WhatsApp HTTP ${r.status}: ${result.slice(0, 200)}${result.length > 200 ? "…" : ""}`,
  );
}

// 6. Fire the Telegram operator mirror so you receive a card for this order.
const tg = (
  await sb(
    "telegram_bot_settings?select=bot_token,operator_chat_id,enabled,mirror_orders&limit=1",
  )
)[0];
if (tg?.enabled && tg?.bot_token && tg?.operator_chat_id && tg?.mirror_orders) {
  const text = [
    "📦 <b>طلب جاهز للاستلام</b>",
    "",
    `👤 العميل: <b>محمد - اختبار حقيقي</b>`,
    `🔖 رقم الطلب: <code>${REF_ID}</code>`,
    `🛒 المنتج: ${product.name}`,
  ].join("\n");
  const r = await fetch(
    `https://api.telegram.org/bot${tg.bot_token}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: tg.operator_chat_id,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: "📦 صفحة الاستلام", url: `${APP_HOST}/pickup` }],
          ],
        },
      }),
    },
  );
  const j = await r.json().catch(() => null);
  console.log(`📨  Telegram operator: ${r.status} ${j?.ok ? "ok" : "fail"}`);
}

console.log(`\n📋  Pickup credentials for testing:`);
console.log(`   Web:   ${APP_HOST}/pickup`);
console.log(`   Bot:   https://t.me/roxinetbot   (send /start)`);
console.log(`   Order# (use this in BOTH):  ${REF_ID}`);
console.log(`   Last 4:                     ${MOBILE.slice(-4)}`);
