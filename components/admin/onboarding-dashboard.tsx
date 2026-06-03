import {
  PackageCheck,
  ShieldCheck,
  Boxes,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/**
 * Onboarding content panel — rendered inside the real admin shell (sidebar +
 * topbar stay mounted, every section visible but locked). It looks and feels
 * like the dashboard but exposes ZERO live data; instead it drives the one
 * action that unlocks everything: connecting the store.
 *
 * The layout swaps the page `{children}` for this panel whenever the signed-in
 * user has no store membership, so the global analytics/orders loaders never
 * run for them — no cross-store data leak.
 *
 * The connect CTA points at the OAuth kickoff route. Once the store is linked
 * the callback grants an owner membership, `getCurrentRole()` starts returning
 * a role, and the shell unlocks automatically.
 */
export function OnboardingDashboard({
  name,
  email,
}: {
  name?: string;
  email?: string;
}) {
  return (
    <div className="py-6 lg:py-8 space-y-5 lg:space-y-6">
      {/* Hero — greeting + connect CTA */}
      <section className="relative overflow-hidden rounded-3xl surface-dark p-6 sm:p-8 lg:p-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -end-10 size-56 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent) / 0.55), transparent 70%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -start-16 size-64 rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(220 70% 50% / 0.4), transparent 70%)",
          }}
        />

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white px-3 py-1 text-[11px] font-semibold tracking-widest uppercase">
            <Sparkles className="size-3.5 text-accent" />
            خطوة أخيرة
          </span>
          <h1 className="mt-4 text-white font-display text-2xl sm:text-3xl font-extrabold leading-tight">
            مرحباً {name ?? ""} 👋
            <br />
            لنُجهّز لوحة تحكم متجرك
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
            حسابك جاهز وكل الأقسام موجودة. لفتح اللوحة وعرض الطلبات والتسليم
            التلقائي، يتبقى أن تربط متجرك بتطبيق Portalio SA. تستغرق العملية أقل من
            دقيقة.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="/api/salla/oauth/start"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-accent text-accent-fg text-sm font-extrabold hover:brightness-105 active:scale-[0.98] transition-all shadow-[0_12px_30px_-12px_hsl(var(--accent)/0.7)]"
            >
              ربط المتجر الآن
              <ArrowLeft className="size-4" strokeWidth={2.5} />
            </a>
            <a
              href="/admin"
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/15 transition-colors"
            >
              تحديث الحالة
            </a>
          </div>
        </div>
      </section>

      {/* Ghost stat tiles — zeroed, give the dashboard its shape */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <GhostStat icon={PackageCheck} label="الطلبات المُسلّمة" hint="بانتظار الربط" />
        <GhostStat icon={Boxes} label="الحسابات المتاحة" hint="بانتظار الربط" />
        <GhostStat icon={ShieldCheck} label="نسبة التحقق" hint="بانتظار الربط" />
      </section>

      {/* Steps */}
      <section className="rounded-3xl bg-bg border border-[hsl(var(--hairline-strong))] p-6 sm:p-8 card-soft">
        <h2 className="font-display text-lg font-extrabold text-fg mb-5">
          كيف تبدأ؟
        </h2>
        <ol className="space-y-4">
          <Step
            n={1}
            title="اربط متجرك"
            body="اضغط «ربط المتجر الآن» وأضِف تطبيق Portalio SA إلى متجرك ووافق على الصلاحيات."
            active
          />
          <Step
            n={2}
            title="استورد منتجاتك"
            body="بعد الربط، تظهر منتجاتك تلقائياً وتُربط بقواعد التسليم."
          />
          <Step
            n={3}
            title="ابدأ التسليم التلقائي"
            body="كل طلب جديد يُسلّم فوراً للعميل عبر صفحة الاستلام والتحقق."
          />
        </ol>
      </section>

      <p className="text-center text-xs text-fg-faint">
        حسابك: <span dir="ltr">{email}</span>
      </p>
    </div>
  );
}

function GhostStat({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof PackageCheck;
  label: string;
  hint: string;
}) {
  return (
    <article className="rounded-3xl bg-bg/80 border border-[hsl(var(--hairline))] p-5 card-soft">
      <div className="flex items-center justify-between">
        <div className="grid place-items-center size-10 rounded-xl bg-[hsl(60_14%_94%)] text-[hsl(222_30%_6%)]">
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-fg-faint">
          {hint}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tabular-nums text-fg/30">—</p>
      <p className="mt-1 text-sm font-semibold text-fg-muted">{label}</p>
    </article>
  );
}

function Step({
  n,
  title,
  body,
  active = false,
}: {
  n: number;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <span
        className={
          active
            ? "grid place-items-center size-8 rounded-full bg-fg text-bg text-sm font-extrabold shrink-0"
            : "grid place-items-center size-8 rounded-full bg-[hsl(60_14%_94%)] text-fg-muted text-sm font-extrabold shrink-0"
        }
      >
        {active ? <CheckCircle2 className="size-4 text-accent" /> : n}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-fg">{title}</p>
        <p className="text-sm text-fg-muted leading-relaxed mt-0.5">{body}</p>
      </div>
    </li>
  );
}
