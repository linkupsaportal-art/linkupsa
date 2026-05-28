"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Section divider — draws a blurple hairline from the right (RTL-friendly)
 * to the left as the user scrolls into the next section.
 * Decorative — set aria-hidden by default.
 */
export function DividerDraw({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "right center",
          scrollTrigger: { trigger: ref.current, start: "top 90%", end: "top 50%", scrub: 0.4 },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div className={cn("relative h-px w-full overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 bg-fg/5" />
      <div
        ref={ref}
        className="absolute inset-y-0 left-0 right-0 origin-right bg-gradient-to-l from-accent via-accent-hi to-transparent"
      />
    </div>
  );
}
