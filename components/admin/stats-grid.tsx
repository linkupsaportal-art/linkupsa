import {
  ShoppingBag, Users, Boxes, ShieldCheck, TrendingUp,
  CheckCircle2, Clock, Webhook, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compact KPI tile used on the overview. Lighter than `<StatCard>` — no
 * block-row visualisation, just label + big number + helper meta. Optional
 * "accent" variant turns the tile lime.
 */
export function MetricTile({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon: LucideIcon;
  variant?: "default" | "accent" | "dark";
}) {
  return (
    <article
      className={cn(
        "rounded-2xl p-4 sm:p-5 transition-all card-soft",
        variant === "accent" && "pill-accent border-0",
        variant === "dark" && "surface-dark border-0 text-white",
        variant === "default" && "bg-surface border border-[hsl(var(--hairline-strong))]",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid place-items-center size-8 rounded-xl",
            variant === "accent" && "bg-fg/10 text-fg",
            variant === "dark" && "bg-white/10 text-accent",
            variant === "default" && "bg-surface-2 text-fg",
          )}
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            variant === "dark" ? "text-white/80" : "text-fg-muted",
          )}
        >
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-num font-extrabold tracking-tighter text-2xl sm:text-3xl",
          variant === "dark" ? "text-white" : "text-fg",
        )}
      >
        {value}
        {unit && (
          <span className={cn("ms-1 text-xs font-semibold", variant === "dark" ? "text-white/60" : "text-fg-muted")}>
            {unit}
          </span>
        )}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-[11px]",
            variant === "dark" ? "text-white/55" : "text-fg-faint",
          )}
        >
          {hint}
        </p>
      )}
    </article>
  );
}

/**
 * The full overview KPI grid. Eight tiles arranged in a responsive grid,
 * driven by live data from getDashboardAnalytics(). Falls back to zeros so
 * the dashboard still renders if the query is unavailable.
 *
 *   - row 1: إجمالي الطلبات · العملاء · المنتجات النشطة · الحسابات المتاحة
 *   - row 2: نسبة التسليم · مكتملة · بانتظار التسليم · أحداث الربط
 */
export function OverviewStatsGrid({ data }: { data?: OverviewStats }) {
  const d = data ?? EMPTY_STATS;
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <MetricTile
        icon={ShoppingBag}
        label="إجمالي الطلبات"
        value={d.totalOrders.toLocaleString("en-US")}
        hint="كل الطلبات المستلمة"
      />
      <MetricTile
        icon={Users}
        label="العملاء"
        value={d.uniqueCustomers.toLocaleString("en-US")}
        hint="عميل فريد"
      />
      <MetricTile
        icon={Boxes}
        label="المنتجات النشطة"
        value={`${d.productsActive}`}
        unit={`/ ${d.productsTotal}`}
        hint="منتج معروض"
      />
      <MetricTile
        variant="accent"
        icon={ShieldCheck}
        label="الحسابات المتاحة"
        value={d.slotsAvailable.toLocaleString("en-US")}
        unit="فتحة"
        hint={`${d.accountsAvailable} حساب جاهز`}
      />

      <MetricTile
        variant="dark"
        icon={TrendingUp}
        label="نسبة التسليم الناجح"
        value={`${d.fulfillRate}`}
        unit="%"
        hint="من إجمالي الطلبات"
      />
      <MetricTile
        icon={CheckCircle2}
        label="الطلبات المكتملة"
        value={d.fulfilled.toLocaleString("en-US")}
        hint="سُلّمت بنجاح"
      />
      <MetricTile
        icon={Clock}
        label="بانتظار التسليم"
        value={d.pending.toLocaleString("en-US")}
        hint="تحتاج متابعة"
      />
      <MetricTile
        icon={Webhook}
        label="أحداث الربط"
        value={d.webhooksTotal.toLocaleString("en-US")}
        hint={d.webhooksFailed > 0 ? `${d.webhooksFailed} فشل` : "كلها سليمة"}
      />
    </section>
  );
}

/** Subset of DashboardAnalytics consumed by the KPI grid. */
export type OverviewStats = {
  totalOrders: number;
  uniqueCustomers: number;
  productsActive: number;
  productsTotal: number;
  slotsAvailable: number;
  accountsAvailable: number;
  fulfillRate: number;
  fulfilled: number;
  pending: number;
  webhooksTotal: number;
  webhooksFailed: number;
};

const EMPTY_STATS: OverviewStats = {
  totalOrders: 0,
  uniqueCustomers: 0,
  productsActive: 0,
  productsTotal: 0,
  slotsAvailable: 0,
  accountsAvailable: 0,
  fulfillRate: 0,
  fulfilled: 0,
  pending: 0,
  webhooksTotal: 0,
  webhooksFailed: 0,
};
