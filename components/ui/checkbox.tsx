"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Checkbox — native input styled with our tokens.
 * Lime fill on checked. Accessible by default — the native input handles
 * keyboard nav, focus, and screen-reader semantics.
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const auto = React.useId();
    const inputId = id ?? auto;
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <span className="relative inline-flex items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              "peer size-4 appearance-none rounded-[5px] cursor-pointer transition-colors",
              "border border-[hsl(var(--hairline-strong))] bg-surface",
              "checked:bg-fg checked:border-fg",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            )}
            {...props}
          />
          <Check
            aria-hidden
            className="pointer-events-none absolute size-3 text-bg opacity-0 peer-checked:opacity-100 transition-opacity"
            strokeWidth={3}
          />
        </span>
        {label && (
          <label htmlFor={inputId} className="text-sm text-fg-muted cursor-pointer select-none">
            {label}
          </label>
        )}
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";
