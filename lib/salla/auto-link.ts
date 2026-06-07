import { createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

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

/**
 * When a webhook arrives with a valid portaliosa key AND a merchant ID in the
 * body, this function:
 *   1. Looks up the user by webhook_key in profiles
 *   2. Upserts a salla_stores row (if it doesn't exist yet)
 *   3. Upserts a store_members row making the user the owner (only if no
 *      owner exists yet — never hijacks an existing store)
 *
 * Returns the user ID if linking succeeded, null otherwise.
 */
export async function autoLinkStore(
  webhookKey: string,
  merchantId: number,
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

  // 2. Ensure salla_stores row exists
  const { error: storeErr } = await sb.from("salla_stores").upsert(
    {
      store_id: merchantId,
      installed_at: new Date().toISOString(),
      uninstalled_at: null,
    },
    { onConflict: "store_id", ignoreDuplicates: true },
  );
  if (storeErr) {
    console.error("[auto-link] Failed to upsert salla_stores:", storeErr.message);
  }

  // 3. Ensure store_members row exists — only if no existing owner
  const { data: existingOwner } = await sb
    .from("store_members")
    .select("user_id")
    .eq("store_id", merchantId)
    .eq("is_owner", true)
    .maybeSingle();

  if (!existingOwner) {
    // No owner yet — grant ownership to this user
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
  } else {
    // Store already has an owner — add as manager (not owner)
    const { error: memberErr } = await sb.from("store_members").upsert(
      {
        user_id: userId,
        store_id: merchantId,
        role: "support",
        is_owner: false,
      },
      { onConflict: "user_id,store_id", ignoreDuplicates: true },
    );
    if (memberErr) {
      console.error("[auto-link] Failed to upsert store_members (non-owner):", memberErr.message);
    } else {
      console.log(
        `[auto-link] ✅ Added user ${userId.substring(0, 8)}... to store ${merchantId} (support)`,
      );
    }
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
