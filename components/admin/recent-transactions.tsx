import Link from "next/link";
import { ShieldCheck, ShieldAlert, ArrowUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type SecurityEvent = {
  id: string;
  label: string;
  date: string;
  detail: string;
  kind: "success" | "blocked";
};

const DEMO: SecurityEvent[] = [
  { id: "t1", label: "#9660479 · محمد", date: "2026-05-30", detail: "تم تسليم رمز التحقق", kind: "success" },
  { id: "t2", label: "#6043550 · محمد", date: "2026-05-30", detail: "تم تسليم رمز التحقق", kind: "success" },
  { id: "t3", label: "#1989505 · زائر", date: "2026-05-29", detail: "رقم جوال غير مطابق", kind: "blocked" },
  { id: "t4", label: "#4484853 · محمد", date: "2026-05-29", detail: "طلب متكرر سريع", kind: "blocked" },
  { id: "t5", label: "#3383241 · عميل", date: "2026-05-29", detail: "تم تسليم رمز التحقق", kind: "success" },
];

/** Recent verification / security activity feed (OTP requests + blocks). */
export function RecentTransactions({ events }: { events?: SecurityEvent[] }) {
  const rows = events && events.length ? events : DEMO;
  return (
    <article className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft">
      <header className="flex items-center justify-between p-5 border-b border-[hsl(var(--hairline))]">
        <div>
          <h3 className="font-display text-base font-bold tracking-tight text-fg">
            نشاط التحقق
          </h3>
          <p className="text-xs text-fg-muted mt-0.5">آخر عمليات استلام الرموز</p>
        </div>
        <Link
          href="/admin/otp-logs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:text-accent-fg hover:bg-accent rounded-full px-3 py-1.5 transition-colors"
        >
          عرض الكل
          <ArrowUpLeft className="size-3.5" />
        </Link>
      </header>

      <ul className="divide-y divide-[hsl(var(--hairline))]">
        {rows.map((ev) => (
          <li key={ev.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
            <span
              className={cn(
                "grid place-items-center size-9 rounded-xl shrink-0",
                ev.kind === "success"
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger",
              )}
            >
              {ev.kind === "success" ? (
                <ShieldCheck className="size-4" />
              ) : (
                <ShieldAlert className="size-4" />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg truncate">{ev.detail}</p>
              <p className="text-[11px] text-fg-faint font-num mt-0.5" dir="ltr">
                {ev.label} · {ev.date}
              </p>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
