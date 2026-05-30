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

const Q = `query($id: String!, $name: String){
  whatsappGetTemplates(integrationId:$id, name:$name){
    data { _id name status language category }
  }
}`;
const r = await fetch(`https://${cfg.host}/graphql`, {
  method: "POST",
  headers: { "content-type": "application/json", "x-app-token": cfg.app_token },
  body: JSON.stringify({ query: Q, variables: { id: cfg.integration_id, name: "phone_ban_alert_v1" } }),
});
const j = await r.json();
console.log(JSON.stringify(j, null, 2));
