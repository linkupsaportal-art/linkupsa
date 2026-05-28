"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Fixed top progress bar — fills with blurple as the user scrolls the page.
 * Powered by ScrollTrigger so it stays buttery and never decoupled from Lenis.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bar.current) return;
    gsap.set(bar.current, { scaleX: 0, transformOrigin: "right center" });
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        gsap.to(bar.current, { scaleX: self.progress, duration: 0.15, ease: "none", overwrite: true });
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[3px] pointer-events-none">
      <div className="absolute inset-0 bg-fg/5" />
      <div
        ref={bar}
        className="absolute inset-y-0 left-0 right-0 origin-right bg-gradient-to-l from-accent via-accent-hi to-accent shadow-[0_0_12px_hsl(var(--accent)/0.7)]"
      />
    </div>
  );
}
