import { PickupForm } from "./pickup-form";

export const metadata = {
  title: "استلام الطلب",
  description: "أدخل رقم الطلب وآخر 4 أرقام من جوالك للاستلام",
};

export default function PickupPage() {
  return (
    <div className="min-h-svh bg-bg flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-fg mb-4 shadow-[0_8px_28px_-6px_hsl(var(--accent)/0.7)]">
            <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7L12 3 4 7m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7m8 4v10" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-fg mb-2">استلام طلبك</h1>
          <p className="text-sm text-fg-muted">
            أدخل رقم الطلب وآخر 4 أرقام من جوالك المسجل في الطلب.
          </p>
        </div>
        <PickupForm />
      </div>
    </div>
  );
}
