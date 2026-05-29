"use client";

import { useState, useTransition } from "react";
import { lookupOrderAction } from "./actions";
import { OrderDetails } from "./order-details";
import type { PickupResult } from "./types";

export function PickupForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PickupResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!orderNumber.trim()) { setError("رقم الطلب مطلوب"); return; }
    if (!/^\d{4}$/.test(lastFour)) { setError("أدخل آخر 4 أرقام من جوالك"); return; }

    startTransition(async () => {
      const res = await lookupOrderAction(orderNumber.trim(), lastFour);
      if ("error" in res) {
        setError(res.error);
      } else {
        setResult(res);
      }
    });
  }

  if (result) {
    return <OrderDetails result={result} onReset={() => { setResult(null); setOrderNumber(""); setLastFour(""); }} />;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] p-6 space-y-4 shadow-card">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="order-number" className="block text-sm font-semibold text-fg">
          رقم الطلب
        </label>
        <input
          id="order-number"
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="263047555"
          className="w-full h-12 px-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-base text-fg placeholder:text-fg-faint font-num text-start focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="last-four" className="block text-sm font-semibold text-fg">
          آخر 4 أرقام من الجوال
        </label>
        <input
          id="last-four"
          type="text"
          inputMode="numeric"
          dir="ltr"
          maxLength={4}
          value={lastFour}
          onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
          placeholder="0000"
          className="w-full h-12 px-4 rounded-xl bg-surface-2 border border-[hsl(var(--hairline-strong))] text-base text-fg placeholder:text-fg-faint font-num tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-xl bg-accent text-accent-fg text-base font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.6)]"
      >
        {isPending ? "جاري التحقق..." : "استلام الطلب"}
      </button>

      <p className="text-center text-xs text-fg-muted leading-relaxed">
        إذا واجهت أي مشكلة في الاستلام، تواصل مع المتجر مباشرة.
      </p>
    </form>
  );
}
