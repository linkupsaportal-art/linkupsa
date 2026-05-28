"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  "النظرة العامة",
  "الفِرَق",
  "العملاء",
  "الاشتراك",
  "المدفوعات",
  "التطبيقات",
  "الإعدادات",
];

/**
 * Black-pill tab strip — purely visual for now (no routing). Gives the
 * dashboard the multi-section feel from the reference image.
 */
export function DashboardTabs() {
  const [active, setActive] = useState(TABS[0]);
  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
      {TABS.map((label) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => setActive(label)}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
              isActive
                ? "bg-fg text-bg shadow-[0_6px_18px_-6px_hsl(220_30%_8%/0.45)]"
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
