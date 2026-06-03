"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Logo } from "@/components/brand/logo";
import { Quote } from "lucide-react";

/**
 * Brand panel shown next to the auth form on large viewports.
 *
 * Structure (top → bottom):
 *   1. Brand row (top-left) — Logo + small slogan
 *   2. Center stage — large editorial headline + subhead
 *   3. Bottom — quote card from a real-feel persona
 *
 * Background: soft blurple radial glow + grid lines + slow-drifting orb.
 * All text is Arabic, brand-neutral (no NDA tech mentions).
 */
export function AuthBrandPanel() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-brand-row]", {
        y: 16,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "power3.out",
      });
      gsap.to("[data-brand-orb]", {
        x: 30,
        y: -20,
        rotate: 8,
        duration: 14,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative h-full w-full flex flex-col p-12 xl:p-16">
      {/* Background — soft glow + grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(0 0% 100% / 0.025) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
      <span
        data-brand-orb
        aria-hidden
        className="absolute top-[-10%] right-[-10%] size-[28rem] rounded-full blur-3xl pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.55), transparent 70%)",
        }}
      />

      {/* Top — brand row */}
      <div data-brand-row className="relative z-10">
        <Logo />
        <p className="mt-3 text-sm text-fg-subtle max-w-xs leading-relaxed">
          منصة التسليم الرقمي المؤتمت لمتاجر سلة.
        </p>
      </div>

      {/* Middle — editorial copy */}
      <div data-brand-row className="relative z-10 mt-auto mb-10">
        <h1
          className="font-display font-bold tracking-tighter leading-[0.95] text-fg"
          style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)" }}
        >
          كل طلب رقمي،
          <br />
          <span className="text-accent">يصل بنفسه.</span>
        </h1>
        <p className="mt-5 text-fg-muted leading-relaxed max-w-md">
          سجّل دخولك للوحة التحكم، وتابع طلباتك وحساباتك ومنتجاتك من مكان واحد. واجهة بسيطة، أمان قوي، وعمليات آلية تشتغل وأنت نايم.
        </p>
      </div>

      {/* Bottom — testimonial card */}
      <div
        data-brand-row
        className="relative z-10 rounded-xl border border-[hsl(var(--hairline-strong))] bg-surface/70 backdrop-blur-md p-6"
      >
        <Quote className="size-5 text-accent mb-3" />
        <p className="text-sm leading-relaxed text-fg-muted">
          “منذ ربط متجري بـ Portalio SA، صارت طلبات المنتجات الرقمية تُسلَّم تلقائياً خلال ثوانٍ. وفّرت ساعات يومياً من العمل اليدوي.”
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div
            aria-hidden
            className="size-9 rounded-full bg-gradient-to-br from-accent to-accent-hi flex items-center justify-center font-bold text-accent-fg"
          >
            ع
          </div>
          <div className="text-xs">
            <p className="font-semibold text-fg">عبدالله الراشد</p>
            <p className="text-fg-faint">مدير متجر · الرياض</p>
          </div>
        </div>
      </div>
    </div>
  );
}
