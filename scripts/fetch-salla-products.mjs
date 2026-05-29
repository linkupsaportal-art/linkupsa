// Fetch real products from the connected demo store and print their IDs/options.
// Run: node scripts/fetch-salla-products.mjs

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

const r = await fetch(
  `${SUPABASE_URL}/rest/v1/salla_stores?select=store_id,store_name,access_token&order=installed_at.desc&limit=1`,
  { headers: { apikey: SR_KEY, authorization: `Bearer ${SR_KEY}` } },
);
const [store] = await r.json();
console.log(`Store: ${store.store_id} (${store.store_name})\n`);

const pr = await fetch("https://api.salla.dev/admin/v2/products?per_page=20", {
  headers: { Authorization: `Bearer ${store.access_token}` },
});
const products = (await pr.json()).data ?? [];

console.log(`Found ${products.length} products:\n`);
for (const p of products) {
  console.log(`  ${p.id.toString().padEnd(12)} ${p.name}`);
  console.log(`    SKU: ${p.sku ?? "none"}    price: ${p.price?.amount} ${p.price?.currency}`);
  console.log(`    URL: ${p.urls?.customer ?? p.url ?? "—"}`);
  if (p.options?.length) {
    for (const opt of p.options) {
      console.log(`      └─ option: ${opt.name}`);
      for (const v of opt.values ?? []) {
        console.log(`           value: ${v.name} (id: ${v.id})`);
      }
    }
  }
  console.log();
}
