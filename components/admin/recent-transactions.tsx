import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ArrowUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Tx = {
  id: string;
  description: string;
  date: string;
  /** "+298.73" or "-298.73" — sign drives the visual */
  amount: string;
  type: "in" | "out";
};

const TX: Tx[] = [
  { id: "t1", description: "تجديد اشتراك المؤسسي (#95)", date: "2026-05-05", amount: "-298.73", type: "out" },
  { id: "t2", description: "شحن محفظة عبر برق", date: "2026-05-05", amount: "+298.73", type: "in" },
  { id: "t3", description: "تجديد اشتراك المؤسسي (#95)", date: "2026-04-07", amount: "-298.73", type: "out" },
  { id: "t4", description: "شحن محفظة عبر برق", date: "2026-04-07", amount: "+298.73", type: "in" },
  { id: "t5", description: "تجديد اشتراك المؤسسي (#95)", date: "2026-03-10", amount: "-298.73", type: "out" },
];

/** Recent wallet transactions feed. */
export function RecentTransactions() {
  return (
    <article className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft">
      <header className="flex items-center justify-between p-5 border-b border-[hsl(var(--hairline))]">
        <div>
          <h3 className="font-display text-base font-bold tracking-tight text-fg">
            أحدث المعاملات
          </h3>
          <p className="text-xs text-fg-muted mt-0.5">حركة المحفظة</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-fg hover:text-accent-fg hover:bg-accent rounded-full px-3 py-1.5 transition-colors"
        >
          عرض الكل
          <ArrowUpLeft className="size-3.5" />
        </Link>
      </header>

      <ul className="divide-y divide-[hsl(var(--hairline))]">
        {TX.map((tx) => (
          <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-2 transition-colors">
            <span
              className={cn(
                "grid place-items-center size-9 rounded-xl shrink-0",
                tx.type === "in"
                  ? "bg-success/10 text-success"
                  : "bg-fg/5 text-fg-muted",
              )}
            >
              {tx.type === "in" ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg truncate">{tx.description}</p>
              <p className="text-[11px] text-fg-faint font-num mt-0.5" dir="ltr">
                {tx.date}
              </p>
            </span>
            <span
              className={cn(
                "shrink-0 font-num font-extrabold text-sm",
                tx.type === "in" ? "text-success" : "text-fg",
              )}
              dir="ltr"
            >
              {tx.amount} <span className="text-[10px] text-fg-muted font-semibold">ر.س</span>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
