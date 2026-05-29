import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for every profile section card. Header + slot for the form
 * body + optional footer slot for actions.
 */
export function SectionCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
  footer,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Right-side chip — used by 2FA card to show "مفعّل" */
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5">
        <div className="flex items-start gap-3 min-w-0">
          <span className="grid place-items-center size-9 rounded-xl bg-fg text-bg shrink-0">
            <Icon className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base sm:text-lg font-extrabold tracking-tight text-fg">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs sm:text-sm text-fg-muted leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {badge}
      </header>

      <div className="px-4 sm:px-5 py-4">{children}</div>

      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 px-4 sm:px-5 py-3 bg-surface-2 border-t border-[hsl(var(--hairline))] rounded-b-[15px]">
          {footer}
        </footer>
      )}
    </article>
  );
}

/**
 * Status pill — green for "ok" / amber for "warning" / red for "danger".
 */
export function StatusBadge({
  variant = "ok",
  children,
}: {
  variant?: "ok" | "warn" | "danger" | "muted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums shrink-0",
        variant === "ok" && "bg-success/10 text-success",
        variant === "warn" && "bg-warn/10 text-warn",
        variant === "danger" && "bg-danger/10 text-danger",
        variant === "muted" && "bg-surface-2 text-fg-muted",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
