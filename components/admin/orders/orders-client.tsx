"use client";

import { useState, useMemo } from "react";
import { ShoppingBag, RefreshCw, Search, X } from "lucide-react";
import type { Order } from "@/lib/db/orders";
import { OrderRowActions, type AccountOption } from "./order-row-actions";

const PAYMENT_LABELS: Record<Order["payment_status"], string> = {
  pending: "بإنتظار الدفع",
  paid: "مدفوع",
  refunded: "مسترجع",
  cancelled: "ملغي",
  failed: "فشل",
};

const PAYMENT_COLORS: Record<Order["payment_status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  paid: "bg-accent/15 text-accent",
  refunded: "bg-orange-500/15 text-orange-400",
  cancelled: "bg-fg-faint/15 text-fg-faint",
  failed: "bg-red-500/15 text-red-400",
};

const FULFILL_LABELS: Record<Order["fulfillment_status"], string> = {
  pending: "بإنتظار التسليم",
  fulfilled: "تم التسليم",
  failed: "فشل",
  cancelled: "ملغي",
};

const FULFILL_COLORS: Record<Order["fulfillment_status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  fulfilled: "bg-accent/15 text-accent",
  failed: "bg-red-500/15 text-red-400",
  cancelled: "bg-fg-faint/15 text-fg-faint",
};

export function OrdersClient({
  orders,
  total,
  initialQuery = "",
  accounts = [],
  canManage = false,
  canDelete = false,
}: {
  orders: Order[];
  total: number;
  initialQuery?: string;
  accounts?: AccountOption[];
  canManage?: boolean;
  canDelete?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "fulfilled">("all");
  const [search, setSearch] = useState(initialQuery);

  const filtered = useMemo(() => {
    const byStatus =
      filter === "all" ? orders : orders.filter((o) => o.fulfillment_status === filter);
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((o) => {
      const ref = String(o.salla_reference_id ?? o.salla_order_id ?? "");
      return (
        ref.includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_email ?? "").toLowerCase().includes(q) ||
        (o.customer_mobile ?? "").includes(q) ||
        (o.product_name ?? "").toLowerCase().includes(q) ||
        (o.account_label ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, filter, search]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <FilterTab label="الكل" count={orders.length} active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterTab
            label="بإنتظار التسليم"
            count={orders.filter((o) => o.fulfillment_status === "pending").length}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />
          <FilterTab
            label="تم التسليم"
            count={orders.filter((o) => o.fulfillment_status === "fulfilled").length}
            active={filter === "fulfilled"}
            onClick={() => setFilter("fulfilled")}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fg-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الطلبات…"
              className="h-9 w-48 sm:w-60 ps-9 pe-8 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="مسح البحث"
                className="absolute end-2 top-1/2 -translate-y-1/2 grid place-items-center size-5 rounded-full text-fg-faint hover:bg-fg/10 hover:text-fg transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface border border-[hsl(var(--hairline-strong))] text-sm text-fg hover:bg-surface-2 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            تحديث
          </button>
        </div>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
                <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                  <th className="text-start px-4 py-3 font-semibold">#الطلب</th>
                  <th className="text-start px-4 py-3 font-semibold">العميل</th>
                  <th className="text-start px-4 py-3 font-semibold">المنتج</th>
                  <th className="text-start px-4 py-3 font-semibold">الحساب</th>
                  <th className="text-start px-4 py-3 font-semibold">الدفع</th>
                  <th className="text-start px-4 py-3 font-semibold">التسليم</th>
                  <th className="text-start px-4 py-3 font-semibold">التاريخ</th>
                  {(canManage || canDelete) && (
                    <th className="text-start px-4 py-3 font-semibold">إجراءات</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--hairline))]">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-num font-semibold text-fg">
                        #{order.salla_reference_id ?? order.salla_order_id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-fg">{order.customer_name ?? "—"}</div>
                      <div className="text-xs text-fg-muted font-num" dir="ltr">
                        {order.customer_mobile ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-fg">
                      {order.product_name ?? <span className="text-fg-faint">—</span>}
                      {order.salla_option_value && (
                        <div className="text-xs text-fg-muted">{order.salla_option_value}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-fg">
                      {order.account_label ?? <span className="text-fg-faint">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${PAYMENT_COLORS[order.payment_status]}`}>
                        {PAYMENT_LABELS[order.payment_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${FULFILL_COLORS[order.fulfillment_status]}`}>
                        {FULFILL_LABELS[order.fulfillment_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted font-num">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    {(canManage || canDelete) && (
                      <td className="px-4 py-3">
                        <OrderRowActions
                          order={order}
                          accounts={accounts}
                          canManage={canManage}
                          canDelete={canDelete}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[hsl(var(--hairline))] px-4 py-2 text-xs text-fg-muted bg-surface-2">
            إجمالي: <span className="font-num font-semibold">{total}</span> طلب
          </div>
        </div>
      )}
    </div>
  );
}

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold transition-colors ${
        active
          ? "bg-fg text-bg"
          : "bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 border border-[hsl(var(--hairline-strong))]"
      }`}
    >
      <span>{label}</span>
      <span className={`font-num text-xs ${active ? "opacity-70" : "opacity-60"}`}>
        {count}
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-12 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
        <ShoppingBag className="size-6 text-fg-muted" />
      </div>
      <h3 className="font-semibold text-fg mb-1">لا توجد طلبات بعد</h3>
      <p className="text-sm text-fg-muted">ستظهر الطلبات هنا تلقائياً عند وصولها من سلة.</p>
    </div>
  );
}
