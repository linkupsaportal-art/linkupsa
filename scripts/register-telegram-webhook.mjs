/**
 * Registers the merchant Telegram bot's webhook with Telegram, then
 * persists the secret token + URL in Supabase.
 *
 * Run:  node scripts/register-telegram-webhook.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomBytes } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env", ".env.local"]) {
  try {
    const txt = readFileSync(path.join(root, file), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
}

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const APP_HOST = "https://www.portaliosa.com";
const WEBHOOK_PATH = "/api/telegram/webhook";

console.log("→ Loading Telegram bot config from Supabase...");
const { data: cfg, error } = await sb
  .from("telegram_bot_settings")
  .select("id, bot_token")
  .limit(1)
  .single();
if (error || !cfg?.bot_token) {
  console.error("✗ No bot config found:", error?.message);
  process.exit(1);
}

console.log("→ Verifying token via getMe...");
const meRes = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/getMe`);
const me = await meRes.json();
if (!me.ok) {
  console.error("✗ Bot token rejected by Telegram:", me.description);
  process.exit(1);
}
console.log(`✓ Bot @${me.result.username} (${me.result.first_name})`);

console.log("→ Registering webhook...");
const secret = randomBytes(24).toString("base64url");
const url = `${APP_HOST}${WEBHOOK_PATH}`;
const setRes = await fetch(
  `https://api.telegram.org/bot${cfg.bot_token}/setWebhook`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    }),
  },
);
const setJson = await setRes.json();
if (!setJson.ok) {
  console.error("✗ setWebhook failed:", setJson);
  process.exit(1);
}
console.log("✓ setWebhook OK:", setJson.description);

console.log("→ Persisting webhook to Supabase...");
const { error: upErr } = await sb
  .from("telegram_bot_settings")
  .update({
    webhook_url: url,
    webhook_secret: secret,
    webhook_set_at: new Date().toISOString(),
    bot_username: me.result.username,
    updated_at: new Date().toISOString(),
  })
  .eq("id", cfg.id);
if (upErr) {
  console.error("✗ Persist failed:", upErr);
  process.exit(1);
}

console.log("→ Confirming webhook info...");
const infoRes = await fetch(
  `https://api.telegram.org/bot${cfg.bot_token}/getWebhookInfo`,
);
const info = await infoRes.json();
console.log(JSON.stringify(info, null, 2));

console.log(`\n✅ Done. Open https://t.me/${me.result.username} and send /start`);
