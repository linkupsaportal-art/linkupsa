import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type PhoneBan = {
  id: string;
  mobile: string;
  product_id: string | null;
  product_name: string | null;
  reason: string | null;
  active: boolean;
  auto_banned: boolean;
  banned_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Lists every phone ban with the product name resolved (or null for
 * "global" bans that apply to all products).
 */
export async function listPhoneBans(): Promise<PhoneBan[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("phone_bans")
    .select("id, mobile, product_id, reason, active, auto_banned, banned_by, created_at, updated_at, products:products(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const product = Array.isArray(r.products) ? r.products[0] : r.products;
    return {
      id: r.id,
      mobile: r.mobile,
      product_id: r.product_id,
      product_name: product?.name ?? null,
      reason: r.reason,
      active: r.active,
      auto_banned: r.auto_banned ?? false,
      banned_by: r.banned_by,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });
}

/**
 * Checks if a mobile is banned for a given product. Used inside the
 * order ingestor before allocation. Returns the ban record if matched,
 * else null. Global bans (product_id IS NULL) match every product.
 */
export async function findActiveBan(opts: {
  mobile: string;
  productId: string;
}): Promise<PhoneBan | null> {
  const sb = createServiceClient();
  const cleaned = opts.mobile.replace(/[\s+\-()]/g, "");
  const { data } = await sb
    .from("phone_bans")
    .select("*")
    .eq("active", true)
    .or(`product_id.eq.${opts.productId},product_id.is.null`)
    .or(`mobile.eq.${cleaned},mobile.eq.+${cleaned}`)
    .limit(1);
  if (!data?.length) return null;
  const r = data[0];
  return {
    id: r.id,
    mobile: r.mobile,
    product_id: r.product_id,
    product_name: null,
    reason: r.reason,
    active: r.active,
    auto_banned: r.auto_banned ?? false,
    banned_by: r.banned_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
