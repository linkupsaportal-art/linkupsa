import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type NotificationChannel = {
  id: string;
  store_id: number;
  channel: "email" | "whatsapp" | "sms" | "telegram";
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

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

/** Returns the most-recent N notification dispatch results from orders. */
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
