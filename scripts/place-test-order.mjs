// Place a test order on the demo store via Salla API.
// This will fire a real order.created webhook to our edge worker.
//
// Run: node scripts/place-test-order.mjs

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

const r = await fetch(
  `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/salla_stores?select=access_token&order=installed_at.desc&limit=1`,
  { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } },
);
const [{ access_token }] = await r.json();

// Create an external order — Salla's "create order" endpoint
const order = {
  customer: {
    first_name: "Test",
    last_name: "Customer",
    email: "razexelite11@gmail.com",
    mobile: "+966555512345",
  },
  products: [
    {
      identifier_type: "id",
      identifier: 913017913,
      quantity: 1,
      // Salla expects options[].value as an array of option-value IDs
      options: [
        { id: 38336820, value: [2147204501] },
      ],
    },
  ],
  payment: {
    method: "cod",
    status: "paid",
    cash_on_delivery: {
      amount: 0,
      currency: "SAR",
    },
  },
  shipping: {
    name: "Test Customer",
    email: "razexelite11@gmail.com",
    mobile: "+966555512345",
    address: {
      country: "SA",
      city: "Riyadh",
      street: "King Fahd Road",
    },
  },
};

const cr = await fetch("https://api.salla.dev/admin/v2/orders", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${access_token}`,
    "content-type": "application/json",
  },
  body: JSON.stringify(order),
});

const result = await cr.json();
console.log(`Status: ${cr.status}`);
console.log(JSON.stringify(result, null, 2));
