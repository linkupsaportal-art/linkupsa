"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP, gsap, ScrollTrigger } from "@/lib/gsap";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Razex Xelite Premium Navigation
 *
 * Features:
 * - Full-Width Edge Snap.
 * - Elegant 3-Bar SVG morphing trigger.
 * - GSAP-driven screen-peel polygon clip-path reveal.
 * - Dynamic scrollbar hiding with layout shift correction.
 * - Interactive ambient background with cursor tracking inside overlay.
 * - Clean responsive architecture.
 */

const NAV_LINKS = [
  { href: "#exploration", label: "المنتجات", num: "٠١" },
  { href: "#process", label: "العملية", num: "٠٢" },
  { href: "#methodology", label: "المنهجية", num: "٠٣" },
  { href: "#recognition", label: "موثوق", num: "٠٤" },
  { href: "#journal", label: "اليوميات", num: "٠٥" },
] as const;

export function Navbar() {
  const root = useRef<HTMLElement>(null);
  const triggerWrap = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // Spotlight coordinates inside the menu overlay
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!menuOverlayRef.current) return;
    const rect = menuOverlayRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Prevent scroll & layout shift when menu is open
  useEffect(() => {
    if (open) {
      const scrollWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty("--scrollbar-width", `${scrollWidth}px`);
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  // Close on Escape + click-outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      // Close only if clicking completely outside the trigger button and outside the overlay content
      if (
        triggerWrap.current &&
        !triggerWrap.current.contains(e.target as Node) &&
        menuOverlayRef.current &&
        !menuOverlayRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useGSAP(
    () => {
      const overlay = menuOverlayRef.current;
      if (!overlay || !root.current) return;

      // Soft shadow on scroll past hero fold
      const scrollTriggerInstance = ScrollTrigger.create({
        start: 80,
        end: "max",
        onUpdate: (self) => {
          root.current?.classList.toggle("nav-scrolled", self.scroll() > 80);
        },
      });

      // First-paint drop-down (LUMEN style reveal)
      gsap.from(root.current, {
        y: -30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.4,
      });

      // Unified overlay GSAP timeline - Built once, controlled by state change
      tl.current = gsap
        .timeline({
          paused: true,
          defaults: { ease: "power4.inOut" },
          onStart: () => {
            gsap.set(overlay, { autoAlpha: 1 });
          },
          onReverseComplete: () => {
            gsap.set(overlay, { autoAlpha: 0 });
          },
        })
        .fromTo(
          overlay,
          { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
          { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 0.8 },
        )
        .fromTo(
          "[data-menu-item]",
          { y: 50, opacity: 0, rotateX: -10 },
          { y: 0, opacity: 1, rotateX: 0, stagger: 0.06, duration: 0.6, ease: "power3.out" },
          "-=0.4",
        )
        .fromTo(
          "[data-menu-info] > *",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: "power2.out" },
          "-=0.45",
        );

      return () => {
        scrollTriggerInstance.kill();
      };
    },
    { scope: root },
  );

  // Sync open state with GSAP timeline play/reverse
  useEffect(() => {
    if (!tl.current) return;
    if (open) {
      tl.current.play();
    } else {
      tl.current.reverse();
    }
  }, [open]);

  return (
    <>
      <header
        ref={root}
        className={cn(
          "sticky top-0 z-[90] flex items-center justify-between transition-shadow duration-300 w-full",
          "px-6 md:px-12 py-5 border-b border-[hsl(var(--hairline))] backdrop-blur-md bg-bg/85",
        )}
      >
        {/* Brand — right (RTL primary side) */}
        <Link href="/" onClick={() => setOpen(false)} className="shrink-0 relative z-[95]">
          <Logo />
        </Link>

        {/* Actions Wrap — left side */}
        <div ref={triggerWrap} className="relative z-[95] flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              "hidden sm:flex items-center gap-2 px-5 py-2 border text-xs font-semibold uppercase tracking-wider transition duration-300",
              "border-accent/30 bg-accent/5 text-accent hover:bg-accent hover:text-accent-fg active:scale-95",
            )}
          >
            تسجيل الدخول
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={cn(
              "group flex items-center gap-3 px-5 py-2 border transition duration-300",
              "border-[hsl(var(--hairline-strong))] bg-bg hover:bg-fg/5 active:scale-95",
            )}
          >
            {/* Custom Morphing SVG lines instead of lucide-icons */}
            <div className="relative size-5 flex flex-col justify-center items-center">
              <span
                className={cn(
                  "w-5 h-[1.5px] bg-fg transition-all duration-300 absolute",
                  open ? "rotate-45" : "-translate-y-1.5"
                )}
              />
              <span
                className={cn(
                  "w-5 h-[1.5px] bg-fg transition-all duration-300 absolute",
                  open ? "opacity-0 scale-x-0" : "opacity-100"
                )}
              />
              <span
                className={cn(
                  "w-5 h-[1.5px] bg-fg transition-all duration-300 absolute",
                  open ? "-rotate-45" : "translate-y-1.5"
                )}
              />
            </div>
            <span className="text-sm font-medium tracking-wide">
              {open ? "إغلاق" : "القائمة"}
            </span>
          </button>
        </div>
      </header>

      {/* Full-Screen Premium Overlay Menu */}
      <div
        ref={menuOverlayRef}
        onMouseMove={handleMouseMove}
        className={cn(
          "fixed inset-0 w-screen h-screen bg-bg/98 z-[80] invisible",
          "flex flex-col p-8 md:p-16 pt-28 md:pt-36 overflow-y-auto no-scrollbar",
          "border-b border-[hsl(var(--hairline))]"
        )}
      >
        {/* Bound the spotlight inside an overflow-hidden wrapper to prevent scroll expansion */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="pointer-events-none absolute size-[500px] rounded-full bg-accent/5 blur-[120px] transition-opacity duration-500 hidden md:block"
            style={{
              left: `${spotlightPos.x - 250}px`,
              top: `${spotlightPos.y - 250}px`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center h-full max-w-7xl mx-auto w-full relative z-10 my-auto">
          
          {/* Right Column — Large Arabic Navigation Links */}
          <div className="flex flex-col justify-center divide-y divide-[hsl(var(--hairline))] border-t border-b border-[hsl(var(--hairline))]">
            {NAV_LINKS.map((l) => (
              <div
                key={l.href}
                data-menu-item
                className="group/item py-4 md:py-5 flex items-center"
              >
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-6 md:gap-8 group-hover/item:-translate-x-4 transition-transform duration-500 ease-out"
                >
                  <span className="text-sm font-mono text-fg/30 align-baseline">{l.num}</span>
                  <span className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-fg tracking-tight hover:text-accent transition-colors leading-none">
                    {l.label}
                  </span>
                </a>
              </div>
            ))}
          </div>

          {/* Left Column — Info Card, Stats & Contact info */}
          <div
            data-menu-info
            className="flex flex-col justify-between h-full p-8 md:p-12 bg-surface rounded-md border border-[hsl(var(--hairline))] relative overflow-hidden"
          >
            {/* Ambient Large Monogram */}
            <span className="absolute -bottom-24 -left-20 text-[24rem] font-bold text-fg/3 select-none pointer-events-none font-display leading-none">
              و
            </span>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-success"></span>
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-success">
                  النظام يعمل بالكامل • تسليم فوري
                </p>
              </div>
              <h4 className="text-xl md:text-2xl font-bold font-display tracking-tight text-fg mb-4">
                بوابة LinkUp الإدارية
              </h4>
              <p className="text-sm text-fg-muted leading-relaxed max-w-md">
                منصة تسليم المنتجات الرقمية والتحقق الفوري. آلية بالكامل، آمنة، ومبنية لمتاجر سلة.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "inline-flex items-center gap-2.5 px-6 py-2.5 border text-xs font-bold uppercase tracking-widest transition duration-300",
                    "border-accent bg-accent text-accent-fg hover:bg-accent-hi",
                  )}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "inline-flex items-center gap-2.5 px-6 py-2.5 border text-xs font-bold uppercase tracking-widest transition duration-300",
                    "border-[hsl(var(--hairline-strong))] bg-transparent text-fg hover:bg-fg/5",
                  )}
                >
                  حساب جديد
                </Link>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-[hsl(var(--hairline))] flex flex-col gap-6 relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle mb-2">
                  تواصل معنا
                </p>
                <a
                  href="mailto:hello@linkup.sa"
                  className="text-sm font-semibold hover:text-accent transition-colors font-mono"
                >
                  hello@linkup.sa
                </a>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-fg-subtle mb-2">
                  تابعنا
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-xs font-semibold hover:text-accent transition-colors">
                    Instagram
                  </a>
                  <a href="#" className="text-xs font-semibold hover:text-accent transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="text-xs font-semibold hover:text-accent transition-colors">
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
