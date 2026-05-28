# 📝 Implementation Plan — Landing Page Premium Refactor

This plan details the premium refactoring, beautification, and addition of custom animations (GSAP, scrolling marquees, circular rotating texts) for the digital product delivery platform **Wasel** landing page, resolving all overlapping layout issues and establishing a high-end editorial aesthetic.

---

## 📅 Ordered Task Breakdown

### 1. [Globals CSS] Global Keyframes & Classes
- [ ] Add `@keyframes spin-clockwise` and `.animate-spin-slow` in `web/app/globals.css`.
- [ ] Add `@keyframes marquee-ltr` and `.animate-marquee` in `web/app/globals.css`.
- [ ] Ensure perfect behavior in RTL environments (e.g. using `dir="ltr"` container helper for marquee math).

### 2. [Navbar] Premium Header Redesign
- [ ] Implement smooth GSAP slide-down entrance animation (`y: -50`, `opacity: 0` to normal) on navbar mount.
- [ ] On **Desktop (`hidden md:flex`)**:
  - [ ] Show `Logo` on the right (RTL start).
  - [ ] Show centered navigation links (`المنتجات`, `العملية`, `المنهجية`, `موثوق`, `اليوميات`) with a custom underline hover reveal (editorial hairline transition).
  - [ ] Show a premium left CTA button ("استلم طلبك") deep-linking to `#hero-form`, featuring a custom arrow that slides to the left on hover (`group-hover:-translate-x-1.5 transition-transform`).
- [ ] On **Mobile (`flex md:hidden`)**:
  - [ ] Show `Logo` and a clean, morphing Menu/X toggle button on the left (RTL end).
  - [ ] Clicking the button slides in a full-screen, high-end overlay menu from the top/right.
  - [ ] Blur background glass treatment (`backdrop-blur-xl bg-bg/90`).
  - [ ] Staggered menu item slide-ins driven by GSAP animations (`y: 20`, `opacity: 0` with a clean stagger).

### 3. [Hero] Spatial & Grid Polish
- [ ] Redesign the grid layout to completely fix overlapping text and image squeezing.
- [ ] Use a responsive, spacious layout:
  - **Desktop (`lg:grid-cols-12`)**:
    - Right Column (`lg:col-span-5`): Title, kicker, subhead, cards, and CTAs.
    - Center Column (`lg:col-span-4`): Carousel image with a stable `aspect-[4/5]` ratio and refined borders.
    - Left Column (`lg:col-span-3`): Counter (`12,408`) and the floating spinning circular text SVG badge underneath or next to it.
  - **Mobile/Tablet**: Stack vertically or in 2 spacious columns to avoid squeezing.
- [ ] Embed the exact spinning circular text SVG badge with custom path text and slow rotation.
- [ ] Safely initialize `splitChars` and `splitWords` returns with check protections to avoid runtime crashes.

### 4. [Marquee] Endless Scrolling Ribbon
- [ ] Position the scrolling marquee ribbon in `web/app/page.tsx` right between `<Hero />` and `<Exploration />`.
- [ ] Wrap it in a hairline-bordered container with subtle background (`bg-surface-2/30` or similar), styled with stroked outline typography or clean mono caps.
- [ ] Ticker text: `"تسليم فوري • أمان مدمج • بدون صيانة • ربط مباشر • Row-Level Security • pgsodium • Cloudflare Workers •"` repeating infinitely.

### 5. [Section Animations] GSAP ScrollTrigger Polish
- [ ] Review other components (`exploration.tsx`, `process.tsx`, `methodology.tsx`, `recognition.tsx`, `journal.tsx`, `order-form.tsx`, `footer.tsx`) to calibrate and perfect ScrollTrigger transitions.
- [ ] Verify that all animation triggers handle elements safely (preventing typescript compilation errors or unmount warnings).

### 6. [Verification] Production Build Audit
- [ ] Run `next build` to verify clean compilation.
- [ ] Execute `react_doctor_diagnose` with full flags to catch any TS or lint regressions.

---

## ## Review
*To be filled out upon completion of the implementation.*
