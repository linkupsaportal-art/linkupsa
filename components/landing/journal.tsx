"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ArrowLeft, BookOpen } from "lucide-react";
import { ImageOrPlaceholder } from "@/components/ui/image-or-placeholder";
import { IMG } from "@/lib/images";
import { splitChars } from "@/lib/split-text";
import { cn } from "@/lib/utils";

// ==========================================
// Sleek 3D Blender-Style SVG Icons (Journal)
// ==========================================

function Code3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-16 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="codeMetalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="40%" stopColor="#808080" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <radialGradient id="codeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="codeGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>
        <filter id="shadow3d-code" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="30" fill="url(#codeGlow)" />

      <g filter="url(#shadow3d-code)">
        <path
          d="M 38,32 L 24,50 L 38,68"
          stroke="url(#codeMetalGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 38,32 L 24,50 L 38,68"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        <path
          d="M 62,32 L 76,50 L 62,68"
          stroke="url(#codeMetalGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 62,32 L 76,50 L 62,68"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />

        <path
          d="M 56,26 L 44,74"
          stroke="url(#codeMetalGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 56,26 L 44,74"
          stroke="#e4e4e7"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

function Lock3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-16 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="lockGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lockShackle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#52525b" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <filter id="shadow3d-lock" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="30" fill="url(#lockGlow)" />

      <g filter="url(#shadow3d-lock)">
        <path
          d="M 34,44 V 30 C 34,18 66,18 66,30 V 44"
          stroke="url(#lockShackle)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        <rect
          x="24"
          y="42"
          width="52"
          height="38"
          rx="5"
          fill="url(#codeGlass)"
          stroke="url(#codeMetalGrad)"
          strokeWidth="1.5"
        />

        <circle cx="50" cy="56" r="4.5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        <path d="M 50,60.5 L 50,69" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="56" r="2.5" fill="#38bdf8" className="animate-pulse" />
      </g>
    </svg>
  );
}

function Tag3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-16 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="tagGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tagThread" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#71717a" />
        </linearGradient>
        <filter id="shadow3d-tag" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="30" fill="url(#tagGlow)" />

      <g filter="url(#shadow3d-tag)">
        <path
          d="M 32,24 C 36,12 48,12 50,26"
          stroke="url(#tagThread)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        <path
          d="M 50,26 L 70,44 V 74 C 70,78 66,82 62,82 H 30 C 26,82 22,78 22,74 V 44 Z"
          fill="url(#codeGlass)"
          stroke="url(#codeMetalGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        <circle cx="46" cy="38" r="4.5" fill="#18181b" stroke="url(#codeMetalGrad)" strokeWidth="1" />

        <path
          d="M 48,46 L 36,60 H 48 L 44,72 L 56,58 H 44 Z"
          fill="#38bdf8"
        />
      </g>
    </svg>
  );
}

const ARTICLES = [
  {
    icon: Code3D,
    cat: "تجربة العميل",
    sub: "تسليم",
    title: "كيف يصل طلبك خلال ثوانٍ بدون تدخل بشري",
    body: "تشريح كامل لرحلة الطلب من لحظة الدفع على متجرك حتى وصول المنتج لجوال العميل.",
  },
  {
    icon: Lock3D,
    cat: "أمان",
    sub: "حماية",
    title: "لماذا لا يستطيع أحد رؤية كلمات المرور — حتى نحن",
    body: "كل سر مشفر على مستوى البيانات، والأكواد تُولَّد فقط عند الطلب. صفر تخزين بصيغة قابلة للقراءة.",
  },
  {
    icon: Tag3D,
    cat: "ربط",
    sub: "سلة",
    title: "كيف ربطنا متجرك بـ Portalio SA في أقل من ٢٤ ساعة",
    body: "خطوة بخطوة من تنصيب التطبيق على سلة حتى تسليم أول طلب — بدون مطور، بدون وقت تطوير.",
  },
] as const;

export function Journal() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Hero text reveal (line by line)
      gsap.from("[data-journal-hero-text] > *", {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      // Hero image — strong scrub parallax + hint of zoom
      gsap.fromTo(
        "[data-journal-hero-img]",
        { scale: 1.18, y: -30 },
        {
          scale: 1.02,
          y: 60,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.5 },
        },
      );

      // List items reveal staggered with rotateX (3D)
      gsap.from("[data-journal-item]", {
        x: 60,
        opacity: 0,
        rotateX: -10,
        transformOrigin: "top center",
        stagger: 0.14,
        duration: 0.7,
        ease: "power4.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      // Section headline char reveal
      const title = root.current?.querySelector<HTMLElement>("[data-journal-title]");
      if (title) {
        const chars = splitChars(title);
        gsap.from(chars, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.04,
          duration: 0.7,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
      }

      // Hover-shift list items: icon spins, edge bar slides
      const items = root.current?.querySelectorAll<HTMLElement>("[data-journal-item]");
      items?.forEach((it) => {
        const icon = it.querySelector("[data-journal-icon]");
        if (!icon) return;
        const rotTo = gsap.quickTo(icon, "rotate", { duration: 0.4, ease: "power3.out" });
        it.addEventListener("mouseenter", () => rotTo(8));
        it.addEventListener("mouseleave", () => rotTo(0));
      });
    },
    { scope: root },
  );

  return (
    <section id="journal" ref={root} className="border-b border-[hsl(var(--hairline))] bg-bg">
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[hsl(var(--hairline))]">
        {/* Featured big visual article */}
        <div className="group relative min-h-[600px] flex flex-col justify-end p-8 md:p-12 overflow-hidden cursor-pointer">
          <ImageOrPlaceholder
            data-journal-hero-img
            src={IMG.journalHero}
            alt="Featured journal entry"
            label="Journal · hero"
            fill
            className="object-cover editorial-img absolute inset-0 transition-all duration-1000 ease-out group-hover:opacity-100 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />

          <div
            data-journal-hero-text
            className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 border text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border-accent/30 bg-accent/10 text-accent">
                مقال مميز
              </span>
              <span className="text-xs font-mono tracking-tight text-fg/50">
                ٠٧ / ٠٢ / ٢٠٢٦
              </span>
            </div>

            <h3 className="text-5xl md:text-7xl uppercase font-bold tracking-tighter mb-8 font-display">
              كيف يصل الطلب
              <br />
              <span className="font-normal text-fg/40">في ٣ ثوانٍ</span>
            </h3>

            <p className="leading-relaxed line-clamp-2 md:text-lg text-fg-muted max-w-md mb-8">
              تشريح كامل لرحلة الطلب من لحظة الدفع على متجرك حتى وصول المنتج لجوال العميل، مع كل القرارات وراء التجربة.
            </p>

            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest transition-colors text-fg group-hover:text-accent">
              اقرأ المقال
              <div className="size-8 rounded-full border flex items-center justify-center group-hover:text-bg transition-all duration-300 border-[hsl(var(--hairline-strong))] group-hover:bg-accent group-hover:border-accent">
                <ArrowLeft className="size-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: editorial list */}
        <div className="flex flex-col h-full">
          <div className="p-8 md:p-12 border-b border-[hsl(var(--hairline))] flex items-center justify-between bg-surface/40">
            <div>
              <h2 data-journal-title className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-2 font-display inline-block">
                اليوميات
              </h2>
              <p className="text-xs uppercase tracking-widest text-fg/40">
                خلف الكواليس
              </p>
            </div>
            <a
              href="#"
              className="px-5 py-2.5 border text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border-[hsl(var(--hairline-strong))] hover:bg-fg hover:text-bg"
            >
              الأرشيف
              <BookOpen className="size-3.5" />
            </a>
          </div>

          <div className="flex-1 divide-y divide-[hsl(var(--hairline))]">
            {ARTICLES.map((a, i) => (
              <a
                key={i}
                href="#"
                data-journal-item
                className="group/it block p-8 md:px-12 transition-colors relative overflow-hidden hover:bg-fg/5"
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 transform translate-x-full group-hover/it:translate-x-0 transition-transform duration-300 bg-accent" />
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                        {a.cat}
                      </span>
                      <span className="size-1 rounded-full bg-fg/20" />
                      <span className="text-[10px] uppercase tracking-widest text-fg/40">
                        {a.sub}
                      </span>
                    </div>
                    <h4 className="text-xl md:text-2xl font-semibold mb-2 group-hover/it:text-fg transition-colors text-fg/90">
                      {a.title}
                    </h4>
                    <p className="text-sm group-hover/it:text-fg/70 transition-colors text-fg/40">
                      {a.body}
                    </p>
                  </div>
                  <div data-journal-icon className="hidden md:flex transition-colors size-20 border items-center justify-center bg-fg/5 border-[hsl(var(--hairline))] group-hover/it:bg-accent/10 text-accent shrink-0 rounded-md">
                    <a.icon className="size-16" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
