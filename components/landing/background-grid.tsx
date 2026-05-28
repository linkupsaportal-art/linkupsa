"use client";

/**
 * Fixed-position editorial backdrop:
 *  - 4-column hairline vertical guides (`.bg-grid-lines`)
 *  - 2 SVG neon accent lines that crawl horizontally / vertically (LUMEN trick)
 *
 * Sits behind every section, pointer-events-none.
 */
export function BackgroundGrid() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-grid-lines">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="neon-h" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(199 89% 48% / 0)" />
            <stop offset="50%" stopColor="hsl(199 89% 48% / 0.5)" />
            <stop offset="100%" stopColor="hsl(199 89% 48% / 0)" />
          </linearGradient>
          <linearGradient id="neon-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(199 89% 48% / 0)" />
            <stop offset="50%" stopColor="hsl(199 89% 48% / 0.5)" />
            <stop offset="100%" stopColor="hsl(199 89% 48% / 0)" />
          </linearGradient>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal traveler at 25% */}
        <line
          x1="-200"
          y1="25%"
          x2="0"
          y2="25%"
          stroke="url(#neon-h)"
          strokeWidth="1"
          filter="url(#neon-glow)"
        >
          <animate attributeName="x1" values="-200;100%" dur="15s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0;120%" dur="15s" repeatCount="indefinite" />
        </line>

        {/* Vertical traveler at 75% */}
        <line
          x1="75%"
          y1="-200"
          x2="75%"
          y2="0"
          stroke="url(#neon-v)"
          strokeWidth="1"
          filter="url(#neon-glow)"
        >
          <animate attributeName="y1" values="-200;100%" dur="12s" repeatCount="indefinite" />
          <animate attributeName="y2" values="0;120%" dur="12s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  );
}
