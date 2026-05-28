"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "@/components/effects/magnetic";
import { splitChars } from "@/lib/split-text";

// ==========================================
// Sleek 3D Blender-Style SVG Icons
// ==========================================

function Trophy3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-24 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="30%" stopColor="#a1a1aa" />
          <stop offset="70%" stopColor="#3f3f46" />
          <stop offset="100%" stopColor="#18181b" />
        </linearGradient>
        <radialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="45" r="28" fill="url(#glowGrad)" />

      <g filter="url(#shadow3d)">
        {/* Trophy Base */}
        <path d="M 30,80 L 70,80 L 65,72 L 35,72 Z" fill="url(#metalGrad)" stroke="#71717a" strokeWidth="0.5" />
        <path d="M 40,72 L 60,72 L 56,60 L 44,60 Z" fill="url(#metalGrad)" stroke="#52525b" strokeWidth="0.5" />
        
        {/* Handles */}
        <path d="M 32,32 C 22,32 18,48 34,54" stroke="url(#metalGrad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M 68,32 C 78,32 82,48 66,54" stroke="url(#metalGrad)" strokeWidth="3" strokeLinecap="round" />

        {/* Trophy Cup Body */}
        <path d="M 32,28 C 32,58 68,58 68,28 Z" fill="url(#glassGrad)" stroke="url(#metalGrad)" strokeWidth="1.5" />
        
        {/* Metallic Top Rim */}
        <ellipse cx="50" cy="28" rx="18" ry="4" fill="#18181b" stroke="url(#metalGrad)" strokeWidth="1.5" />

        {/* Floating Core Indicator */}
        <circle cx="50" cy="40" r="5" fill="#0ea5e9" opacity="0.8" className="animate-pulse" />
      </g>
    </svg>
  );
}

function Badge3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-24 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#52525b" />
          <stop offset="50%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id="frostedOverlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>
        <filter id="shadow3d-badge" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="35" fill="url(#badgeGlow)" />

      <g filter="url(#shadow3d-badge)">
        {/* Outer Wavy Seal */}
        <path
          d="M 50,15 L 59,20 L 69,18 L 73,27 L 82,31 L 81,41 L 85,50 L 81,59 L 82,69 L 73,73 L 69,82 L 59,80 L 50,85 L 41,80 L 31,82 L 27,73 L 18,69 L 19,59 L 15,50 L 19,41 L 18,31 L 27,27 L 31,18 L 41,20 Z"
          fill="url(#darkMetal)"
          stroke="#71717a"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Inner Glass Plate */}
        <circle cx="50" cy="50" r="23" fill="url(#frostedOverlay)" stroke="#a1a1aa" strokeWidth="1" />

        {/* Center Checkmark */}
        <path
          d="M 38,50 L 46,58 L 62,42"
          stroke="url(#metalGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 38,50 L 46,58 L 62,42"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

function Security3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-24 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="secGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shackleMetal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="50%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
        <filter id="shadow3d-sec" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="35" fill="url(#secGlow)" />

      <g filter="url(#shadow3d-sec)">
        {/* Shackle */}
        <path
          d="M 32,45 V 32 C 32,20 68,20 68,32 V 45"
          stroke="url(#shackleMetal)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Lock Body */}
        <path
          d="M 26,45 H 74 L 78,72 H 22 Z"
          fill="url(#glassGrad)"
          stroke="url(#metalGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Front Metal Bezel */}
        <path
          d="M 34,49 H 66 L 69,68 H 31 Z"
          fill="#18181b"
          stroke="#52525b"
          strokeWidth="1"
        />

        {/* Glowing Security Core */}
        <circle cx="50" cy="58" r="5" fill="#09090b" stroke="url(#metalGrad)" strokeWidth="1" />
        <line x1="50" y1="63" x2="50" y2="66" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="58" r="2.5" fill="#38bdf8" className="animate-pulse" />
      </g>
    </svg>
  );
}

function Serverless3D({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-24 transition-all duration-500", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="prismGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <filter id="shadow3d-serv" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="35" fill="url(#prismGlow)" />

      <g filter="url(#shadow3d-serv)">
        {/* Floating Top/Left Prism */}
        <g className="animate-[bounce_3.5s_infinite_ease-in-out]">
          <path d="M 32,20 L 45,30 L 32,40 Z" fill="url(#glassGrad)" stroke="url(#metalGrad)" strokeWidth="1" />
          <path d="M 32,20 L 22,32 L 32,40 Z" fill="#27272a" stroke="url(#metalGrad)" strokeWidth="1" opacity="0.8" />
          <line x1="32" y1="20" x2="32" y2="40" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
        </g>

        {/* Floating Right Prism */}
        <g className="animate-[bounce_4s_infinite_ease-in-out_0.5s]">
          <path d="M 68,30 L 78,42 L 64,50 Z" fill="url(#glassGrad)" stroke="url(#metalGrad)" strokeWidth="1" />
          <path d="M 68,30 L 58,40 L 64,50 Z" fill="#27272a" stroke="url(#metalGrad)" strokeWidth="1" opacity="0.8" />
          <line x1="64" y1="30" x2="64" y2="50" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
        </g>

        {/* Floating Center Bottom Big Prism */}
        <g className="animate-[bounce_4.5s_infinite_ease-in-out_1s]">
          <path d="M 50,45 L 65,60 L 50,75 Z" fill="url(#glassGrad)" stroke="url(#metalGrad)" strokeWidth="1.5" />
          <path d="M 50,45 L 35,60 L 50,75 Z" fill="#18181b" stroke="url(#metalGrad)" strokeWidth="1.5" opacity="0.9" />
          <line x1="50" y1="45" x2="50" y2="75" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}

const ITEMS = [
  {
    icon: Trophy3D,
    kicker: "أداء ميداني",
    title: "أكثر من 12,000 طلب وُصِّل بنجاح",
    body: "خلال أول 6 أشهر، بدون فشل واحد ناتج عن المنصة.",
    cta: "اطّلع على الأرقام",
  },
  {
    icon: Badge3D,
    kicker: "Salla Partner",
    title: "متوافق مع Salla 100%",
    body: "نستعمل الواجهات الرسمية لسلة فقط، بدون اختصارات أو حلول جانبية.",
    cta: "تفاصيل الربط",
  },
  {
    icon: Security3D,
    kicker: "أمان موثّق",
    title: "تشفير على مستوى الصف",
    body: "كل سر مشفر، الصلاحيات صارمة، وكل عملية مسجلة في سجل لا يمكن التلاعب به.",
    cta: "ورقة الأمان",
  },
  {
    icon: Serverless3D,
    kicker: "صفر صيانة",
    title: "تشتغل ٢٤/٧ بدون توقف",
    body: "تحديثات تلقائية، نسخ احتياطي يومي، لا قلق ولا صيانة. أنت تركّز على متجرك، نحن نتولى الباقي.",
    cta: "البنية التحتية",
  },
] as const;

export function Recognition() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const headline = root.current?.querySelector<HTMLElement>("[data-rec-headline]");
      if (headline) {
        const chars = splitChars(headline);
        gsap.from(chars, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.04,
          duration: 0.7,
          ease: "power4.out",
          scrollTrigger: { trigger: root.current, start: "top 75%" },
        });
      }

      gsap.from("[data-rec-card]", {
        y: 80,
        opacity: 0,
        rotate: -2,
        stagger: 0.12,
        duration: 0.8,
        ease: "power4.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      gsap.from("[data-rec-icon]", {
        scale: 0.5,
        opacity: 0,
        rotate: -45,
        stagger: 0.12,
        duration: 0.6,
        ease: "back.out(1.8)",
        scrollTrigger: { trigger: root.current, start: "top 60%" },
      });

      // 3D tilt + lift per card on cursor
      const cards = root.current?.querySelectorAll<HTMLElement>("[data-rec-card]");
      cards?.forEach((card) => {
        card.style.transformStyle = "preserve-3d";
        const yTo = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });
        const rxTo = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3.out" });
        const ryTo = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3.out" });

        card.addEventListener("mouseenter", () => yTo(-6));
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ryTo(px * 8);
          rxTo(-py * 6);
        });
        card.addEventListener("mouseleave", () => {
          yTo(0); rxTo(0); ryTo(0);
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="recognition" ref={root} className="border-b border-[hsl(var(--hairline))]">
      <div className="px-6 md:px-12 py-16 flex items-end justify-between border-b border-[hsl(var(--hairline))]">
        <h2
          data-rec-headline
          className="text-5xl md:text-7xl font-bold tracking-tighter uppercase font-display"
        >
          موثوق
        </h2>
        <Magnetic strength={0.3}>
          <a
            href="#hero-form"
            className="px-6 py-3 border border-[hsl(var(--hairline-strong))] rounded-md text-sm font-medium transition-colors flex items-center gap-2 mb-2 hover:bg-accent hover:border-accent hover:text-accent-fg"
          >
            ابدأ الآن
            <ArrowLeft className="size-4" />
          </a>
        </Magnetic>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[hsl(var(--hairline))]">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            data-rec-card
            className={cn("p-8 group transition-colors cursor-pointer hover:bg-fg/5")}
          >
            <div className="flex h-40 border-b mb-6 items-center justify-center border-[hsl(var(--hairline))]">
              <item.icon
                data-rec-icon
                className="size-28 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <p className="text-[10px] font-bold uppercase mb-2 text-accent">{item.kicker}</p>
            <h3 className="leading-tight transition-colors text-xl font-semibold mb-6">
              {item.title}
            </h3>
            <p className="text-sm leading-relaxed text-fg-subtle mb-6 line-clamp-2">{item.body}</p>
            <div className="flex items-center text-xs font-medium group-hover:text-fg transition-colors text-fg/50">
              {item.cta}
              <ChevronLeft className="size-3 mr-1" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
