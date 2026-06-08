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
  console.log("Checking profiles...");
  try {
    const profiles = await supabaseQuery("profiles");
    console.log("Profiles in DB:", JSON.stringify(profiles, null, 2));

    const email = "linkup.saudi@gmail.com";
    const userProfile = profiles.find(p => p.email?.toLowerCase() === email.toLowerCase());
    if (userProfile) {
      console.log("Found profile:", userProfile);
      // Let's also check their store members
      const members = await supabaseQuery("store_members", `user_id=eq.${userProfile.id}`);
      console.log("Store members for user:", members);
    } else {
      console.log(`No profile found for email ${email}`);
    }
  } catch (err) {
    console.error("Error querying profiles:", err);
  }
}

main();
