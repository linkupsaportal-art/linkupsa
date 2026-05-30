"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processInbox } from "@/lib/salla/order-ingestor";
import { dispatch } from "@/lib/salla/handlers";
import { refreshStoreInfo } from "@/lib/salla/store-info";
import type { SallaWebhookEnvelope } from "@/lib/salla/types";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Manually trigger the inbox processor. Useful when the daily cron
 * hasn't fired yet and the operator wants to push a stuck event
 * through. Also retries any non-order events that slipped past the
 * sync dispatcher into pending.
 */
export async function drainWebhookQueueAction(): Promise<
  ActionResult<{
    processed: number;
    fulfilled: number;
    skipped: number;
    errors: number;
    ackedNonOrder: number;
  }>
> {
  try {
    // First: ack any non-order pending events whose dispatcher already
    // ran successfully but didn't flip them. This is a safety pass for
    // legacy rows from before the auto-ack was added.
    const sb = createServiceClient();
    const { data: stale } = await sb
      .from("webhook_events")
      .select("id, event, payload")
      .eq("status", "pending")
      .not("event", "ilike", "order.%")
      .limit(50);
    let ackedNonOrder = 0;
    for (const row of stale ?? []) {
      try {
        await dispatch(row.payload as unknown as SallaWebhookEnvelope, row.id);
        ackedNonOrder++;
      } catch {
        /* per-row failures are recorded by dispatch itself */
      }
    }

    // Second: drain order events through the ingestor.
    const stats = await processInbox();
    revalidatePath("/admin/integrations");
    return { ok: true, data: { ...stats, ackedNonOrder } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Marks a single failed event as "acknowledged" and retries it through
 * the ingestor. Used for one-off recovery from transient Salla API
 * errors.
 */
export async function retryWebhookEventAction(eventId: string): Promise<ActionResult> {
  try {
    const sb = createServiceClient();
    await sb
      .from("webhook_events")
      .update({ status: "pending", error: null, processed_at: null })
      .eq("id", eventId);
    await processInbox();
    revalidatePath("/admin/integrations");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}


/**
 * Refreshes a store's storefront URL / domain / logo from Salla's
 * `/store/info` endpoint. Used by the "Refresh" button next to each
 * connected store on the integrations page.
 */
export async function refreshStoreInfoAction(
  storeId: number,
): Promise<ActionResult<{ storeUrl: string | null }>> {
  const sb = createServiceClient();
  const { data: store, error } = await sb
    .from("salla_stores")
    .select("access_token")
    .eq("store_id", storeId)
    .maybeSingle();
  if (error || !store?.access_token) {
    return { ok: false, error: "لا يوجد رمز وصول لهذا المتجر" };
  }
  const r = await refreshStoreInfo({ storeId, accessToken: store.access_token });
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/admin/integrations");
  return { ok: true, data: { storeUrl: r.storeUrl } };
}
