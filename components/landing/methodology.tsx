"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ArrowUpRight, Aperture } from "lucide-react";
import { ImageOrPlaceholder } from "@/components/ui/image-or-placeholder";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Methodology — left visual + floating data card, right philosophy + interactive list.
 * GSAP: image scale-in, floating card slide-up, list items reveal on scroll, hover h-grow detail.
 */

const STEPS = [
  {
    n: "01",
    title: "استقبال الطلب",
    detail: "بمجرد اكتمال الدفع على متجرك، يصلنا الطلب آلياً ونبدأ التحقق منه على الفور.",
  },
  {
    n: "02",
    title: "التحقق من الدفع",
    detail: "نتأكد أن الطلب مدفوع بالكامل قبل تنفيذ أي شيء — صفر مفاجآت.",
  },
  {
    n: "03",
    title: "اختيار المنتج المناسب",
    detail: "نوزّع الحسابات والأكواد بنظام عادل يضمن أن لا يستلم عميلان نفس المنتج.",
  },
  {
    n: "04",
    title: "التسليم والإشعار",
    detail: "نرسل المنتج عبر القنوات اللي تختارها: واتساب، إيميل، رسائل، أو تليجرام.",
  },
] as const;

export function Methodology() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Floating data card — entry path: drift in from below-right with a slight rotate
      gsap.from("[data-meth-card]", {
        y: 60,
        x: 40,
        rotate: 4,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      // Floating card breathes (idle motion)
      gsap.to("[data-meth-card]", {
        y: -8,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      gsap.from("[data-meth-heading] > .word", {
        yPercent: 110,
        opacity: 0,
        stagger: 0.06,
        duration: 0.7,
        ease: "power4.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      gsap.from("[data-meth-step]", {
        x: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 65%" },
      });

      // Image scrub — counter-direction parallax
      gsap.fromTo(
        "[data-meth-img]",
        { scale: 1.1, y: -40 },
        {
          scale: 1,
          y: 40,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );

      // Big aperture watermark slowly rotates
      gsap.to("[data-meth-aperture]", {
        rotate: 360,
        duration: 90,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: root },
  );

  // Manually pre-split heading words because we don't run splitChars here (lighter).
  return (
    <section
      id="methodology"
      ref={root}
      className="grid grid-cols-1 lg:grid-cols-2 border-b border-[hsl(var(--hairline))] bg-bg group"
    >
      {/* Left: Visual + Floating card */}
      <div className="relative min-h-[500px] lg:min-h-[700px] border-r-0 lg:border-l border-[hsl(var(--hairline))] overflow-hidden">
        <ImageOrPlaceholder
          data-meth-img
          src={IMG.methodology}
          alt="Engineering methodology"
          label="Methodology · main"
          fill
          className="object-cover editorial-img opacity-80 group-hover:opacity-100 transition-opacity duration-1000"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

        <div
          data-meth-card
          className={cn(
            "absolute bottom-8 right-8 left-8 md:right-12 md:left-auto md:w-80",
            "backdrop-blur-xl border border-[hsl(var(--hairline-strong))] p-6 z-10",
            "bg-surface/85 hover:bg-surface transition-colors duration-300",
          )}
        >
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[hsl(var(--hairline))]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              الستاك المعتمد
            </span>
            <Aperture className="size-4 text-fg-subtle" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-fg/50">
              الموثوقية
            </p>
            <p className="text-lg font-medium tracking-tight">
              جاهزية ٢٤/٧ · صفر صيانة
            </p>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-fg/50">
              الأمان
            </p>
            <p className="text-lg font-medium tracking-tight">
              تشفير على مستوى البيانات
            </p>
          </div>
        </div>
      </div>

      {/* Right: Philosophy + step list */}
      <div className="flex flex-col">
        <div className="p-8 md:p-16 flex-1 flex flex-col justify-center relative">
          <div className="absolute top-0 left-0 p-6 opacity-5">
            <Aperture data-meth-aperture className="size-[120px]" strokeWidth={0.5} />
          </div>

          <p className="text-[10px] uppercase flex items-center gap-3 font-bold text-accent tracking-[0.2em] mb-6">
            <span className="size-2 rounded-full bg-accent" />
            الرؤية
          </p>
          <h2
            data-meth-heading
            className="text-4xl md:text-6xl font-semibold tracking-tighter leading-none mb-6 font-display"
          >
            <span className="word inline-block">آلي،</span>{" "}
            <span className="word inline-block">آمن،</span>{" "}
            <span className="word inline-block text-fg/30">و موثوق.</span>
          </h2>
          <p className="leading-relaxed text-sm md:text-base text-fg-subtle max-w-md">
            التسليم الرقمي ليس مجرد إرسال ملف. إنه ثقة تُبنى مع كل طلب يصل سليماً، آمناً، ودون أخطاء.
            بنينا Portalio SA على هذا المبدأ — كل طبقة تتحقق من الطبقة الأخرى.
          </p>
        </div>

        {/* Steps list */}
        <div className="border-t divide-y border-[hsl(var(--hairline))] divide-[hsl(var(--hairline))] bg-surface">
          {STEPS.map((s) => (
            <a
              key={s.n}
              href="#process"
              data-meth-step
              className="group/step block p-6 md:px-12 md:py-8 transition-colors duration-300 hover:bg-fg/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="font-mono text-xs transition-colors text-accent/50 group-hover/step:text-accent">
                    {s.n}
                  </span>
                  <div className="flex flex-col">
                    <h3 className="group-hover/step:text-fg transition-colors text-lg font-medium text-fg/80 tracking-tight">
                      {s.title}
                    </h3>
                    <span className="text-xs mt-1 opacity-0 h-0 group-hover/step:opacity-100 group-hover/step:h-auto transition-all duration-300 overflow-hidden transform translate-y-2 group-hover/step:translate-y-0 text-fg/40">
                      {s.detail}
                    </span>
                  </div>
                </div>
                <div className="size-8 rounded-full border flex items-center justify-center transition-all border-[hsl(var(--hairline-strong))] group-hover/step:border-accent/50 group-hover/step:bg-accent/10">
                  <ArrowUpRight className="size-4 text-fg/50 group-hover/step:text-accent" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
