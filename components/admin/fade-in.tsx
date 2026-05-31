"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

/**
 * Staggered fade-in wrapper for dashboard sections.
 *
 * Each direct child is animated from (opacity 0, y+16) to its resting state
 * with a small stagger so the analytics cards cascade in instead of snapping
 * on instantly. Respects `prefers-reduced-motion` — users who opted out get
 * the content immediately with no transform.
 *
 * Server components can wrap their content in this without going client
 * themselves: only this thin wrapper is a client component.
 */
export function FadeInStagger({
  children,
  className,
  stagger = 0.08,
  y = 16,
  duration = 0.5,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  duration?: number;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current) return;

      // Honor reduced-motion: skip the animation entirely.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targets = Array.from(root.current.children);
      if (reduce || targets.length === 0) {
        gsap.set(targets, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
