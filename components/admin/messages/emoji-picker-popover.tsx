"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Smile, X } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface EmojiPickerPopoverProps {
  /** Called when the user selects an emoji */
  onEmojiSelect: (emoji: string) => void;
  /** Optional class for the trigger button */
  triggerClassName?: string;
}

/* ─── Component ─────────────────────────────────────────────────────── */

export function EmojiPickerPopover({
  onEmojiSelect,
  triggerClassName,
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const handleSelect = useCallback(
    (emoji: { native: string }) => {
      onEmojiSelect(emoji.native);
    },
    [onEmojiSelect]
  );

  return (
    <div ref={containerRef} className="relative inline-flex">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          triggerClassName ??
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none border " +
            (open
              ? "bg-accent/15 text-accent border-accent/30"
              : "bg-surface-2/60 text-fg-muted border-[hsl(var(--hairline))] hover:bg-surface-2 hover:text-fg hover:border-[hsl(var(--hairline-strong))]")
        }
      >
        <Smile className="size-3.5" />
        <span>إيموجي</span>
        {open && <X className="size-3" />}
      </button>

      {/* Floating Picker */}
      {open && (
        <div className="absolute z-[100] top-full mt-2 end-0 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-white/5">
            <Picker
              data={data}
              onEmojiSelect={handleSelect}
              theme="dark"
              locale="ar"
              previewPosition="none"
              skinTonePosition="search"
              navPosition="bottom"
              perLine={8}
              emojiSize={22}
              emojiButtonSize={32}
              maxFrequentRows={2}
              set="native"
            />
          </div>
        </div>
      )}
    </div>
  );
}
