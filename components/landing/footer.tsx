"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP, gsap } from "@/lib/gsap";
import { Mail, MapPin, Phone, Calendar, Send, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Footer — Discord-flavored dark surface, single-row brand letter spread,
 * 4-column meta grid, and a unified bottom bar that contains:
 *   - copyright (right)
 *   - legal links
 *   - social icon row (left)
 *
 * GSAP: edge-stagger on letter spread, column reveal stagger.
 */

/** Inline brand icons (lucide-react dropped Instagram/Twitter/etc). */
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function XTwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2H21l-6.52 7.452L22 22h-6.832l-4.86-6.353L4.7 22H2l7.07-8.072L2 2h6.99l4.4 5.812L18.244 2Zm-1.155 18h1.66L8.97 4H7.21l9.879 16Z" />
    </svg>
  );
}
function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33a.07.07 0 0 0-.03.03C2 9.46 1.5 13.46 1.74 17.42c0 .02.01.04.03.05a16.36 16.36 0 0 0 4.93 2.5.08.08 0 0 0 .09-.03c.38-.52.72-1.07 1.01-1.65.02-.04 0-.08-.04-.09a10.85 10.85 0 0 1-1.55-.74.08.08 0 0 1-.01-.13c.1-.08.21-.16.31-.24a.06.06 0 0 1 .07-.01c3.27 1.49 6.79 1.49 10.02 0a.06.06 0 0 1 .07.01c.1.08.21.16.31.24a.08.08 0 0 1-.01.13c-.5.29-1.01.55-1.55.74-.04.02-.05.06-.04.09.3.58.64 1.13 1.01 1.65a.08.08 0 0 0 .09.03 16.31 16.31 0 0 0 4.94-2.5.08.08 0 0 0 .03-.05c.28-4.5-.62-8.45-2.96-12.06a.06.06 0 0 0-.03-.03ZM8.52 15.13c-.99 0-1.8-.91-1.8-2.02s.79-2.02 1.8-2.02c1.02 0 1.81.92 1.8 2.02 0 1.11-.79 2.02-1.8 2.02Zm6.97 0c-.98 0-1.8-.91-1.8-2.02s.79-2.02 1.8-2.02c1.02 0 1.81.92 1.8 2.02 0 1.11-.78 2.02-1.8 2.02Z" />
    </svg>
  );
}

const SOCIALS = [
  { href: "#", label: "Instagram", icon: InstagramIcon },
  { href: "#", label: "X / Twitter", icon: XTwitterIcon },
  { href: "#", label: "Discord", icon: DiscordIcon },
  { href: "#", label: "Telegram", icon: Send },
  { href: "#", label: "WhatsApp", icon: MessageCircle },
  { href: "mailto:hello@linkup.sa", label: "Email", icon: Mail },
] as const;

export function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-foot-letter]", {
        y: 28,
        opacity: 0,
        stagger: { each: 0.06, from: "edges" },
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });

      // Continuous parallax on letters as the user scrolls into the footer
      gsap.fromTo(
        "[data-foot-letter]",
        { y: 0 },
        {
          y: (i) => (i % 2 === 0 ? -10 : 10),
          ease: "none",
          stagger: 0.05,
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.5,
          },
        },
      );

      gsap.from("[data-foot-col]", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });

      gsap.from("[data-foot-social]", {
        scale: 0.6,
        opacity: 0,
        stagger: 0.05,
        duration: 0.4,
        ease: "back.out(2)",
        scrollTrigger: { trigger: root.current, start: "top 80%" },
      });

      // Magnetic socials
      const socials = root.current?.querySelectorAll<HTMLElement>("[data-foot-social]");
      socials?.forEach((s) => {
        const xTo = gsap.quickTo(s, "x", { duration: 0.4, ease: "power3.out" });
        const yTo = gsap.quickTo(s, "y", { duration: 0.4, ease: "power3.out" });
        s.addEventListener("mousemove", (e) => {
          const r = s.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.4);
          yTo((e.clientY - r.top - r.height / 2) * 0.4);
        });
        s.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative bg-surface-3 pt-24 pb-10 border-t border-[hsl(var(--hairline))]">
      {/* Letter-spread brand line — single row, no duplicate "تواصل" panel anymore */}
      <div className="md:px-12 px-6 mb-12 md:mb-16">
        <div dir="ltr" className="flex items-center justify-center gap-3 md:gap-5 opacity-80">
          {"LINKUP".split("").map((c, i) => (
            <span
              key={i}
              data-foot-letter
              className="font-display font-bold tracking-[0.4em] text-2xl md:text-4xl text-fg-muted"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* 4-column meta block */}
      <div className="md:px-12 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 max-w-7xl mx-auto">
          {/* Brand & Newsletter */}
          <div data-foot-col className="space-y-6">
            <Logo />
            <p className="text-sm leading-relaxed max-w-xs text-fg-subtle">
              منصة سعودية لتسليم المنتجات الرقمية تلقائياً. مستقلة بالكامل، آمنة، ومبنية لتكون ملكك وتحت سيطرتك بنسبة ١٠٠٪.
            </p>
            <div className="pt-2">
              <p className="text-xs font-semibold mb-2 text-fg">اشترك في النشرة</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 border px-3 py-2 text-xs placeholder-fg-faint focus:outline-none transition-all bg-surface-2 border-[hsl(var(--hairline-strong))] text-fg focus:border-accent rounded-md"
                />
                <button
                  type="submit"
                  className="font-semibold text-xs px-4 py-2 transition-colors text-accent-fg bg-accent hover:bg-accent-hi rounded-md"
                >
                  اشترك
                </button>
              </form>
            </div>
          </div>

          {/* Products */}
          <div data-foot-col>
            <h4 className="text-sm font-semibold mb-6 tracking-wide text-fg">المنتجات</h4>
            <ul className="space-y-3 text-sm text-fg-subtle">
              <li><a href="#exploration" className="transition-colors hover:text-accent">حسابات 2FA</a></li>
              <li><a href="#exploration" className="transition-colors hover:text-accent">Steam Guard</a></li>
              <li><a href="#exploration" className="transition-colors hover:text-accent">أكواد البريد</a></li>
              <li><a href="#exploration" className="transition-colors hover:text-accent">بطاقات الشحن</a></li>
              <li><a href="#exploration" className="transition-colors hover:text-accent">ملفات رقمية</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div data-foot-col>
            <h4 className="text-sm font-semibold mb-6 tracking-wide text-fg">المنصة</h4>
            <ul className="space-y-3 text-sm text-fg-subtle">
              <li><a href="#process" className="transition-colors hover:text-accent">العملية</a></li>
              <li><a href="#methodology" className="transition-colors hover:text-accent">المنهجية</a></li>
              <li><a href="#recognition" className="transition-colors hover:text-accent">لماذا LinkUp</a></li>
              <li><a href="#journal" className="transition-colors hover:text-accent">اليوميات</a></li>
              <li><Link href="/auth" className="transition-colors hover:text-accent">بوابة الإدارة</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div data-foot-col>
            <h4 className="text-sm font-semibold mb-6 tracking-wide text-fg">تواصل</h4>
            <ul className="space-y-3 text-sm text-fg-subtle">
              <li>
                <a href="#" className="transition-colors flex items-center gap-2 hover:text-accent">
                  <MapPin className="size-3.5" />
                  الرياض، المملكة العربية السعودية
                </a>
              </li>
              <li>
                <a href="tel:+966500000000" className="transition-colors flex items-center gap-2 hover:text-accent">
                  <Phone className="size-3.5" />
                  +966 50 000 0000
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors flex items-center gap-2 hover:text-accent">
                  <Calendar className="size-3.5" />
                  حجز اجتماع
                </a>
              </li>
              <li>
                <a href="mailto:hello@linkup.sa" className="transition-colors flex items-center gap-2 hover:text-accent">
                  <Mail className="size-3.5" />
                  hello@linkup.sa
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — socials + copyright + legal all in one row */}
        <div className="border-t border-[hsl(var(--hairline))] pt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto">
          {/* Socials — left in LTR, but visually first on RTL */}
          <div className="flex items-center gap-3 order-2 lg:order-1">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                data-foot-social
                className="size-10 rounded-full flex items-center justify-center transition-colors bg-surface-2 hover:bg-accent hover:text-accent-fg text-fg-muted border border-[hsl(var(--hairline))]"
              >
                <s.icon className="size-4" />
              </a>
            ))}
          </div>

          {/* Legal */}
          <div className="flex items-center flex-wrap gap-6 text-xs text-fg-faint order-3 lg:order-2">
            <a href="#" className="transition-colors hover:text-fg">سياسة الخصوصية</a>
            <a href="#" className="transition-colors hover:text-fg">الشروط</a>
            <a href="#" className="transition-colors hover:text-fg">خريطة الموقع</a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-fg-faint order-1 lg:order-3">
            © {new Date().getFullYear()} LinkUp. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
