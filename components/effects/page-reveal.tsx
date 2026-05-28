"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/**
 * First-load curtain that reveals the page from the bottom up.
 *  - Two stacked panels split horizontally.
 *  - Logo wordmark fades through center while panels slide.
 *  - Self-removes from the DOM once the timeline completes (so it doesn't
 *    intercept clicks or screen-readers).
 */
export function PageReveal() {
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (!root.current) return;
    document.body.style.overflow = "hidden";
    const tl = gsap.timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: () => {
        document.body.style.overflow = "";
        setMounted(false);
      },
    });
    tl.to("[data-curtain-word]", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0.1)
      .to("[data-curtain-word]", { y: -20, opacity: 0, duration: 0.5, ease: "power3.in" }, 1.0)
      .to("[data-curtain-top]", { yPercent: -100, duration: 1.0 }, 1.1)
      .to("[data-curtain-bot]", { yPercent: 100, duration: 1.0 }, 1.1);
    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[100] pointer-events-none">
      <div data-curtain-top className="absolute inset-x-0 top-0 h-1/2 bg-surface-3" />
      <div data-curtain-bot className="absolute inset-x-0 bottom-0 h-1/2 bg-surface-3" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          data-curtain-word
          dir="ltr"
          className="font-display font-bold tracking-tighter text-fg text-5xl md:text-7xl opacity-0 [unicode-bidi:isolate]"
          style={{ transform: "translateY(20px)" }}
        >
          LinkUp<span className="text-accent">+</span>
        </span>
      </div>
    </div>
  );
}
