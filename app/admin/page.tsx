import Link from "next/link";
import { ShoppingBag, Database, Sparkles, Wallet } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { DashboardTabs } from "@/components/admin/dashboard-tabs";
import { StatCard } from "@/components/admin/stat-card";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { QuickLinks } from "@/components/admin/quick-links";
import { OverviewStatsGrid } from "@/components/admin/stats-grid";
import { MonthlyTrend } from "@/components/admin/monthly-trend";
import { StatusDistribution } from "@/components/admin/status-distribution";
import { RecentOrdersTable } from "@/components/admin/recent-orders-table";
import { RecentTransactions } from "@/components/admin/recent-transactions";
import { DomainsCard } from "@/components/admin/domains-card";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * Dashboard — original lime/black/cream design (chart · stat cards · quick links)
 * with the additional analytics blocks appended below.
 *
 * Layout:
 *   1. Header + tabs
 *   2. PRIMARY (kept from original):
 *      - col-8: 3 stat tiles + tubular chart
 *      - col-4: quick links rail
 *   3. SECONDARY analytics (new):
 *      - 8/4 split: monthly trend + status donut**************************************************************************************************************************************************ùùùùùùùù*****************************$*%%%%%%%%%%$**********************************************ù************************************************************************************************************************************************************* 
 *      - 8/4 split: recent orders table + (transactions stack + domains)
 *      - full-width: KPI grid (8 tiles)
 */
export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const name =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "عبدالله";

  return (
    <>
      <PageHeader
        eyebrow="نظرة عامة"
        title={`مرحباً، ${name} 👋`}
        description="ملخّص أداء متجرك خلال آخر 30 يوم. الأرقام تتحدث لحظياً مع كل طلب جديد."
        actions={
          <div className="inline-flex items-center gap-3 rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] px-4 py-3 card-soft">
            <div className="grid place-items-center size-9 rounded-xl pill-accent">
              <Wallet className="size-4" strokeWidth={2} />
            </div>
            <div className="text-start">
              <p className="text-[10px] uppercase tracking-widest font-bold text-fg-faint">
                رصيد المحفظة
              </p>
              <p className="text-base font-extrabold tabular-nums text-fg">
                2.81 <span className="text-xs text-fg-muted">ر.س</span>
              </p>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-5">
        {/* Main column — original design preserved */}
        <div className="xl:col-span-8 grid gap-4 lg:gap-5">
          <DashboardTabs />

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            <StatCard
              label="الطلبات"
              value={780}
              capacity="1 000"
              percent={82}
              icon={ShoppingBag}
              filledBlocks={6}
            />
            <StatCard
              variant="accent"
              label="نقل البيانات"
              value={163}
              capacity="512 ميغا"
              percent={68}
              icon={Database}
              filledBlocks={5}
            />
            <UpgradeCard />
          </section>

          <DashboardChart />
        </div>

        {/* Right rail — original quick-links preserved */}
        <div className="xl:col-span-4">
          <QuickLinks />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          NEW analytics blocks — appended below, do not replace the above
          ──────────────────────────────────────────────────────────────── */}
      <div className="mt-6 lg:mt-8 space-y-4 lg:space-y-5">
        <OverviewStatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-8">
            <MonthlyTrend />
          </div>
          <div className="lg:col-span-4">
            <StatusDistribution />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-8">
            <RecentOrdersTable />
          </div>
          <div className="lg:col-span-4 grid gap-4 lg:gap-5">
            <RecentTransactions />
            <DomainsCard />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * "Upgrade" CTA tile — matches the dark card with gradient sphere from the
 * original reference image.
 */
function UpgradeCard() {
  return (
    <article className="relative overflow-hidden rounded-3xl surface-dark p-5 sm:p-6 flex flex-col justify-between min-h-[180px]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -end-10 size-40 rounded-full opacity-50 blur-2xl"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.55), transparent 70%)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -start-12 size-44 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(220 70% 50% / 0.35), transparent 70%)" }}
      />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase">
          <Sparkles className="size-3 text-accent" />
          جديد
        </span>
        <h3 className="mt-3 text-white font-display text-xl font-bold leading-tight">
          ارتقِ بمتجرك
          <br />
          إلى المستوى التالي
        </h3>
      </div>

      <Link
        href="/admin/settings"
        className="relative mt-4 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-bg text-fg text-sm font-bold hover:bg-accent hover:text-accent-fg active:scale-[0.98] transition-all"
      >
        ترقية الخطة ▶
      </Link>
    </article>
  );
}
