/** Hairline divider with a centered inline label, e.g. "أو". */
export function AuthDivider({ label = "أو" }: { label?: string }) {
  return (
    <div className="relative flex items-center gap-3 my-6">
      <span className="flex-1 h-px bg-[hsl(var(--hairline-strong))]" />
      <span className="text-[10px] uppercase tracking-widest font-semibold text-fg-faint">
        {label}
      </span>
      <span className="flex-1 h-px bg-[hsl(var(--hairline-strong))]" />
    </div>
  );
}
