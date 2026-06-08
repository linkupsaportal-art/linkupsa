// Let's write a node script that does exactly what checkWebhookConnectionAction does, to avoid compiling TS/Next.js imports which might fail.
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

const USER_ID = "ff409995-f4bb-46e5-85f2-39758b03c6db"; // Linkup.saudi@gmail.com

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

async function checkConnection() {
  console.log(`Checking connection for User ID: ${USER_ID}`);
  
  // 1. Check memberships
  const memberships = await supabaseQuery("store_members", `user_id=eq.${USER_ID}`);
  const storeIds = (memberships ?? []).map((m) => m.store_id);
  console.log("Associated Store IDs:", storeIds);

  let totalEvents = 0;
  let lastEventAt = null;
  let lastEventType = null;
  const activeIds = new Set();

  if (storeIds.length > 0) {
    // We fetch count and latest event
    const events = await supabaseQuery("webhook_events", `store_id=in.(${storeIds.join(",")})&order=received_at.desc&limit=1`);
    console.log("Latest store event:", events);
    
    // Check all events count
    const allEvents = await supabaseQuery("webhook_events", `store_id=in.(${storeIds.join(",")})&select=store_id`);
    totalEvents = allEvents.length;
    
    if (events && events[0]) {
      lastEventAt = events[0].received_at;
      lastEventType = events[0].event;
    }
    
    for (const e of allEvents) {
      activeIds.add(e.store_id);
    }
  }

  // 2. Check by portaliosa key in headers
  if (totalEvents === 0) {
    console.log("No store events found via store_members. Checking by webhook_key in headers...");
    const profiles = await supabaseQuery("profiles", `id=eq.${USER_ID}`);
    const webhookKey = profiles?.[0]?.webhook_key;
    if (webhookKey) {
      console.log(`Webhook key found: ${webhookKey}`);
      // Find events in webhook_events matching webhookKey in headers jsonb field
      // We can query this by listing webhook_events (or using supabase filter if supported, but simple fetch works)
      const allWebhooks = await supabaseQuery("webhook_events", "limit=100");
      const filtered = allWebhooks.filter(w => {
        const h = w.headers || {};
        return h["x-portaliosa-key"] === webhookKey;
      });
      
      totalEvents = filtered.length;
      if (totalEvents > 0) {
        lastEventAt = filtered[0].received_at;
        lastEventType = filtered[0].event;
        if (filtered[0].store_id) {
          activeIds.add(filtered[0].store_id);
        }
      }
    }
  }

  const result = {
    connected: totalEvents > 0,
    totalEvents,
    lastEventAt,
    lastEventType,
    activeStoreIds: Array.from(activeIds),
  };

  console.log("Connection check result:", result);
}

checkConnection().catch(console.error);
