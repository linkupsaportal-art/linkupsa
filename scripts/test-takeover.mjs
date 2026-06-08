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
const WEBHOOK_TOKEN = env.SALLA_WEBHOOK_TOKEN || "9ab2fd0f47c89fc3ed7f57b7142065b8d33b206d55faf2cfa75b4e413cb76e66";

if (!SUPABASE_URL || !SR_KEY) {
  console.error("Missing supabase env in .env");
  process.exit(1);
}

// User details for testing
const USER_A_ID = "d5f5eebf-db23-4903-bc17-9322a36d5c67"; // Salla Tester
const USER_A_KEY = "pk_0fa21871fe849b7e0b9ed0360a2665c2";

const USER_B_ID = "abc8191b-2a25-4a8f-9449-026ce37f3354"; // Julia 15
const USER_B_KEY = "pk_8a0b1987a55fd44642f20eade3884830";

const TEST_STORE_ID = 88888;
const LOCAL_WEBHOOK_URL = "http://localhost:3000/api/salla/webhook";

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
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

async function supabaseDelete(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: SR_KEY,
      Authorization: `Bearer ${SR_KEY}`,
    },
  });
  return res.text();
}

async function sendWebhook(webhookKey) {
  const payload = {
    event: "order.created",
    merchant: TEST_STORE_ID,
    created_at: new Date().toISOString(),
    data: {
      id: 11223344,
      reference_id: `TEST-TAKEOVER-${Date.now()}`,
      status: { id: 1, name: "under_review", customized: { id: 1, name: "قيد المراجعة" } },
      payment: { method: "cod", status: "pending" },
      amounts: { total: { amount: 100, currency: "SAR" } },
      customer: { first_name: "Test", last_name: "Customer", email: "test@example.com" },
      items: [
        {
          id: 1,
          name: "Test Product",
          quantity: 1,
          amounts: { total: { amount: 100, currency: "SAR" } },
        },
      ],
      store: {
        id: TEST_STORE_ID,
        name: "Takeover Test Store 🛍️",
        url: "https://takeover-test.salla.sa",
      },
    },
  };

  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Salla Webhook v2.0",
    authorization: WEBHOOK_TOKEN,
    "x-salla-security-strategy": "Token",
    "x-portaliosa-key": webhookKey,
  };

  const res = await fetch(LOCAL_WEBHOOK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${res.statusText} - ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   🧪  WEBHOOK STORE TAKEOVER TEST                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    // Clean up any leftovers from previous failed runs
    log("🧹", "Cleaning up leftovers...");
    await supabaseDelete("store_members", `store_id=eq.${TEST_STORE_ID}`);
    await supabaseDelete("salla_stores", `store_id=eq.${TEST_STORE_ID}`);

    // Verify cleanup
    let initialMembers = await supabaseQuery("store_members", `store_id=eq.${TEST_STORE_ID}`);
    if (initialMembers.length > 0) {
      log("❌", "Failed to clean up store members before starting test.");
      process.exit(1);
    }
    log("✅", "Database is clean and ready.");

    // Step 1: Connect Store via User A (Salla Tester)
    log("🚀", "Step 1: Connecting store via User A (Salla Tester)...");
    await sendWebhook(USER_A_KEY);
    log("⏳", "Waiting for link to write to database...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify User A is owner
    let membersStep1 = await supabaseQuery("store_members", `store_id=eq.${TEST_STORE_ID}`);
    if (membersStep1.length !== 1) {
      log("❌", `Expected exactly 1 member, got ${membersStep1.length}`);
      process.exit(1);
    }
    if (membersStep1[0].user_id !== USER_A_ID || !membersStep1[0].is_owner || membersStep1[0].role !== "manager") {
      log("❌", `User A connection verified improperly: ${JSON.stringify(membersStep1[0])}`);
      process.exit(1);
    }
    log("✅", "User A successfully connected as store owner!");

    // Step 2: Connect same Store via User B (Julia 15) -> Takeover
    log("🚀", "Step 2: Connecting SAME store via User B (Julia 15) to trigger TAKEOVER...");
    await sendWebhook(USER_B_KEY);
    log("⏳", "Waiting for takeover to write to database...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify Takeover
    let membersStep2 = await supabaseQuery("store_members", `store_id=eq.${TEST_STORE_ID}`);
    log("📊", `Members found after takeover: ${membersStep2.length}`);
    for (const m of membersStep2) {
      log("  ", `Member: user_id=${m.user_id} role=${m.role} is_owner=${m.is_owner}`);
    }

    const hasUserA = membersStep2.some(m => m.user_id === USER_A_ID);
    const userBRow = membersStep2.find(m => m.user_id === USER_B_ID);

    if (hasUserA) {
      log("❌", "TAKEOVER FAILED: User A was NOT removed from store_members!");
      process.exit(1);
    }
    if (!userBRow) {
      log("❌", "TAKEOVER FAILED: User B was NOT added to store_members!");
      process.exit(1);
    }
    if (!userBRow.is_owner || userBRow.role !== "manager") {
      log("❌", `TAKEOVER FAILED: User B is not owner or manager: ${JSON.stringify(userBRow)}`);
      process.exit(1);
    }
    log("✅", "Takeover successful! User A was removed, and User B is the new owner.");

    // Clean up
    log("🧹", "Cleaning up test data...");
    await supabaseDelete("store_members", `store_id=eq.${TEST_STORE_ID}`);
    await supabaseDelete("salla_stores", `store_id=eq.${TEST_STORE_ID}`);
    log("✅", "Cleanup complete.");

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   🎉  TAKEOVER TEST PASSED SUCCESSFULLY!                 ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");
  } catch (err) {
    log("❌", `Test failed with error: ${err.message}`);
    // Attempt cleanup anyway
    try {
      await supabaseDelete("store_members", `store_id=eq.${TEST_STORE_ID}`);
      await supabaseDelete("salla_stores", `store_id=eq.${TEST_STORE_ID}`);
    } catch {}
    process.exit(1);
  }
}

main();
