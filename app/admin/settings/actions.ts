"use server";

import { revalidatePath } from "next/cache";
import {
  updatePickupCustomizationSettings,
  type PickupCustomizationSettings,
} from "@/lib/db/platform-settings";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updatePickupCustomizationSettingsAction(
  next: PickupCustomizationSettings,
): Promise<ActionResult> {
  try {
    await updatePickupCustomizationSettings(next);
    revalidatePath("/admin/settings");
    revalidatePath("/pickup");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
