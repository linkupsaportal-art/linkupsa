"use client";

import * as React from "react";
import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Props = React.ComponentPropsWithoutRef<"div"> & {
  /** Strength of the magnetic pull, default 0.25. */
  strength?: number;
  /** Lift on hover (Y offset), default 0. */
  lift?: number;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Magnetic wrapper — child gets pulled toward the cursor while hovered.
 *  - Uses gsap.quickTo for 60fps smoothing without triggering React renders.
 *  - Honors prefers-reduced-motion (no-op).
 *  - Drop in around any clickable: <Magnetic><Button /></Magnetic>
 */
export function Magnetic({
  children,
  className,
  strength = 0.25,
  lift = 0,
  as: Tag = "div",
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      xTo((e.clientX - cx) * strength);
      yTo((e.clientY - cy) * strength + (lift * -1));
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };
    const onEnter = () => {
      if (lift) yTo(-lift);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength, lift]);

  // @ts-expect-error — dynamic tag is fine here
  return <Tag ref={ref} className={cn("inline-block", className)} {...rest}>{children}</Tag>;
}
