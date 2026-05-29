"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  name,
  value,
  onChange,
  options,
  placeholder = "اختر...",
  className,
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Click outside to close
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Keyboard accessibility
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Hidden input to pass value for native <form> FormData parsing */}
      {name && <input type="hidden" name={name} value={value} />}

      {/* Select trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "w-full h-10 px-3.5 rounded-xl border flex items-center justify-between text-start transition-all duration-150 select-none",
          "bg-[hsl(200_14%_97%)] border-[hsl(220_18%_14%/0.10)] text-[hsl(222_30%_6%)] text-sm font-semibold",
          open && "border-accent ring-2 ring-accent/20 bg-white",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-white hover:border-[hsl(220_18%_14%/0.25)]",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 text-fg-muted">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-fg-faint shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Floating Dropdown List */}
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-50 mt-1.5 py-1 max-h-60 overflow-y-auto",
            "bg-white border border-[hsl(220_18%_14%/0.10)] rounded-xl shadow-lg",
            "animate-in fade-in slide-in-from-top-1 duration-150",
            "phone-dropdown-scroll",
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full px-3.5 py-2.5 text-start text-xs font-bold transition-colors flex items-center justify-between gap-3 cursor-pointer",
                  isSelected
                    ? "bg-accent/10 text-[hsl(222_30%_6%)] font-extrabold"
                    : "text-[hsl(220_16%_26%)] hover:bg-[hsl(200_14%_94%)]",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.icon && (
                    <span className="shrink-0 text-fg-muted">{opt.icon}</span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="size-3.5 text-accent stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
