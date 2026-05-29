import { createServiceClient } from "@/lib/supabase/server";

export type HandlerType =
  | "2fa_account"
  | "steam_guard_account"
  | "email_code_account"
  | "normal_account"
  | "recharge_card"
  | "digital_file";

export type Product = {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  image_url: string | null;
  handler_type: HandlerType;
  status: "active" | "inactive";
  salla_product_id: number | null;
  notification_channels: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
    telegram: boolean;
  };
  sort_order: number;
  created_at: string;
  updated_at: string;
  options?: ProductOption[];
  account_count?: number;
};

export type ProductOption = {
  id: string;
  product_id: string;
  name: string;
  name_ar: string | null;
  salla_option_value: string | null;
  sort_order: number;
  created_at: string;
};

export const HANDLER_LABELS: Record<HandlerType, string> = {
  "2fa_account": "حساب 2FA",
  steam_guard_account: "Steam Guard",
  email_code_account: "كود إيميل",
  normal_account: "حساب عادي",
  recharge_card: "بطاقة شحن",
  digital_file: "ملف رقمي",
};

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

/** Fetch Salla products from the merchant's store for the mapping dropdown. */
export async function listSallaProducts(storeId: number): Promise<
  Array<{ id: number; name: string; sku: string | null }>
> {
  const sb = createServiceClient();
  const { data: store } = await sb
    .from("salla_stores")
    .select("access_token")
    .eq("store_id", storeId)
    .single();

  if (!store?.access_token) return [];

  const r = await fetch("https://api.salla.dev/admin/v2/products?per_page=50", {
    headers: { Authorization: `Bearer ${store.access_token}` },
  });
  if (!r.ok) return [];
  const json = await r.json();
  return (json.data ?? []).map((p: { id: number; name: string; sku?: string }) => ({
    id: p.id,
    name: p.name,
    sku: p.sku ?? null,
  }));
}
