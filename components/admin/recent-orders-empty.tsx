import { Inbox, ChevronLeft } from "lucide-react";
import Link from "next/link";

/** Empty-state placeholder for the "Recent orders" section on the dashboard. */
export function RecentOrdersEmpty() {
  return (
    <div className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft">
      <header className="flex items-center justify-between p-5 border-b border-[hsl(var(--hairline))]">
        <div>
          <h3 className="font-display text-sm font-bold tracking-tight text-fg">آخر الطلبات</h3>
          <p className="text-xs text-fg-muted mt-0.5">يظهر هنا أحدث طلبات المتجر</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-xs font-semibold text-fg hover:text-accent transition-colors inline-flex items-center gap-1"
        >
          عرض الكل
          <ChevronLeft className="size-3" />
        </Link>
      </header>
      <div className="grid place-items-center text-center px-6 py-16">
        <div className="grid place-items-center size-12 rounded-2xl bg-surface-2 text-fg-muted mb-4">
          <Inbox className="size-5" />
        </div>
        <h4 className="text-sm font-semibold mb-1 text-fg">لا توجد طلبات بعد</h4>
        <p className="text-xs text-fg-muted max-w-xs leading-relaxed">
          سيتم عرض الطلبات هنا فور بدء استقبالها من متجرك.
        </p>
      </div>
    </div>
  );
}
