import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * OTP log row shape, joined with the order/account it belongs to so the
 * admin table can render the customer + product context without N+1 lookups.
 */
export type OtpLogRow = {
  id: string;
  result: string;
  ip_address: string | null;
  user_agent: string | null;
  error_detail: string | null;
  requested_at: string;
  order_id: string;
  order_reference: number | null;
  customer_name: string | null;
  customer_mobile: string | null;
  customer_mobile_last4: string | null;
  account_label: string | null;
  product_name: string | null;
};

export type OtpLogStats = {
  total: number;
  success: number;
  failures: number;
  uniqueIps: number;
};

const RESULT_FILTER = ["success", "limit_exceeded", "phone_mismatch", "cooldown", "totp_error", "order_not_found"] as const;
export type OtpResult = (typeof RESULT_FILTER)[number];

/** Paginated list with optional filters. */
export async function listOtpLogs(opts: {
  limit?: number;
  offset?: number;
  result?: OtpResult | "all";
  search?: string;
} = {}): Promise<{ rows: OtpLogRow[]; total: number; stats: OtpLogStats }> {
  const sb = createServiceClient();
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;

  // Count + result aggregations in one round-trip via Postgres view-style queries
  let q = sb
    .from("otp_logs")
    .select(
      `
      id, result, ip_address, user_agent, error_detail, requested_at, order_id,
      orders:orders!inner(salla_reference_id, customer_name, customer_mobile, customer_mobile_last4),
      accounts:accounts(label, products:products(name))
    `,
      { count: "exact" },
    )
    .order("requested_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.result && opts.result !== "all") q = q.eq("result", opts.result);

  const { data, count, error } = await q;
  if (error) throw error;

  const rows: OtpLogRow[] = (data ?? []).map((r) => {
    const order = Array.isArray(r.orders) ? r.orders[0] : r.orders;
    const account = Array.isArray(r.accounts) ? r.accounts[0] : r.accounts;
    const product = account
      ? Array.isArray(account.products)
        ? account.products[0]
        : account.products
      : null;
    return {
      id: r.id,
      result: r.result,
      ip_address: r.ip_address,
      user_agent: r.user_agent,
      error_detail: r.error_detail,
      requested_at: r.requested_at,
      order_id: r.order_id,
      order_reference: order?.salla_reference_id ?? null,
      customer_name: order?.customer_name ?? null,
      customer_mobile: order?.customer_mobile ?? null,
      customer_mobile_last4: order?.customer_mobile_last4 ?? null,
      account_label: account?.label ?? null,
      product_name: product?.name ?? null,
    };
  });

  // Compute summary stats from a separate small query (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: agg } = await sb
    .from("otp_logs")
    .select("result, ip_address")
    .gte("requested_at", since);

  const uniqueIps = new Set((agg ?? []).map((r) => r.ip_address).filter(Boolean)).size;
  const success = (agg ?? []).filter((r) => r.result === "success").length;
  const failures = (agg ?? []).filter((r) => r.result !== "success").length;

  return {
    rows,
    total: count ?? rows.length,
    stats: { total: agg?.length ?? 0, success, failures, uniqueIps },
  };
}
