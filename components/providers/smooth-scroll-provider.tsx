"use client";

/**
 * Lenis-driven smooth scrolling for the public/landing routes.
 *
 * Why this is route-scoped:
 *   The admin shell uses an inner scroll container (`<main overflow-y-auto>`
 *   inside an `h-svh overflow-hidden` layout). Lenis hijacks the window wheel
 *   event and ignores nested scrollers, which would silently kill scrolling
 *   on every admin page. We disable Lenis whenever the URL is under /admin.
 *
 * Respects `prefers-reduced-motion` — falls back to native scroll.
 */
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) return; // admin has its own inner scroller — leave native scroll alone
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCb = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCb);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCb);
      lenis.destroy();
    };
  }, [isAdmin]);

  return <>{children}</>;
}
