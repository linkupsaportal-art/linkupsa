import {
  ShoppingBag, Users, Megaphone, Wallet, TrendingUp,
  CheckCircle2, XCircle, Receipt, type LucideIcon,
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
 * The full overview KPI grid. Eight tiles arranged in a responsive grid:
 *   - row 1 (4 wide): الطلبات · العملاء · الحملات · المحفظة
 *   - row 2 (4 wide): الإيرادات · متوسط الطلب · مكتملة · ملغية
 */
export function OverviewStatsGrid() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <MetricTile
        icon={ShoppingBag}
        label="إجمالي الطلبات"
        value="17,575"
        hint="آخر 30 يوم"
      />
      <MetricTile
        icon={Users}
        label="إجمالي العملاء"
        value="9,087"
        hint="عميل فريد"
      />
      <MetricTile
        icon={Megaphone}
        label="الحملات النشطة"
        value="0"
        hint="جاهز للإطلاق"
      />
      <MetricTile
        variant="accent"
        icon={Wallet}
        label="رصيد المحفظة"
        value="2.81"
        unit="ر.س"
        hint="متاح للسحب"
      />

      <MetricTile
        variant="dark"
        icon={TrendingUp}
        label="إجمالي الإيرادات"
        value="617,952.91"
        unit="ر.س"
        hint="منذ بداية النشاط"
      />
      <MetricTile
        icon={Receipt}
        label="متوسط قيمة الطلب"
        value="35.16"
        unit="ر.س"
        hint="آخر 30 يوم"
      />
      <MetricTile
        icon={CheckCircle2}
        label="الطلبات المكتملة"
        value="6,874"
        hint="بنجاح"
      />
      <MetricTile
        icon={XCircle}
        label="الطلبات الملغية"
        value="0"
        hint="هذا الشهر"
      />
    </section>
  );
}
