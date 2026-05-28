import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";

/**
 * Empty-state for sections we haven't implemented yet.
 * Lime accent badge + dark gradient hero on a white card.
 */
export function ComingSoon({
  title,
  description,
  eyebrow = "قريباً",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <>
      <PageHeader title={title} eyebrow={eyebrow} description={description} />

      <div className="relative overflow-hidden rounded-3xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft">
        {/* Soft accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 end-0 size-[28rem] rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.6), transparent 70%)" }}
        />
        {/* Dotted grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--fg)/0.07) 1px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative grid place-items-center text-center px-6 py-20 md:py-28">
          <div className="inline-flex size-16 items-center justify-center rounded-2xl pill-accent mb-6 shadow-[0_8px_28px_-6px_hsl(var(--accent)/0.7)]">
            <Sparkles className="size-7" strokeWidth={2} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-fg">
            هذا القسم قيد التطوير
          </h2>
          <p className="max-w-md text-sm md:text-base text-fg-muted leading-relaxed">
            نحن نعمل على إطلاق هذه الميزة قريباً. تابع التحديثات من إعدادات الحساب.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-fg-muted border border-[hsl(var(--hairline-strong))] rounded-full px-3 py-1.5 bg-surface-2">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            in development
          </div>
        </div>
      </div>
    </>
  );
}
