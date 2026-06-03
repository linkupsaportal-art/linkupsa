"use client";

import { useState, useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { ImageOrPlaceholder } from "@/components/ui/image-or-placeholder";
import { IMG } from "@/lib/images";
import { splitChars } from "@/lib/split-text";
import { Magnetic } from "@/components/effects/magnetic";

/**
 * Exploration — paired-image gallery + huge editorial title.
 *
 * Animation pass:
 *  - Title: char-split mask reveal on every change.
 *  - Images: clip-path inset reveal + counter-direction parallax scrub.
 *  - Number indicator: slot-machine roll on change.
 *  - Page progress bar at the bottom of the gallery side.
 *  - Tilt on hover for the gallery cluster.
 *  - Magnetic prev/next buttons.
 */

const PROJECTS = [
  {
    title: "حسابات",
    subtitle: "مع 2FA",
    description:
      "حسابات رقمية محمية بمصادقة Google Authenticator. السر مشفر داخل قاعدة البيانات، والكود يُولَّد على الخادم لحظياً ويُسلَّم للعميل عند الطلب.",
    img1: IMG.prod2faA,
    img2: IMG.prod2faB,
    label1: "Product · 2FA · A",
    label2: "Product · 2FA · B",
  },
  {
    title: "Steam",
    subtitle: "مع Steam Guard",
    description:
      "حسابات Steam كاملة مع نظام حماية مدمج. يولّد Portalio SA كود الحماية لعميلك تلقائياً عند الحاجة، بنفس آلية تطبيق Steam الرسمي.",
    img1: IMG.prodSteamA,
    img2: IMG.prodSteamB,
    label1: "Product · Steam · A",
    label2: "Product · Steam · B",
  },
  {
    title: "أكواد",
    subtitle: "إيميل و SMS",
    description:
      "نجلب كود التحقق من البريد المرتبط بالحساب لحظة طلبه. آلي بالكامل، بدون أن يلمس الإنسان كلمة المرور.",
    img1: IMG.prodEmailA,
    img2: IMG.prodEmailB,
    label1: "Product · Email · A",
    label2: "Product · Email · B",
  },
  {
    title: "ملفات",
    subtitle: "روابط موقعة",
    description:
      "ملفات رقمية تُسلَّم عبر روابط Storage موقعة قصيرة العمر (≤5 دقائق). لا تسريب، لا إعادة استخدام، تحميل واحد بهوية واحدة.",
    img1: IMG.prodFilesA,
    img2: IMG.prodFilesB,
    label1: "Product · Files · A",
    label2: "Product · Files · B",
  },
] as const;

export function Exploration() {
  const root = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const [idx, setIdx] = useState(0);
  const project = PROJECTS[idx];

  // Per-change animations (title chars, images clip-reveal, slot index)
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      const chars = titleRef.current ? splitChars(titleRef.current) : [];
      tl.from(chars, { yPercent: 110, opacity: 0, stagger: 0.03, duration: 0.7 });

      tl.fromTo(subRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.4");
      tl.fromTo(descRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.3");

      // Images: clip-path inset reveal
      tl.fromTo(
        "[data-explore-img-1]",
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power4.out" },
        "-=0.7",
      );
      tl.fromTo(
        "[data-explore-img-2]",
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power4.out" },
        "-=0.85",
      );

      // Slot machine number — old digit slides up, new slides in
      if (indexRef.current) {
        gsap.fromTo(
          indexRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.6)" },
        );
      }
    },
    { dependencies: [idx], scope: root },
  );

  // One-time scroll setup
  useGSAP(
    () => {
      // Section reveal
      gsap.from("[data-explore-col]", {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });

      // Counter-direction image parallax
      gsap.fromTo(
        "[data-explore-img-1]",
        { y: -30 },
        {
          y: 30,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        "[data-explore-img-2]",
        { y: 30 },
        {
          y: -30,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );

      // Section progress bar
      gsap.fromTo(
        "[data-explore-progress]",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "right center",
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
            end: "bottom 20%",
            scrub: 0.4,
          },
        },
      );

      // Mouse-driven 3D tilt for the gallery cluster
      const gallery = galleryRef.current;
      if (gallery) {
        gsap.set(gallery, { rotateX: 0, rotateY: 0, transformPerspective: 1200, transformStyle: "preserve-3d" });
        const xTo = gsap.quickTo(gallery, "rotationY", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(gallery, "rotationX", { duration: 0.5, ease: "power3.out" });
        gallery.addEventListener("mousemove", (e) => {
          const r = gallery.getBoundingClientRect();
          xTo(((e.clientX - r.left) / r.width - 0.5) * 8);
          yTo(-((e.clientY - r.top) / r.height - 0.5) * 6);
        });
        gallery.addEventListener("mouseleave", () => {
          xTo(0); yTo(0);
        });
      }
    },
    { scope: root },
  );

  return (
    <section
      id="exploration"
      ref={root}
      className="grid grid-cols-1 md:grid-cols-2 border-b border-[hsl(var(--hairline))]"
    >
      {/* Left: paired images */}
      <div
        data-explore-col
        ref={galleryRef}
        className="md:p-12 p-6 group border-l-0 md:border-l border-[hsl(var(--hairline))] overflow-hidden order-2 md:order-1"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="bg-surface-2 w-full h-64 md:h-80 relative overflow-hidden rounded-md">
            <ImageOrPlaceholder
              data-explore-img-1
              src={project.img1}
              alt={project.title}
              label={project.label1}
              fill
              className="object-cover editorial-img opacity-90 group-hover:scale-105 transition-transform duration-700"
              sizes="(min-width: 768px) 25vw, 50vw"
            />
          </div>
          <div className="w-full h-64 md:h-80 relative overflow-hidden translate-y-8 bg-surface-2 rounded-md">
            <ImageOrPlaceholder
              data-explore-img-2
              src={project.img2}
              alt={project.subtitle}
              label={project.label2}
              fill
              className="object-cover editorial-img opacity-90 group-hover:scale-105 transition-transform duration-700 delay-75"
              sizes="(min-width: 768px) 25vw, 50vw"
            />
          </div>
        </div>
        <div className="mt-6 h-0.5 bg-fg/5 overflow-hidden">
          <div data-explore-progress className="h-full bg-gradient-to-l from-accent to-accent-hi" />
        </div>
      </div>

      {/* Right: typography + nav */}
      <div data-explore-col className="md:p-12 p-6 flex flex-col justify-center order-1 md:order-2">
        <h2
          ref={titleRef}
          className="text-7xl md:text-9xl font-semibold tracking-tighter mb-3 font-display"
        >
          {project.title}
        </h2>
        <h3 ref={subRef} className="text-xl md:text-2xl font-semibold mb-4 text-fg-muted">
          {project.subtitle}
        </h3>
        <p ref={descRef} className="leading-relaxed text-sm md:text-base text-fg-subtle max-w-md mb-10">
          {project.description}
        </p>

        <div className="flex items-center justify-between mt-auto pt-8 border-t border-[hsl(var(--hairline))]">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-semibold font-mono inline-flex items-baseline overflow-hidden">
              <span ref={indexRef} className="inline-block">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-base align-top mr-1 text-fg/30">
                / {String(PROJECTS.length).padStart(2, "0")}
              </span>
            </span>
            <div className="flex gap-2 mr-4">
              <Magnetic strength={0.3}>
                <button
                  onClick={() => setIdx((i) => (i - 1 + PROJECTS.length) % PROJECTS.length)}
                  className="size-9 border border-[hsl(var(--hairline-strong))] rounded-full flex items-center justify-center transition hover:bg-accent hover:border-accent hover:text-accent-fg"
                  aria-label="السابق"
                >
                  <ChevronRight className="size-4" />
                </button>
              </Magnetic>
              <Magnetic strength={0.3}>
                <button
                  onClick={() => setIdx((i) => (i + 1) % PROJECTS.length)}
                  className="size-9 border border-[hsl(var(--hairline-strong))] rounded-full flex items-center justify-center transition hover:bg-accent hover:border-accent hover:text-accent-fg"
                  aria-label="التالي"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </Magnetic>
            </div>
          </div>

          <Magnetic strength={0.2}>
            <a
              href="#hero-form"
              className="px-6 py-3 border border-[hsl(var(--hairline-strong))] rounded-md text-sm font-medium transition-colors flex items-center gap-2 hover:bg-accent hover:border-accent hover:text-accent-fg"
            >
              استلم طلبك
              <ArrowLeft className="size-4" />
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
