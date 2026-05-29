import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { HandlerType, Product, ProductOption } from "./products-types";

export type { HandlerType, Product, ProductOption };
export { HANDLER_LABELS } from "./products-types";

export async function listProducts(): Promise<Product[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("products")
    .select(`
      *,
      options:product_options(*)
    `)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("products")
    .select(`*, options:product_options(*)`)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Product;
}

export async function createProduct(input: {
  name: string;
  name_ar?: string;
  description?: string;
  handler_type: HandlerType;
  salla_product_id?: number | null;
  status?: "active" | "inactive";
}): Promise<Product> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("products")
    .insert({
      name: input.name,
      name_ar: input.name_ar ?? null,
      description: input.description ?? null,
      handler_type: input.handler_type,
      salla_product_id: input.salla_product_id ?? null,
      status: input.status ?? "active",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: Partial<{
    name: string;
    name_ar: string | null;
    description: string | null;
    handler_type: HandlerType;
    salla_product_id: number | null;
    status: "active" | "inactive";
    image_url: string | null;
    notification_channels: Product["notification_channels"];
  }>,
): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("products").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createProductOption(input: {
  product_id: string;
  name: string;
  name_ar?: string;
  salla_option_value?: string;
  sort_order?: number;
}): Promise<ProductOption> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("product_options")
    .insert({
      product_id: input.product_id,
      name: input.name,
      name_ar: input.name_ar ?? null,
      salla_option_value: input.salla_option_value ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProductOption;
}

export async function deleteProductOption(id: string): Promise<void> {
  const sb = createServiceClient();
  const { error } = await sb.from("product_options").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
