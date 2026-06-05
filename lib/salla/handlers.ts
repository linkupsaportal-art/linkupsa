import { createServiceClient } from "@/lib/supabase/server";
import type { AppStoreAuthorizeData, SallaWebhookEnvelope } from "./types";
import { refreshStoreInfo } from "./store-info";

/**
 * Synchronous post-receive dispatch — kept tiny on purpose so the route
 * handler returns within Salla's 30s timeout window.
 *
 * Heavy work (fulfillment, picking accounts, sending notifications) belongs
 * in a background worker that drains `webhook_events` by status='pending',
 * not here. Here we only do the strictly-required state mutation:
 *   - app.store.authorize → store the access token
 *   - app.store.uninstalled → mark store uninstalled
 *
 * Order events flip themselves to status='succeeded' once a worker picks
 * them up. Lightweight informational events (app.installed,
 * app.updated, customer.*, product.*) are auto-acked as `succeeded`
 * so the integrations dashboard doesn't show them stuck at `pending`
 * forever — we record them for audit but have nothing more to do.
 */
export async function dispatch(envelope: SallaWebhookEnvelope, eventId: string): Promise<void> {
  const sb = createServiceClient();

  switch (envelope.event) {
    case "app.store.authorize":
      await persistStoreTokens(envelope);
      await markProcessed(sb, eventId, "succeeded");
      return;
    case "app.store.uninstalled":
    case "app.uninstalled":
      await markStoreUninstalled(envelope);
      await markProcessed(sb, eventId, "succeeded");
      return;
    // Order events are intentionally left at status='pending' — the
    // fulfillment worker (next milestone) will pick them up.
    case "order.created":
    case "order.updated":
    case "order.status.updated":
    case "order.payment.updated":
    case "invoice.created":
      return;
    // Everything else: archived / informational. Ack as succeeded so the
    // dashboard reflects "we received and acknowledged it" rather than
    // a misleading "pending".
    default:
      await markProcessed(sb, eventId, "succeeded");
      return;
  }
}

/**
 * Real Salla `app.store.authorize` payload (verified from production):
 *   {
 *     event: "app.store.authorize",
 *     merchant: 1375098081,              // ← THIS is the store id
 *     created_at: "2026-05-29 16:11:49",
 *     data: {
 *       id: 1487898353,                  // app id (not store)
 *       access_token: "ory_at_...",
 *       refresh_token: "ory_rt_...",
 *       expires: 1781269908,             // ← unix epoch seconds, absolute
 *       scope: "...",
 *       token_type: "bearer",
 *       app_name, app_type, app_description
 *     }
 *   }
 *
 * Note: `data.store` does NOT exist — the store/merchant id lives on the
 * envelope. We use `envelope.merchant` as our store_id.
 */
async function persistStoreTokens(envelope: SallaWebhookEnvelope) {
  const data = envelope.data as AppStoreAuthorizeData | undefined;
  if (!data?.access_token || !envelope.merchant) return;

  const sb = createServiceClient();
  const expiresAt = computeExpiry(data);

  await sb
    .from("salla_stores")
    .upsert(
      {
        store_id: envelope.merchant,
        store_name: data.app_name ?? null,
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? null,
        token_expires_at: expiresAt,
        scope: data.scope ?? null,
        installed_at: new Date().toISOString(),
        uninstalled_at: null,
      },
      { onConflict: "store_id" },
    );

  // Best-effort enrich with storefront URL / domain / logo. Runs after the
  // upsert so the row exists before we update it. Failures here are silent —
  // the integrations page has a manual "Refresh" button as a fallback.
  void refreshStoreInfo({
    storeId: envelope.merchant,
    accessToken: data.access_token,
  });
}

/**
 * Salla sends `data.expires` as an absolute unix epoch (seconds), e.g. 1781269908.
 * `data.expires_in` is sometimes also present and is "seconds from now". We prefer
 * the absolute value; fall back to expires_in only if expires is missing.
 */
function computeExpiry(data: AppStoreAuthorizeData): string | null {
  if (typeof data.expires === "number" && data.expires > 0) {
    return new Date(data.expires * 1000).toISOString();
  }
  if (typeof data.expires_in === "number" && data.expires_in > 0) {
    return new Date(Date.now() + data.expires_in * 1000).toISOString();
  }
  return null;
}

async function markStoreUninstalled(envelope: SallaWebhookEnvelope) {
  if (!envelope.merchant) return;
  const sb = createServiceClient();
  await sb
    .from("salla_stores")
    .update({ uninstalled_at: new Date().toISOString() })
    .eq("store_id", envelope.merchant);
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
