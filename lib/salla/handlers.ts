import { createServiceClient } from "@/lib/supabase/server";
import type { AppStoreAuthorizeData, SallaWebhookEnvelope } from "./types";

/**
 * Synchronous post-receive dispatch — kept tiny on purpose so the route
 * handler returns within Salla's 30s timeout window.
 *
 * Heavy work (fulfillment, picking accounts, sending notifications) belongs
 * in a background worker that drains `webhook_events` by status='pending',
 * not here. Here we only do the strictly-required state mutation:
 *   - app.store.authorize → store the access token
 *   - app.store.uninstall → mark store uninstalled
 *
 * Order events flip themselves to status='succeeded' once a worker picks
 * them up. For now they just persist in the inbox.
 */
export async function dispatch(envelope: SallaWebhookEnvelope, eventId: string): Promise<void> {
  const sb = createServiceClient();

  switch (envelope.event) {
    case "app.store.authorize":
      await persistStoreTokens(envelope.data as AppStoreAuthorizeData);
      await markProcessed(sb, eventId, "succeeded");
      return;
    case "app.store.uninstalled":
    case "app.uninstalled":
      await markStoreUninstalled(envelope);
      await markProcessed(sb, eventId, "succeeded");
      return;
    // Order events are intentionally left at status='pending' — the
    // fulfillment worker (next milestone) will pick them up.
    default:
      return;
  }
}

async function persistStoreTokens(data: AppStoreAuthorizeData | undefined) {
  if (!data?.access_token) return;
  const sb = createServiceClient();
  const storeId = data.store?.id ?? data.merchant?.id;
  if (!storeId) return;

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : data.expires
      ? // Salla sometimes sends a Unix epoch in `expires`. Anything < 10^11
        // is "seconds offset from now"; otherwise treat as absolute epoch.
        new Date((data.expires < 1e11 ? Date.now() / 1000 + data.expires : data.expires) * 1000).toISOString()
      : null;

  await sb
    .from("salla_stores")
    .upsert(
      {
        store_id: storeId,
        store_name: data.store?.name ?? null,
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        token_expires_at: expiresAt,
        scope: data.scope ?? null,
        installed_at: new Date().toISOString(),
        uninstalled_at: null,
      },
      { onConflict: "store_id" },
    );
}

async function markStoreUninstalled(envelope: SallaWebhookEnvelope) {
  const sb = createServiceClient();
  const data = envelope.data as { store?: { id?: number } } | undefined;
  const storeId = data?.store?.id ?? envelope.merchant;
  if (!storeId) return;
  await sb
    .from("salla_stores")
    .update({ uninstalled_at: new Date().toISOString() })
    .eq("store_id", storeId);
}

async function markProcessed(
  sb: ReturnType<typeof createServiceClient>,
  eventId: string,
  status: "succeeded" | "failed",
) {
  await sb
    .from("webhook_events")
    .update({ status, processed_at: new Date().toISOString() })
    .eq("id", eventId);
}
