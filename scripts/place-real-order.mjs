/**
 * Places a REAL order on the demo Salla store with the merchant's
 * Algeria number so the full pipeline runs end-to-end:
 *   storefront → Salla webhook → our /api/salla/webhook
 *   → webhook_events row → /api/salla/process drains it
 *   → fetches order from Salla → upserts in DB → allocator
 *   → notifyOrderReady → email + Karzoun WhatsApp
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

const TOKEN = "ory_at_WXKj7LRioSBVvd7evtMd2_Iyr0ePQKkeCF_BUKHqAK4.wHBzNzrxUT_5-DMzknUOpeQV4lxK467-4Qy-GDxJJNg";

// Reference customer by ID — Salla rejects inline customer objects in POST /orders.
// We'll either reuse the existing demo customer or create a new one with the merchant's number.
const body = {
  customer_id: 278112486,
  products: [
    { id: 913017913, quantity: 1 },
  ],
  payment: {
    status: "paid",
    method: "cod",
    cash_on_delivery: { amount: 0, currency: "SAR" },
  },
  payment_method: "cod",
  shipping_address: {
    city_id: 92,                      // Riyadh
    country_code: "SA",
    address: "Street 1",
    street_number: "1",
    block: "Olaya",
    postal_code: "12211",
    geocode: "24.7136,46.6753",
  },
  shipping: { is_pickup: false },
};

console.log("Placing real Salla order with body:");
console.log(JSON.stringify(body, null, 2));

const r = await fetch("https://api.salla.dev/admin/v2/orders", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});
const text = await r.text();
console.log("\nstatus:", r.status);
let parsed;
try { parsed = JSON.parse(text); console.log(JSON.stringify(parsed, null, 2).slice(0, 3000)); }
catch { console.log(text.slice(0, 1500)); }

if (parsed?.data?.id) {
  console.log(`\n✅  Real Salla order created!`);
  console.log(`   Order ID:     ${parsed.data.id}`);
  console.log(`   Reference:    ${parsed.data.reference_id}`);
  console.log(`   Status:       ${parsed.data.status?.slug}`);
  console.log(`\n   Webhook → our endpoint → /api/salla/process should now fire.`);
}
