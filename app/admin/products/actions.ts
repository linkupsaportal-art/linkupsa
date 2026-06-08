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

/**
 * Builds the `notification_channels` JSONB from the form's checkbox toggles.
 * Hidden inputs send "1" (checked) or "0" (unchecked).
 */
function buildNotificationChannels(formData: FormData): Product["notification_channels"] {
  const whatsapp = formData.get("notify_whatsapp") === "1";
  const email = formData.get("notify_email") === "1";
  const telegram = formData.get("notify_telegram") === "1";
  return { whatsapp, email, telegram };
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
