import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderStatus = "completed" | "pending" | "failed";

export type Order = {
  id: string;
  date: string;
  customer: string;
  /** Repurposed: product name (the table is presentational only). */
  amount: string;
  status: OrderStatus;
};

/** Demo data — used as a fallback when no orders prop is provided. */
const DEFAULT_ORDERS: Order[] = [
  { id: "262887900", date: "2026-05-28", customer: "Hamad Al Farhan", amount: "اشتراك شات جي بي تي", status: "completed" },
  { id: "262883328", date: "2026-05-28", customer: "رهف", amount: "اشتراك شات جي بي تي", status: "completed" },
  { id: "262828462", date: "2026-05-28", customer: "عبدالعزيز الغامدي", amount: "فستان تجريبي", status: "completed" },
  { id: "262768325", date: "2026-05-27", customer: "Mr. Qusai", amount: "اشتراك شات جي بي تي", status: "completed" },
  { id: "262761822", date: "2026-05-27", customer: "Jawaher Alfaifi", amount: "فستان تجريبي", status: "completed" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  completed: "مكتمل",
  pending: "قيد التنفيذ",
  failed: "ملغى",
};

const STATUS_CLS: Record<OrderStatus, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warn/10 text-black",
  failed: "bg-danger/10 text-danger",
};

/**
 * Recent orders block — used on the dashboard overview.
 *
 * Pass `orders` from a server component (e.g. fetched from Supabase) to wire
 * production data. When omitted, falls back to demo data so the dashboard
 * still renders during the design phase.
 */
export function RecentOrdersTable({
  orders = DEFAULT_ORDERS,
}: {
  orders?: Order[];
}) {
  return (
    <article className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft">
      <header className="flex items-center justify-between p-5 border-b border-[hsl(var(--hairline))]">
        <div>
          <h3 className="font-display text-base font-bold tracking-tight text-fg">
            أحدث الطلبات
          </h3>
          <p className="text-xs text-fg-muted mt-0.5">آخر 5 طلبات على متجرك</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:text-accent-fg hover:bg-accent rounded-full px-3 py-1.5 transition-colors"
        >
          عرض الكل
          <ArrowUpLeft className="size-3.5" />
        </Link>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-widest text-fg-faint border-b border-[hsl(var(--hairline))]">
              <Th>الطلب #</Th>
              <Th>التاريخ</Th>
              <Th>العميل</Th>
              <Th align="end">المنتج</Th>
              <Th align="end">الحالة</Th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-fg-muted">
                  لا توجد طلبات بعد
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[hsl(var(--hairline))] last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <Td>
                    <span className="font-mono text-xs font-bold text-fg" dir="ltr">
                      #{order.id}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-fg-muted font-num" dir="ltr">
                      {order.date}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-fg font-medium">{order.customer}</span>
                  </Td>
                  <Td align="end">
                    <span className="text-fg font-medium">
                      {order.amount}
                    </span>
                  </Td>
                  <Td align="end">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                        STATUS_CLS[order.status],
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {STATUS_LABEL[order.status]}
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <th
      className={cn(
        "px-5 py-3 font-bold",
        align === "end" ? "text-end" : "text-start",
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <td
      className={cn(
        "px-5 py-3.5",
        align === "end" ? "text-end" : "text-start",
      )}
    >
      {children}
    </td>
  );
}
