"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Six-digit code input. One box per digit. Auto-advances on type, jumps back on
 * Backspace, accepts paste of the full 6-digit string. Bubbles a single string
 * via `onChange`.
 *
 *    <OtpInput value={code} onChange={setCode} autoSubmitOnFill={...} />
 */
export interface OtpInputProps {
  value: string;
  onChange: (next: string) => void;
  /** Called when all 6 digits are filled. */
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first empty cell on mount.
  useEffect(() => {
    if (disabled) return;
    const idx = Math.min(value.length, length - 1);
    refs.current[idx]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  function handleInput(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[idx] = digit;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (digit && idx < length - 1) refs.current[idx + 1]?.focus();
    if (next.length === length && onComplete) onComplete(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const arr = value.split("");
        arr[idx] = "";
        onChange(arr.join(""));
      } else if (idx > 0) {
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      // RTL ⇒ "left" arrow moves to the next visual cell (which is index+1)
      refs.current[idx + 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      refs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length && onComplete) onComplete(pasted);
  }

  return (
    <div
      dir="ltr"
      className="flex items-center justify-center gap-2 sm:gap-3"
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          aria-label={`الخانة ${i + 1}`}
          className={cn(
            "size-12 sm:size-14 text-center text-2xl font-bold tabular-nums font-mono",
            "rounded-md border bg-surface text-fg",
            "border-[hsl(var(--hairline-strong))] focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
            "transition-colors",
            invalid && "border-danger focus:border-danger",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
