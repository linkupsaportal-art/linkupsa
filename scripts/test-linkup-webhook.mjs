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

const TOKEN = env.SALLA_WEBHOOK_TOKEN;
if (!TOKEN) {
  console.error("SALLA_WEBHOOK_TOKEN missing from .env");
  process.exit(1);
}

const WEBHOOK_KEY = "pk_1dbe36b65072c1dbf56ca4bf0329f176"; // Linkup.saudi@gmail.com key
const MERCHANT_ID = 1075453390; // LinkUp SA (Live) Store ID
const BASE = "http://localhost:3000";

async function main() {
  const payload = {
    event: "app.store.authorize",
    merchant: MERCHANT_ID,
    created_at: new Date().toISOString(),
    data: {
      access_token: "test_token_" + Date.now(),
      refresh_token: "test_refresh",
      expires_in: 1209600,
      scope: "offline_access settings.read",
      token_type: "Bearer",
      store: { id: MERCHANT_ID, name: "LinkUp SA (Live)", url: "https://linkup-sa.salla.sa" },
      merchant: { id: MERCHANT_ID },
    },
  };

  console.log(`Sending webhook request to ${BASE}/api/salla/webhook...`);
  console.log(`Using x-portaliosa-key: ${WEBHOOK_KEY}`);
  console.log(`Using merchant ID: ${MERCHANT_ID}`);
  
  const res = await fetch(`${BASE}/api/salla/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Salla Webhook v2.0",
      "x-salla-security-strategy": "Token",
      authorization: TOKEN,
      "x-portaliosa-key": WEBHOOK_KEY,
    },
    body: JSON.stringify(payload),
  });

  console.log(`Response Status: ${res.status}`);
  const text = await res.text();
  console.log("Response Body:", text);
}

main().catch(console.error);
