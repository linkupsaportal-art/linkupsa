/**
 * Repair: the first migration accidentally stored secrets as a JSON-serialized
 * Node Buffer (`{"type":"Buffer","data":[...]}`) inside the bytea column.
 * This reads that JSON, reconstructs the original v1 envelope string, and
 * rewrites the column using the correct Postgres `\x` hex wire-format.
 *
 * Idempotent: rows already holding a clean `\xHEX(v1:...)` are left alone.
 *
 * Run: node scripts/repair-encrypted-secrets.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env"), "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return env;
}
const env = loadEnv();

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COLS = [
  "password_encrypted",
  "totp_secret_encrypted",
  "steam_shared_secret_encrypted",
  "card_code_encrypted",
  "email_auth_config_encrypted",
];

// Given the column value as supabase-js returns it, produce the correct
// `\x` hex string that represents the UTF-8 bytes of the v1 envelope.
function repairValue(raw) {
  if (raw == null) return undefined;
  let s = String(raw);

  // bytea hex → decode to inner UTF-8
  let inner = s;
  if (s.startsWith("\\x")) {
    inner = Buffer.from(s.slice(2), "hex").toString("utf8");
  }

  // Case 1: inner is the JSON-Buffer wrapper from the broken migration.
  if (inner.startsWith('{"type":"Buffer"')) {
    try {
      const obj = JSON.parse(inner);
      const bytes = Buffer.from(obj.data); // these bytes ARE the v1 string
      const v1 = bytes.toString("utf8");
      if (v1.startsWith("v1:")) {
        return "\\x" + Buffer.from(v1, "utf8").toString("hex");
      }
    } catch {
      return undefined;
    }
  }

  // Case 2: already a clean v1 envelope (correct format) — leave it.
  if (inner.startsWith("v1:")) return undefined;

  return undefined;
}

async function run() {
  const { data: rows, error } = await sb
    .from("accounts")
    .select("id, password_encrypted, totp_secret_encrypted, steam_shared_secret_encrypted, card_code_encrypted, email_auth_config_encrypted");
  if (error) { console.error(error.message); process.exit(1); }

  let fixed = 0;
  for (const row of rows ?? []) {
    const patch = {};
    for (const col of COLS) {
      const repaired = repairValue(row[col]);
      if (repaired) patch[col] = repaired;
    }
    if (Object.keys(patch).length) {
      const { error: upErr } = await sb.from("accounts").update(patch).eq("id", row.id);
      if (upErr) console.error(`  ✗ ${row.id}: ${upErr.message}`);
      else { fixed++; console.log(`  ✓ repaired ${Object.keys(patch).join(", ")} for ${row.id}`); }
    }
  }
  console.log(`\nDone. Rows repaired: ${fixed}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
