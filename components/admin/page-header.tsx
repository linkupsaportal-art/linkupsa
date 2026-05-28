import { cn } from "@/lib/utils";

/** Standard admin page header — title + optional eyebrow + right slot. */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5 lg:mb-6 pt-5 lg:pt-6",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] uppercase font-bold tracking-[0.18em] text-fg-faint mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-[40px] leading-[1.05] font-extrabold tracking-tight text-fg">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-fg-muted leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/**
 * Tab strip used under the dashboard header. Pure visual for now —
 * the active tab gets a black pill, the rest are ghost.
 */
export function PageTabs({
  items,
  active,
  onSelect,
}: {
  items: string[];
  active?: string;
  onSelect?: (label: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
      {items.map((label) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect?.(label)}
            className={cn(
              "h-9 px-4 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
              isActive
                ? "bg-fg text-bg shadow-[0_4px_14px_-6px_hsl(220_30%_8%/0.45)]"
                : "text-fg-muted hover:text-fg hover:bg-surface-2",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
