"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal native checkbox styled with our tokens.
 * Avoids @radix-ui/react-checkbox (one fewer dependency); the native input
 * is fully accessible and keyboard-navigable on its own.
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
            className="peer size-4 appearance-none rounded-[4px] border border-[hsl(var(--hairline-strong))] bg-surface-2 transition-colors checked:bg-accent checked:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg cursor-pointer"
            {...props}
          />
          <Check
            aria-hidden
            className="pointer-events-none absolute size-3 text-accent-fg opacity-0 peer-checked:opacity-100 transition-opacity"
            strokeWidth={3}
          />
        </span>
        {label && (
          <label htmlFor={inputId} className="text-xs text-fg-muted cursor-pointer select-none">
            {label}
          </label>
        )}
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";
