"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Single big marquee — Arabic-only, scroll-velocity aware.
 *  - Big editorial type (clamp 2rem → 4.5rem) so it reads as a section, not filler.
 *  - Star separators in blurple between phrases.
 *  - timeScale ramps up when the user scrolls fast and eases back at rest.
 */
const PHRASES = [
  "تسليم رقمي فوري",
  "أمان مدمج بالكامل",
  "ربط مباشر مع سلة",
  "أكواد تُولَّد لحظياً",
  "حماية متعددة الطبقات",
  "تسليم خلال ثوانٍ",
  "ملكية كاملة للسورس كود",
  "بدون صيانة سيرفرات",
] as const;

export function MarqueeRibbon() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const tween = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 40,
      repeat: -1,
    });

    let proxy = 1;
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const v = self.getVelocity() / 1000;
        const target = gsap.utils.clamp(0.4, 4, 1 + Math.abs(v));
        proxy += (target - proxy) * 0.1;
        tween.timeScale(proxy);
      },
    });

    return () => {
      trigger.kill();
      tween.kill();
    };
  }, []);

  return (
    <div className="w-full border-y border-[hsl(var(--hairline))] bg-surface-2/50 py-6 md:py-10 overflow-hidden select-none">
      <div className="w-full" dir="ltr">
        <div ref={trackRef} className="flex w-max items-center whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, dup) => (
            <span key={dup} className="flex items-center whitespace-nowrap">
              {PHRASES.map((p, i) => (
                <span
                  key={`${dup}-${i}`}
                  className="flex items-center"
                  style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)" }}
                >
                  <span className="font-display font-bold tracking-tight text-fg-muted">{p}</span>
                  <Star />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Decorative 8-point star separator in blurple. */
function Star() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="mx-6 md:mx-10 shrink-0 text-accent"
      style={{ width: "0.7em", height: "0.7em" }}
    >
      <path
        d="M12 2 L13.5 9.5 L21 8.5 L15 13 L21 17.5 L13.5 16.5 L12 24 L10.5 16.5 L3 17.5 L9 13 L3 8.5 L10.5 9.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
