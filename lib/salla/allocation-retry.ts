/**
 * Allocation Retry (self-healing pass)
 *
 * Paid orders can get stuck in fulfillment_status='pending' when:
 *   - the merchant linked the product AFTER the order arrived, or
 *   - the product number was entered as a SKU (now supported), or
 *   - no account was in stock at ingest time.
 *
 * The customer then sees "الطلب قيد المعالجة" on the pickup page forever.
 * This pass runs with every inbox drain (cron, every minute): it re-maps
 * unmapped orders and re-runs the allocator, so fixing the product mapping
 * or restocking accounts heals stuck orders automatically.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { findActiveBan } from "@/lib/db/phone-bans";
import { matchProductForOrder } from "./product-matcher";
import { getOrigin, sendOrderReadyNotification } from "./order-notifier";

type ServiceClient = ReturnType<typeof createServiceClient>;

type PendingOrder = {
  id: string;
  store_id: number | null;
  salla_order_id: number | null;
  salla_reference_id: number | null;
  salla_product_id: number | null;
  salla_option_value: string | null;
  product_id: string | null;
  product_option_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_mobile: string | null;
  raw_payload: Record<string, unknown> | null;
};

/** Pulls the first item's SKU out of the stored Salla payload (if any). */
function skuFromPayload(payload: Record<string, unknown> | null): string | null {
  const items = payload?.items as Array<Record<string, unknown>> | undefined;
  const sku = items?.[0]?.sku;
  return typeof sku === "string" && sku ? sku : typeof sku === "number" ? String(sku) : null;
}

export async function retryPendingAllocations(
  sb: ServiceClient,
): Promise<{ healed: number }> {
  const stats = { healed: 0 };

  const { data: orders } = await sb
    .from("orders")
    .select(
      "id, store_id, salla_order_id, salla_reference_id, salla_product_id, salla_option_value, product_id, product_option_id, customer_name, customer_email, customer_mobile, raw_payload",
    )
    .eq("payment_status", "paid")
    .eq("fulfillment_status", "pending")
    .is("account_id", null)
    .is("archived_at", null)
    .limit(20);

  if (!orders?.length) return stats;

  for (const order of orders as PendingOrder[]) {
    try {
      let productId = order.product_id;
      let productOptionId = order.product_option_id;

      // Re-map if the order arrived before the product link existed
      if (!productId) {
        const match = await matchProductForOrder(sb, {
          sallaProductId: order.salla_product_id,
          sallaSku: skuFromPayload(order.raw_payload),
          sallaOptionValue: order.salla_option_value,
        });
        if (!match.productId) continue; // still unmapped — nothing to do
        productId = match.productId;
        productOptionId = match.productOptionId;
        await sb
          .from("orders")
          .update({ product_id: productId, product_option_id: productOptionId })
          .eq("id", order.id);
      }

      // Banned customers never get an allocation
      const mobile = order.customer_mobile ?? "";
      const ban = await findActiveBan({ mobile, productId });
      if (ban) continue;

      const { data: allocated } = await sb.rpc("allocate_account", {
        p_order_id: order.id,
        p_product_id: productId,
        p_option_id: productOptionId ?? undefined,
      });
      if (!allocated) continue; // out of stock — retried on the next run

      stats.healed++;
      await sendOrderReadyNotification({
        orderId: order.id,
        storeId: order.store_id ?? 0,
        email: order.customer_email,
        mobile: order.customer_mobile,
        customerName: order.customer_name ?? "",
        orderNumber: String(order.salla_reference_id ?? order.salla_order_id ?? ""),
        productName: productNameFromPayload(order.raw_payload),
        productId,
        origin: getOrigin(),
      });
    } catch {
      // Best-effort pass — a failing order must not block the others.
    }
  }

  return stats;
}

function productNameFromPayload(payload: Record<string, unknown> | null): string {
  const items = payload?.items as Array<Record<string, unknown>> | undefined;
  const name = items?.[0]?.name;
  return typeof name === "string" && name ? name : "منتج رقمي";
}
