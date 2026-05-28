"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Point = { month: string; orders: number; revenue: number };

const TREND: Point[] = [
  { month: "يناير", orders: 1240, revenue: 42150 },
  { month: "فبراير", orders: 1480, revenue: 51200 },
  { month: "مارس", orders: 1620, revenue: 58730 },
  { month: "أبريل", orders: 1390, revenue: 49400 },
  { month: "مايو", orders: 1980, revenue: 71200 },
  { month: "يونيو", orders: 2110, revenue: 78900 },
  { month: "يوليو", orders: 1860, revenue: 65300 },
  { month: "أغسطس", orders: 2240, revenue: 81000 },
  { month: "سبتمبر", orders: 2390, revenue: 86200 },
  { month: "أكتوبر", orders: 2680, revenue: 96400 },
  { month: "نوفمبر", orders: 2950, revenue: 105800 },
  { month: "ديسمبر", orders: 3210, revenue: 118200 },
];

const MAX = Math.max(...TREND.map((p) => p.orders));

/** Monthly orders trend — black bars with lime hover, top-of-bar pill labels. */
export function MonthlyTrend() {
  return (
    <article className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-display text-base font-bold tracking-tight text-fg">
            اتجاه الطلبات الشهري
          </h3>
          <p className="text-xs text-fg-muted mt-0.5">آخر 12 شهر</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-[hsl(var(--hairline-strong))] text-xs font-semibold text-fg hover:bg-surface-2 transition-colors"
        >
          2026
          <ChevronDown className="size-3.5" />
        </button>
      </header>

      <div className="relative">
        {/* Y-axis lines */}
        <div className="absolute inset-0 flex flex-col justify-between" style={{ height: 200 }}>
          {[0.9, 0.7, 0.5, 0.3, 0.1].map((t) => (
            <div key={t} className="border-t border-dashed border-[hsl(var(--hairline))]" />
          ))}
        </div>

        {/* Bars */}
        <ul
          className="relative grid grid-cols-12 gap-1.5 sm:gap-2"
          style={{ height: 200 }}
        >
          {TREND.map((p, i) => {
            const h = (p.orders / MAX) * 100;
            const peak = i === TREND.length - 1;
            return (
              <li
                key={p.month}
                className="group relative flex items-end justify-center"
              >
                <div
                  className={cn(
                    "w-full max-w-[28px] rounded-t-lg transition-colors",
                    peak ? "bg-accent" : "bg-fg group-hover:bg-accent",
                  )}
                  style={{ height: `${Math.max(h, 6)}%` }}
                />
                {peak && (
                  <span className="absolute -top-2 inline-flex items-center rounded-full bg-fg text-bg text-[10px] font-bold px-2 py-0.5 font-num">
                    {p.orders.toLocaleString("en-US")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* X-axis labels */}
        <ul className="grid grid-cols-12 gap-1.5 sm:gap-2 mt-3 text-[10px] sm:text-[11px] text-fg-muted">
          {TREND.map((p) => (
            <li key={p.month} className="text-center font-medium truncate">
              {p.month.slice(0, 3)}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
