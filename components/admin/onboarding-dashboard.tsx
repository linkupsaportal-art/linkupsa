import {
  PackageCheck,
  ShieldCheck,
  Boxes,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { LogoGlyph } from "@/components/brand/logo";
import { signOutAction } from "@/app/(auth)/actions";

/**
 * Onboarding dashboard — shown to a signed-in user who has not yet linked a
 * store. It looks and feels like the real dashboard (same gradient canvas,
 * lime/black/cream theme, stat tiles) so the user feels they're "in", but it
 * exposes ZERO live data and instead drives the one action that unlocks
 * everything: connecting their store.
 *
 * Why this lives in the layout (not a page): the layout intercepts
 * membership-less users *before* any data page renders, so the global
 * analytics never leak to someone who doesn't own a store yet.
 *
 * The connect CTA points at the OAuth kickoff route. Once the store is
 * linked the callback grants an owner membership, `getCurrentRole()` starts
 * returning a role, and the user lands on the real dashboard automatically.
 */
export function OnboardingDashboard({
  name,
  email,
}: {
  name?: string;
  email?: string;
}) {
  return (
    <div
      className="theme-admin min-h-svh w-full overflow-y-auto"
      style={{
        background:
          "linear-gradient(180deg, hsl(170 8% 92%) 0%, hsl(186 11% 84%) 50%, hsl(190 12% 78%) 100%)",
      }}
    >
      {/* Slim top bar — brand + sign out, mirrors the real shell topbar */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[hsl(220_18%_14%/0.06)] bg-bg/70 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <LogoGlyph className="size-8" />
          <span className="font-display text-base font-extrabold tracking-tight text-[hsl(222_30%_6%)]">
            LinkUp
          </span>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center h-9 px-4 rounded-full text-xs font-bold text-fg-muted hover:text-fg hover:bg-fg/5 transition-colors"
          >
            تسجيل الخروج
          </button>
        </form>
      </header>

      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
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
              حسابك جاهز. لتفعيل اللوحة وعرض الطلبات والتسليم التلقائي، يتبقى أن
              تربط متجرك بتطبيق LinkUp. تستغرق العملية أقل من دقيقة.
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
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          <GhostStat icon={PackageCheck} label="الطلبات المُسلّمة" hint="بانتظار الربط" />
          <GhostStat icon={Boxes} label="الحسابات المتاحة" hint="بانتظار الربط" />
          <GhostStat icon={ShieldCheck} label="نسبة التحقق" hint="بانتظار الربط" />
        </section>

        {/* Steps */}
        <section className="mt-6 rounded-3xl bg-bg border border-[hsl(var(--hairline-strong))] p-6 sm:p-8 card-soft">
          <h2 className="font-display text-lg font-extrabold text-fg mb-5">
            كيف تبدأ؟
          </h2>
          <ol className="space-y-4">
            <Step
              n={1}
              title="اربط متجرك"
              body="اضغط «ربط المتجر الآن» وأضِف تطبيق LinkUp إلى متجرك ووافق على الصلاحيات."
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

        <p className="mt-6 text-center text-xs text-fg-faint">
          حسابك: <span dir="ltr">{email}</span>
        </p>
      </div>
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
