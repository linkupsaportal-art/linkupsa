import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type ChannelKind = "email" | "whatsapp";

export type NotificationChannel = {
  id: string;
  store_id: number;
  channel: ChannelKind;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/* ─────────────────────────────────────────────────────────────────────
 * Per-channel config shapes (live in `config jsonb`).
 * The UI binds to these typed views; the DB stays a flexible bag.
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Karzoun Chat (WhatsApp BSP) configuration.
 * - `provider` distinguishes future BSPs (Meta direct, Twilio, ...).
 * - `param_map` keys the positional template params per template name.
 * - `ban_template` overrides the default "phone_ban_alert_v1".
 */
export type WhatsAppConfig = {
  provider: "karzoun";
  host: string;
  app_token: string;
  integration_id: string;
  default_template: string;
  ban_template?: string;
  language: string;
  store_name?: string;
  param_map?: Record<string, string[]>;
};

/**
 * Email config (Resend). The merchant can plug in their own Resend
 * API key from the admin panel — when present, it overrides the
 * platform default. The verified sender domain (e.g. `portaliosa.com`)
 * is captured here too so the From / Reply-To selectors can default
 * sensibly without manual editing on every send.
 */
export type EmailConfig = {
  api_key?: string;
  /** Verified sender domain registered in Resend (e.g. "portaliosa.com"). */
  verified_domain?: string;
  from?: string;
  reply_to?: string;
};

/* ─── Read helpers ───────────────────────────────────────────────────── */

/**
 * Loads every notification channel configured at any store level.
 * The admin page surfaces them grouped by channel.
 */
export async function listNotificationChannels(): Promise<NotificationChannel[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("notification_channels")
    .select("*")
    .order("channel");
  if (error) throw error;
  return (data ?? []) as NotificationChannel[];
}

export async function getNotificationChannel(opts: {
  storeId: number;
  channel: ChannelKind;
}): Promise<NotificationChannel | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("notification_channels")
    .select("*")
    .eq("store_id", opts.storeId)
    .eq("channel", opts.channel)
    .maybeSingle();
  if (error) throw error;
  return (data as NotificationChannel | null) ?? null;
}

/* ─── Mutation helpers ───────────────────────────────────────────────── */

export async function upsertNotificationChannel(input: {
  storeId: number;
  channel: ChannelKind;
  enabled: boolean;
  config: Record<string, unknown>;
}): Promise<NotificationChannel> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("notification_channels")
    .upsert(
      {
        store_id: input.storeId,
        channel: input.channel,
        enabled: input.enabled,
        config: input.config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "store_id,channel" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as NotificationChannel;
}

export async function setChannelEnabled(opts: {
  storeId: number;
  channel: ChannelKind;
  enabled: boolean;
}): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("notification_channels")
    .update({ enabled: opts.enabled, updated_at: new Date().toISOString() })
    .eq("store_id", opts.storeId)
    .eq("channel", opts.channel);
  if (error) throw error;
}

/* ─── Order dispatch summary (unchanged) ─────────────────────────────── */

export type NotificationDispatchSummary = {
  order_id: string;
  order_reference: number | null;
  customer_name: string | null;
  product_name: string | null;
  attempted: string[];
  succeeded: string[];
  failed: { channel: string; error: string }[];
  notification_sent_at: string;
};

export async function listRecentDispatches(limit = 30): Promise<NotificationDispatchSummary[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("orders")
    .select(
      "id, salla_reference_id, customer_name, notification_channels_used, notification_sent_at, products:products(name)",
    )
    .not("notification_sent_at", "is", null)
    .order("notification_sent_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const product = Array.isArray(r.products) ? r.products[0] : r.products;
    const channels = (r.notification_channels_used as Record<string, unknown> | null) ?? {};
    return {
      order_id: r.id,
      order_reference: r.salla_reference_id,
      customer_name: r.customer_name,
      product_name: product?.name ?? null,
      attempted: (channels.attempted as string[]) ?? [],
      succeeded: (channels.succeeded as string[]) ?? [],
      failed: (channels.failed as { channel: string; error: string }[]) ?? [],
      notification_sent_at: r.notification_sent_at as string,
    };
  });
}

/**
 * Like `listRecentDispatches`, but filters to only dispatches where the
 * specified channel was attempted (succeeded OR failed). Used by the
 * dedicated `/admin/messages/whatsapp` and `/admin/messages/email` pages.
 */
export async function listDispatchesByChannel(
  channel: ChannelKind,
  limit = 30,
): Promise<NotificationDispatchSummary[]> {
  const all = await listRecentDispatches(Math.min(limit * 3, 150));
  return all
    .filter(
      (d) =>
        d.attempted.includes(channel) ||
        d.succeeded.includes(channel) ||
        d.failed.some((f) => f.channel === channel),
    )
    .slice(0, limit);
}

/**
 * Returns the currently active store id. We are single-tenant for now,
 * so picking the most recently installed Salla store is correct. If
 * multi-tenant comes online later, this gets resolved via session.
 */
export async function getActiveStoreId(): Promise<number | null> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("salla_stores")
    .select("store_id")
    .order("installed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.store_id as number | undefined) ?? null);
}
