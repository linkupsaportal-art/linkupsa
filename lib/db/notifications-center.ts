import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * In-app notification center helpers (the navbar bell feed).
 *
 * Writes always go through the service client (trusted server context):
 * one row per recipient. Reads/updates from the UI are scoped to the
 * current user by RLS, but these helpers also pass an explicit user_id
 * filter as defense in depth.
 */

export type NotificationType =
  | "staff_invite"
  | "role_changed"
  | "staff_removed"
  | "system"
  | "order"
  | "security";

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  actor_name: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

/** Insert a notification for a single user. Best-effort: never throws. */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from("notifications")
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        actor_id: input.actorId ?? null,
        actor_name: input.actorName ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** List a user's notifications (newest first) + unread count. */
export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<{ items: NotificationRow[]; unread: number }> {
  const sb = createServiceClient();
  const [{ data: items }, { count }] = await Promise.all([
    sb
      .from("notifications")
      .select("id, type, title, body, link, actor_name, metadata, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    sb
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
  ]);
  return { items: (items ?? []) as NotificationRow[], unread: count ?? 0 };
}

/** Mark one notification read (scoped to owner). */
export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<{ ok: boolean }> {
  const sb = createServiceClient();
  const { error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("read_at", null);
  return { ok: !error };
}

/** Mark every unread notification for a user as read. */
export async function markAllNotificationsRead(
  userId: string,
): Promise<{ ok: boolean; count: number }> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
    .select("id");
  return { ok: !error, count: data?.length ?? 0 };
}
