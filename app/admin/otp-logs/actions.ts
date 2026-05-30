"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import {
  getAutoBanSettings,
  updateAutoBanSettings,
  updatePickupSessionSettings,
  type AutoBanSettings,
  type PickupSessionSettings,
} from "@/lib/db/platform-settings";
import { notifyPhoneBan } from "@/lib/notifications/ban-notify";

export type ActionResult = { ok: true } | { ok: false; error: string };

/* ─── Phone bans ───────────────────────────────────────────────────────── */

export async function createPhoneBan(input: {
  mobile: string;
  productId: string | null;
  reason: string | null;
}): Promise<ActionResult> {
  const mobile = input.mobile.trim().replace(/[\s\-()]/g, "");
  if (!/^\+?\d{6,15}$/.test(mobile)) {
    return { ok: false, error: "رقم الجوال غير صحيح" };
  }
  const sb = createServiceClient();
  const reason = input.reason?.trim() || null;
  const { error } = await sb.from("phone_bans").insert({
    mobile,
    product_id: input.productId,
    reason,
    active: true,
    auto_banned: false,
  });
  if (error) return { ok: false, error: error.message };
  // Best-effort WhatsApp alert. Never blocks the ban creation.
  void notifyPhoneBan({ mobile, reason });
  revalidatePath("/admin/otp-logs");
  return { ok: true };
}

export async function togglePhoneBan(id: string, active: boolean): Promise<ActionResult> {
  const sb = createServiceClient();
  const { error } = await sb.from("phone_bans").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/otp-logs");
  return { ok: true };
}

export async function deletePhoneBan(id: string): Promise<ActionResult> {
  const sb = createServiceClient();
  const { error } = await sb.from("phone_bans").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/otp-logs");
  return { ok: true };
}

/* ─── Auto-ban platform settings ─────────────────────────────────────── */

export async function getAutoBanSettingsAction(): Promise<AutoBanSettings> {
  return getAutoBanSettings();
}

export async function updateAutoBanSettingsAction(
  next: AutoBanSettings,
): Promise<ActionResult> {
  try {
    await updateAutoBanSettings(next);
    revalidatePath("/admin/otp-logs");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ─── Pickup session timing settings ─────────────────────────────────── */

export async function updatePickupSessionSettingsAction(
  next: PickupSessionSettings,
): Promise<ActionResult> {
  try {
    await updatePickupSessionSettings(next);
    revalidatePath("/admin/otp-logs");
    revalidatePath("/pickup");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
