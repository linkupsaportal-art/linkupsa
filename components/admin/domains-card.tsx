import Link from "next/link";
import { Globe, Plus, Check } from "lucide-react";

type Domain = {
  slug: string;
  status: "active" | "pending";
};

const DOMAINS: Domain[] = [
  { slug: "spektrum", status: "active" },
  { slug: "other", status: "active" },
];

/** Registered subdomains — quick status overview + add button. */
export function DomainsCard() {
  return (
    <article className="rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft p-5">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center size-8 rounded-xl bg-surface-2 text-fg">
            <Globe className="size-4" strokeWidth={1.7} />
          </span>
          <h3 className="font-display text-sm font-bold tracking-tight text-fg">
            النطاقات المسجلة
          </h3>
        </div>
        <Link
          href="/admin/integrations"
          aria-label="إضافة نطاق"
          className="grid place-items-center size-8 rounded-full pill-accent hover:scale-[1.05] active:scale-95 transition-transform"
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </Link>
      </header>

      <ul className="space-y-2">
        {DOMAINS.map((d) => (
          <li
            key={d.slug}
            className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5"
          >
            <span className="font-mono text-xs font-semibold text-fg" dir="ltr">
              {d.slug}.linkup.sa
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-success">
              <Check className="size-3" strokeWidth={3} />
              {d.status === "active" ? "نشط" : "قيد المعالجة"}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
