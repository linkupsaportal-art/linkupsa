/** Wider mutation probe — Karzoun seems to only expose template + call mutations. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env"]) {
  const txt = readFileSync(path.join(root, file), "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: cfgRow } = await sb.from("notification_channels").select("config").eq("store_id", 1375098081).eq("channel", "whatsapp").maybeSingle();
const cfg = cfgRow.config;

// Try discovering with a partial-name suggestion via getQuery introspection alternative
const candidates = [
  "whatsappSendTemplateMessage",
  "whatsappSendCallButtonMessage",
  "messagesSend",
  "messageSend",
  "whatsappTemplatesAdd",
];
for (const name of candidates) {
  const r = await fetch(`https://${cfg.host}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": cfg.app_token },
    body: JSON.stringify({ query: `mutation { ${name} }` }),
  });
  const j = await r.json();
  console.log(`${name}: ${j.errors?.[0]?.message?.slice(0, 260) ?? JSON.stringify(j.data)}`);
}

// Fish for the real answer: post a query like Karzoun's UI does for sending free text inside an open conversation
// Their UI calls `whatsappSendTextMessageToInbox` or similar. Try all *Send* mutations:
const wide = [
  "messagesSendText",
  "whatsappTemplatesUpdate",
  "whatsappSendTemplateMessageWithMedia",
  "whatsappSendCallButtonMessage",
  "whatsappSendTemplateMessageReply",
  "inboxSendMessage",
  "inboxSendText",
];
for (const name of wide) {
  const r = await fetch(`https://${cfg.host}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": cfg.app_token },
    body: JSON.stringify({ query: `mutation { ${name} }` }),
  });
  const j = await r.json();
  console.log(`${name}: ${j.errors?.[0]?.message?.slice(0, 260) ?? JSON.stringify(j.data)}`);
}
