import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stat tile — modeled after the "Operations" / "Data Transfer" cards in the
 * reference image.
 *
 * Anatomy:
 *   ┌────────────────────────────────────────┐
 *   │ ⚙ Operations                ⋯          │   header (icon · label · menu)
 *   │ 780 / 1 000   ⬤ 82%                    │   value · cap · percent pill
 *   │ ███ ███ ███ ░░░ ░░░                    │   block-row visualization
 *   └────────────────────────────────────────┘
 *
 * Two visual variants:
 *   - default → white card, subtle hairline + soft drop shadow
 *   - accent  → solid lime card (used for the highlighted "primary" KPI)
 */
export function StatCard({
  label,
  value,
  capacity,
  percent,
  icon: Icon,
  variant = "default",
  filledBlocks = 5,
  totalBlocks = 8,
}: {
  label: string;
  value: string | number;
  /** Optional "/ 1 000" capacity suffix shown after the value. */
  capacity?: string;
  /** Percent shown in the pill next to the value (0–100). */
  percent?: number;
  icon: LucideIcon;
  variant?: "default" | "accent";
  filledBlocks?: number;
  totalBlocks?: number;
}) {
  const isAccent = variant === "accent";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all",
        isAccent
          ? "pill-accent border-0 shadow-[0_8px_24px_-8px_hsl(72_86%_50%/0.55)]"
          : "bg-surface border border-[hsl(var(--hairline-strong))] card-soft hover:card-lift",
      )}
    >
      {/* Header row — icon chip · label · menu */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid place-items-center size-9 rounded-2xl",
              isAccent
                ? "bg-fg/10 text-fg"
                : "bg-fg text-bg",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
          <span className={cn("text-sm font-semibold", isAccent ? "text-fg" : "text-fg")}>
            {label}
          </span>
        </div>
        <button
          type="button"
          aria-label="المزيد"
          className={cn(
            "grid place-items-center size-7 rounded-full transition-colors",
            isAccent
              ? "text-fg/60 hover:bg-fg/10 hover:text-fg"
              : "text-fg-faint hover:bg-surface-2 hover:text-fg",
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Value row — big number · capacity · percent pill */}
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-num text-4xl sm:text-5xl font-extrabold tracking-tighter">
          {value}
        </span>
        {capacity && (
          <span className="text-sm text-fg-muted font-num">/ {capacity}</span>
        )}
        {percent != null && (
          <span
            className={cn(
              "ms-auto inline-flex items-center gap-1 rounded-full px-2.5 h-6 text-[11px] font-semibold font-num",
              isAccent
                ? "bg-fg text-bg"
                : "pill-accent",
            )}
          >
            <span className="size-1.5 rounded-full bg-current opacity-70" />
            {percent}%
          </span>
        )}
      </div>

      {/* Block-row — N of M filled */}
      <div className={cn("mt-5 block-row", isAccent && "on-accent")}>
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <i key={i} className={i >= filledBlocks ? "empty" : ""} />
        ))}
      </div>
    </article>
  );
}
