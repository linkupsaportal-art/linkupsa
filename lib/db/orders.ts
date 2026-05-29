import { createServiceClient } from "@/lib/supabase/server";

export type Order = {
  id: string;
  salla_order_id: number;
  salla_reference_id: number | null;
  store_id: number | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_mobile: string | null;
  customer_mobile_last4: string | null;
  product_id: string | null;
  product_option_id: string | null;
  salla_product_id: number | null;
  salla_option_value: string | null;
  account_id: string | null;
  assigned_at: string | null;
  salla_status: string | null;
  payment_status: "pending" | "paid" | "refunded" | "cancelled" | "failed";
  fulfillment_status: "pending" | "fulfilled" | "failed" | "cancelled";
  otp_request_count: number;
  otp_request_limit: number;
  notification_sent_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  product_name?: string;
  account_label?: string;
};

export async function listOrders(opts?: {
  limit?: number;
  offset?: number;
  fulfillment_status?: string;
  payment_status?: string;
}): Promise<{ orders: Order[]; total: number }> {
  const sb = createServiceClient();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let q = sb
    .from("orders")
    .select(
      `*, 
       products(name),
       accounts(label)`,
      { count: "exact" },
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.fulfillment_status) q = q.eq("fulfillment_status", opts.fulfillment_status);
  if (opts?.payment_status) q = q.eq("payment_status", opts.payment_status);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);

  const orders = (data ?? []).map((row: Record<string, unknown>) => ({
    ...(row as Order),
    product_name: (row.products as { name: string } | null)?.name ?? null,
    account_label: (row.accounts as { label: string } | null)?.label ?? null,
  }));

  return { orders, total: count ?? 0 };
}
