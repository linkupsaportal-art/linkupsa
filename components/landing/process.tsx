"use client";

import { useRef, useState } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ImageOrPlaceholder } from "@/components/ui/image-or-placeholder";
import { IMG } from "@/lib/images";
import { splitChars } from "@/lib/split-text";
import { cn } from "@/lib/utils";

/**
 * Process — case-study layout with animated tab indicator + counters + parallax.
 */

const TABS = [
  {
    id: "darkroom",
    label: "الرحلة",
    heading: "العملية",
    sub: "تدفق آلي بالكامل",
    title: "من الدفع إلى التسليم",
    body: "بمجرد إكتمال الدفع على متجرك، نستلم الطلب تلقائياً، نتحقق من حالته، ثم نسلّم المنتج للعميل في ثوانٍ. كل خطوة مسجلة، كل عملية قابلة للتدقيق.",
    stats: [
      { label: "زمن التسليم", value: "~3", suffix: "ث" },
      { label: "نسبة النجاح", value: "99.9", suffix: "٪" },
      { label: "تدخل يدوي", value: "0", suffix: "" },
    ],
  },
  {
    id: "studio",
    label: "الموثوقية",
    heading: "الثبات",
    sub: "بنية حديثة",
    title: "تشتغل وأنت نايم",
    body: "بنية موزعة على عدة طبقات، صفر صيانة، تحديثات تلقائية، ونسخ احتياطي يومي. لا توقف، لا انقطاع، لا قلق.",
    stats: [
      { label: "زمن الاستجابة", value: "10", suffix: "ms" },
      { label: "Uptime", value: "99.99", suffix: "٪" },
      { label: "تكلفة سيرفر", value: "0", suffix: "$" },
    ],
  },
] as const;

export function Process() {
  const root = useRef<HTMLElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [tabIdx, setTabIdx] = useState(0);
  const tab = TABS[tabIdx];

  // Animate the tab indicator pill
  useGSAP(
    () => {
      const tabsBar = tabBarRef.current;
      const indicator = indicatorRef.current;
      if (!tabsBar || !indicator) return;
      const buttons = tabsBar.querySelectorAll<HTMLElement>("[data-tab]");
      const target = buttons[tabIdx];
      if (!target) return;
      const r = target.getBoundingClientRect();
      const parent = tabsBar.getBoundingClientRect();
      gsap.to(indicator, {
        width: r.width,
        x: r.left - parent.left,
        duration: 0.5,
        ease: "power3.out",
      });
    },
    { dependencies: [tabIdx], scope: root },
  );

  useGSAP(
    () => {
      // Initial section animations (run once)
      const headlineEl = root.current?.querySelector<HTMLElement>("[data-process-headline]");
      if (headlineEl) {
        const chars = splitChars(headlineEl);
        gsap.from(chars, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.04,
          duration: 0.8,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
      }

      // Image parallax-scrub
      gsap.fromTo(
        "[data-process-img]",
        { scale: 1.15, y: -30 },
        {
          scale: 1,
          y: 30,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        },
      );

      // Counter tween for each numeric stat
      const stats = root.current?.querySelectorAll<HTMLElement>("[data-stat-value]");
      stats?.forEach((node) => {
        const target = parseFloat(node.dataset.target ?? "");
        if (!Number.isFinite(target)) return;
        const decimals = parseInt(node.dataset.decimals ?? "0", 10);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: root.current, start: "top 75%" },
          onUpdate() {
            const safe = Number.isFinite(obj.v) ? obj.v : 0;
            node.textContent = safe.toFixed(decimals);
          },
        });
      });
    },
    { scope: root },
  );

  // Re-run content animations when tabIdx changes
  useGSAP(
    () => {
      gsap.from("[data-process-row]", {
        y: 24,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { dependencies: [tabIdx], scope: root },
  );

  return (
    <section id="process" ref={root} className="relative border-b border-[hsl(var(--hairline))]">
      {/* Tabs */}
      <div
        ref={tabBarRef}
        className="absolute top-0 right-0 md:right-1/4 flex z-20 bg-surface-3/40 backdrop-blur-md"
      >
        <span
          ref={indicatorRef}
          className="absolute top-0 bottom-0 bg-bg/80 border-l border-[hsl(var(--hairline))] -z-10"
          style={{ width: 0 }}
        />
        {TABS.map((t, i) => (
          <button
            key={t.id}
            data-tab
            onClick={() => setTabIdx(i)}
            className={cn(
              "text-xs font-semibold tracking-widest uppercase border-l border-[hsl(var(--hairline))] px-6 md:px-8 py-3 transition-colors relative",
              i === tabIdx ? "text-fg" : "text-fg/50 hover:text-fg",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left content */}
        <div className="md:p-12 md:pt-32 p-6 pt-24 flex flex-col justify-center border-l-0 md:border-l border-[hsl(var(--hairline))]">
          <h2
            data-process-headline
            className="text-5xl md:text-7xl uppercase font-bold tracking-tighter mb-8 font-display"
          >
            {tab.heading}
          </h2>

          <div data-process-row className="mb-12">
            <h4 className="text-xl font-semibold mb-2">{tab.title}</h4>
            <h5 className="text-lg text-fg/70 mb-6">{tab.sub}</h5>
            <p className="leading-relaxed text-sm text-fg-subtle max-w-sm">{tab.body}</p>
          </div>

          <div
            data-process-row
            className="grid grid-cols-3 gap-8 pt-8 border-t border-[hsl(var(--hairline))]"
          >
            {tab.stats.map((s) => {
              const numericPart = parseFloat(s.value);
              const isNumeric = Number.isFinite(numericPart);
              const decimals = (s.value.split(".")[1] ?? "").length;
              return (
                <div key={s.label} className="group">
                  <p className="text-[10px] font-bold uppercase mb-1 text-accent">{s.label}</p>
                  <p className="text-2xl font-bold font-mono">
                    {isNumeric ? (
                      <span
                        data-stat-value
                        data-target={String(numericPart)}
                        data-decimals={String(decimals)}
                      >
                        0
                      </span>
                    ) : (
                      <span>{s.value}</span>
                    )}
                    {s.suffix && <span className="ml-0.5">{s.suffix}</span>}
                  </p>
                  <div className="mt-2 h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right image */}
        <div className="relative h-[500px] md:h-auto overflow-hidden group">
          <ImageOrPlaceholder
            data-process-img
            src={IMG.process}
            alt="عملية التسليم"
            label="Process · main"
            fill
            className="object-cover editorial-img transition-transform duration-1000 group-hover:scale-105"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-3 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-l from-accent to-transparent" />
        </div>
      </div>
    </section>
  );
}
