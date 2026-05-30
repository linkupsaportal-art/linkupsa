"use client";

import { Clock, Activity } from "lucide-react";

/**
 * Slim top-of-card strip that shows the customer how much active session
 * time they have left before the page auto-locks. Goes red < 30s and
 * orange < 60s as a soft warning.
 */
export function SessionTimer({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number;
  totalSeconds: number;
}) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  const tone =
    secondsLeft <= 30
      ? "danger"
      : secondsLeft <= 60
        ? "warn"
        : "ok";

  const palette = {
    ok: { dot: "bg-emerald-500", bar: "bg-emerald-500/70", text: "text-emerald-700", label: "الجلسة نشطة" },
    warn: { dot: "bg-amber-500", bar: "bg-amber-500", text: "text-amber-700", label: "الجلسة تنتهي قريباً" },
    danger: { dot: "bg-red-500", bar: "bg-red-500", text: "text-red-700", label: "ستُقفل الجلسة الآن" },
  } as const;
  const c = palette[tone];

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;

  return (
    <div className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] p-3 select-none">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className={`absolute inset-0 rounded-full ${c.dot} animate-ping opacity-70`} />
            <span className={`relative inline-flex size-2 rounded-full ${c.dot}`} />
          </span>
          <span className={`text-[11px] font-extrabold tracking-wider uppercase ${c.text}`}>
            {c.label}
          </span>
          <Activity className="size-3 text-fg-faint" />
        </div>
        <div className="flex items-center gap-1 text-fg" dir="ltr">
          <Clock className="size-3.5 text-fg-muted" />
          <span className="font-num font-extrabold text-sm">
            {m}:{String(s).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div className="h-1 rounded-full bg-surface-2 overflow-hidden border border-[hsl(var(--hairline))]">
        <div
          className={`h-full transition-all duration-1000 ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
