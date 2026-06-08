import { createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
import { refreshStoreInfo } from "./store-info";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Header name the merchant sets in Salla's webhook custom headers. */
const PORTALIOSA_KEY_HEADER = "x-portaliosa-key";

/** Prefix for all generated webhook keys — makes them instantly recognizable. */
const KEY_PREFIX = "pk_";

/* ------------------------------------------------------------------ */
/*  Key Resolution                                                     */
/* ------------------------------------------------------------------ */

/**
 * Extracts the per-user portaliosa key from incoming webhook headers.
 *
 * Salla's custom header system is buggy — it REVERSES key/value pairs. So
 * the merchant enters:
 *   Name: x-portaliosa-key   Value: pk_abc123...
 * But Salla sends:
 *   Header: pk_abc123...: x-portaliosa-key
 *
 * We handle BOTH orientations:
 *   Normal:   x-portaliosa-key: pk_abc123...
 *   Reversed: pk_abc123...: x-portaliosa-key
 */
export function resolveWebhookKey(headers: Headers): string | null {
  // 1. Normal orientation
  const normal = headers.get(PORTALIOSA_KEY_HEADER);
  if (normal && normal.startsWith(KEY_PREFIX)) return normal.trim();

  // 2. Reversed orientation — scan for any header NAME starting with "pk_"
  //    whose VALUE is "x-portaliosa-key" (or any variant)
  // Headers.forEach is the only way to iterate all entries
  let reversed: string | null = null;
  headers.forEach((value, name) => {
    if (name.startsWith(KEY_PREFIX) && value.toLowerCase().includes("portaliosa")) {
      reversed = name.trim();
    }
  });

  return reversed;
}

/* ------------------------------------------------------------------ */
/*  Key Generation                                                     */
/* ------------------------------------------------------------------ */

/** Generates a unique webhook key: pk_ + 32 hex chars (16 random bytes). */
export function generateWebhookKey(): string {
  return KEY_PREFIX + randomBytes(16).toString("hex");
}

/* ------------------------------------------------------------------ */
/*  Auto-Link Store → User                                             */
/* ------------------------------------------------------------------ */

/** Optional store metadata extracted from the webhook payload. */
export type WebhookStoreMeta = {
  name?: string;
  url?: string;
};

/**
 * When a webhook arrives with a valid portaliosa key AND a merchant ID in the
 * body, this function:
 *   1. Looks up the user by webhook_key in profiles
 *   2. Upserts a salla_stores row (enriching with storeMeta if available)
 *   3. Upserts a store_members row making the user the owner (only if no
 *      owner exists yet — never hijacks an existing store)
 *   4. Best-effort: enriches store info via Salla API if an access token exists
 *
 * Returns the user ID if linking succeeded, null otherwise.
 */
export async function autoLinkStore(
  webhookKey: string,
  merchantId: number,
  storeMeta?: WebhookStoreMeta,
): Promise<{ userId: string } | null> {
  const sb = createServiceClient();

  // 1. Resolve key → user
  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .eq("webhook_key", webhookKey)
    .maybeSingle();

  if (!profile?.id) {
    console.log(`[auto-link] No user found for key ${webhookKey.substring(0, 12)}...`);
    return null;
  }

  const userId = profile.id as string;

  // 2. Ensure salla_stores row exists — enrich with storeMeta if available
  const storeUpsertData: Record<string, unknown> = {
    store_id: merchantId,
    installed_at: new Date().toISOString(),
    uninstalled_at: null,
  };
  // Only set name/URL if provided (avoid overwriting existing data with nulls)
  if (storeMeta?.name) storeUpsertData.store_name = storeMeta.name;
  if (storeMeta?.url) {
    storeUpsertData.store_url = storeMeta.url;
    storeUpsertData.store_domain = extractDomainFromUrl(storeMeta.url);
  }

  const { error: storeErr } = await sb.from("salla_stores").upsert(
    storeUpsertData,
    { onConflict: "store_id", ignoreDuplicates: false },
  );
  if (storeErr) {
    console.error("[auto-link] Failed to upsert salla_stores:", storeErr.message);
  }

  // 3. Takeover logic: Check if there are other members connected to this store.
  //    If other members exist (not current userId), remove them from store_members,
  //    then grant/upsert ownership to the current connecting user (userId).
  const { data: otherMembers } = await sb
    .from("store_members")
    .select("user_id")
    .eq("store_id", merchantId)
    .neq("user_id", userId);

  if (otherMembers && otherMembers.length > 0) {
    console.log(
      `[auto-link] Takeover: removing ${otherMembers.length} previous member(s) from store ${merchantId}`,
    );
    const { error: delErr } = await sb
      .from("store_members")
      .delete()
      .eq("store_id", merchantId)
      .neq("user_id", userId);

    if (delErr) {
      console.error(
        `[auto-link] Failed to remove previous store members for store ${merchantId}:`,
        delErr.message,
      );
    }
  }

  // Grant ownership to the current connecting user
  const { error: memberErr } = await sb.from("store_members").upsert(
    {
      user_id: userId,
      store_id: merchantId,
      role: "manager",
      is_owner: true,
    },
    { onConflict: "user_id,store_id" },
  );

  if (memberErr) {
    console.error("[auto-link] Failed to upsert store_members:", memberErr.message);
  } else {
    console.log(
      `[auto-link] ✅ Linked store ${merchantId} → user ${userId.substring(0, 8)}... (owner)`,
    );
  }

  // 4. Best-effort: enrich store info via Salla API if a token is already stored
  //    This happens when the store was previously OAuth-linked.
  try {
    const { data: storeRow } = await sb
      .from("salla_stores")
      .select("access_token, store_name")
      .eq("store_id", merchantId)
      .maybeSingle();

    if (storeRow?.access_token && !storeRow?.store_name) {
      console.log(`[auto-link] Enriching store ${merchantId} with API data...`);
      await refreshStoreInfo({
        storeId: merchantId,
        accessToken: storeRow.access_token as string,
      });
    }
  } catch (err) {
    console.error("[auto-link] store enrichment failed (non-fatal):", err);
  }

  return { userId };
}

/* ------------------------------------------------------------------ */
/*  Lazy Key Provisioning                                              */
/* ------------------------------------------------------------------ */

/**
 * Gets the user's webhook key, generating one lazily if it doesn't exist yet.
 * Used by the integrations page to display the key.
 */
export async function getOrCreateWebhookKey(userId: string): Promise<string> {
  const sb = createServiceClient();

  const { data: profile } = await sb
    .from("profiles")
    .select("webhook_key")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.webhook_key) return profile.webhook_key as string;

  // Generate and persist
  const key = generateWebhookKey();
  await sb.from("profiles").update({ webhook_key: key }).eq("id", userId);
  return key;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extracts the hostname from a URL string, gracefully handling malformed input. */
function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}
