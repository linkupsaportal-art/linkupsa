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
 * Checks whether the current user's webhook setup is working.
 *
 * Two-pronged approach to solve the chicken-and-egg problem:
 *   1. Check via store_members → webhook_events (the "linked" path)
 *   2. Check webhook_events where headers contain the user's portaliosa key
 *      (handles the FIRST webhook before any store is linked)
 *
 * Called from the "فحص الاتصال" button on the integrations page.
 */
export async function checkWebhookConnectionAction(
  userId: string,
): Promise<ActionResult<ConnectionStatus>> {
  try {
    const sb = createServiceClient();

    // ── Path 1: via linked stores ──────────────────────────────────────
    const { data: memberships } = await sb
      .from("store_members")
      .select("store_id")
      .eq("user_id", userId);

    const storeIds = (memberships ?? []).map((m) => m.store_id as number);

    let totalEvents = 0;
    let lastEventAt: string | null = null;
    let lastEventType: string | null = null;
    const activeIds = new Set<number>();

    if (storeIds.length > 0) {
      const { data: events, count } = await sb
        .from("webhook_events")
        .select("store_id, event, received_at", { count: "exact" })
        .in("store_id", storeIds)
        .order("received_at", { ascending: false })
        .limit(1);

      totalEvents = count ?? 0;
      const lastEvent = events?.[0];
      if (lastEvent) {
        lastEventAt = (lastEvent.received_at as string) ?? null;
        lastEventType = (lastEvent.event as string) ?? null;
      }

      const { data: recent } = await sb
        .from("webhook_events")
        .select("store_id")
        .in("store_id", storeIds)
        .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString())
        .limit(100);
      for (const r of recent ?? []) {
        if (r.store_id) activeIds.add(r.store_id as number);
      }
    }

    // ── Path 2: check by portaliosa key in headers ─────────────────────
    // If no events were found via store_members, the webhook might have
    // arrived but the auto-link didn't create store_members yet.
    // Look for events where the stored headers contain the user's key.
    if (totalEvents === 0) {
      const { data: profile } = await sb
        .from("profiles")
        .select("webhook_key")
        .eq("id", userId)
        .maybeSingle();

      const webhookKey = profile?.webhook_key as string | undefined;
      if (webhookKey) {
        // Search webhook_events where the headers JSONB contains the key
        // headers column stores: {"x-portaliosa-key": "pk_...", ...}
        const { data: keyEvents, count: keyCount } = await sb
          .from("webhook_events")
          .select("store_id, event, received_at", { count: "exact" })
          .or(`headers->>x-portaliosa-key.eq.${webhookKey},headers->>x-portaliosa-key.ilike.%${webhookKey}%`)
          .order("received_at", { ascending: false })
          .limit(1);

        if ((keyCount ?? 0) > 0) {
          totalEvents = keyCount ?? 0;
          const last = keyEvents?.[0];
          if (last) {
            lastEventAt = (last.received_at as string) ?? null;
            lastEventType = (last.event as string) ?? null;
            if (last.store_id) activeIds.add(last.store_id as number);
          }
        }
      }
    }

    return {
      ok: true,
      data: {
        connected: totalEvents > 0,
        totalEvents,
        lastEventAt,
        lastEventType,
        activeStoreIds: [...activeIds],
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
