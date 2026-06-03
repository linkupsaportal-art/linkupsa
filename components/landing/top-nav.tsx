"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ChevronLeft, Sparkles, ShieldCheck, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slim announcement strip that sits ABOVE the floating Navbar.
 *  - Auto-rotates between messages every 5s with a slide-in/out animation.
 *  - Dismissible via the close button — preference saved to sessionStorage.
 *  - Hidden once dismissed; re-appears on next session.
 */

const ANNOUNCEMENTS = [
  { icon: Sparkles, text: "إطلاق Portalio SA 1.0 · تسليم رقمي مؤتمت لمتاجر سلة", cta: "تعرف أكثر", href: "#exploration" },
  { icon: ShieldCheck, text: "بياناتك مشفرة بالكامل · سجل عمليات قابل للتدقيق", cta: "ورقة الأمان", href: "#methodology" },
  { icon: Zap, text: "زمن استجابة لحظي · تسليم خلال ثوانٍ", cta: "كيف يعمل", href: "#process" },
  { icon: Globe, text: "ربط مباشر مع متجرك على سلة · بدون تدخل يدوي", cta: "تفاصيل الربط", href: "#recognition" },
] as const;

export function TopNav() {
  const root = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);

  // Restore dismissal from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("linkup-topnav-dismissed") === "1") setHidden(true);
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (hidden) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 5000);
    return () => clearInterval(id);
  }, [hidden]);

  // Slide animation on idx change
  useGSAP(
    () => {
      gsap.fromTo(
        "[data-topnav-msg]",
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
      );
    },
    { dependencies: [idx], scope: root },
  );

  // First-load reveal
  useGSAP(
    () => {
      if (!root.current) return;
      gsap.from(root.current, {
        y: -30,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 1.2,
      });
    },
    { scope: root },
  );

  if (hidden) return null;

  const msg = ANNOUNCEMENTS[idx];
  const Icon = msg.icon;

  return (
    <div
      ref={root}
      className={cn(
        "fixed inset-x-0 top-0 z-[55] h-9",
        "bg-gradient-to-l from-accent via-accent-hi to-accent text-accent-fg",
        "border-b border-accent-hi/50 overflow-hidden",
      )}
    >
      <div className="relative h-full flex items-center justify-center px-12">
        <div data-topnav-msg className="flex items-center gap-3 text-xs md:text-sm font-medium">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{msg.text}</span>
          <a
            href={msg.href}
            className="hidden md:inline-flex items-center gap-1 ml-2 pl-2 border-r border-accent-fg/30 font-bold uppercase tracking-widest text-[11px] hover:underline underline-offset-4"
          >
            {msg.cta}
            <ChevronLeft className="size-3" />
          </a>
        </div>

        {/* Pagination dots */}
        <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5">
          {ANNOUNCEMENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`الإعلان رقم ${i + 1}`}
              className={cn(
                "size-1.5 rounded-full transition-all",
                i === idx ? "bg-accent-fg w-4" : "bg-accent-fg/40 hover:bg-accent-fg/70",
              )}
            />
          ))}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => {
            setHidden(true);
            sessionStorage.setItem("linkup-topnav-dismissed", "1");
          }}
          aria-label="إخفاء الإعلان"
          className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 size-6 rounded-full hover:bg-accent-fg/15 flex items-center justify-center transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
