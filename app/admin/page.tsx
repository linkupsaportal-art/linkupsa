import Link from "next/link";
import { ShoppingBag, ShieldCheck, Sparkles, PackageCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { DashboardTabs } from "@/components/admin/dashboard-tabs";
import { StatCard } from "@/components/admin/stat-card";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { QuickLinks } from "@/components/admin/quick-links";
import { OverviewStatsGrid } from "@/components/admin/stats-grid";
import { MonthlyTrend } from "@/components/admin/monthly-trend";
import { StatusDistribution, type Slice } from "@/components/admin/status-distribution";
import { RecentOrdersTable, type Order } from "@/components/admin/recent-orders-table";
import { RecentTransactions } from "@/components/admin/recent-transactions";
import { DomainsCard } from "@/components/admin/domains-card";
import { getCurrentUser, getCurrentRole } from "@/lib/supabase/server";
import { getDashboardAnalytics } from "@/lib/db/analytics";
import { FadeInStagger } from "@/components/admin/fade-in";
import { OnboardingDashboard } from "@/components/admin/onboarding-dashboard";

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
  // Gate the analytics behind membership. A signed-in user with no store
  // membership (fresh signup / pending invitee) sees the onboarding panel
  // instead — so the global analytics loader never runs for them and no
  // other store's data is ever fetched.
  const role = await getCurrentRole();
  const user = await getCurrentUser();
  if (!role) {
    const name =
      (user?.user_metadata?.name as string | undefined) ??
      (user?.user_metadata?.full_name as string | undefined) ??
      user?.email?.split("@")[0];
    return <OnboardingDashboard name={name} email={user?.email ?? undefined} />;
  }

  const analytics = await getDashboardAnalytics();
  const name =
    (user?.user_metadata?.name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "عبدالله";

  // Order-status donut driven by live fulfillment counts.
  const statusSlices: Slice[] = [
    { label: "مكتمل", value: analytics.fulfilled, cls: "stroke-fg", dotCls: "bg-fg" },
    { label: "بانتظار التسليم", value: analytics.pending, cls: "stroke-warn", dotCls: "bg-warn" },
    { label: "فشل", value: analytics.failed, cls: "stroke-danger", dotCls: "bg-danger" },
    { label: "ملغى", value: analytics.cancelled, cls: "stroke-accent", dotCls: "bg-accent" },
  ];

  // Recent orders table rows.
  const recentOrders: Order[] = analytics.recentOrders.map((o) => ({
    id: o.reference,
    date: o.date,
    customer: o.customer,
    amount: o.product, // table renders this slot as plain text; show product name
    status: o.status,
  }));

  return (
    <>
      <PageHeader
        eyebrow="نظرة عامة"
        title={`مرحباً، ${name} 👋`}
        description="ملخّص أداء متجرك لحظياً — الطلبات، التسليم، المخزون والتحقق."
        actions={
          <div className="inline-flex items-center gap-3 rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] px-4 py-3 card-soft">
            <div className="grid place-items-center size-9 rounded-xl pill-accent">
              <PackageCheck className="size-4" strokeWidth={2} />
            </div>
            <div className="text-start">
              <p className="text-[10px] uppercase tracking-widest font-bold text-fg-faint">
                نسبة التسليم
              </p>
              <p className="text-base font-extrabold tabular-nums text-fg">
                {analytics.fulfillRate}
                <span className="text-xs text-fg-muted"> %</span>
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
              label="الطلبات المُسلّمة"
              value={analytics.fulfilled}
              capacity={String(analytics.totalOrders)}
              percent={analytics.fulfillRate}
              icon={ShoppingBag}
              filledBlocks={Math.round((analytics.fulfillRate / 100) * 8)}
            />
            <StatCard
              variant="accent"
              label="الحسابات المتاحة"
              value={analytics.slotsAvailable}
              capacity={`${analytics.accountsAvailable} حساب`}
              percent={analytics.otpSuccessRate}
              icon={ShieldCheck}
              filledBlocks={Math.min(8, Math.max(1, analytics.accountsAvailable))}
            />
            <UpgradeCard />
          </section>

          <DashboardChart days={analytics.daily} />
        </div>

        {/* Right rail — original quick-links preserved */}
        <div className="xl:col-span-4">
          <QuickLinks />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────
          Analytics blocks — same layout, now wired to live data + a
          staggered GSAP fade-in so cards cascade instead of snapping in.
          ──────────────────────────────────────────────────────────────── */}
      <FadeInStagger className="mt-6 lg:mt-8 space-y-4 lg:space-y-5">
        <OverviewStatsGrid data={analytics} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-8">
            <MonthlyTrend points={analytics.monthly} />
          </div>
          <div className="lg:col-span-4">
            <StatusDistribution slices={statusSlices} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-8">
            <RecentOrdersTable orders={recentOrders} />
          </div>
          <div className="lg:col-span-4 grid gap-4 lg:gap-5">
            <RecentTransactions events={analytics.recentSecurity} />
            <DomainsCard />
          </div>
        </div>
      </FadeInStagger>
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
