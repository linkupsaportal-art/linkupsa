"use client";

import * as React from "react";
import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Generic scroll-triggered reveal wrapper.
 * Fade + slide on first intersection, with configurable direction.
 *
 *   <Reveal direction="up" delay={0.1}>...</Reveal>
 */
type Direction = "up" | "down" | "left" | "right" | "scale";

const DIRECTIONS: Record<Direction, gsap.TweenVars> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: -40 },
  right: { x: 40 },
  scale: { scale: 0.92 },
};

export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.7,
  start = "top 85%",
  once = true,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  start?: string;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        ...DIRECTIONS[direction],
        opacity: 0,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start, toggleActions: once ? "play none none none" : "play none none reverse" },
      });
    },
    { scope: ref },
  );

  // @ts-expect-error — dynamic tag with ref is fine
  return <Tag ref={ref} className={cn(className)}>{children}</Tag>;
}
