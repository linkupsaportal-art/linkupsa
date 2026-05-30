# 📜 Changelog — Digital Product Delivery Platform

> Reverse-chronological history of meaningful project changes.
> Hard cap: 500 lines. Trim to 400–450 when exceeded.

---

# 2026-05-30 14:20

- 📨 **WhatsApp Ban Alerts + Pickup Session Settings — Razex Xelite**
  - **Ban Notification Pipeline**: Added [ban-notify.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/notifications/ban-notify.ts) with a fire-and-forget `notifyPhoneBan` helper. Wired into both manual ban creation in [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/otp-logs/actions.ts) and the auto-ban evaluator in [auto-ban.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/security/auto-ban.ts) so any banned phone receives a WhatsApp explaining the reason.
  - **Karzoun Template `phone_ban_alert_v1`**: Submitted a new Arabic UTILITY template via `whatsappTemplatesAdd` with three positional placeholders (`store_name`, `customer_name`, `reason`). Status is currently PENDING with Meta — once it flips to APPROVED the live test in `scripts/poll-and-send-ban-test.mjs` will fire to +213672661102 automatically.
  - **Session Tab UI**: Created [session-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/session-tab.tsx) — the fourth tab in the OTP hub. Operators can tune two pickup-page guard rails: idle-lock window and TOTP visibility cap. Includes preset chips, live duration humanizer, and a dirty-state save bar matching the existing auto-ban tab pattern.
  - **Pickup Session Storage**: Added `PickupSessionSettings` type plus getters/setters to [platform-settings.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/platform-settings.ts), with `updatePickupSessionSettingsAction` server action that revalidates both `/admin/otp-logs` and `/pickup`.
  - **Pickup Idle Lock + TOTP Lifetime Cap**: New `use-idle-timeout.ts` hook plus `idle-lock-overlay.tsx` and `session-timer.tsx` components in `app/pickup/`, threaded through `pickup-form.tsx` and `order-details.tsx`. The TOTP block in `totp-code-block.tsx` now respects a hard lifetime cap and offers a "احصل على كود جديد" reset.
  - **Diagnostics & Build**: Verified zero TypeScript errors across all touched files; full `next build` (Next 16 Turbopack) compiles in 6s with all 21 routes intact.

# 2026-05-30 10:35

- 📊 **Dedicated Phone Number Column with Bold Highlight in OTP Logs — Razex Xelite**
  - **New Column Integration**: Appended a dedicated "رقم الجوال" (Phone Number) column to the OTP Logs admin table in [otp-logs-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/otp-logs-client.tsx) instead of rendering it stacked under the Customer column.
  - **Last 4 Digits Bold Formatting**: Programmed the `formatMobile` helper function to render the full phone number as standard LTR monospace, clearly **bolding** (`font-extrabold` / `strong`) the last 4 digits for swift visual parsing and keeping the preceding digits in a neutral muted tone.
  - **Balanced Column Ratios**: Recalculated the percentages across all 7 columns (`12% - 12% - 20% - 16% - 18% - 12% - 10%`) to enforce a rigid fixed table structure (`table-fixed`), maintaining precise grid alignment in RTL layout with zero layout shifts or vertical text wrapping.
  - **Phone Number Search Filter**: Added phone numbers to the dynamic search filter, allowing administrators to search logs by the customer's full phone number or last 4 digits instantly.
  - **Pristine Compilation**: Validated 100% TypeScript type safety and verified that Next.js static builds compile perfectly with `react_doctor_diagnose` reporting zero errors.

# 2026-05-30 10:30

- 📊 **Premium Redesign & Fixed Layout of OTP Logs Table — Razex Xelite**
  - **Fixed Grid Columns**: Re-engineered the OTP logs table in [otp-logs-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/otp-logs-client.tsx) to enforce a rigid fixed column layout (`table-fixed`) with explicit percentage-based widths, preventing awkward layout shifts and stretching.
  - **Premium Status Indicators**: Enhanced the status badges with HSL colors and animated micro-dots (pulsing electric lime for success, glowing red for failures, and warm orange for waiting states).
  - **Monospace IP and Order Badges**: Wrapped IP addresses and order references in highly-organized monospace tags (`font-mono`) featuring thin borders, custom background highlights, and integrated inline globe icons.
  - **Stacked Data Layout**: Stacked customer names/phone numbers, account labels/products, and date/time (divided cleanly in monospace structure) vertically inside cells to maximize readability.
  - **Perfect Compilation Health**: Verified 100% type-safety and pristine build generation with zero warnings and zero TypeScript errors on the whole workspace.

# 2026-05-29 23:20

- 🗑️ **Wiped StoreSwitcher Component & Cleaned Topbar — Razex Xelite**
  - **Complete Removal**: Removed the `StoreSwitcher` dropdown component from the admin dashboard header in [topbar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/topbar.tsx), since it is no longer required in this single-merchant edge architecture.
  - **File Purged**: Deleted the unused [store-switcher.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/store-switcher.tsx) component cleanly from the filesystem.
  - **Zero Regressions**: Ran a full compilation scan with `react_doctor_diagnose` to confirm 100% correct typecheck states, zero build errors, and an upscaled health score of **88/100**.

# 2026-05-29 23:10

- 🛡️ **Premium Deletion Dialogs & Secure Decrypted View System — Razex Xelite**
  - **Modern UI Deletion Dialogs**: Appended custom, highly polished modern dialog modals (`Dialog`) for confirming Product and Product Option deletions inside [products-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/products/products-client.tsx) to completely eliminate ugly browser-native `confirm(...)` overlays across all sections of the dashboard. Styled with standard Arabic RTL alignment, warning indicators (`AlertTriangle`), Cairo & Inter typography, and micro-scales on confirm actions.
  - **Secured Secrets Reveal API**: Created a server-side action (`revealAccountSecretsAction`) to retrieve decrypted passwords, TOTP seeds, Steam shared secrets, and card codes from Supabase on-demand.
  - **Secure View Details Dialog**: Integrated live decrypted credential fields toggles with secure copy buttons and glowing visual loading indicators in [accounts-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/accounts-client.tsx) to render full account details beautifully and securely.
  - **TypeScript & Typecheck Guard**: Fixed all type-narrowing assignability issues on optional parameters and union outputs. Verified 100% typescript type safety and clean Turbopack builds with `react_doctor_diagnose` reporting zero compile-time errors.

# 2026-05-29 23:00

- 🎛️ **Complete Dropdown UI Overhaul — CustomSelect Primitive & Native Select Replacement — Razex Xelite**
  - **CustomSelect Primitive**: Crafted a reusable, highly accessible `CustomSelect` component ([select.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/ui/select.tsx)) featuring smooth dropdown panels, keyboard navigation, hover-highlights, checked selection states, and integrated hidden inputs for zero-change `FormData` parser compatibility.
  - **Visual Icon Enhancement**: Integrated premium Lucide icons (`Key`, `Gamepad2`, `Mail`, `User`, `CreditCard`, `FileDown`) directly beside options to easily differentiate between delivery types (e.g. 2FA account, Steam Guard, recharge card) with instant visual clarity.
  - **Full Admin Integration**: Replaced all native `<select>` dropdowns across both Products ([products-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/products/products-client.tsx)) and Accounts ([accounts-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/accounts-client.tsx)) tables with the new CustomSelect element for a uniform, elite look.
  - **Numeric Spinner Polish**: Hided the default, raw HTML5 number input spinner arrows globally inside [globals.css](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/globals.css) for both Webkit and Firefox browsers to match our clean, high-end visual language.
  - **Typescript Perfected**: All changes pass compile-time type checking with zero warnings, fully validating backward compatibility.

# 2026-05-29 22:45


- 🎨 **Total Redesign of Customer Pickup Portal — Dashboard Theme (Cream & Lime) Integration — Razex Xelite**
  - **Premium Theme Unification**: Applied the `.theme-admin` design system scope to the entire `/pickup` portal. Ported the dashboard's gorgeous premium gradient background, radial backdrop glowing ambient blobs, and custom high-end typography (Cairo display font & Manrope numeric figures).
  - **Glassmorphic Interactive Containers**: Re-engineered the pickup portal inputs form ([pickup-form.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/pickup-form.tsx)) and credentials details panel ([order-details.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/order-details.tsx)) using a light-glass canvas layout (`bg-white/85 backdrop-blur-xl border border-white/60`) and the layered card shadow `.card-lift`.
  - **Sleek Input Fields**: Restyled search fields with integrated modern inline icons (`Hash` and `Phone`), faint tinted backgrounds, and smooth focus-scaling border rings in neon electric lime.
  - **Phosphor Accent Interactive Blocks**: Configured primary action triggers to use the brand's signature Phosphor electric lime accent (`bg-accent hover:bg-accent-hi text-accent-fg`) featuring subtle micro-scales, dynamic shadow overflows, and responsive indicator overlays.
  - **Dual-Layer SVG TOTP Progress Countdown**: Re-designed the 2FA verification block ([totp-code-block.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/totp-code-block.tsx)) with a custom dual-layer SVG progress circle that dynamically drains color in lock-step with active countdown values, upscaled numeric code tracking, and automated hover-reload animations.

# 2026-05-28 22:10


- 🎨 **Complete PhoneInput Redesign — Custom Searchable Dropdown & Integrated Country Flag — Razex Xelite**
  - **Full Component Rewrite**: Completely rewrote [phone-input.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/ui/phone-input.tsx) from scratch. Replaced the ugly native `<select>` overlay with a custom-built, searchable dropdown panel. The component now uses only the headless `usePhoneInput` hook from `react-international-phone` — all UI is custom.
  - **Integrated Flag + Dial Code**: The country flag and dial code (e.g. `🇸🇦 +966`) are rendered inline inside the input field as a clean trigger button with a subtle chevron, separated from the phone digits by a thin vertical divider. Phone digits remain always LTR.
  - **Searchable Dropdown**: The country dropdown features a built-in search bar that filters by name, dial code, or ISO2 code. Each row shows flag, country name, dial code, and a checkmark for the active selection. The panel has smooth `animate-in` entrance, rounded corners, shadow elevation, and a custom scrollbar.
  - **CSS Cleanup**: Removed ~100 lines of dead `.linkup-phone-input` / `.linkup-phone-dropdown` / `.react-international-phone-*` CSS overrides from [globals.css](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/globals.css). Replaced with ~25 lines: a `display:none` reset for the library's unused default UI, and custom scrollbar styles for `.phone-dropdown-scroll`.
  - **Zero Breaking Changes**: The `PhoneInputProps` interface is identical — no consumer code changes needed. The [account-info-card.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/profile/account-info-card.tsx) usage works as-is.

# 2026-05-28 20:20


- 📱 **Premium Country Code Dropdown UI Overhaul & Embedded Dial Code Trigger — Razex Xelite completed visual & responsive polish**
  - **Embedded Dial Code in Trigger**: Fully redesigned the [phone-input.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/ui/phone-input.tsx) component using the headless `usePhoneInput` hook. Embedded the country dial code (e.g. `+966`) directly inside the select trigger button next to the flag (e.g., `[ 🇸🇦 +966 ▼ ]`), and enabled `disableDialCodeAndPrefix` to completely hide the dial code from the editable input text field.
  - **Fixed Dropdown Clipping & Stacking**: Changed the container overflow setting inside [globals.css](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/globals.css) to `overflow: visible` and unblocked [section-card.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/profile/section-card.tsx) boundary limits by removing `overflow-hidden` from the wrapper. Added z-index stack handling (`z-10` elevating to `z-30` on `:focus-within`) on the outer container.
  - **Theme & Scrollbar Unification**: Styled the dropdown options list with native HSL tokens (`hsl(var(--bg))`, `hsl(var(--fg))`, `hsl(var(--surface-2))`) to match both light and dark modes, and configured a sleek, minimal webkit scrollbar for premium details.

# 2026-05-28 20:15

- 🛡️ **Secure 2FA Verification Gate for Backup Codes Regeneration — Razex Xelite implemented user verification**
  - **Server-Side Challenge & Verification**: Enhanced the `regenerateBackupCodesAction` inside [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/profile/actions.ts) to accept a validated 6-digit code object via Zod. Fetches the user's active verified TOTP factor, challenges it, and verifies the token against the challenge before performing the internal backup codes regeneration.
  - **RTL-Aligned Verification Dialog**: Built a custom `RegenerateConfirmDialog` overlay in [two-factor-card.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/profile/two-factor-card.tsx) prompting the user to enter their current 6-digit TOTP token using the premium `<OtpInput>` custom component.
  - **Fluid Loading and Error Handling**: Managed state transitions smoothly. Displays any validation errors inline inside the modal so it remains open on failure, and closes it upon successful verification to transition cleanly to the backup codes grid view.

# 2026-05-28 17:30

- 🧭 **Dynamic Admin Sidebar Hover-Mode Spacer & Rounded Gap Patch — Razex Xelite fixed layout bugs**
  - **Fluid Sidebar Expansions**: Resolved the sidebar overlap bug on the admin dashboard where the hovered expanded panel (width `260px` in `"hover"` mode) covered the middle main content container.
  - **Synchronized Transition Spacer**: Replaced the static `72px` spacer inside `components/admin/sidebar.tsx` with a dynamic container that smooth-transitions its width (`w-[72px]` to `w-[260px]`) in perfect lock-step synchronicity with the sidebar expansions. This ensures the main canvas shifts smoothly and is never covered on sidebar hover.
  - **Rounded Top-Left Gap & Bottom Blend Patch**: Fixed the empty background showing through behind the rounded corners of the sidebar by:
    - Wrapping `AdminSidebar` inside a dedicated, flexible parent container inside `app/admin/layout.tsx` and styling its background with a top-only linear gradient using explicit `#fff` (`linear-gradient(to bottom, #fff 64px, transparent 64px)`), completely bypassing CSS variable fallback conflicts.
    - Appending the same linear gradient to the hover-mode spacer inside `components/admin/sidebar.tsx` and `h-full` to the sidebar `aside`.
    - This beautifully fills the top-left rounded corner curve with the clean white header background to continue the navbar flush with the sidebar across all modes (including collapsed state), while keeping the bottom-left corner transparent to seamlessly blend into the page canvas.
  - **Smooth Label Transitions**: Re-engineered sidebar DOM rendering from dynamic component swaps to a unified single element layout (`UnifiedNavItem`). Added fluid, synchronized transitions (`transition-all duration-300`) for text opacities, badges, widths, profile metrics, and the brand title (`LinkUp`), avoiding sudden visual jumps when shifting between collapsed, expanded, and hover modes.
  - **Mobile RTL Premium Sidebar Drawer**: Replaced the simple mobile-only `NavList` inside `AdminTopbar` with our gorgeous premium `AdminSidebar` component (in `isMobile` mode). Positioned the drawer layout to correctly align to the right (`start-0` under `dir="rtl"`) so it slides in/out fluidly from the right side of the viewport, preserving absolute architectural visual sync across all screens.

# 2026-05-28 14:15

- 🛡️ **Total Decoupling of Salla Integrations & Global Clean-up — Razex Xelite completed visual & spec sweep**
  - **Global Metadata Sweep**: Removed all "سلة" and "Salla" keywords and references from the root Next.js layout (`app/layout.tsx`) description and keyword attributes to enforce an independent storefront model.
  - **Visual Elements Clean-up**: Refactored `components/landing/recognition.tsx` to replace the "Salla Partner" card with an elite "ربط برميوم متكامل" (Integrated Premium Sync) trust item, shifting focus to high-speed independent storefront APIs.
  - **System Specifications Sync**: Conducted a thorough documentation pass across `docs/architecture.md`, `docs/project-details.md`, and `docs/project_structure.md` to completely eliminate Salla database mappings and integration flows, replacing them with generic independent Storefront webhook and API sync references.
  - **Prise & Audit**: Verified that no lingering Salla references remain in any environment `.env` or application code configs.

# 2026-05-27 23:35

- 🔑 **Modular Cyberpunk Auth Portal Refactoring & Navigation Access — Razex Xelite completed implementation**
  - **Auth Routing Integrations**: Programmed direct entry paths to the administrator dashboard portal `/auth` inside:
    - **Header Sticky Navbar**: Appended a sleek, neon-themed cyan CTA button next to the hamburger menu on screen widths `sm` and up using Next.js `<Link>` components to maintain smooth client-side routing.
    - **Full-Screen Menu Overlay**: Embedded a premium portal card with the decoupled brand metadata and an interactive, pulse-animated "بوابة الإدارة" Link.
    - **Footer Site Navigation**: Updated the platform column and bottom social rows to completely omit legacy "سلة" references and point to the secure Portaliosa admin hub.
  - **Ultra Clean Modular Splitting (Zero Lints & Warnings)**: Refactored the monolithic `web/app/auth/page.tsx` file (from 509 lines down to 179 lines) into cohesive modules:
    - Created [schemas.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/web/app/auth/schemas.ts) containing Zod typing models.
    - Created [login-form.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/web/app/auth/components/login-form.tsx) for Sign In operations.
    - Created [register-form.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/web/app/auth/components/register-form.tsx) for Sign Up operations.
    - Created [two-factor-setup.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/web/app/auth/components/two-factor-setup.tsx) for the Google 2FA Authenticator setups.
  - **Outstanding Build Health**: Executed the `react_doctor_diagnose` sweep, successfully passing with **0 compiling errors** and raising our diagnostics quality index score to **92/100 (Great)**!

# 2026-05-27 22:50

- 🛡️ **Premium Portaliosa Brand Shield & Hero Polish — Razex Xelite completed visual overhaul**
  - **Salla-Free Architectural Pivot**: Decoupled the landing page layout from old Salla dependencies. Updated the main subhead text to reflect the brand's new independent, self-hosted automated delivery model.
  - **Interactive Brand Shield Card**: Removed the lookup form card from the hero section and replaced it with a highly animated, floating **Portaliosa Brand Shield** layout featuring:
    - Translucent glassmorphism panel (`bg-surface/40 backdrop-blur-xl`) with a cybernetic dot-matrix tech grid.
    - Double-layer neon ambient aurora gradient behind the shield, breathing with infinite pulse transitions.
    - High-fidelity, optimized Next.js `<Image>` utilizing the newly generated `linkup-logo.webp` WebP asset with automatic layout bounding (`fill`), responsiveness (`sizes`), and instant prefetching (`priority`).
    - Glowing cyberpunk retro corner brackets and personalized `PORTALIOSA SYSTEM` brand status tags.
  - **Zero Compiler Warnings**: Cleaned up all unused React component imports (`HeroLookupForm`) and fully validated a diagnostics index score of **93/100** with **0 compile errors** on React Doctor!

# 2026-05-27 22:45

- ⚡ **Insanely Premium Cyberpunk Hero Form Redesign — Razex Xelite completed UI polish**
  - **Dynamic Neon Card Container**: Upgraded the card wrapper to utilize a glowing dual-layer border structure that expands its shadow box and brightens its border using active blurple colors upon input focus.
  - **Retro-Cyber Corner Brackets**: Constructed 4 sharp geometric SVGs at the card corners that scale outward (`scale-105`) and shift colors dynamically to latch around the active container.
  - **Glow-Pin Input Indicators**: Appended digital indicator status dots next to each form field label that pulse actively (`animate-pulse`) when their corresponding input field is focused.
  - **Laser Sweep Shimmer & Glow CTA**: Added an infinite diagonal skewed laser glare sweep (`animate-laser`) on the submit button, supported by moving gradient transitions and massive blurple drop shadows.
  - **Advanced Colorful Physics Blast**: Re-engineered the success submit burst function using GSAP to project 24 colorful, glowing physics particles of varying sizes (blurple, white, cyan) with custom radial offsets and box-shadow backlighting.
  - **Clean Build Sweep**: Resolved all long-linter class warnings and verified a Great score of **94/100** with **0 compile errors** on React Doctor!

# 2026-05-27 22:40

- 🏷️ **Official Logo Integration & Favicon Generation — Razex Xelite completed brand assets**
  - **High-Performance WebP Converter**: Processed the original `linkup-logo.png` (1.5MB) using `sharp-cli` to produce an optimized, highly scalable `linkup-logo.webp` (WebP format, 80 quality) saved inside `web/public/`.
  - **Next.js App Router Favicon**: Created a resized `32x32` pixel `icon.png` in `web/app/` using sharp-cli resize filters, and removed legacy `favicon.ico` to let Next.js natively render the official brand icon.
  - **Centralized Logo Propagation**: Updated `web/components/brand/logo.tsx` to utilize the new WebP asset via `next/image` with `fill` layouts and LCP `priority` prefetching. This automatically updated the header navbar, overlay details card, and bottom footer elements seamlessly.
  - **Build Integrity Sweep**: Performed full diagnostics checking showing 0 TypeScript/ESLint errors and compiled Next.js static output in record time.

# 2026-05-27 22:30

- 🧭 **Premium Full-Screen Navigation & Morphing Trigger — Razex Xelite completed navigation polish**
  - **3-Bar Morphing SVG Trigger**: Replaced standard icon with a premium custom 3-bar SVG button that morphs into a clean "X" using synchronized transitions.
  - **GSAP Screen-Peel Transition**: Implemented a highly optimized GSAP clip-path polygon wipe sequence. Built the timeline once on mount and controlled it via play/reverse triggers to avoid any stuck states.
  - **Dynamic Scrollbar Hiding & Layout Shift Fix**: Programmatically calculated scrollbar width on the document and appended a body lock class with custom HSL properties, ensuring zero visual layout shifts on open/close.
  - **No-Scrollbar & Glow Utilities**: Applied a `no-scrollbar` styling wrapper to ensure a clean, distraction-free overlay and added an interactive cursor spotlight following the mouse.
  - **TypeScript Verification**: Resolved the TS2339 index parameter compiler error in `NAV_LINKS` and secured 100% build compatibility with a React Doctor score of **93/100**.

# 2026-05-27 23:25

- 💎 **Premium Landing Page Refactoring — Razex Xelite completed visual polish, custom animations, and layout fixes**
- 🎨 **CSS Animation Keyframes (`globals.css`)**: Appended utility classes and infinite CSS keyframe definitions for both `spin-clockwise` (rotating circle badge text) and `marquee-ltr` (endless marquee ribbon).
- 🧭 **Editorial Header Navigation (`navbar.tsx`)**: Fully re-designed the navbar into a premium editorial top bar:
  - Sticky glass header with smooth-scrolling border and backdrop transition.
  - Logo placement (right) and elegant nav links with hairline hover reveals.
  - CTAs with sliding chevron animations.
  - Full-screen glassmorphic mobile menu overlay with GSAP staggered link entrances.
- 🎬 **Responsive 12-Column Hero Section (`hero.tsx`)**: Solved all image squeezing and text overlapping layout issues across all viewports.
  - Reconfigured to a beautiful 12-column grid (`lg:grid-cols-12`) on desktop (5 cols details, 4 cols carousel, 3 cols counter & badge).
  - Designed a high-end luxury crossfade image carousel with absolute layout opacity transition (eliminating translate bugs in RTL/LTR).
  - Integrated a floating **rotating circular SVG text badge** ("• وَصَل • تسليم رقمي فوري • آمن و موثوق •").
  - Encapsulated GSAP `SplitText` functions inside robust checks to prevent strict-mode runtime type errors.
- 🎗️ **Endless Scrolling Ticker (`marquee-ribbon.tsx`)**: Created a gorgeous, seamless marquee ribbon separating Hero and Exploration sections. Implemented stroked-text Tech highlights and solid monospace Arabic text in an LTR-isolated container (immune to RTL flexbox layout conflicts).
- 📐 **RTL-Calibrated Column Dividers (`recognition.tsx` & `journal.tsx`)**: Corrected standard border dividers in multi-column RTL layouts using logical `divide-x-reverse` instead of standard `divide-x` to ensure proper right-to-left visual lines.
- ⚙️ **Successful Next.js Build & Type Verification**:
  - Ran full `react-doctor` diagnostics with zero errors and a project index score of **95/100 (Great)**.
  - Proactively executed `next build` which compiled successfully with static prerender generation in 5.2s!

# 2026-05-27 16:30

- 🟢 Initial documentation pass — Razex Xelite created `docs/` folder as source of truth
- 📝 Created `docs/project_structure.md` with full workspace tree + metadata footer
- 📝 Created `docs/changelog.md` (this file) for historical tracking
- 📝 Created `docs/architecture.md` capturing the agreed stack and ADRs
- 🔧 Updated `project-details.md` — replaced legacy "VPS + Nginx + PM2" stack section with the **authoritative serverless stack** agreed in WhatsApp conversation:
  - Next.js 15 + shadcn/ui + Tailwind on Vercel
  - Supabase (Postgres + Edge Functions + pg_cron + Storage + Auth + pgsodium)
  - Cloudflare (Workers + KV + Queues + Turnstile + WAF + DNS)
  - Resend for transactional email
  - Custom queue system on Supabase + CF (no third-party queue service)
  - Meta Cloud API for WhatsApp (pending client confirmation)
  - Local SA SMS provider (Unifonic / Mobily — pending confirmation)
- 📌 Documented ownership guarantee: source code + DB + credentials all under client's accounts, portable to any Postgres + Node host
- ⚠️ Open questions logged for client follow-up: WhatsApp BSP choice, SMS provider, domain decision, Salla Partner account status, expected admin user count, backup strategy beyond Supabase native
- 🎯 Next: collect client credentials (Gmail, then Vercel/Supabase/Cloudflare/GitHub/Resend accounts) before scaffolding code


# 2026-05-27 18:45

- 🚀 **Landing page MVP shipped — first scaffold of the entire customer-facing UI.**
- 🛠 Scaffolded `web/` directory with Next.js 16 + React 19 + Tailwind 4 + Turbopack via `create-next-app`
- 📦 Installed runtime deps: `gsap`, `@gsap/react`, `lenis`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `tailwindcss-animate`, `@radix-ui/react-{slot,accordion,dialog,label}`, `react-hook-form`, `zod`, `@hookform/resolvers`, `next-themes` (405 packages total)
- 🎨 **Brand identity created:** name **وَصَل / Wasel** ("arrived/delivered"), custom SVG logo (W-as-envelope/arrow with cyan→sapphire gradient), tagline "استلم منتجك الرقمي خلال ثوانٍ"
- 🎨 **Design tokens** defined as HSL CSS variables in `globals.css` and exposed to Tailwind via `@theme inline`: surface ladder (bg → surface-3), foreground ladder (fg → fg-subtle), brand triad (brand / brand-lo / brand-hi), semantic states, and helpers `.aurora` / `.bg-grid` / `.bg-grain` / `.glass` / `.text-gradient` / `.slat`
- 🌐 **Layout configured RTL+ar+dark** by default, with `next/font/google` loading IBM Plex Sans Arabic + Inter + JetBrains Mono via CSS variables; viewport theme color set to zinc-950
- ⚙️ **Centralized GSAP singleton** at `lib/gsap.ts` registering `ScrollTrigger` + `useGSAP` once, avoiding double-registration warnings
- ⚙️ **Lenis smooth-scroll provider** wired to GSAP ticker so all ScrollTrigger pins/scrubs stay perfectly in sync; respects `prefers-reduced-motion`
- 🧱 **shadcn-pattern primitives** built locally (no shadcn CLI to keep tokens fully custom): `button.tsx` (CVA variants × 5, sizes × 5, asChild), `input.tsx` (with start/end adornments + invalid state), `accordion.tsx` (Radix-themed)
- 🧭 **Navbar** — sticky glass capsule, GSAP scrub compresses height/blur on scroll, 3-bar → X morph via GSAP timeline, mobile sheet via Radix Dialog sliding in from the right (RTL-aware), desktop CTA "استلم طلبك"
- 🎬 **Hero section** — kicker chip → word-by-word headline reveal → subhead → lookup form (order number + last 4 phone digits) directly inline (no scroll-to-find friction) → trust strip; aurora gradient + grid mask + film grain + 2 floating brand blobs animated infinite
- 🎬 **HowItWorks** — 3 steps scroll-pinned horizontally on ≥900px screens via GSAP+ScrollTrigger, graceful vertical-stack fallback on mobile / reduced-motion, giant outline numbers with parallax driven by `containerAnimation` of the master horizontal tween
- 🎬 **Products** — bento grid of 6 product types (2FA / Steam Guard / Email Code / Normal / Recharge Card / Digital File), each card has a cursor-following spotlight (CSS vars updated on mousemove), accent gradient blob, hover lift, reveal stagger
- 🎬 **Security** — 4 pillars (encryption / no-secret-leak / audit logs / defense-in-depth), sticky-header layout on desktop, reveal stagger on enter
- 🎬 **FAQ** — 6 questions via Radix Accordion, chevron rotation, item-by-item reveal stagger
- 🚪 **GarageFooter** — the showpiece. 14 metallic slats stacked top-to-bottom, ScrollTrigger pins the section, slats peel up with a stagger, an amber lamp glow ignites, drifting tools (Wrench/Cog/Zap) animate in from the sides, and the workshop content (logo + 4 link columns + neon "وصلنا. تشرفنا." sign) rises up from below. Mobile / reduced-motion fallback keeps the same effect via simple intersection trigger
- 🚧 **Build verified** — `next build` passes clean: `Compiled successfully in 3.0s`, TypeScript clean, route `/` prerendered as static. Two issues found and fixed during verification:
  - `lucide-react` no longer exports `Github` in current version → replaced with inline SVG `GitHubMark` in the footer
  - `ScrollTrigger.getAll().slice(-1)[0]` returned `ScrollTrigger` instead of `gsap.core.Tween` for `containerAnimation` → refactored to keep the master tween in scope and pass it directly
- 🧹 **Removed scaffold noise:** deleted `web/AGENTS.md`, `web/CLAUDE.md`, `web/README.md` and the default `next.svg / vercel.svg / globe.svg / file.svg / window.svg` from `public/`
- 📝 Updated `docs/project_structure.md` with the full new tree + animation stack + brand identity sections
- ⚠️ **Note:** nano-banana-pro image generation MCP returned "Insufficient credits" → pivoted entirely to CSS gradients + inline SVG art, which is faster, themable, infinitely scalable, and lighter on the bundle. No raster assets needed
- 🎯 Next: dev-server smoke test on the user's machine; then move to scaffolding `/admin` and `/code-limit` zones, plus the Supabase project + initial schema migrations


# 2026-05-27 19:40

- 🔄 **Full landing-page redesign** — pivoted from "premium dark tech" to **editorial light/B&W minimalism inspired by `template.md` (LUMEN photography portfolio)**, adapted for Wasel's Arabic/RTL digital-delivery context.
- 🗑 **Removed all 7 old landing components** (`navbar`, `hero`, `how-it-works`, `products`, `security`, `faq`, `garage-footer`) and the old `accordion` primitive.
- 🎨 **New design tokens** in `globals.css` — light editorial palette: zinc-50 background, deep ink ladder for text, sky-600 accent (LUMEN blue), zero border-radius (sharp editorial corners), hairline border vars (`--hairline` / `--hairline-strong`).
- 🧱 **Editorial Button** — square corners, hairline border, ink-on-paper hover (`bg-fg text-bg`). Variants: primary / outline / ghost / accent / link. All sizes uppercase tracking-wider for editorial cap-style.
- 🧱 **Editorial Input** — hairline border + sharp corners, accent-blue focus state.
- 🪪 **New logo** — black-square monogram with the Arabic letter "و" (waw) inside, matching LUMEN's `L` square + wordmark pattern.
- 🌐 **`<BackgroundGrid>`** — fixed-position fullscreen layer with 4-column hairline guides + two animated SVG neon-blue traveling lines (horizontal at 25%, vertical at 75%, slow infinite crawl with Gaussian-blur glow).
- 🧠 **Free SplitText replacement** in `lib/split-text.ts` — uses `Intl.Segmenter` (Arabic-grapheme-aware) to wrap each char in `<span class="char">` for GSAP staggers; falls back to `Array.from` on older runtimes.
- 🖼 **Image registry** in `lib/images.ts` — single source of truth mapping every named asset to its `/public/images/*.webp` path. Components import via `IMG.heroSlide1` etc., never hard-code.
- 🖼 **`<ImageOrPlaceholder>`** — renders `next/image` when the file resolves, otherwise shows a shimmer placeholder with the asset label, so the layout is never broken before the AI-generated webps land.
- 🧱 **`/public/images/README.md`** — full spec sheet for the image-generation agent: file → section mapping, format (WebP @ q80), color (B&W neutral, page applies grayscale on top), aspect (3:4 or 4:3), long edge 1600px, no overlays.
- 🖌 **7 new sections built (LUMEN structure adapted to Wasel):**
  1. **`Navbar`** — hairline-bottom blur, brand right (RTL), single editorial dropdown trigger ("القائمة" / "إغلاق") with stagger-revealed menu items, scroll-trigger soft shadow drop.
  2. **`Hero`** — 3-column grid: right (kicker + huge "وَصَل +" headline with char-split reveal + 2 mini cards + CTAs), center (image carousel with caption + arrows + auto-advance every 5.5s), left (giant counter `0 → 12,408` tweened on scroll-in via GSAP).
  3. **`Exploration`** — left dual-image gallery with vertical-offset (RTL preserved), right huge type ("حسابات", "Steam", "أكواد", "ملفات") + subtitle + description + slide indicator + chevron nav. Crossfade animation between projects.
  4. **`Process`** — tabbed case study ("الورشة" / "الاستوديو"). Left huge heading mask-reveal, body, 3 stats with **counter tweens on scroll**. Right full-bleed parallax image. Tabs swap content + retrigger animations.
  5. **`Methodology`** — left visual + floating data card with stack info, right philosophy headline ("آلي، آمن، و موثوق") + 4-step interactive list with on-hover detail expansion (LUMEN's `Pre-Visualization / Capture / Post-Production` pattern adapted to webhook → payment-check → round-robin → notify).
  6. **`Recognition`** — 4-card grid replacing LUMEN's "Awards" with Wasel's trust signals (12k orders / Salla Partner / pgsodium encryption / zero-VPS edge). Icons scale-in with `back.out`, headline mask-reveals.
  7. **`Journal`** — left featured large article with parallax-scrub image and headline reveal ("كيف يصل الطلب في ٣ ثوانٍ"), right 3-item editorial list with right-edge accent bar that slides in on hover.
  - **`OrderForm`** — pre-footer CTA section ("رقم الطلب، و آخر ٤ من جوالك") with the actual lookup form. Identifier `#hero-form` preserved so navbar deep-link still works.
  - **`Footer`** — letter-spread "WASEL" monogram with `from: "edges"` stagger reveal, 4-column block (newsletter signup / products / platform / contact), bottom legal bar.
- 🎬 **GSAP scroll-driven everywhere:** char/word splits, scroll-trigger reveals, parallax scrubs (image scale on scroll), counter tweens, scroll-pinned tabs, hover-h-grow detail expansions, edge-stagger on letter spread.
- 🌍 **Layout updated:** removed forced `dark` class, kept RTL + Arabic + Plex Sans Arabic, switched theme-color to `#FAFAFA` (light), color-scheme to `light`. Replaced JetBrains Mono with Geist Mono for editorial mono-feel.
- 🐛 **Build issues fixed during verification:**
  - `lucide-react` doesn't export `Instagram`/`Twitter` brand icons → replaced with inline SVG `InstagramIcon` / `TwitterIcon` in footer.
- ✅ **`next build` passes clean** — `Compiled successfully in 3.1s`, TypeScript 3.7s, prerendered as static.
- 🎯 Next: AI agent generates the 16 referenced WebP files into `web/public/images/` per the registry + README; placeholders auto-disappear once files land.


# 2026-05-27 21:10

- 🖼 **AI Image Generation & Optimization Completed — Razex Xelite generated and optimized all 17 WebP images**
- 🎨 **Editorial Visuals Created:** Designed custom high-fidelity prompts following the Leica medium-format B&W chiaroscuro baseline.
- ⚡ **Optimized Web Assets:**
  - Generated all 3 Hero Carousel slides (`hero-slide-1.webp`, `hero-slide-2.webp`, `hero-slide-3.webp`) at `1600x1200` (4:3)
  - Generated all 8 Exploration slides (`prod-2fa-a.webp`, `prod-2fa-b.webp`, `prod-steam-a.webp`, `prod-steam-b.webp`, `prod-email-a.webp`, `prod-email-b.webp`, `prod-files-a.webp`, `prod-files-b.webp`) at `1600x1200` (4:3)
  - Generated full-bleed Case Study/Process view (`process.webp`) at `1600x1200` (4:3)
  - Generated data-flow architecture landscape (`methodology.webp`) at `1600x1200` (4:3)
  - Generated cover article visual (`journal-hero.webp`) at `1600x1200` (4:3)
  - Generated all 3 Blog item thumbnails (`journal-1.webp`, `journal-2.webp`, `journal-3.webp`) at `1600x1067` (3:2)
- ⚙️ **Process Automation:** Developed and executed an automated Node.js processing script utilizing the high-performance `sharp` library to:
  - Resize the long edge of all assets to exactly `1600px`.
  - Convert generated PNGs to high-efficiency WebP format at exactly quality 80.
  - Save all images directly inside `web/public/images/` with exact matching names.
- 📝 **Updated System Documentation:** Synced `docs/project_structure.md` to reflect the newly populated public assets directory and its structure.


# 2026-05-27 21:35

- 🎨 **3D Icon Redesign — Razex Xelite implemented beautiful 3D Blender-style SVG icons**
- 🧱 **High-Fidelity Visual Components:** Replaced the simple Lucide outline icons (`Trophy`, `BadgeCheck`, `Award`, `Sparkles`) inside the trust indicators section (`recognition.tsx`) with highly customized inline SVG illustrations:
  - **Trophy3D:** Abstract geometric cup in a dark titanium gradient, supported by dynamic side handles and a polished glass core illuminated by an active cyan pulsing light.
  - **Badge3D:** 12-pointed verification seal crafted from heavy brushed titanium and layered frosted glass, housing a brilliant glowing cyan checkmark.
  - **Security3D:** Premium geometric padlock with a sleek, polished steel shackle, frosted glass body, dark inner core, and an glowing active-cyan indicator.
  - **Serverless3D:** Three floating translucent glass prisms with fine glowing borders, cascading vertically with independent floating animations (`animate-bounce`).
- ⚡ **Zero Overhead Performance:** Leveraging pure SVG gradients, shadows, masks, and CSS keyframe animations, ensuring stunning 3D depth and premium aesthetics without loading heavy image assets or adding bundle weight.
- 📐 **Visual Scaling:** Scaled the rendering dimensions inside the cards from `size-16` (64px) to `size-28` (112px) to maximize the visual presence of the 3D details inside the `h-40` layout blocks.


# 2026-05-27 21:45

- 🎨 **Journal 3D Icon Redesign — Razex Xelite implemented beautiful 3D Blender-style SVG icons for list items**
- 🧱 **High-Fidelity Visual Components:** Replaced the simple Lucide outline icons (`Code2`, `Lock`, `Tag`) inside the editorial articles list (`journal.tsx`) with highly customized inline SVG illustrations matching the Wasel design system:
  - **Code3D:** Glowing 3D serverless code brackets `</>` crafted in a dark metal gradient with glowing cyan neon borders and a heavy slash divider.
  - **Lock3D:** Premium 3D cylindrical database lock with a polished chrome shackle, a frosted glass core, and an active pulsing blue indicator.
  - **Tag3D:** Futuristic 3D store/price tag in isometric perspective featuring a frosted glass body, brushed titanium border, sleek silver loop thread, and an active neon connection bolt.
- 📐 **Visual Scaling:** Scaled the rendering dimensions inside the editorial rows from `size-6` (24px) to a prominent **`size-16` (64px)** to fill the list item containers and maximize the high-fidelity 3D visual presence.


# 2026-05-27 21:50

- 🐛 **Arabic Typography Connection Bug Fixed — Razex Xelite resolved the broken Arabic ligatures layout bug**
- 🧠 **Smart Ligature Protection:** Updated `splitChars` inside the text splitting library (`split-text.ts`) to automatically detect Arabic characters (`/[\u0600-\u06FF]/`) using a robust regex scan.
- 📐 **Cursive-Safe Animation Fallback:**
  - When Arabic cursive text (like `"حسابات"` in `exploration.tsx` or `"العملية"` in `process.tsx`) is detected, `splitChars` automatically falls back to `splitWords` (word-by-word wrapping).
  - This ensures that characters inside words stay together as continuous, properly ligatured cursive Arabic letters instead of breaking into isolated glyphs like `"ح س ا ب ا ت"` and `"ال ع م ل ي ة"`.
  - Stagger animations still work perfectly at the word level, keeping a premium motion aesthetic while maintaining strict typographic correctness.
- ⚡ **Cohesive Typography Check:** Verified all other page headings ("اليوميات", "موثوق") and verified that the Latin/English headline ("LinkUp") retains its character-level staggered entry because it contains no Arabic letters.


# 2026-05-27 22:25

- 🧭 **Navbar Redesigned — Razex Xelite updated navigation layout to match minimal snapped template style**
- 📐 **Full-Width Edge Snap:** Switched position from a floating capsule (`sticky top-9` spacing) to a full-width header (`sticky top-0 z-50 w-full`) snapped directly to the top viewport edge to match `template.md` (LUMEN).
- 🎨 **Editorial Styling:**
  - Standardized background styling using HSL tokens to a refined, translucent `bg-bg/80` with a sharp `backdrop-blur-md` for maximum legibility.
  - Set a clean bottom hairline border (`border-b border-[hsl(var(--hairline))]`).
  - Standardized scroll-bound shadow activation using a self-referential class trigger `[&.nav-scrolled]:shadow-[0_1px_0_hsl(0_0%_0%/0.05),0_8px_24px_-16px_hsl(0_0%_0%/0.1)]`.
- 🗑 **Layout Simplification:** Removed the dismissible top announcement strip (`TopNav`) from `app/page.tsx` to ensure absolute visual cleanliness and snap the main navigation directly to the top edge.
