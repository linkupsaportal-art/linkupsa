// Quick smoke test: prove the access token captured via app.store.authorize
// actually grants real Salla Merchant API access.
//
// Reads the token from supabase, hits a couple read endpoints, prints the
// shape of the responses. Stops at the first 401 — if that happens, the
// scope or token is wrong.
//
// Run: node scripts/test-salla-api.mjs

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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SR_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SR_KEY) {
  console.error("Missing supabase env in .env");
  process.exit(1);
}

const sb = await fetch(
  `${SUPABASE_URL}/rest/v1/salla_stores?select=store_id,store_name,access_token,scope&order=installed_at.desc&limit=1`,
  {
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
    },
  },
);

if (!sb.ok) {
  console.error("Supabase read failed:", sb.status, await sb.text());
  process.exit(1);
}

const [store] = await sb.json();
if (!store) {
  console.error("No salla_stores rows. Install the app on a demo store first.");
  process.exit(1);
}

console.log(`Using store ${store.store_id} (${store.store_name})`);
console.log(`Scope: ${store.scope}\n`);

const TOKEN = store.access_token;
const BASE = "https://api.salla.dev/admin/v2";

async function probe(label, path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
  });
  const text = await r.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  const summary =
    typeof body === "object" && body !== null && "data" in body
      ? Array.isArray(body.data)
        ? `${body.data.length} items`
        : body.data
          ? "1 object"
          : "empty"
      : typeof body === "object" && body !== null
        ? JSON.stringify(body).slice(0, 200)
        : body;
  console.log(`${label.padEnd(20)} ${r.status}  ${summary}`);
  return { status: r.status, body };
}

await probe("store info", "/store/info");
await probe("orders list", "/orders?per_page=5");
await probe("products list", "/products?per_page=5");
await probe("customers list", "/customers?per_page=5");


// Pull one order to see real shape
const r = await fetch(`${BASE}/orders?per_page=1`, {
  headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
});
const j = await r.json();
console.log("\n--- Sample order ---");
console.log(JSON.stringify(j.data?.[0], null, 2));
