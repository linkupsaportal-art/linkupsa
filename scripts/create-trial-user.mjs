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

const EMAIL = "salla-tester@portaliosa.com";
const PASSWORD = "SallaTester2026!";
const NAME = "Salla Tester";

// 1. Create Supabase Auth User
console.log(`Creating user ${EMAIL}...`);
const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: SR_KEY,
    authorization: `Bearer ${SR_KEY}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: NAME,
    },
  }),
});

const userBody = await userRes.json();
if (!userRes.ok) {
  if (userBody?.message?.includes("already")) {
    console.log("User already exists, continuing to member check.");
  } else {
    console.error("Failed to create user:", userRes.status, userBody);
    process.exit(1);
  }
}

// 2. Fetch user ID (either newly created or existing)
let userId = userBody?.id;
if (!userId) {
  // Find existing user
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(EMAIL)}`, {
    headers: {
      apikey: SR_KEY,
      authorization: `Bearer ${SR_KEY}`,
    },
  });
  const list = await listRes.json();
  const found = (list || []).find(u => u.email === EMAIL);
  userId = found?.id;
}

if (!userId) {
  console.error("Could not find user ID.");
  process.exit(1);
}

console.log(`User ID: ${userId}`);

// 3. Link to profiles
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
  }),
});

if (!profileUpsert.ok) {
  console.error("Failed to upsert profile:", profileUpsert.status, await profileUpsert.text());
} else {
  console.log("Profile upserted successfully.");
}

// 4. Link user to store 1375098081 as manager/owner
console.log("Linking to store 1375098081...");
const memberUpsert = await fetch(`${SUPABASE_URL}/rest/v1/store_members`, {
  method: "POST",
  headers: {
    apikey: SR_KEY,
    authorization: `Bearer ${SR_KEY}`,
    "content-type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify({
    store_id: 1375098081,
    user_id: userId,
    role: "manager",
    is_owner: true,
  }),
});

if (!memberUpsert.ok) {
  console.error("Failed to link store member:", memberUpsert.status, await memberUpsert.text());
} else {
  console.log("Linked to store 1375098081 successfully.");
}

console.log("\nDone! Trial User is ready.");
console.log(`Email: ${EMAIL}`);
console.log(`Password: ${PASSWORD}`);
