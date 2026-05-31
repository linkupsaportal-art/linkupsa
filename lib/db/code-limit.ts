import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Code-limit change history — the audit trail behind the standalone
 * code-limit panel and the order "raise limit" action. Every change to an
 * order's otp_request_limit is journaled in `code_limit_changes`.
 */

export type CodeLimitChange = {
  id: string;
  orderReference: number | null;
  previousLimit: number;
  newLimit: number;
  changedByName: string | null;
  reason: string | null;
  createdAt: string;
};

export async function listCodeLimitChanges(limit = 100): Promise<CodeLimitChange[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("code_limit_changes")
    .select("id, order_reference, previous_limit, new_limit, changed_by_name, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    orderReference: (r.order_reference as number | null) ?? null,
    previousLimit: r.previous_limit as number,
    newLimit: r.new_limit as number,
    changedByName: (r.changed_by_name as string | null) ?? null,
    reason: (r.reason as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

/**
 * Orders the code-limit operator can act on — minimal projection: reference,
 * current limit, usage. No secrets, no customer PII beyond the reference.
 */
export type CodeLimitOrder = {
  id: string;
  reference: number | null;
  currentLimit: number;
  usage: number;
  productName: string | null;
};

export async function listOrdersForCodeLimit(limit = 100): Promise<CodeLimitOrder[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("orders")
    .select("id, salla_reference_id, otp_request_limit, otp_request_count, products(name, name_ar)")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((o) => {
    const prod = Array.isArray(o.products) ? o.products[0] : o.products;
    return {
      id: o.id as string,
      reference: (o.salla_reference_id as number | null) ?? null,
      currentLimit: o.otp_request_limit as number,
      usage: o.otp_request_count as number,
      productName: prod?.name_ar || prod?.name || null,
    };
  });
}
