"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processInbox } from "@/lib/salla/order-ingestor";
import { dispatch } from "@/lib/salla/handlers";
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

/* ------------------------------------------------------------------ */
/*  Webhook Connection Check                                           */
/* ------------------------------------------------------------------ */

export type ConnectionStatus = {
  connected: boolean;
  /** Total events received all-time for this user's stores. */
  totalEvents: number;
  /** Last event received timestamp. */
  lastEventAt: string | null;
  /** Last event type name. */
  lastEventType: string | null;
  /** Store IDs that have received events. */
  activeStoreIds: number[];
};

/**
 * Checks whether the current user's linked stores have received webhook
 * events — the definitive proof that the Salla webhook is correctly wired.
 *
 * Called from the "فحص الاتصال" button on the integrations page.
 */
export async function checkWebhookConnectionAction(
  userId: string,
): Promise<ActionResult<ConnectionStatus>> {
  try {
    const sb = createServiceClient();

    // Get user's stores via store_members
    const { data: memberships } = await sb
      .from("store_members")
      .select("store_id")
      .eq("user_id", userId);

    const storeIds = (memberships ?? []).map((m) => m.store_id as number);

    if (storeIds.length === 0) {
      // No stores linked yet — check if ANY events arrived
      // (could be pre-linking events)
      return {
        ok: true,
        data: {
          connected: false,
          totalEvents: 0,
          lastEventAt: null,
          lastEventType: null,
          activeStoreIds: [],
        },
      };
    }

    // Query webhook_events for these store IDs
    const { data: events, count } = await sb
      .from("webhook_events")
      .select("store_id, event, received_at", { count: "exact" })
      .in("store_id", storeIds)
      .order("received_at", { ascending: false })
      .limit(1);

    const lastEvent = events?.[0];
    const activeIds = new Set<number>();
    // Get distinct active store IDs from recent events
    const { data: recent } = await sb
      .from("webhook_events")
      .select("store_id")
      .in("store_id", storeIds)
      .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString())
      .limit(100);
    for (const r of recent ?? []) {
      if (r.store_id) activeIds.add(r.store_id as number);
    }

    return {
      ok: true,
      data: {
        connected: (count ?? 0) > 0,
        totalEvents: count ?? 0,
        lastEventAt: (lastEvent?.received_at as string) ?? null,
        lastEventType: (lastEvent?.event as string) ?? null,
        activeStoreIds: [...activeIds],
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
