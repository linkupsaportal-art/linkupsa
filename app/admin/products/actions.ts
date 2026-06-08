"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  createProductOption,
  deleteProduct,
  deleteProductOption,
  updateProduct,
} from "@/lib/db/products";
import type { HandlerType, Product } from "@/lib/db/products-types";
import { getNotificationChannel, getActiveStoreId } from "@/lib/db/notifications";
import { verifyKarzoun } from "@/lib/notifications/whatsapp-karzoun";

/**
 * Builds the `notification_channels` JSONB from the form's checkbox toggles.
 * Hidden inputs send "1" (checked) or "0" (unchecked).
 */
function buildNotificationChannels(formData: FormData): Product["notification_channels"] {
  const whatsapp = formData.get("notify_whatsapp") === "1";
  const email = formData.get("notify_email") === "1";
  const telegram = formData.get("notify_telegram") === "1";
  const whatsapp_template = (formData.get("whatsapp_template") as string) || undefined;
  const email_template = (formData.get("email_template") as string) || undefined;
  return {
    whatsapp,
    email,
    telegram,
    ...(whatsapp_template && whatsapp_template !== "none" ? { whatsapp_template } : {}),
    ...(email_template && email_template !== "none" ? { email_template } : {}),
  };
}

export async function createProductAction(formData: FormData) {
  const name = formData.get("name") as string;
  const name_ar = (formData.get("name_ar") as string) || undefined;
  const description = (formData.get("description") as string) || undefined;
  const handler_type = formData.get("handler_type") as HandlerType;
  const salla_product_id_raw = formData.get("salla_product_id") as string;
  const salla_product_id = salla_product_id_raw ? Number(salla_product_id_raw) : null;

  if (!name?.trim()) return { error: "اسم المنتج مطلوب" };
  if (!handler_type) return { error: "نوع المنتج مطلوب" };

  const youtube_url = (formData.get("youtube_url") as string)?.trim() || null;

  const notification_channels = buildNotificationChannels(formData);

  try {
    await createProduct({ name: name.trim(), name_ar, description, youtube_url, handler_type, salla_product_id, notification_channels });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateProductAction(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const name_ar = (formData.get("name_ar") as string) || null;
  const description = (formData.get("description") as string) || null;
  const handler_type = formData.get("handler_type") as HandlerType;
  const salla_product_id_raw = formData.get("salla_product_id") as string;
  const salla_product_id = salla_product_id_raw ? Number(salla_product_id_raw) : null;
  const status = formData.get("status") as "active" | "inactive";

  if (!name?.trim()) return { error: "اسم المنتج مطلوب" };

  const youtube_url = (formData.get("youtube_url") as string)?.trim() || null;

  const notification_channels = buildNotificationChannels(formData);

  try {
    await updateProduct(id, { name: name.trim(), name_ar, description, youtube_url, handler_type, salla_product_id, status, notification_channels });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleProductStatusAction(id: string, status: "active" | "inactive") {
  try {
    await updateProduct(id, { status });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await deleteProduct(id);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function addProductOptionAction(productId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const name_ar = (formData.get("name_ar") as string) || undefined;
  const salla_option_value = (formData.get("salla_option_value") as string) || undefined;

  if (!name?.trim()) return { error: "اسم الخيار مطلوب" };

  try {
    await createProductOption({ product_id: productId, name: name.trim(), name_ar, salla_option_value });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteProductOptionAction(id: string) {
  try {
    await deleteProductOption(id);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getKarzounTemplatesAction() {
  try {
    const storeId = await getActiveStoreId();
    if (!storeId) return { error: "No active store found" };

    const channel = await getNotificationChannel({ storeId, channel: "whatsapp" });
    if (!channel || !channel.enabled || !channel.config) {
      return { error: "WhatsApp channel not configured or disabled" };
    }

    const cfg = channel.config as any;
    if (!cfg.app_token || !cfg.integration_id) {
      return { error: "Karzoun credentials missing in configuration" };
    }

    const res = await verifyKarzoun({
      host: cfg.host,
      appToken: cfg.app_token,
      integrationId: cfg.integration_id,
    });

    if (!res.ok) {
      return { error: res.error };
    }

    // Return only approved templates
    const approvedTemplates = res.templates
      .filter((t) => t.status === "APPROVED")
      .map((t) => ({ value: t.name, label: `${t.name} (معتمد)` }));

    return { templates: approvedTemplates };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
