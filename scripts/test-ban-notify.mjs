/**
 * Live ban-notification smoke test.
 *
 * Sends `phone_ban_alert_v1` to +213672661102 with a fake reason and
 * a duration line so we verify both placeholders + the duration suffix
 * the customer will see on WhatsApp.
 *
 * Run:  node scripts/test-ban-notify.mjs
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
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: cfgRow } = await sb
  .from("notification_channels")
  .select("config")
  .eq("store_id", 1375098081)
  .eq("channel", "whatsapp")
  .maybeSingle();
const cfg = cfgRow.config;

const TO = "213672661102";
const TEMPLATE = "phone_ban_alert_v1";
const STORE = "PortalIosa";
const NAME = "محمد";
const DURATION_MIN = 60 * 24; // 24h temp ban
const REASON_BASE = "تم رصد محاولات متعددة فاشلة لطلب كود التحقق.";

function humanizeMinutes(minutes) {
  if (!minutes || minutes <= 0) return "دائم";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (hours === 1) return "ساعة";
    if (hours === 2) return "ساعتان";
    return `${hours} ساعات`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "يوم";
  if (days === 2) return "يومان";
  return `${days} أيام`;
}

const durationLabel = humanizeMinutes(DURATION_MIN);
const REASON = `${REASON_BASE} — مدة الحظر: ${durationLabel}`;

const params = {
  "BODY_{{1}}": STORE,
  "BODY_{{2}}": NAME,
  "BODY_{{3}}": REASON,
};

const SEND = `mutation Send(
  $integrationId: String!,
  $templateId: String,
  $templateName: String!,
  $recipient: String!,
  $language: String!,
  $params: JSON
) {
  whatsappSendTemplateMessage(
    integrationId: $integrationId,
    templateId: $templateId,
    templateName: $templateName,
    recipient: $recipient,
    language: $language,
    params: $params
  ) { __typename }
}`;

console.log(`→ Sending ${TEMPLATE} to +${TO}`);
console.log(`  Duration: ${durationLabel}`);
console.log(`  Reason  : ${REASON_BASE}`);
const r = await fetch(`https://${cfg.host}/graphql`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-app-token": cfg.app_token },
  body: JSON.stringify({
    query: SEND,
    variables: {
      integrationId: cfg.integration_id,
      templateId: null,
      templateName: TEMPLATE,
      recipient: TO,
      language: "ar",
      params,
    },
  }),
});
const json = await r.json();
console.log(`HTTP ${r.status}`);
console.log(JSON.stringify(json, null, 2));
