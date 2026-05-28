"use client";

import { BarChart3, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Statistics chart — tubular bars matching the reference image.
 *
 * Each day is a "tube" (rounded black pill) with a lime fill rising from the
 * bottom. Empty/future days render as a dashed outline instead.
 * Pure CSS, no chart library.
 */

type Day = {
  date: string;
  /** 0–1 — operations bar height */
  ops: number;
  /** 0–1 — data transfer (lime) bar height */
  data: number;
  /** Render as empty (dashed) instead of filled. */
  empty?: boolean;
  /** Optional badge floating next to the bar. */
  badge?: string;
};

const DEMO: Day[] = [
  { date: "27 يون", ops: 0.62, data: 0.48 },
  { date: "28 يون", ops: 0.32, data: 0.42 },
  { date: "29 يون", ops: 0.55, data: 0.42 },
  { date: "30 يون", ops: 0, data: 0, empty: true },
  { date: "1 يول", ops: 0.78, data: 0.54, badge: "87%" },
  { date: "2 يول", ops: 0, data: 0, empty: true },
  { date: "3 يول", ops: 0.42, data: 0.46, badge: "32%" },
  { date: "4 يول", ops: 0.40, data: 0.44 },
];

export function DashboardChart() {
  const trackH = 220; // px

  return (
    <section className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center size-8 rounded-xl bg-fg text-bg">
            <BarChart3 className="size-4" strokeWidth={2} />
          </span>
          <h3 className="font-display text-base font-bold">إحصائيات الطلبات</h3>
          <Legend dotClass="bg-fg" label="الطلبات" />
          <Legend dotClass="bg-accent" label="نقل البيانات" />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-[hsl(var(--hairline-strong))] text-xs font-semibold text-fg hover:bg-surface-2 transition-colors"
        >
          2025
          <ChevronDown className="size-3.5" />
        </button>
      </header>

      <div className="relative">
        {/* Y-axis grid */}
        <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-fg-faint tabular-nums" style={{ height: trackH }}>
          {[0.9, 0.7, 0.5, 0.3, 0.1].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className="w-6 text-end">{t.toFixed(1)}</span>
              <span className="flex-1 border-t border-dashed border-[hsl(var(--hairline))]" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <ul className="relative grid grid-cols-8 gap-3 ps-10 pe-2" style={{ height: trackH }}>
          {DEMO.map((day, i) => (
            <li key={i} className="relative flex items-end justify-center">
              {/* Tube — operations (black pill) */}
              <div
                className={cn(
                  "bar-tube",
                  day.empty && "empty",
                )}
                style={{ height: day.empty ? "60%" : `${Math.max(0.18, day.ops) * 100}%` }}
              >
                {!day.empty && (
                  <>
                    <span className="dot-top" />
                    <span className="dot-bot" />
                    {/* Lime fill = data transfer */}
                    <span
                      className="fill"
                      style={{ height: `${Math.max(0.1, day.data) * 100}%` }}
                    />
                  </>
                )}
              </div>

              {day.badge && !day.empty && (
                <span className="absolute -top-1 end-0 inline-flex items-center rounded-full bg-fg text-bg text-[10px] font-bold px-2 py-0.5 tabular-nums">
                  {day.badge}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* X-axis labels */}
        <ul className="grid grid-cols-8 gap-3 ps-10 pe-2 mt-3 text-[11px] text-fg-muted tabular-nums">
          {DEMO.map((day, i) => (
            <li key={i} className="text-center font-medium">{day.date}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="ms-3 inline-flex items-center gap-1.5 text-xs text-fg-muted">
      <span className={cn("size-2.5 rounded-full", dotClass)} />
      {label}
    </span>
  );
}
