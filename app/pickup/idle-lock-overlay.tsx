"use client";

import { Lock, RefreshCw, ArrowLeft } from "lucide-react";

/**
 * Full-card overlay shown when the customer leaves the pickup page idle
 * for too long. Blurs the credentials, shows a clear message, and offers
 * either "extend session" (resets the timer in-place) or "back to start"
 * (full reset to the order-number form).
 */
export function IdleLockOverlay({
  onResume,
  onReset,
  totalSeconds,
}: {
  onResume: () => void;
  onReset: () => void;
  totalSeconds: number;
}) {
  const minutes = Math.round(totalSeconds / 60);
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl backdrop-blur-2xl bg-black/15 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="انتهت الجلسة بسبب عدم النشاط"
    >
      <div className="text-center px-6 py-8 max-w-xs space-y-4">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-700 border border-amber-500/30 shadow-[0_8px_32px_rgba(212,158,66,0.25)]">
          <Lock className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display font-extrabold text-fg text-xl">
            تم تأمين الجلسة
          </h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            تم إخفاء البيانات الحساسة بعد {minutes} دقائق من عدم النشاط، لحماية حسابك.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onResume}
            className="h-11 rounded-xl bg-accent text-accent-fg text-sm font-extrabold hover:bg-accent-hi transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(212,245,66,0.3)] active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="size-4 stroke-[2.5]" />
            متابعة الجلسة
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-10 rounded-xl bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 border border-[hsl(var(--hairline-strong))] text-sm font-bold transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="size-4 rotate-180" />
            البدء من جديد
          </button>
        </div>
      </div>
    </div>
  );
}
