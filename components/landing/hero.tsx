"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ChevronLeft, ShieldCheck, Layers, Sparkles, Zap, Bot } from "lucide-react";
import { splitChars, splitWords } from "@/lib/split-text";

/**
 * Razex Xelite Premium Brand Hero Section
 *
 * Visual Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Right (RTL primary)            │   Left              │
 *   │  ─────────────────              │   ─────             │
 *   │  Kicker chip                    │   ┌───────────────┐ │
 *   │  Huge headline (LinkUp +)       │   │ Floating Brand│ │
 *   │  Underline accent               │   │ Logo Shield   │ │
 *   │  Subhead                        │   └───────────────┘ │
 *   │  Mini-cards (٦ أنواع · تشفير ·  │                     │
 *   │  تسليم · آلي)                   │                     │
 *   └──────────────────────────────────────────────────────┘
 */

const COUNTER_TARGET = 12408;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 1.4 /* wait for PageReveal curtain */,
      });

      tl.from("[data-h='kicker']", { y: 18, opacity: 0, duration: 0.5 });

      const chars = splitChars(headlineRef.current);
      tl.from(
        chars,
        { yPercent: 110, opacity: 0, stagger: 0.025, duration: 0.95, ease: "power4.out" },
        "-=0.25",
      );

      tl.from(
        "[data-h='underline']",
        { scaleX: 0, transformOrigin: "right center", duration: 0.7, ease: "power4.out" },
        "-=0.3",
      );

      const words = splitWords(subRef.current);
      tl.from(words, { y: 14, opacity: 0, stagger: 0.04, duration: 0.5 }, "-=0.55");

      tl.from(
        "[data-h='card']",
        { y: 18, opacity: 0, stagger: 0.08, duration: 0.45 },
        "-=0.4",
      );
      tl.from(
        "[data-h='strip'] > *",
        { y: 14, opacity: 0, stagger: 0.07, duration: 0.45 },
        "-=0.35",
      );

      // Drifting orbs forever
      gsap.to("[data-h='orb-1']", {
        x: 40, y: -30, rotate: 15,
        duration: 12, ease: "sine.inOut", yoyo: true, repeat: -1,
      });
      gsap.to("[data-h='orb-2']", {
        x: -50, y: 40, rotate: -20,
        duration: 16, ease: "sine.inOut", yoyo: true, repeat: -1,
      });

      // Headline parallax-fade as user scrolls past hero
      gsap.to(headlineRef.current, {
        yPercent: -25,
        opacity: 0.35,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
      });

      // Counter
      if (counterRef.current) {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: COUNTER_TARGET,
          duration: 2.4,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 60%" },
          onUpdate() {
            if (counterRef.current) {
              counterRef.current.textContent = Math.round(obj.v).toLocaleString("en-US");
            }
          },
        });
      }
    },
    { scope: root },
  );

  return (
    <section
      id="top"
      ref={root}
      className="relative overflow-hidden border-b border-[hsl(var(--hairline))] pt-12 pb-20 px-6 md:pt-20 md:pb-28 md:px-12"
    >
      {/* Floating ornaments */}
      <span
        data-h="orb-1"
        aria-hidden
        className="pointer-events-none absolute top-20 left-[8%] size-[18rem] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.6), transparent 70%)" }}
      />
      <span
        data-h="orb-2"
        aria-hidden
        className="pointer-events-none absolute bottom-10 right-[6%] size-[22rem] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.5), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Right side (RTL primary) — copy */}
        <div className="lg:col-span-7 order-1">
          <p
            data-h="kicker"
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] uppercase font-semibold tracking-widest text-accent backdrop-blur-sm"
          >
            <Sparkles className="size-3.5" />
            استلم منتجك الرقمي خلال ثوانٍ
          </p>

          <h1
            ref={headlineRef}
            dir="ltr"
            className="mt-6 font-display font-bold leading-[0.88] tracking-tighter text-fg [unicode-bidi:isolate]"
            style={{ fontSize: "clamp(3rem, 9vw, 8.5rem)" }}
          >
            LinkUp
            <span className="text-accent align-top text-[0.55em] ml-1">+</span>
          </h1>
          <div
            data-h="underline"
            className="mt-3 h-[3px] w-32 bg-gradient-to-l from-accent to-transparent rounded-full"
          />

          <p
            ref={subRef}
            className="mt-6 text-base md:text-lg text-fg-muted leading-relaxed max-w-xl"
          >
            منصة تسليم المنتجات الرقمية الفورية والمؤمنة. حسابات، أكواد، ملفات — كلها تصل لعميلك خلال ثوانٍ معدودة، آمنة بالكامل، وبأتمتة ذكية ومستقلة.
          </p>

          {/* Mini feature cards */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
            {[
              { icon: Layers, t1: "٦ أنواع", t2: "من المنتجات" },
              { icon: ShieldCheck, t1: "تشفير", t2: "طرف لطرف" },
              { icon: Zap, t1: "تسليم", t2: "فوري" },
              { icon: Bot, t1: "آلي", t2: "٢٤/٧" },
            ].map((c) => (
              <div data-h="card" key={c.t1} className="group cursor-default">
                <c.icon
                  className="size-6 mb-2 text-fg group-hover:text-accent transition-colors"
                  strokeWidth={1.5}
                />
                <h3 className="text-sm font-semibold leading-tight">
                  {c.t1}
                  <br />
                  {c.t2}
                </h3>
                <div className="mt-2 w-4 h-0.5 group-hover:w-12 transition-all bg-accent" />
              </div>
            ))}
          </div>
        </div>

        {/* Left side — Insanely Premium Brand Logo Shield instead of lookup form */}
        <div className="lg:col-span-5 order-2" id="hero-brand-shield">
          <div className="relative w-full aspect-square max-w-[420px] mx-auto group">
            {/* Background glowing aurora gradient */}
            <div className="absolute -inset-6 rounded-full blur-3xl opacity-35 bg-gradient-to-r from-accent to-brand-lo animate-pulse pointer-events-none" />

            {/* Futuristic container card */}
            <div className="relative w-full h-full rounded-2xl border border-[hsl(var(--hairline-strong))] bg-surface/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]">
              {/* Dot-matrix tech pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--fg)_1px,_transparent_1px)] bg-[size:16px_16px]" />

              {/* Glowing Corner Cyber Brackets */}
              <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-accent/40 rounded-tl-md" />
              <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-accent/40 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-accent/40 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-accent/40 rounded-br-md" />

              {/* Floating Monogram Shield holding the brand logo */}
              <div className="relative size-44 md:size-52 rounded-2xl bg-gradient-to-b from-fg/10 to-transparent p-0.5 border border-fg/15 shadow-2xl flex items-center justify-center transition-transform duration-500 hover:scale-[1.03]">
                <div className="relative w-full h-full bg-surface-3 rounded-[14px] flex items-center justify-center p-6 overflow-hidden">
                  {/* Subtle dynamic neon overlay */}
                  <div className="absolute inset-0 bg-radial-gradient from-accent/15 via-transparent to-transparent opacity-60 pointer-events-none" />

                  <Image
                    src="/linkup-logo.webp"
                    alt="LinkUp Logo"
                    fill
                    sizes="(max-width: 768px) 176px, 208px"
                    className="object-contain filter drop-shadow-[0_8px_16px_rgba(88,101,242,0.3)] transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </div>

              {/* Retro-cyber status tag */}
              <div className="mt-8 flex flex-col items-center gap-1.5 text-center">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent font-semibold">
                  PORTALIOSA SYSTEM
                </p>
                <span className="text-[10px] font-mono text-fg-subtle uppercase tracking-wider">
                  بوابة التسليم الرقمي الذكية
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip — counter + secondary CTAs */}
      <div
        data-h="strip"
        className="relative mt-16 mx-auto max-w-7xl flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-t border-[hsl(var(--hairline))] pt-10"
      >
        <div>
          <p className="text-[10px] uppercase font-semibold text-fg-faint tracking-widest mb-1">
            الطلبات التي وصلنا بها
          </p>
          <span
            ref={counterRef}
            className="block font-display font-bold tracking-tighter tabular-nums leading-none"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
          >
            0
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#exploration"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[hsl(var(--hairline-strong))] text-xs uppercase font-semibold tracking-widest hover:bg-fg/10 hover:border-fg/40 transition-colors"
          >
            استعرض المنتجات
            <ChevronLeft className="size-4" />
          </a>
          <a
            href="#process"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-xs uppercase font-semibold tracking-widest text-fg-muted hover:text-fg transition-colors"
          >
            كيف يعمل
            <ChevronLeft className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
