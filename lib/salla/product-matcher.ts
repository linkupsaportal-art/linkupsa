/**
 * Product Matcher
 *
 * Maps a Salla order item to one of our products. Merchants frequently enter
 * the SKU shown on the Salla product page (e.g. "10001110") instead of
 * Salla's internal product id (e.g. 817821976) — both are accepted here so
 * orders match either way.
 */

import type { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type ProductMatch = {
  productId: string | null;
  productOptionId: string | null;
};

export async function matchProductForOrder(
  sb: ServiceClient,
  args: {
    sallaProductId: number | null;
    sallaSku: string | null;
    sallaOptionValue: string | null;
  },
): Promise<ProductMatch> {
  let productId: string | null = null;

  // 1) Exact match on Salla's internal product id
  if (args.sallaProductId) {
    const { data } = await sb
      .from("products")
      .select("id")
      .eq("salla_product_id", args.sallaProductId)
      .maybeSingle();
    productId = data?.id ?? null;
  }

  // 2) Fallback: the merchant stored the SKU as the "product number"
  if (!productId && args.sallaSku) {
    const skuAsNumber = Number(args.sallaSku.replace(/\D/g, ""));
    if (Number.isFinite(skuAsNumber) && skuAsNumber > 0) {
      const { data } = await sb
        .from("products")
        .select("id")
        .eq("salla_product_id", skuAsNumber)
        .maybeSingle();
      productId = data?.id ?? null;
    }
  }

  // Resolve the option (e.g. "1 شهر") if the product matched
  let productOptionId: string | null = null;
  if (productId && args.sallaOptionValue) {
    const { data } = await sb
      .from("product_options")
      .select("id")
      .eq("product_id", productId)
      .eq("salla_option_value", args.sallaOptionValue)
      .maybeSingle();
    productOptionId = data?.id ?? null;
  }

  return { productId, productOptionId };
}
