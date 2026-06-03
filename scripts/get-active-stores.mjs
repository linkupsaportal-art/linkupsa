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
  `${SUPABASE_URL}/rest/v1/salla_stores?select=store_id,store_name,installed_at`,
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

const stores = await sb.json();
console.log("Active stores in database:");
console.log(JSON.stringify(stores, null, 2));
