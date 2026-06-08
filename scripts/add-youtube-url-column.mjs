/**
 * Adds `youtube_url` column to the `products` table via Supabase REST/SQL.
 * Run: node scripts/add-youtube-url-column.mjs
 */
import { readFileSync } from "fs";

function loadEnv(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* file may not exist */ }
}
loadEnv(".env.local");
loadEnv(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing env vars");
  process.exit(1);
}

// Use the Supabase SQL endpoint (PostgREST rpc or direct pg-meta)
const sql = `ALTER TABLE products ADD COLUMN IF NOT EXISTS youtube_url text DEFAULT NULL;`;

// Try via pg-meta REST API
const pgMetaUrl = `${supabaseUrl}/rest/v1/rpc/`;
const res = await fetch(`${supabaseUrl}/rest/v1/products?select=youtube_url&limit=1`, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  },
});

if (res.ok) {
  console.log("✅ Column 'youtube_url' already exists. No migration needed.");
} else {
  const body = await res.text();
  if (body.includes("youtube_url")) {
    console.log("❌ Column 'youtube_url' does not exist.");
    console.log("   Please run this SQL in the Supabase Dashboard SQL Editor:\n");
    console.log(`   ${sql}\n`);
  } else {
    console.log("✅ Column check passed.", body);
  }
}
