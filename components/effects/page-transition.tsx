"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";

/**
 * Snappy route transition — fade-IN only, scoped to public routes.
 *
 * Admin routes get NO transition because:
 *  - Next.js nested layouts already keep the sidebar/topbar mounted between
 *    sub-routes, so animating the whole tree would re-fade the shell every
 *    time and feel like a full refresh.
 *  - The dashboard navigates between sibling routes constantly; we want
 *    Shopify-style instant tab snaps, not a fade.
 *
 * Public/landing routes still get a tiny 180ms cubic fade-in for polish.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Skip the transition entirely on admin routes — nested layout handles
    // shell persistence and sub-routes should snap instantly.
    if (pathname.startsWith("/admin")) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node) return;
    gsap.fromTo(
      node,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.18, ease: "power2.out", overwrite: true },
    );
  }, [pathname]);

  return (
    <div ref={ref} className="will-change-transform">
      {children}
    </div>
  );
}
