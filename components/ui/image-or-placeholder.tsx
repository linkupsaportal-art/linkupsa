"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Renders a Next.js Image when the file resolves successfully; otherwise
 * shows a tasteful editorial placeholder (label + shimmer) so the layout
 * is never broken before the AI-generated assets ship.
 */
export function ImageOrPlaceholder({
  src,
  alt,
  label,
  className,
  fill,
  width,
  height,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  /** Short label drawn on the placeholder (e.g. "Hero · Slide 1"). */
  label?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={cn(
          "img-placeholder relative flex items-center justify-center overflow-hidden",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600/60 px-3 py-1 border border-zinc-400/40 bg-white/40 backdrop-blur-sm">
          {label ?? "Image · TBD"}
        </span>
      </div>
    );
  }

  // Use plain <img> with onError fallback for simplicity (next/image gets
  // grumpy about missing remote files at build time on static export paths).
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <Image
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className={cn(className)}
      fill={fill}
      width={fill ? undefined : (width ?? 1600)}
      height={fill ? undefined : (height ?? 900)}
      priority={priority}
      sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
      unoptimized
    />
  );
}
