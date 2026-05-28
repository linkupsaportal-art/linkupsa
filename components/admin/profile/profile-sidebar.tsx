"use client";

import { useEffect, useState } from "react";
import { User, Mail, KeyRound, ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSection {
  id: string;
  label: string;
  icon: any;
  securityBadge?: boolean;
}

const SECTIONS: readonly ProfileSection[] = [
  { id: "profile", label: "الحساب", icon: User },
  { id: "email", label: "البريد الإلكتروني", icon: Mail },
  { id: "password", label: "كلمة المرور", icon: KeyRound },
  { id: "2fa", label: "المصادقة بخطوتين", icon: ShieldCheck, securityBadge: true },
];

/**
 * Sticky in-page nav for the profile page. Tracks which section is in view
 * via IntersectionObserver and highlights it. RTL-aware.
 */
export function ProfileSidebar({ hasMfa }: { hasMfa: boolean }) {
  const [active, setActive] = useState<string>("profile");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the section that's most visible
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    SECTIONS.forEach(({ id }) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="rounded-2xl bg-surface border border-[hsl(var(--hairline-strong))] card-soft p-2">
      <ul className="space-y-0.5">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          const Icon = s.icon;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-fg text-bg font-semibold"
                    : "text-fg-muted hover:text-fg hover:bg-surface-2",
                )}
              >
                <Icon
                  className={cn("size-4 shrink-0", isActive ? "text-accent" : "text-fg-muted")}
                  strokeWidth={1.7}
                />
                <span className="flex-1 truncate">{s.label}</span>
                {s.securityBadge && hasMfa && (
                  <span
                    className={cn(
                      "grid place-items-center size-4 rounded-full",
                      isActive ? "bg-accent text-accent-fg" : "bg-success/15 text-success",
                    )}
                    aria-label="مفعّل"
                  >
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
