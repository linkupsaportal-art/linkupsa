import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Dashboard analytics aggregator.
 *
 * One round of queries that powers every block on the admin overview. All
 * numbers come straight from the live tables — orders, accounts, otp_logs,
 * phone_bans, webhook_events, products — so the dashboard reflects reality
 * instead of placeholder design data.
 *
 * Kept intentionally read-only and resilient: any individual query failing
 * degrades that one metric to a zero/empty rather than throwing the whole
 * page. The operator should always see *something* truthful.
 */

export type DailyPoint = {
  /** Short Arabic-friendly label, e.g. "30 مايو". */
  label: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  total: number;
  fulfilled: number;
};

export type MonthlyPoint = {
  /** Arabic month name. */
  month: string;
  orders: number;
};

export type ProductStock = {
  id: string;
  name: string;
  ordersCount: number;
  slotsLeft: number;
  /** Stock health 0–100 (slotsLeft relative to the busiest product). */
  health: number;
};

export type RecentOrderRow = {
  id: string;
  reference: string;
  date: string;
  customer: string;
  product: string;
  status: "completed" | "pending" | "failed";
};

export type SecurityEventRow = {
  id: string;
  label: string;
  date: string;
  kind: "success" | "blocked";
  detail: string;
};

export type DashboardAnalytics = {
  // Headline KPIs
  totalOrders: number;
  fulfilled: number;
  pending: number;
  failed: number;
  cancelled: number;
  uniqueCustomers: number;
  fulfillRate: number; // 0–100

  // Stock / accounts
  productsActive: number;
  productsTotal: number;
  accountsAvailable: number;
  slotsAvailable: number;

  // OTP / verification
  otpTotal: number;
  otpSuccess: number;
  otpFailed: number;
  otpSuccessRate: number; // 0–100
  otpBreakdown: { result: string; count: number }[];

  // Security
  bansActive: number;
  bansAuto: number;

  // Integration health
  webhooksTotal: number;
  webhooksFailed: number;
  webhooksPending: number;

  // Series + tables
  daily: DailyPoint[]; // last 8 calendar days
  monthly: MonthlyPoint[]; // last 12 months
  topProducts: ProductStock[];
  recentOrders: RecentOrderRow[];
  recentSecurity: SecurityEventRow[];
};

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function dayLabel(d: Date): string {
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const sb = createServiceClient();

  // Pull the order set once (small table) and derive most metrics in JS.
  const [
    ordersRes,
    accountsRes,
    productsRes,
    otpRes,
    bansRes,
    webhooksRes,
  ] = await Promise.all([
    sb
      .from("orders")
      .select(
        "id, salla_reference_id, salla_order_id, customer_name, customer_email, customer_mobile, fulfillment_status, payment_status, created_at, product_id, products(name, name_ar)",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
    sb.from("accounts").select("id, product_id, status, max_usage, current_usage"),
    sb.from("products").select("id, name, name_ar, status"),
    sb.from("otp_logs").select("result, requested_at, order_id, orders(salla_reference_id, customer_name, customer_mobile_last4)").order("requested_at", { ascending: false }),
    sb.from("phone_bans").select("active, auto_banned, expires_at"),
    sb.from("webhook_events").select("status"),
  ]);

  type OrderRow = {
    id: string;
    salla_reference_id: number | null;
    salla_order_id: number | null;
    customer_name: string | null;
    customer_email: string | null;
    customer_mobile: string | null;
    fulfillment_status: string;
    payment_status: string;
    created_at: string;
    product_id: string | null;
    products: { name: string | null; name_ar: string | null } | { name: string | null; name_ar: string | null }[] | null;
  };

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const accounts = (accountsRes.data ?? []) as {
    id: string; product_id: string | null; status: string; max_usage: number; current_usage: number;
  }[];
  const products = (productsRes.data ?? []) as {
    id: string; name: string | null; name_ar: string | null; status: string;
  }[];
  const otp = (otpRes.data ?? []) as {
    result: string; requested_at: string; order_id: string;
    orders: { salla_reference_id: number | null; customer_name: string | null; customer_mobile_last4: string | null } | { salla_reference_id: number | null; customer_name: string | null; customer_mobile_last4: string | null }[] | null;
  }[];
  const bans = (bansRes.data ?? []) as { active: boolean; auto_banned: boolean; expires_at: string | null }[];
  const webhooks = (webhooksRes.data ?? []) as { status: string }[];

  // ---- Order headline metrics ----
  const totalOrders = orders.length;
  const fulfilled = orders.filter((o) => o.fulfillment_status === "fulfilled").length;
  const pending = orders.filter((o) => o.fulfillment_status === "pending").length;
  const failed = orders.filter((o) => o.fulfillment_status === "failed").length;
  const cancelled = orders.filter((o) => o.fulfillment_status === "cancelled").length;
  const uniqueCustomers = new Set(
    orders.map((o) => o.customer_mobile || o.customer_email || o.customer_name).filter(Boolean),
  ).size;
  const fulfillRate = totalOrders ? Math.round((fulfilled / totalOrders) * 100) : 0;

  // ---- Accounts / stock ----
  const productsTotal = products.length;
  const productsActive = products.filter((p) => p.status === "active").length;
  const activeAccounts = accounts.filter((a) => a.status === "active");
  const accountsAvailable = activeAccounts.filter((a) => a.current_usage < a.max_usage).length;
  const slotsAvailable = activeAccounts.reduce(
    (sum, a) => sum + Math.max(0, a.max_usage - a.current_usage),
    0,
  );

  // ---- OTP / verification ----
  const otpTotal = otp.length;
  const otpSuccess = otp.filter((r) => r.result === "success").length;
  const otpFailed = otpTotal - otpSuccess;
  const otpSuccessRate = otpTotal ? Math.round((otpSuccess / otpTotal) * 100) : 0;
  const otpBreakdownMap = new Map<string, number>();
  for (const r of otp) otpBreakdownMap.set(r.result, (otpBreakdownMap.get(r.result) ?? 0) + 1);
  const otpBreakdown = [...otpBreakdownMap.entries()]
    .map(([result, count]) => ({ result, count }))
    .sort((a, b) => b.count - a.count);

  // ---- Security ----
  const now = Date.now();
  const isActiveBan = (b: { active: boolean; expires_at: string | null }) =>
    b.active && (!b.expires_at || new Date(b.expires_at).getTime() > now);
  const bansActive = bans.filter(isActiveBan).length;
  const bansAuto = bans.filter((b) => isActiveBan(b) && b.auto_banned).length;

  // ---- Webhooks ----
  const webhooksTotal = webhooks.length;
  const webhooksFailed = webhooks.filter((w) => w.status === "failed").length;
  const webhooksPending = webhooks.filter((w) => w.status === "pending").length;

  // ---- Daily series (last 8 calendar days) ----
  const daily: DailyPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const sameDay = orders.filter((o) => o.created_at.slice(0, 10) === iso);
    daily.push({
      label: dayLabel(d),
      date: iso,
      total: sameDay.length,
      fulfilled: sameDay.filter((o) => o.fulfillment_status === "fulfilled").length,
    });
  }

  // ---- Monthly series (last 12 months) ----
  const monthly: MonthlyPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const count = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getFullYear() === y && od.getMonth() === m;
    }).length;
    monthly.push({ month: AR_MONTHS[m], orders: count });
  }

  // ---- Top products + stock health ----
  const ordersByProduct = new Map<string, number>();
  for (const o of orders) {
    if (o.product_id) ordersByProduct.set(o.product_id, (ordersByProduct.get(o.product_id) ?? 0) + 1);
  }
  const slotsByProduct = new Map<string, number>();
  for (const a of activeAccounts) {
    if (a.product_id) {
      slotsByProduct.set(
        a.product_id,
        (slotsByProduct.get(a.product_id) ?? 0) + Math.max(0, a.max_usage - a.current_usage),
      );
    }
  }
  const maxSlots = Math.max(1, ...products.map((p) => slotsByProduct.get(p.id) ?? 0));
  const topProducts: ProductStock[] = products
    .map((p) => {
      const slotsLeft = slotsByProduct.get(p.id) ?? 0;
      return {
        id: p.id,
        name: p.name_ar || p.name || "—",
        ordersCount: ordersByProduct.get(p.id) ?? 0,
        slotsLeft,
        health: Math.round((slotsLeft / maxSlots) * 100),
      };
    })
    .sort((a, b) => b.ordersCount - a.ordersCount);

  // ---- Recent orders (top 5) ----
  const statusMap: Record<string, RecentOrderRow["status"]> = {
    fulfilled: "completed",
    pending: "pending",
    failed: "failed",
    cancelled: "failed",
  };
  const recentOrders: RecentOrderRow[] = orders.slice(0, 5).map((o) => {
    const prod = Array.isArray(o.products) ? o.products[0] : o.products;
    return {
      id: o.id,
      reference: String(o.salla_reference_id ?? o.salla_order_id ?? "—"),
      date: o.created_at.slice(0, 10),
      customer: o.customer_name ?? "—",
      product: prod?.name_ar || prod?.name || "—",
      status: statusMap[o.fulfillment_status] ?? "pending",
    };
  });

  // ---- Recent security / verification activity (top 5) ----
  const recentSecurity: SecurityEventRow[] = otp.slice(0, 5).map((r, idx) => {
    const ord = Array.isArray(r.orders) ? r.orders[0] : r.orders;
    const ref = ord?.salla_reference_id ? `#${ord.salla_reference_id}` : "طلب";
    const ok = r.result === "success";
    const detailMap: Record<string, string> = {
      success: "تم تسليم رمز التحقق",
      phone_mismatch: "رقم جوال غير مطابق",
      cooldown: "طلب متكرر سريع",
      limit_exceeded: "تجاوز حد الطلبات",
      totp_error: "خطأ في توليد الرمز",
      order_not_found: "طلب غير موجود",
    };
    return {
      id: `${r.order_id}-${idx}`,
      label: `${ref}${ord?.customer_name ? ` · ${ord.customer_name}` : ""}`,
      date: r.requested_at.slice(0, 10),
      kind: ok ? "success" : "blocked",
      detail: detailMap[r.result] ?? r.result,
    };
  });

  return {
    totalOrders,
    fulfilled,
    pending,
    failed,
    cancelled,
    uniqueCustomers,
    fulfillRate,
    productsActive,
    productsTotal,
    accountsAvailable,
    slotsAvailable,
    otpTotal,
    otpSuccess,
    otpFailed,
    otpSuccessRate,
    otpBreakdown,
    bansActive,
    bansAuto,
    webhooksTotal,
    webhooksFailed,
    webhooksPending,
    daily,
    monthly,
    topProducts,
    recentOrders,
    recentSecurity,
  };
}
