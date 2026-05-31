"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/lib/db/notifications-center";

/**
 * Notification-center server actions for the navbar bell. All scoped to the
 * current authenticated user — the helpers double-filter by user_id so a
 * client can never read or mutate another user's feed.
 */

export type NotifResult =
  | { ok: true; items: NotificationRow[]; unread: number }
  | { ok: false; error: string };

/** Fetch the current user's latest notifications + unread count. */
export async function fetchNotificationsAction(): Promise<NotifResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مسجّل الدخول" };
  const { items, unread } = await listNotifications(user.id, 20);
  return { ok: true, items, unread };
}

const idSchema = z.object({ id: z.string().uuid() });

/** Mark a single notification as read, then return the refreshed feed. */
export async function markReadAction(input: unknown): Promise<NotifResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مسجّل الدخول" };
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "معرّف غير صالح" };
  await markNotificationRead(user.id, parsed.data.id);
  const { items, unread } = await listNotifications(user.id, 20);
  return { ok: true, items, unread };
}

/** Mark all notifications read, then return the refreshed feed. */
export async function markAllReadAction(): Promise<NotifResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مسجّل الدخول" };
  await markAllNotificationsRead(user.id);
  const { items, unread } = await listNotifications(user.id, 20);
  return { ok: true, items, unread };
}
