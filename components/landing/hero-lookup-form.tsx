"use client";

import { useRef, useState } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Hash, Phone, ArrowLeft, ShieldCheck, Sparkle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Magnetic } from "@/components/effects/magnetic";
import { cn } from "@/lib/utils";

/**
 * Razex Xelite Cyberpunk Lookup Form Redesign
 *
 * Visual Highlights:
 * - Dynamic glowing dual-layer card container.
 * - Dot-matrix digital tech texture.
 * - Pulsing status tags & cyber-retro corner brackets that illuminate on focus.
 * - Glowing status dots next to active inputs.
 * - Action button with dynamic gradient, intense accent shadow, and skews laser-sweeps.
 * - Advanced 3-color physics particle blast on submit.
 */
export function HeroLookupForm() {
  const root = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Focus tracking for interactive neon corner brackets & dot states
  const [isOrderFocused, setIsOrderFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  const isFocused = isOrderFocused || isPhoneFocused;

  useGSAP(
    () => {
      // Clean mount slide-up
      gsap.from(root.current, {
        y: 35,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 1.5,
      });

      // Pulse background aurora glow
      gsap.to("[data-hlf-glow]", {
        scale: 1.12,
        opacity: 0.6,
        duration: 3.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: root },
  );

  function burstFrom(target: HTMLElement) {
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const colors = ["hsl(var(--accent))", "#60A5FA", "#FFFFFF"]; // Accent blurple, sky blue, glowing white

    for (let i = 0; i < 24; i++) {
      const dot = document.createElement("span");
      const size = 4 + Math.random() * 5; // 4px to 9px
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      dot.style.cssText = `
        position: fixed; left: ${cx}px; top: ${cy}px;
        width: ${size}px; height: ${size}px;
        background: ${color};
        border-radius: 999px;
        pointer-events: none; z-index: 100;
        box-shadow: 0 0 10px ${color};
      `;
      document.body.appendChild(dot);
      
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const dist = 80 + Math.random() * 90;
      
      gsap.to(dot, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        scale: 0.2,
        duration: 0.8 + Math.random() * 0.4,
        ease: "power4.out",
        onComplete: () => dot.remove(),
      });
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const cta = root.current?.querySelector<HTMLElement>("[data-hlf-cta]");
    if (cta) burstFrom(cta);
    setTimeout(() => setSubmitting(false), 1100);
  }

  return (
    <div ref={root} className="relative">
      {/* Backdrop glowing aurora spotlight */}
      <div
        data-hlf-glow
        aria-hidden
        className="absolute -inset-8 rounded-[2.5rem] blur-3xl pointer-events-none opacity-40 transition-colors duration-500 z-0"
        style={{
          background: isFocused
            ? "radial-gradient(closest-side, hsl(var(--accent)/0.6), transparent)"
            : "radial-gradient(closest-side, hsl(var(--accent)/0.35), transparent)",
        }}
      />

      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-500 p-5 md:p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] overflow-hidden z-10",
          isFocused
            ? "border-accent bg-surface/90 shadow-[0_0_35px_hsl(var(--accent)/0.15)]"
            : "border-[hsl(var(--hairline-strong))] bg-surface/80",
        )}
      >
        {/* Dot Matrix Digital Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-2xl bg-[radial-gradient(ellipse_at_center,_var(--fg)_1px,_transparent_1px)] bg-[size:16px_16px] z-0" />

        {/* Retro-cyber corner brackets that glow when focused */}
        <div className={cn("absolute -top-[1.5px] -left-[1.5px] size-4 border-t-2 border-l-2 transition-all duration-300 pointer-events-none rounded-tl-md z-10", isFocused ? "border-accent scale-105" : "border-fg/10")} />
        <div className={cn("absolute -top-[1.5px] -right-[1.5px] size-4 border-t-2 border-r-2 transition-all duration-300 pointer-events-none rounded-tr-md z-10", isFocused ? "border-accent scale-105" : "border-fg/10")} />
        <div className={cn("absolute -bottom-[1.5px] -left-[1.5px] size-4 border-b-2 border-l-2 transition-all duration-300 pointer-events-none rounded-bl-md z-10", isFocused ? "border-accent scale-105" : "border-fg/10")} />
        <div className={cn("absolute -bottom-[1.5px] -right-[1.5px] size-4 border-b-2 border-r-2 transition-all duration-300 pointer-events-none rounded-br-md z-10", isFocused ? "border-accent scale-105" : "border-fg/10")} />

        {/* Status header */}
        <div className="flex items-center justify-between mb-6 z-10 relative">
          <div className="flex items-center gap-2 px-3 py-1 border border-success/20 bg-success/5 text-[10px] font-mono uppercase tracking-widest text-success rounded-full">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-success"></span>
            </span>
            اتصال آمن • تسليم فوري
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-fg-subtle border border-[hsl(var(--hairline-strong))] px-2.5 py-1 bg-surface-2/50 rounded-full" dir="ltr">
            #SECURE-GATEWAY
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 relative z-10">
          <div className="grid sm:grid-cols-2 gap-3.5">
            <FormField
              label="رقم الطلب"
              icon={<Hash className="size-4" />}
              isFieldFocused={isOrderFocused}
              inputProps={{
                inputMode: "numeric",
                placeholder: "مثال: 1234567",
                required: true,
                autoComplete: "off",
                onFocus: () => setIsOrderFocused(true),
                onBlur: () => setIsOrderFocused(false),
              }}
            />
            <FormField
              label="آخر ٤ أرقام من الجوال"
              icon={<Phone className="size-4" />}
              isFieldFocused={isPhoneFocused}
              inputProps={{
                inputMode: "numeric",
                placeholder: "٠٠٠٠",
                required: true,
                maxLength: 4,
                pattern: "[0-9]{4}",
                autoComplete: "off",
                onFocus: () => setIsPhoneFocused(true),
                onBlur: () => setIsPhoneFocused(false),
              }}
            />
          </div>

          <div className="pt-1">
            <Magnetic strength={0.15}>
              <button
                data-hlf-cta
                type="submit"
                disabled={submitting}
                className={cn(
                  "group/btn relative w-full overflow-hidden rounded-xl h-13 md:h-14 px-6 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest transition-all duration-500 ease-out",
                  "bg-gradient-to-r from-accent via-accent-hi to-accent bg-[length:200%_auto] hover:bg-right text-accent-fg active:scale-[0.98]",
                  "shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.6)] hover:shadow-[0_12px_32px_-6px_hsl(var(--accent)/0.8)] disabled:opacity-60 disabled:pointer-events-none",
                )}
              >
                {/* skewed laser sweep shine */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                  <div className="absolute top-0 -left-[150%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-12 animate-laser" />
                </div>

                <span className="relative z-10 flex items-center gap-3">
                  {submitting ? (
                    <>
                      <span className="size-3.5 rounded-full border-2 border-accent-fg border-t-transparent animate-spin" />
                      جاري التحقق…
                    </>
                  ) : (
                    <>
                      استعرض الطلب
                      <ArrowLeft className="size-4 transition-transform group-hover/btn:-translate-x-1.5" />
                    </>
                  )}
                </span>
              </button>
            </Magnetic>
          </div>

          {/* Secure details micro-row */}
          <div className="flex items-center justify-between gap-3 pt-2 text-[11px] text-fg-subtle">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-accent" />
              اتصال مشفر ومؤمن
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkle className="size-3.5 text-accent animate-pulse" />
              بدون كلمات مرور
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  isFieldFocused,
  inputProps,
}: {
  label: string;
  icon: React.ReactNode;
  isFieldFocused: boolean;
  inputProps: React.ComponentProps<typeof Input>;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-fg mb-1.5">
        <span
          className={cn(
            "size-1.5 rounded-full transition-colors duration-300",
            isFieldFocused ? "bg-accent animate-pulse" : "bg-fg/20",
          )}
        />
        {label}
      </span>
      <Input
        inputSize="lg"
        startAdornment={
          <span className={cn("transition-colors duration-300", isFieldFocused ? "text-accent" : "text-fg-faint")}>
            {icon}
          </span>
        }
        className={cn(
          "h-12 transition-all duration-300",
          isFieldFocused ? "border-accent/60 bg-surface-2/80" : "border-[hsl(var(--hairline-strong))] bg-surface-2/40",
        )}
        {...inputProps}
      />
    </label>
  );
}
