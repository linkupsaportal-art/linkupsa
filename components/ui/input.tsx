import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — clean white surface, hairline border, lime focus ring.
 * Theme-aware: works on both the public (dark) theme and admin (cream) theme
 * via the shared CSS tokens.
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: "md" | "lg";
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = "md", startAdornment, endAdornment, invalid, type, ...props }, ref) => {
    const heightCls = inputSize === "lg" ? "h-12" : "h-11";
    return (
      <div
        className={cn(
          "group relative flex items-center gap-2.5 border bg-surface px-4 transition-colors rounded-xl",
          "border-[hsl(var(--hairline-strong))] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
          invalid && "border-danger focus-within:border-danger focus-within:ring-danger/30",
          heightCls,
          className,
        )}
      >
        {startAdornment ? (
          <span className="text-fg-faint group-focus-within:text-fg transition-colors">
            {startAdornment}
          </span>
        ) : null}
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex-1 bg-transparent text-fg placeholder:text-fg-faint outline-none",
            "min-w-0 font-medium tabular-nums text-sm",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          {...props}
        />
        {endAdornment}
      </div>
    );
  },
);
Input.displayName = "Input";
