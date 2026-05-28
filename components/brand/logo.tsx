import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * LinkUp Logo component.
 * Uses the official brand logo converted to high-performance WebP.
 */
export function Logo({
  className,
  glyphOnly = false,
  label = "LinkUp",
}: {
  className?: string;
  glyphOnly?: boolean;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight text-2xl text-fg",
        className,
      )}
      aria-label="LinkUp — منصة التسليم الرقمي"
    >
      <LogoGlyph className="size-7" />
      {!glyphOnly && <span dir="ltr" className="leading-none [unicode-bidi:isolate]">{label}</span>}
    </span>
  );
}

export function LogoGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex items-center justify-center bg-transparent overflow-hidden rounded-md",
        className,
      )}
    >
      <Image
        src="/linkup-logo.webp"
        alt="LinkUp Logo"
        fill
        sizes="32px"
        className="object-contain"
        priority
      />
    </span>
  );
}
