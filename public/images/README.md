# `/public/images/` — Generated WebP assets

All landing-page imagery lives here. File names are referenced in `web/lib/images.ts` —
do **not** rename without updating the registry.

| File                    | Used in section          | Notes                          |
| ----------------------- | ------------------------ | ------------------------------ |
| `hero-slide-1.webp`     | Hero · carousel slide 1  | priority, eagerly loaded       |
| `hero-slide-2.webp`     | Hero · carousel slide 2  |                                |
| `hero-slide-3.webp`     | Hero · carousel slide 3  |                                |
| `prod-2fa-a.webp`       | Exploration · 2FA · A    | left big tile                  |
| `prod-2fa-b.webp`       | Exploration · 2FA · B    | right tile, vertical-offset    |
| `prod-steam-a.webp`     | Exploration · Steam · A  |                                |
| `prod-steam-b.webp`     | Exploration · Steam · B  |                                |
| `prod-email-a.webp`     | Exploration · Email · A  |                                |
| `prod-email-b.webp`     | Exploration · Email · B  |                                |
| `prod-files-a.webp`     | Exploration · Files · A  |                                |
| `prod-files-b.webp`     | Exploration · Files · B  |                                |
| `process.webp`          | Process · case study     | full-bleed right column        |
| `methodology.webp`      | Methodology · main       | parallax scrub on scroll       |
| `journal-hero.webp`     | Journal · featured       | parallax scrub, cover          |
| `journal-1.webp`        | Journal · list item 1    | reserved (not yet used)        |
| `journal-2.webp`        | Journal · list item 2    | reserved                        |
| `journal-3.webp`        | Journal · list item 3    | reserved                        |

## Specs (all images)

- **Format:** WebP, quality 80
- **Color:** B&W / heavy desaturation (the page applies CSS `grayscale + contrast(1.18)` on
  top, so generate either neutral or already-monochrome — never punchy color).
- **Aspect:** 3:4 portrait or 4:3 landscape — never letterboxed
- **Long edge:** 1600px (we serve via `unoptimized` Next.js image)
- **No watermarks, no text overlays, no logos**
