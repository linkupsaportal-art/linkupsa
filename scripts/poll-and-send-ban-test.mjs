/**
 * Poll Meta template approval, then send the live ban WhatsApp to
 * +213672661102 once it flips to APPROVED.
 *
 * Run:  node scripts/poll-and-send-ban-test.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: cfgRow } = await sb
  .from("notification_channels")
  .select("config")
  .eq("store_id", 1375098081)
  .eq("channel", "whatsapp")
  .maybeSingle();
const cfg = cfgRow.config;

async function gql(query, variables) {
  const r = await fetch(`https://${cfg.host}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": cfg.app_token },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

const STATUS_Q = `query($id: String!, $name: String){
  whatsappGetTemplates(integrationId:$id, name:$name){ data { name status } }
}`;
const SEND = `mutation Send(
  $integrationId: String!,
  $templateName: String!,
  $recipient: String!,
  $language: String!,
  $params: JSON
){
  whatsappSendTemplateMessage(
    integrationId:$integrationId, templateName:$templateName,
    recipient:$recipient, language:$language, params:$params
  ){ __typename }
}`;

const TEMPLATE = "phone_ban_alert_v1";
const TO = "213672661102";

console.log(`Polling Meta approval for ${TEMPLATE}...`);
const startedAt = Date.now();
const maxMs = 6 * 60 * 1000; // 6 minutes
let approved = false;
while (Date.now() - startedAt < maxMs) {
  const j = await gql(STATUS_Q, { id: cfg.integration_id, name: TEMPLATE });
  const t = j.data?.whatsappGetTemplates?.data?.[0];
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`[+${elapsed}s] status: ${t?.status ?? "(missing)"}`);
  if (t?.status === "APPROVED") {
    approved = true;
    break;
  }
  if (t?.status === "REJECTED") {
    console.error("❌ Template REJECTED by Meta. Inspect in Karzoun UI for reason.");
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 20_000));
}

if (!approved) {
  console.log("⏰ Still PENDING after 6 minutes. Try again in a bit — Meta sometimes takes longer.");
  process.exit(0);
}

console.log("✅ APPROVED — sending live test message...");
const send = await gql(SEND, {
  integrationId: cfg.integration_id,
  templateName: TEMPLATE,
  recipient: TO,
  language: "ar",
  params: {
    "BODY_{{1}}": "PortalIosa",
    "BODY_{{2}}": "محمد",
    "BODY_{{3}}": "اختبار: تجاوز عدد محاولات إدخال كود التحقق",
  },
});
console.log(JSON.stringify(send, null, 2));
if (send.errors) {
  console.error("❌ Send failed");
  process.exit(1);
}
console.log("📨 Sent. Check WhatsApp on +213672661102.");
