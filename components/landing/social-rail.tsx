"use client";

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Mail, Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vertical social rail anchored to the right edge (RTL primary side).
 *  - Vertically rotated "تابعنا" wordmark at the top.
 *  - Vertical hairline that draws on first paint.
 *  - 6 social chips stacked below, magnetic on hover.
 *  - Hidden on small screens (< lg) to avoid covering content.
 *  - Fades out as the user scrolls into the footer (where socials live too).
 */

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
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

export function SocialRail() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Initial reveal — slide in from the right edge
      gsap.from(root.current, {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 1.6, // wait for PageReveal curtain
      });

      // Stagger pop the icons
      gsap.from("[data-rail-item]", {
        scale: 0.4,
        opacity: 0,
        stagger: 0.06,
        duration: 0.5,
        ease: "back.out(2)",
        delay: 1.8,
      });

      // Draw the vertical hairline
      gsap.from("[data-rail-line]", {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 1.1,
        ease: "power3.out",
        delay: 1.8,
      });

      // Magnetic on each social chip
      const chips = root.current?.querySelectorAll<HTMLAnchorElement>("[data-rail-item]");
      chips?.forEach((chip) => {
        const xTo = gsap.quickTo(chip, "x", { duration: 0.4, ease: "power3.out" });
        const yTo = gsap.quickTo(chip, "y", { duration: 0.4, ease: "power3.out" });
        chip.addEventListener("mousemove", (e) => {
          const r = chip.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.4);
          yTo((e.clientY - r.top - r.height / 2) * 0.4);
        });
        chip.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
      });

      // Hide rail when scrolling past the footer (footer has its own socials)
      gsap.to(root.current, {
        autoAlpha: 0,
        scrollTrigger: {
          trigger: "footer",
          start: "top 80%",
          end: "top 60%",
          scrub: 0.4,
        },
      });
    },
    { scope: root },
  );

  return (
    <aside
      ref={root}
      aria-label="تابعنا على الشبكات الاجتماعية"
      className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center gap-5 pointer-events-auto"
    >
      {/* Vertical "تابعنا" label */}
      <span
        className="font-mono text-[10px] uppercase tracking-[0.4em] text-fg-subtle"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        تابعنا
      </span>

      {/* Hairline drawing down */}
      <div data-rail-line className="h-12 w-px bg-gradient-to-b from-accent/70 to-transparent" />

      {/* Social chips column */}
      <div className="flex flex-col gap-3">
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            data-rail-item
            aria-label={s.label}
            className={cn(
              "size-10 rounded-full flex items-center justify-center transition-colors",
              "bg-surface-2/70 backdrop-blur-md border border-[hsl(var(--hairline))]",
              "text-fg-muted hover:bg-accent hover:text-accent-fg hover:border-accent",
            )}
          >
            <s.icon className="size-4" />
          </a>
        ))}
      </div>

      {/* Bottom hairline */}
      <div className="h-12 w-px bg-gradient-to-t from-accent/70 to-transparent" />
    </aside>
  );
}
