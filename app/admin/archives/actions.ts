"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient, getCurrentRole } from "@/lib/supabase/server";
import { getRetentionSettings } from "@/lib/db/platform-settings";

/**
 * Manual archive/cleanup actions for the Archives page. Same logic the nightly
 * cron runs, but triggered on demand by a manager. Manager-only.
 */

export type CleanupResult =
  | { ok: true; count: number; message: string }
  | { ok: false; error: string };

async function requireManager(): Promise<boolean> {
  return (await getCurrentRole()) === "manager";
}

/** Archive orders older than the retention cutoff right now. */
export async function archiveOldOrdersAction(): Promise<CleanupResult> {
  if (!(await requireManager())) return { ok: false, error: "متاح للمدير فقط." };

  const { archive_orders_after_days } = await getRetentionSettings();
  const cutoff = new Date(
    Date.now() - archive_orders_after_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("orders")
    .update({ archived_at: new Date().toISOString(), archived_reason: "manual cleanup" })
    .is("archived_at", null)
    .lte("created_at", cutoff)
    .select("id");

  if (error) return { ok: false, error: "تعذّرت الأرشفة." };
  revalidatePath("/admin/archives");
  revalidatePath("/admin/orders");
  return { ok: true, count: data?.length ?? 0, message: `تمت أرشفة ${data?.length ?? 0} طلب.` };
}

/** Delete OTP logs older than the retention cutoff right now. */
export async function cleanupOtpLogsAction(): Promise<CleanupResult> {
  if (!(await requireManager())) return { ok: false, error: "متاح للمدير فقط." };

  const { delete_otp_logs_after_days } = await getRetentionSettings();
  const cutoff = new Date(
    Date.now() - delete_otp_logs_after_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("otp_logs")
    .delete()
    .lte("requested_at", cutoff)
    .select("id");

  if (error) return { ok: false, error: "تعذّر التنظيف." };
  revalidatePath("/admin/archives");
  return { ok: true, count: data?.length ?? 0, message: `تم حذف ${data?.length ?? 0} سجل.` };
}

/** Restore a single archived order back to the active list. */
export async function restoreOrderAction(orderId: string): Promise<CleanupResult> {
  if (!(await requireManager())) return { ok: false, error: "متاح للمدير فقط." };
  if (!orderId) return { ok: false, error: "معرّف غير صالح." };

  const sb = createServiceClient();
  const { error } = await sb
    .from("orders")
    .update({ archived_at: null, archived_reason: null })
    .eq("id", orderId);

  if (error) return { ok: false, error: "تعذّرت الاستعادة." };
  revalidatePath("/admin/archives");
  revalidatePath("/admin/orders");
  return { ok: true, count: 1, message: "تمت استعادة الطلب." };
}
