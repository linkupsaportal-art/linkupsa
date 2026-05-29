/**
 * End-to-end pipeline test:
 *  - Loads the WhatsApp config from notification_channels (the way prod does)
 *  - Calls sendKarzounWhatsApp the same way the dispatcher does
 *  - Sends a real WhatsApp to the user's Algeria number
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env manually (no dotenv dep)
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORE_ID = 1375098081;
const TO = "213672661102";

const sb = createClient(SB_URL, SB_KEY);
const { data: row, error } = await sb
  .from("notification_channels")
  .select("config, enabled")
  .eq("store_id", STORE_ID)
  .eq("channel", "whatsapp")
  .single();

if (error || !row?.enabled) {
  console.error("Cannot load Karzoun config:", error?.message ?? "channel disabled");
  process.exit(1);
}

console.log("Loaded config: provider=", row.config.provider, " host=", row.config.host, " template=", row.config.default_template);

const sendQ = `
mutation Send($integrationId: String!, $templateName: String!, $recipient: String!, $language: String!, $params: JSON) {
  whatsappSendTemplateMessage(
    integrationId: $integrationId, templateName: $templateName,
    recipient: $recipient, language: $language, params: $params
  ) { __typename }
}`;

const variables = {
  integrationId: row.config.integration_id,
  templateName: row.config.default_template,
  recipient: TO,
  language: row.config.language ?? "ar",
  params: ["محمد - اختبار end-to-end", "PIPELINE-" + Date.now(), "ChatGPT Plus", "99 ريال", "بطاقة بنكية"],
};

const r = await fetch(`https://${row.config.host}/graphql`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-app-token": row.config.app_token,
  },
  body: JSON.stringify({ query: sendQ, variables }),
});
console.log("HTTP", r.status);
console.log(await r.text());
