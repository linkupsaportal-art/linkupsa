/**
 * Re-fires the WhatsApp notification for real order #263047555 to the
 * merchant's Algeria number, using the actual data from our DB
 * (order ref, customer name, allocated account product).
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

async function sb(path) {
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  return JSON.parse(await r.text());
}

const order = (await sb("orders?salla_reference_id=eq.263047555&select=*"))[0];
const product = (await sb(`products?id=eq.${order.product_id}&select=name`))[0];
const cfg = (await sb("notification_channels?store_id=eq.1375098081&channel=eq.whatsapp&select=config"))[0];

const sendQ = `mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) { whatsappSendTemplateMessage(integrationId: $integrationId, templateName: $templateName, recipient: $recipient, language: $language, params: $params) { __typename } }`;

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
        order.customer_name,
        String(order.salla_reference_id),
        product?.name ?? "منتج",
        "PortalIosa",
        "بطاقة بنكية",
      ],
    },
  }),
});
console.log("Real order WhatsApp resend → +213672661102");
console.log("HTTP", r.status);
console.log(await r.text());
console.log(`\nOrder #${order.salla_reference_id} → check WhatsApp on +213672661102`);
console.log(`Pickup test:  https://www.portaliosa.com/pickup`);
console.log(`  Order#: ${order.salla_reference_id}`);
console.log(`  Last 4 (real customer): ${order.customer_mobile.slice(-4)}`);
