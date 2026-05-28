import { cn } from "@/lib/utils";

type Slice = { label: string; value: number; cls: string; dotCls: string };

const SLICES: Slice[] = [
  { label: "مكتمل", value: 6874, cls: "stroke-fg", dotCls: "bg-fg" },
  { label: "قيد التنفيذ", value: 102, cls: "stroke-warn", dotCls: "bg-warn" },
  { label: "ملغى", value: 0, cls: "stroke-danger", dotCls: "bg-danger" },
  { label: "أخرى", value: 10599, cls: "stroke-accent", dotCls: "bg-accent" },
];

const TOTAL = SLICES.reduce((a, s) => a + s.value, 0);

/** Donut chart of order statuses — pure SVG, no chart library. */
export function StatusDistribution() {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  return (
    <article className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft p-5 sm:p-6">
      <header className="mb-4">
        <h3 className="font-display text-base font-bold tracking-tight text-fg">
          توزيع حالات الطلبات
        </h3>
        <p className="text-xs text-fg-muted mt-0.5">منذ بداية النشاط</p>
      </header>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width={150} height={150} viewBox="0 0 150 150" className="-rotate-90">
            <circle
              cx={75}
              cy={75}
              r={radius}
              fill="none"
              strokeWidth={20}
              className="stroke-[hsl(var(--surface-2))]"
            />
            {SLICES.map((slice, i) => {
              if (slice.value === 0) return null;
              const len = (slice.value / TOTAL) * circumference;
              const dasharray = `${len} ${circumference - len}`;
              const node = (
                <circle
                  key={i}
                  cx={75}
                  cy={75}
                  r={radius}
                  fill="none"
                  strokeWidth={20}
                  strokeDasharray={dasharray}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  className={cn(slice.cls, "transition-all")}
                />
              );
              offset += len;
              return node;
            })}
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <p className="font-num text-2xl font-extrabold text-fg leading-none">
              {TOTAL.toLocaleString("en-US")}
            </p>
            <p className="text-[10px] text-fg-muted mt-1">طلب</p>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex-1 min-w-0 space-y-2">
          {SLICES.map((slice) => {
            const pct = TOTAL ? Math.round((slice.value / TOTAL) * 100) : 0;
            return (
              <li key={slice.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={cn("size-2.5 rounded-full shrink-0", slice.dotCls)} />
                  <span className="text-fg-muted truncate">{slice.label}</span>
                </span>
                <span className="font-num font-bold text-fg shrink-0">
                  {slice.value.toLocaleString("en-US")}{" "}
                  <span className="text-fg-faint font-num font-medium">({pct}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
