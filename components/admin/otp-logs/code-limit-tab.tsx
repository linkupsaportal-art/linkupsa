"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gauge, Search, History, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeLimitChange, CodeLimitOrder } from "@/lib/db/code-limit";
import { raiseOrderLimitAction } from "@/app/admin/orders/actions";

/**
 * Code-limit tab — the standalone "raise the OTP request limit" surface from
 * the spec, plus its audit history. Lets an operator find an order, see its
 * current/used limit, set a new one with a reason, and review every prior
 * change. No passwords, no account secrets — limit management only.
 */
export function CodeLimitTab({
  orders,
  history,
}: {
  orders: CodeLimitOrder[];
  history: CodeLimitChange[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CodeLimitOrder | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders.slice(0, 30);
    return orders
      .filter(
        (o) =>
          String(o.reference ?? "").includes(q) ||
          (o.productName ?? "").toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [orders, search]);

  function pick(o: CodeLimitOrder) {
    setSelected(o);
    setNewLimit(String(o.currentLimit));
    setReason("");
    setMsg(null);
  }

  function submit() {
    if (!selected) return;
    const value = Math.max(0, parseInt(newLimit || "0", 10));
    setMsg(null);
    startTransition(async () => {
      const res = await raiseOrderLimitAction({
        orderId: selected.id,
        newLimit: value,
        reason: reason || undefined,
      });
      if (res.ok) {
        setMsg({ kind: "ok", text: res.message ?? "تم التحديث." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Raise limit */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-10 rounded-xl bg-accent/10 text-accent grid place-items-center">
            <Gauge className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-fg">رفع حد الأكواد</h3>
            <p className="text-xs text-fg-muted">ابحث عن الطلب ثم حدّد الحد الجديد.</p>
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fg-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رقم الطلب أو اسم المنتج…"
            className="h-10 w-full ps-9 pe-3 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1.5 mb-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-fg-muted text-center py-4">لا طلبات مطابقة.</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pick(o)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-start transition-colors",
                  selected?.id === o.id
                    ? "border-accent bg-accent/10"
                    : "border-[hsl(var(--hairline))] hover:bg-surface-2",
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fg font-num" dir="ltr">#{o.reference ?? "—"}</p>
                  <p className="text-[11px] text-fg-muted truncate">{o.productName ?? "—"}</p>
                </div>
                <span className="text-[11px] font-num text-fg-muted shrink-0" dir="ltr">
                  {o.usage}/{o.currentLimit}
                </span>
              </button>
            ))
          )}
        </div>

        {selected && (
          <div className="border-t border-[hsl(var(--hairline))] pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-fg-muted">الطلب المحدد</span>
              <span className="font-num font-bold text-fg" dir="ltr">#{selected.reference}</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-fg-muted mb-1.5">الحد الجديد</label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                dir="ltr"
                className="h-10 w-full px-3 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-fg-muted mb-1.5">السبب (اختياري)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: طلب العميل"
                className="h-10 w-full px-3 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-fg text-bg text-sm font-bold hover:bg-[hsl(var(--surface-4))] disabled:opacity-50"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 text-accent rotate-180" />}
              حفظ الحد الجديد
            </button>
            {msg && (
              <p className={cn("text-xs font-semibold", msg.kind === "ok" ? "text-success" : "text-danger")}>
                {msg.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline))] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-10 rounded-xl bg-surface-2 text-fg-muted grid place-items-center">
            <History className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-fg">سجل التعديلات</h3>
            <p className="text-xs text-fg-muted">كل تغيير على حد الأكواد.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-fg-muted text-center py-8">لا تعديلات بعد.</p>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="rounded-xl bg-surface-2 border border-[hsl(var(--hairline))] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-fg font-num" dir="ltr">
                    #{h.orderReference ?? "—"}
                  </span>
                  <span className="text-xs font-num font-bold" dir="ltr">
                    <span className="text-fg-faint">{h.previousLimit}</span>
                    <span className="text-fg-muted mx-1">→</span>
                    <span className="text-accent">{h.newLimit}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-fg-muted">
                  <span>{h.changedByName ?? "—"}{h.reason ? ` · ${h.reason}` : ""}</span>
                  <span className="font-num shrink-0" dir="ltr">
                    {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
