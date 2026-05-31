"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Search, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/db/orders";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { restoreOrderAction } from "@/app/admin/archives/actions";

/**
 * Archived-orders table with per-row restore. Fulfils the spec's
 * "إمكانية استعادة الأرشيف" — managers can see every archived order and pull
 * any one back into the active list.
 */
export function ArchivedOrders({
  orders,
  canManage,
}: {
  orders: Order[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const ref = String(o.salla_reference_id ?? o.salla_order_id ?? "");
      return (
        ref.includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_mobile ?? "").includes(q) ||
        (o.product_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  function restore(id: string) {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const res = await restoreOrderAction(id);
        if (res.ok) router.refresh();
        else alert(res.error);
        resolve();
      });
    });
  }

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-[hsl(var(--hairline))]">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-surface-2 grid place-items-center">
            <Archive className="size-4 text-fg-muted" />
          </div>
          <div>
            <h3 className="font-bold text-fg text-sm">الطلبات المؤرشفة</h3>
            <p className="text-[11px] text-fg-muted">
              {orders.length} طلب مؤرشف — يمكنك استعادة أي طلب.
            </p>
          </div>
        </div>
        {orders.length > 0 && (
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fg-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث…"
              className="h-9 w-40 sm:w-52 ps-9 pe-3 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="p-10 text-center">
          <div className="inline-grid place-items-center size-12 rounded-2xl bg-surface-2 mb-3">
            <Inbox className="size-5 text-fg-faint" />
          </div>
          <p className="text-sm text-fg-muted">لا توجد طلبات مؤرشفة حالياً.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-fg-muted">لا نتائج مطابقة.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-[hsl(var(--hairline))]">
              <tr className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                <th className="text-start px-4 py-3">#الطلب</th>
                <th className="text-start px-4 py-3">العميل</th>
                <th className="text-start px-4 py-3">المنتج</th>
                <th className="text-start px-4 py-3">سبب الأرشفة</th>
                <th className="text-start px-4 py-3">تاريخ الأرشفة</th>
                {canManage && <th className="text-start px-4 py-3">إجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--hairline))]">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3 font-num font-semibold text-fg">
                    #{o.salla_reference_id ?? o.salla_order_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-fg">{o.customer_name ?? "—"}</div>
                    <div className="text-xs text-fg-muted font-num" dir="ltr">{o.customer_mobile ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-fg">{o.product_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{o.archived_reason ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-fg-muted font-num" dir="ltr">
                    {o.archived_at
                      ? new Date(o.archived_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setConfirmId(o.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition-colors",
                          "bg-fg text-bg hover:bg-[hsl(var(--surface-4))] disabled:opacity-50",
                        )}
                      >
                        {pending && confirmId === o.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <ArchiveRestore className="size-3.5 text-accent" />
                        )}
                        استعادة
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="استعادة هذا الطلب؟"
        description="سيعود الطلب إلى القائمة النشطة ويظهر مجدداً في صفحة الطلبات."
        confirmLabel="استعادة"
        onConfirm={async () => {
          if (confirmId) await restore(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}
