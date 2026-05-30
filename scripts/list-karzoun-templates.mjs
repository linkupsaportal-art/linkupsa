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

// Probe sub-fields on WhatsappTemplate
async function gql(query, variables) {
  const r = await fetch(`https://${cfg.host}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-token": cfg.app_token },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

const Q = `query($id: String!){
  whatsappGetTemplates(integrationId:$id){
    data { _id name status language category mapping { name } components }
  }
}`;
const j = await gql(Q, { id: cfg.integration_id });
if (j.errors) {
  console.error(JSON.stringify(j.errors, null, 2));
  process.exit(1);
}
const templates = j.data?.whatsappGetTemplates?.data ?? [];
console.log(`Found ${templates.length} templates:\n`);
for (const t of templates) {
  const body = (t.components ?? []).find((c) => c.type === "BODY")?.text ?? "";
  console.log(`▸ ${t.name}  [${t.status}]  lang=${t.language}  cat=${t.category}`);
  console.log(`   id: ${t._id}`);
  console.log(`   mapping: ${t.mapping?.map((m) => m.name).join(", ") || "(none)"}`);
  console.log(`   body: ${body.replace(/\n/g, " / ").slice(0, 240)}`);
  console.log("");
}
