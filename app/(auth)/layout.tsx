import type { Metadata } from "next";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

/**
 * Shared layout for /login and /register.
 *
 * Split-screen at lg+ :
 *   - Right (RTL primary) : 1/2 — form column, full-bleed, scrollable on small viewports
 *   - Left                : 1/2 — brand panel with testimonial, sticky background
 *
 * Below lg, the brand panel collapses to a thin top strip so the form
 * stays the focus.
 */

export const metadata: Metadata = {
  title: { default: "حسابك على LinkUp", template: "%s · LinkUp" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh w-full grid lg:grid-cols-2 bg-bg">
      {/* Form column — right in RTL */}
      <main className="relative flex flex-col items-center justify-center px-6 py-10 md:px-10 lg:px-16 order-2 lg:order-1 min-h-svh">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Brand column — left in RTL */}
      <aside className="relative hidden lg:block bg-surface-3 border-l border-[hsl(var(--hairline))] order-1 lg:order-2 overflow-hidden">
        <AuthBrandPanel />
      </aside>
    </div>
  );
}
