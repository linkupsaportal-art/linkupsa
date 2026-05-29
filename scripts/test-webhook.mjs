// Smoke test for /api/salla/webhook.
// Run: node scripts/test-webhook.mjs

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
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

const BASE = process.env.WEBHOOK_BASE ?? "http://localhost:3000";

async function probe() {
  const r = await fetch(`${BASE}/api/salla/webhook`);
  console.log(`GET  ${r.status}  ${await r.text()}`);
}

async function postEvent(name, body, tag) {
  const json = JSON.stringify(body);
  const r = await fetch(`${BASE}/api/salla/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-salla-security-strategy": "Token",
      authorization: TOKEN,
    },
    body: json,
  });
  console.log(`POST ${tag.padEnd(28)} ${r.status}  ${await r.text()}`);
}

async function postUnauthorized() {
  const r = await fetch(`${BASE}/api/salla/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-salla-security-strategy": "Token",
      authorization: "WRONG_TOKEN",
    },
    body: "{}",
  });
  console.log(`POST ${"unauthorized".padEnd(28)} ${r.status}  ${await r.text()}`);
}

async function main() {
  await probe();
  await postUnauthorized();

  const auth = {
    event: "app.store.authorize",
    merchant: 999000111,
    created_at: "2026-05-29T12:00:00Z",
    data: {
      access_token: "demo_access_" + Date.now(),
      refresh_token: "demo_refresh",
      expires_in: 1209600,
      scope: "offline_access settings.read",
      token_type: "Bearer",
      store: { id: 999000111, name: "Demo Store" },
      merchant: { id: 999000111 },
    },
  };
  await postEvent("auth", auth, "app.store.authorize");
  // Replay → must dedupe.
  await postEvent("auth-replay", auth, "app.store.authorize (replay)");

  const orderCreated = {
    event: "order.created",
    merchant: 999000111,
    created_at: "2026-05-29T12:01:00Z",
    data: {
      id: 6101,
      reference_id: 21001,
      total: { amount: 99.5, currency: "SAR" },
      status: { name: "بإنتظار المراجعة" },
      customer: { id: 1, mobile: "+966500000000" },
      items: [{ name: "Demo Product", quantity: 1 }],
      store: { id: 999000111 },
    },
  };
  await postEvent("order", orderCreated, "order.created");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
