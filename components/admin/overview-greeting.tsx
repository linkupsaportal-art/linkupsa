/**
 * Overview greeting block — big editorial header with the user's name and a
 * quick wallet balance chip. Used on the admin dashboard root.
 */
export function OverviewGreeting({
  name = "عبدالله",
  walletBalance,
}: {
  name?: string;
  walletBalance?: string;
}) {
  return (
    <header className="pt-6 pb-2 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase font-bold tracking-[0.18em] text-fg-faint mb-2">
          إدارة لوحة التحكم
        </p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[40px] leading-[1.05] font-extrabold tracking-tight text-fg">
          مرحباً، <span className="text-fg">{name}</span> 👋
        </h1>
        <p className="mt-2 text-sm text-fg-muted leading-relaxed max-w-2xl">
          إليك نظرة عامة على متجرك. الأرقام تتحدّث لحظياً مع كل طلب جديد.
        </p>
      </div>

      {walletBalance && (
        <div className="inline-flex items-center gap-3 rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] px-4 py-3 card-soft">
          <div className="grid place-items-center size-9 rounded-xl pill-accent">
            ﷼
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-fg-faint">
              رصيد المحفظة
            </p>
            <p className="text-base font-extrabold tabular-nums text-fg">
              {walletBalance} <span className="text-xs text-fg-muted">ر.س</span>
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
