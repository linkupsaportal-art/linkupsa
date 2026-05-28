/**
 * Centralized image registry.
 *
 * Every image used on the landing page is referenced through this map.
 * Files live under `/public/images/` as 1600w WebP at quality 80.
 *
 * Until the AI-generated assets land, we render a styled placeholder
 * (`<ImageOrPlaceholder>`) so the layout stays intact and we can ship a
 * working build right now.
 */

export const IMG = {
  // Hero — center carousel, 3 slides
  heroSlide1: "/images/hero-slide-1.webp", // a hand receiving a glowing digital envelope
  heroSlide2: "/images/hero-slide-2.webp", // close-up of an account dashboard / 2FA code
  heroSlide3: "/images/hero-slide-3.webp", // network of glowing dots forming a Saudi map silhouette

  // Exploration carousel — 4 product flavors, 2 images each
  prod2faA: "/images/prod-2fa-a.webp",
  prod2faB: "/images/prod-2fa-b.webp",
  prodSteamA: "/images/prod-steam-a.webp",
  prodSteamB: "/images/prod-steam-b.webp",
  prodEmailA: "/images/prod-email-a.webp",
  prodEmailB: "/images/prod-email-b.webp",
  prodFilesA: "/images/prod-files-a.webp",
  prodFilesB: "/images/prod-files-b.webp",

  // Process / featured case study image
  process: "/images/process.webp", // close-up of fingerprint scanner / vault dial / encrypted ledger

  // Methodology — main hero side image
  methodology: "/images/methodology.webp", // hands at a keyboard with code reflecting in glasses

  // Journal — featured large + 3 small thumbnails
  journalHero: "/images/journal-hero.webp", // dark warehouse of glowing neon shelves
  journal1: "/images/journal-1.webp",
  journal2: "/images/journal-2.webp",
  journal3: "/images/journal-3.webp",
} as const;

export type ImageKey = keyof typeof IMG;
