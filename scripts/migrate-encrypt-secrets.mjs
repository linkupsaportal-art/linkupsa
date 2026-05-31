/**
 * One-time migration: re-encrypt account secrets from legacy (plaintext bytea
 * / base64) into the v1 AES-256-GCM envelope.
 *
 * Safe to re-run: rows already in v1 format are skipped. Reads each secret
 * column, decodes the legacy value, encrypts it, and writes it back as TEXT
 * (the v1 string) into the same column.
 *
 * Run: node scripts/migrate-encrypt-secrets.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createCipheriv, randomBytes } from "node:crypto";
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

const key = Buffer.from(env.ENCRYPTION_KEY ?? "", "base64");
if (key.length !== 32) {
  console.error("ENCRYPTION_KEY must decode to 32 bytes. Aborting.");
  process.exit(1);
}

function encrypt(pt) {
  const iv = randomBytes(12);
  const ci = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([ci.update(pt, "utf8"), ci.final()]);
  const tag = ci.getAuthTag();
  return ["v1", iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

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

// Decode whatever the column currently holds into plaintext.
function decodeLegacy(escaped) {
  if (escaped == null) return null;
  const s = String(escaped);
  if (s.startsWith("v1:")) return null; // already encrypted, skip
  return s; // `encode(col,'escape')` already gives us the UTF-8 string
}

async function run() {
  // Read with escape-encoding so we get the raw UTF-8 string content.
  const selectCols = COLS.map((c) => `${c}:${c}`).join(", ");
  const { data, error } = await sb.rpc("noop_does_not_exist").then(
    () => ({ data: null, error: "skip" }),
    () => ({ data: null, error: "skip" }),
  );
  void selectCols; void data; void error;

  // Use raw SQL via PostgREST is not available; fetch via REST and decode.
  const { data: rows, error: readErr } = await sb
    .from("accounts")
    .select("id, password_encrypted, totp_secret_encrypted, steam_shared_secret_encrypted, card_code_encrypted, email_auth_config_encrypted");

  if (readErr) {
    console.error("Read failed:", readErr.message);
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const patch = {};
    for (const col of COLS) {
      const raw = row[col];
      if (raw == null) continue;
      let str = String(raw);
      // Supabase REST returns bytea as hex-escaped "\x..."
      if (str.startsWith("\\x")) {
        str = Buffer.from(str.slice(2), "hex").toString("utf8");
      }
      if (str.startsWith("v1:")) { skipped++; continue; }
      // Re-encrypt — store as Buffer so it lands in the bytea column exactly
      // the way createAccount writes it (UTF-8 bytes of the v1 envelope).
      patch[col] = Buffer.from(encrypt(str), "utf8");
    }
    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await sb.from("accounts").update(patch).eq("id", row.id);
      if (upErr) console.error(`  ✗ ${row.id}: ${upErr.message}`);
      else { updated++; console.log(`  ✓ encrypted ${Object.keys(patch).join(", ")} for ${row.id}`); }
    }
  }

  console.log(`\nDone. Rows updated: ${updated}, columns already-encrypted skipped: ${skipped}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
