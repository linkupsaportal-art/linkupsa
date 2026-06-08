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

const EMAIL = "Linkup.saudi@gmail.com";
const NAME = "razex xelite";

async function main() {
  console.log(`Finding existing user ${EMAIL} in Supabase Auth...`);
  
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
    },
  });
  
  if (!listRes.ok) {
    console.error("Failed to list users:", listRes.status, await listRes.text());
    process.exit(1);
  }

  const listData = await listRes.json();
  const users = Array.isArray(listData) ? listData : (listData.users || []);
  const found = users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());
  
  if (!found) {
    console.error(`User with email ${EMAIL} not found in auth.users.`);
    console.log("All auth users found:", users.map(u => u.email));
    process.exit(1);
  }

  const userId = found.id;
  console.log(`User ID obtained: ${userId}`);

  // Generate a webhook key
  const KEY_PREFIX = "pk_";
  const crypto = await import("node:crypto");
  const webhookKey = KEY_PREFIX + crypto.randomBytes(16).toString("hex");

  // Upsert profile
  console.log("Upserting profile...");
  const profileUpsert = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: userId,
      email: EMAIL,
      name: NAME,
      email_verified: true,
      webhook_key: webhookKey,
      role: "manager",
    }),
  });

  if (!profileUpsert.ok) {
    console.error("Failed to upsert profile:", profileUpsert.status, await profileUpsert.text());
  } else {
    console.log("Profile upserted successfully!");
    
    // Verify
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      headers: {
        apikey: SR_KEY,
        authorization: `Bearer ${SR_KEY}`,
      },
    });
    const profileData = await verifyRes.json();
    console.log("Verified profile in database:", profileData);
  }
}

main().catch(console.error);
