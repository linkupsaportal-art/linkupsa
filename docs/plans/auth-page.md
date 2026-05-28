# 📝 Implementation Plan — Insanely Premium Cyberpunk Auth (Login & Register) Page

This plan details the implementation of a high-fidelity, cyberpunk-themed **Login and Registration page** (`web/app/auth/page.tsx`) utilizing `react-hook-form`, `zod`, and GSAP animations, matching the elite digital product delivery platform aesthetics.

---

## 📅 Proposed Changes

### 1. Unified Auth Page Route
* **File [NEW]**: [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/web/app/auth/page.tsx)
* **Design Concept**: 
  * A full-viewport cyber deck with moving background grid-lines, deep slate surfaces, and double-layer pulsing aurora highlights.
  * A gorgeous auth card in the center featuring:
    * **Dual Tabs**: Tab toggle between "تسجيل الدخول" (Sign In) and "إنشاء حساب" (Sign Up / Register) with smooth sliding GSAP indicator overlays.
    * **Glow Corner Brackets**: Four geometric vector brackets at the card borders that scale and highlight on active field focus.
    * **Inputs**: Fields for Email, Password, and Full Name (for registration) utilizing custom Lucide adornments, floating labels, and glowing focus borders.
    * **Submit Button**: Accent button with dynamic moving gradient, infinite diagonal laser-sweep glare, and a colourful physics particle burst on successful form validation.
    * **2FA Setup Toggle**: An elegant mock 2FA QR code card that slides up for review when the user sets up a new administrator account (satisfying the 2FA requirement).

### 2. Client-Side Validation
* Integrate `react-hook-form` combined with `zod` schemas for strict input verification (validating proper email structures and strong password lengths).
* Render micro error strings in bright neon rose (`--danger`) with custom slide-down reveals.

### 3. Verification & Build Auditing
* Execute full linter checks and linter optimizations.
* Run Next.js production builds to confirm 100% TS-safe compiling.

---

## 📅 Ordered Task Checklist

- [ ] **Step 1: Design Zod Schemas & Types**
  - [ ] Write Zod schemas for both Login and Register actions (email, password, name).
- [ ] **Step 2: Construct the Unified Auth Page**
  - [ ] Create `web/app/auth/page.tsx` and scaffold structure.
  - [ ] Build the interactive form tabs (Sign In vs Register) with active states.
  - [ ] Install retro corner brackets, labels, input fields, and validation indicators.
- [ ] **Step 3: Implement GSAP Transitions**
  - [ ] Add page-mount entrance reveals (card zoom, text slide-ups).
  - [ ] Bind focus triggers to animate the glowing border brackets and labels.
  - [ ] Connect the submit handler to the 3-color physics particle blast on success.
- [ ] **Step 4: Scaffolding the mock admin redirect**
  - [ ] Add successful mock authentication state transitions that redirect to `/admin` or `/cpf` depending on the user.
- [ ] **Step 5: Verify build compile**
  - [ ] Run `react_doctor_diagnose` with full flags.
  - [ ] Ensure 100% build compatibility.

---

## 📝 Verification Plan

### Automated Checks
* Run `react_doctor_diagnose` to check for TypeScript errors, linter rules, and dead code.
* Execute a Next.js production build (`npm run build` or `npx next build`) to verify compiler success.

### Manual Verification
* Visually check form tab toggling and verify slide indicators move smoothly.
* Test active border highlights, label glow pins, and hover spotlights.
* Verify form linter validation errors slide down and display in red.
* Trigger successful mock submit and verify colorful particle blast physics.
