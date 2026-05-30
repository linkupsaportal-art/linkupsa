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
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Lists every phone ban with the product name resolved (or null for
 * "global" bans that apply to all products). Bans whose `expires_at`
 * has passed are still returned (so admins see the history) but the
 * `active` flag is locally flipped to `false` so UI badges update.
 */
export async function listPhoneBans(): Promise<PhoneBan[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("phone_bans")
    .select(
      "id, mobile, product_id, reason, active, auto_banned, banned_by, expires_at, created_at, updated_at, products:products(name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const now = Date.now();
  return (data ?? []).map((r) => {
    const product = Array.isArray(r.products) ? r.products[0] : r.products;
    const expired = r.expires_at && new Date(r.expires_at).getTime() <= now;
    return {
      id: r.id,
      mobile: r.mobile,
      product_id: r.product_id,
      product_name: product?.name ?? null,
      reason: r.reason,
      active: r.active && !expired,
      auto_banned: r.auto_banned ?? false,
      banned_by: r.banned_by,
      expires_at: (r.expires_at as string | null) ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  });
}

/**
 * Checks if a mobile is banned for a given product. Used inside the
 * order ingestor before allocation. Returns the ban record if matched,
 * else null. Global bans (product_id IS NULL) match every product.
 * Bans whose `expires_at` has passed are excluded.
 */
export async function findActiveBan(opts: {
  mobile: string;
  productId: string;
}): Promise<PhoneBan | null> {
  const sb = createServiceClient();
  const cleaned = opts.mobile.replace(/[\s+\-()]/g, "");
  const nowIso = new Date().toISOString();
  const { data } = await sb
    .from("phone_bans")
    .select("*")
    .eq("active", true)
    .or(`product_id.eq.${opts.productId},product_id.is.null`)
    .or(`mobile.eq.${cleaned},mobile.eq.+${cleaned}`)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
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
    expires_at: (r.expires_at as string | null) ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/**
 * Friendly Arabic representation of a duration — used in WhatsApp body
 * and admin ban table. Returns "دائم" for null/0.
 */
export function humanizeBanDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "دائم";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 24) {
    if (remMin === 0) return hours === 1 ? "ساعة" : hours === 2 ? "ساعتان" : `${hours} ساعات`;
    return `${hours} س و ${remMin} د`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days < 7) {
    if (remHours === 0) {
      return days === 1 ? "يوم" : days === 2 ? "يومان" : `${days} أيام`;
    }
    return `${days} ي و ${remHours} س`;
  }
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "أسبوع" : weeks === 2 ? "أسبوعان" : `${weeks} أسابيع`;
}

/**
 * Same humanizer keyed off an `expires_at` ISO string. Returns "دائم"
 * if no expiration, or "منتهي" if already past. Used in the bans table
 * row chip.
 */
export function describeExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "دائم";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "منتهي";
  return humanizeBanDuration(Math.round(ms / 60_000));
}
