"use client";

import { cn } from "@/lib/utils";

/**
 * OAuth provider row used at the top of login & register.
 * Three options: Google, Apple, GitHub. Stack vertically on mobile.
 *
 * Inline SVG marks (no lucide brand icons available; vendor brand
 * guidelines satisfied with simple monochrome glyphs).
 */
type Provider = "google" | "apple" | "github";

const PROVIDERS: { id: Provider; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "google", label: "Google", Icon: GoogleMark },
  { id: "apple", label: "Apple", Icon: AppleMark },
  { id: "github", label: "GitHub", Icon: GitHubMark },
];

export function OAuthRow({ disabled }: { disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          aria-label={`المتابعة عبر ${p.label}`}
          className={cn(
            "h-11 inline-flex items-center justify-center gap-2 rounded-md border border-[hsl(var(--hairline-strong))] bg-surface-2 text-sm font-medium text-fg",
            "hover:bg-fg/10 hover:border-fg/40 transition-colors",
            "disabled:opacity-60 disabled:pointer-events-none",
          )}
        >
          <p.Icon aria-hidden className="size-4" />
          <span className="hidden sm:inline-block">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

function GoogleMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
function AppleMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.04 12.81c-.02-2.18 1.78-3.23 1.86-3.28-1.01-1.48-2.59-1.69-3.15-1.71-1.34-.13-2.62.79-3.31.79-.7 0-1.74-.77-2.86-.75-1.47.02-2.83.85-3.59 2.16-1.53 2.65-.39 6.58 1.1 8.74.73 1.06 1.59 2.25 2.72 2.21 1.09-.04 1.5-.71 2.82-.71 1.31 0 1.69.71 2.85.69 1.18-.02 1.92-1.07 2.64-2.13.83-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.55zM13.97 6.31c.6-.73 1.01-1.74.9-2.75-.87.04-1.93.58-2.55 1.31-.55.65-1.04 1.69-.91 2.68.97.07 1.96-.5 2.56-1.24z" />
    </svg>
  );
}
function GitHubMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.93 10.93 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.26 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
