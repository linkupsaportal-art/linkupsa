import { createServiceClient } from "@/lib/supabase/server";
import type { SallaWebhookEnvelope } from "./types";

/**
 * Persist a webhook delivery to the durable inbox.
 *
 * Idempotency: `delivery_hash` is UNIQUE. A retry inserts nothing and
 * returns `{ duplicate: true }`, which the route handler turns into a 200
 * so Salla doesn't keep retrying.
 *
 * Status starts at `pending` — async processing flips it to
 * `processing` → `succeeded` | `failed`.
 */
export async function recordWebhook(args: {
  deliveryHash: string;
  rawBody: string;
  envelope: SallaWebhookEnvelope;
  headers: Record<string, string>;
}): Promise<
  | { duplicate: false; id: string }
  | { duplicate: true }
  | { duplicate: false; id: null; error: string }
> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("webhook_events")
    .insert({
      delivery_hash: args.deliveryHash,
      event: args.envelope.event,
      merchant: args.envelope.merchant ?? null,
      // For Salla, the store id IS the merchant id at the envelope level.
      // (`data.store.id` doesn't exist — verified from real payloads.)
      store_id: args.envelope.merchant ?? null,
      payload: args.envelope as unknown as Record<string, unknown>,
      headers: args.headers,
    })
    .select("id")
    .single();

  if (error) {
    // Postgres 23505 = unique_violation → duplicate delivery, safe to ack.
    if (error.code === "23505") return { duplicate: true };
    return { duplicate: false, id: null, error: error.message };
  }
  return { duplicate: false, id: data.id };
}
