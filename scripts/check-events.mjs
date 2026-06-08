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

async function supabaseQuery(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: SR_KEY,
      Authorization: `Bearer ${SR_KEY}`,
    },
  });
  return res.json();
}

async function main() {
  try {
    console.log("Checking recent webhook_events...");
    const events = await supabaseQuery("webhook_events", "order=created_at.desc&limit=10");
    console.log("Recent webhook events:", JSON.stringify(events, null, 2));

    console.log("Checking salla_stores...");
    const stores = await supabaseQuery("salla_stores");
    console.log("Salla stores:", JSON.stringify(stores, null, 2));
    
    console.log("Checking store_members...");
    const members = await supabaseQuery("store_members");
    console.log("Store members:", JSON.stringify(members, null, 2));
  } catch (err) {
    console.error("Error querying:", err);
  }
}

main();
