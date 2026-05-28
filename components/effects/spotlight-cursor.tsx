"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Subtle blurple spotlight that follows the cursor across the whole page.
 *  - Pure CSS blur, GPU-friendly.
 *  - Hidden on touch devices and when reduced-motion is set.
 *  - Doesn't replace the system cursor — it complements it.
 */
export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) {
      el.style.display = "none";
      return;
    }

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX - 200);
      yTo(e.clientY - 200);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed top-0 left-0 z-[1] size-[400px] rounded-full pointer-events-none mix-blend-screen opacity-50"
      style={{
        background: "radial-gradient(circle, hsl(var(--accent) / 0.18) 0%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
