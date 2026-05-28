"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";

/**
 * Subtle route-aware fade transition.
 *
 *   - When `pathname` changes, the wrapper fades the OUTGOING DOM out (8px lift),
 *     then fades the INCOMING DOM in. No overlay, no flashy stuff.
 *   - 240ms each phase. Total ~360ms with overlap.
 *   - Honors prefers-reduced-motion (skips animation entirely).
 *
 * Wrap once at the root layout level. Don't wrap individual pages.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [renderedKey, setRenderedKey] = useState(pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setRenderedKey(pathname);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRenderedKey(pathname);
      return;
    }

    const node = ref.current;
    if (!node) {
      setRenderedKey(pathname);
      return;
    }

    // Phase 1 — fade out the current tree
    gsap.to(node, {
      opacity: 0,
      y: 8,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => {
        // Swap subtree (React renders the new pathname's children)
        setRenderedKey(pathname);
        // Phase 2 — fade the new tree in
        gsap.fromTo(
          node,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" },
        );
      },
    });
  }, [pathname]);

  return (
    <div ref={ref} key={renderedKey} className="will-change-transform">
      {children}
    </div>
  );
}
