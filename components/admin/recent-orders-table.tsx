import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "completed" | "pending" | "failed";

type Order = {
  id: string;
  date: string;
  customer: string;
  amount: string; // formatted
  status: OrderStatus;
};

const ORDERS: Order[] = [
  { id: "262887900", date: "2026-05-28", customer: "Hamad Al Farhan", amount: "299.00", status: "completed" },
  { id: "262883328", date: "2026-05-28", customer: "رهف", amount: "299.00", status: "completed" },
  { id: "262828462", date: "2026-05-28", customer: "عبدالعزيز الغامدي", amount: "49.00", status: "completed" },
  { id: "262768325", date: "2026-05-27", customer: "Mr. Qusai", amount: "399.00", status: "completed" },
  { id: "262761822", date: "2026-05-27", customer: "Jawaher Alfaifi", amount: "40.00", status: "completed" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  completed: "مكتمل",
  pending: "قيد التنفيذ",
  failed: "ملغى",
};

const STATUS_CLS: Record<OrderStatus, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warn/10 text-warn",
  failed: "bg-danger/10 text-danger",
};

/** Recent orders block — used on the dashboard overview. */
export function RecentOrdersTable() {
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
              <Th align="end">المبلغ</Th>
              <Th align="end">الحالة</Th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order) => (
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
                  <span className="font-num font-bold text-fg">
                    {order.amount}
                  </span>{" "}
                  <span className="text-xs text-fg-muted">ر.س</span>
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
            ))}
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
