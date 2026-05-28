# 📁 Project Structure — Digital Product Delivery Platform

> Source of truth for the current architecture. Updated on every structural change.
> Last sync: 2026-05-27

---

## Workspace Tree (Current Snapshot)

```text
digital-delivery-platform/
│
├── 📄 conversation.md               ( محادثة WhatsApp مع العميل — تفاوض الميزانية والاتفاق على الستاك Vercel + Supabase + Cloudflare بدون VPS )
├── 📄 project-details.md            ( المواصفات الكاملة بالعربية — الواجهات الثلاث، 6 أنواع منتجات، الأمان، الربط المستقل، الستاك المعتمد )
│
├── 📁 docs/                         ( مصدر الحقيقة الموثق — يجب أن يطابق الواقع دائماً )
│   ├── 📄 project_structure.md      ( هذا الملف — شجرة الملفات + وصف لكل عنصر + metadata المشروع )
│   ├── 📄 changelog.md              ( سجل التغييرات الزمني — حد أقصى 500 سطر، يُقلَّم تلقائياً )
│   └── 📄 architecture.md           ( قرارات المعمارية، اختيار الستاك، DB schema، تدفقات النظام، ADRs )
│
└── 📁 web/                          ( تطبيق Next.js 16 — الـ frontend الكامل: customer interface + admin + code-limit )
    ├── 📄 .gitignore                ( استثناءات git الافتراضية لـ Next.js + node_modules + .next )
    ├── 📄 eslint.config.mjs         ( تكوين ESLint flat config — يمتد من eslint-config-next )
    ├── 📄 next-env.d.ts             ( تعريفات TypeScript المُولّدة من Next.js — لا تُعدَّل يدوياً )
    ├── 📄 next.config.ts            ( إعدادات Next.js — strict mode + optimizePackageImports لـ lucide & gsap )
    ├── 📄 package.json              ( dependencies و scripts — Next 16, React 19, Tailwind 4, GSAP, Lenis, Radix, RHF, Zod )
    ├── 📄 package-lock.json         ( قفل الإصدارات — يُلتزم به )
    ├── 📄 postcss.config.mjs        ( PostCSS pipeline — @tailwindcss/postcss فقط، Tailwind v4 يكفيه )
    ├── 📄 tsconfig.json             ( TypeScript strict + paths alias @/* + Next plugin )
    │
    ├── 📁 app/                      ( Next.js App Router — RSC افتراضي، Server Actions جاهزة )
    │   ├── 📄 icon.png              ( أيقونة المتصفح الرسمية — تم إنشاؤها بدقة 32x32 من الشعار الأصلي )
    │   ├── 📄 globals.css           ( design tokens HSL + Tailwind v4 import + helpers: aurora/grain/grid/glass/garage-slat + RTL + reduced-motion )
    │   ├── 📄 layout.tsx            ( الـ root layout — RTL+lang=ar+dark، يحمل fonts: Plex Arabic/Inter/JetBrains Mono، يلف الـ children بـ SmoothScrollProvider )
    │   ├── 📄 page.tsx              ( الـ landing page — يركّب 7 sections بترتيب Navbar → Hero → HowItWorks → Products → Security → FAQ → GarageFooter )
    │   │
    │   └── 📁 auth/                 ( بوابة الإدارة المستقلة — تسجيل الدخول وإنشاء حساب المشرف )
    │       ├── 📄 page.tsx          ( المنسق الرئيسي للبوابة — تأثيرات GSAP الجذابة وتبديل التبويبات والتأثير الجسيمي CTA )
    │       ├── 📄 schemas.ts        ( قواعد Zod للتحقق — تتحقق من سلامة مدخلات الدخول والإنشاء )
    │       └── 📁 components/       ( المكونات الفرعية للبوابة — مجزأة ومثالية للحفاظ على حد الـ 500 سطر )
    │           ├── 📄 login-form.tsx ( نموذج تسجيل الدخول الآمن مع تتبع تركيز المدخلات وتنبيهات الأخطاء )
    │           ├── 📄 register-form.tsx ( نموذج إنشاء حساب المشرف الإداري الجديد )
    │           └── 📄 two-factor-setup.tsx ( واجهة مسح رمز الاستجابة السريعة (QR) وتأكيد كود التحقق الثنائي TOTP )
    │
    ├── 📁 components/               ( كل المكونات — مقسّمة على دلالة، كل ملف ≤200 سطر )
    │   │
    │   ├── 📁 brand/                ( هوية البراند — wordmark + glyph + variants )
    │   │   └── 📄 logo.tsx          ( Wasel logo — SVG شعار W-as-envelope/arrow بـ gradient، يدعم glyphOnly + currentColor theming )
    │   │
    │   ├── 📁 landing/              ( الـ 11 section للـ customer-facing landing page )
    │   │   ├── 📄 background-grid.tsx ( شبكة خطوط الخلفية الرقيقة + خطوط النيون المتحركة ببطء )
    │   │   ├── 📄 exploration.tsx   ( استعراض المنتجات الـ 4 مع معرض صور تفاعلي وزر استلام الطلب )
    │   │   ├── 📄 footer.tsx        ( تذييل الصفحة الأنيق مع مونوغرام WASEL المتباعد وقائمة الأقسام )
    │   │   ├── 📄 hero.tsx          ( هيرو هيدلاين متفجر، درع الشعار العائم الفاخر Portaliosa بـ GSAP، عداد طلبات ضخم، وشارات المزايا )
    │   │   ├── 📄 journal.tsx       ( اليوميات — مدونة إخبارية تضم مقالاً بارزاً وقائمة موضوعات تفاعلية )
    │   │   ├── 📄 marquee-ribbon.tsx ( شريط الحركة اللانهائي الدوار تسليم فوري • أمان مدمج • Row-Level Security )
    │   │   ├── 📄 methodology.tsx   ( المنهجية المتبعة وخطوات معالجة وتسليم الطلب ومكعب الستاك العائم )
    │   │   ├── 📄 navbar.tsx        ( هيدر فاخر snapped مع قائمة ملء الشاشة الفخمة بـ GSAP، زر تحكم 3-bar متحرك، ومنع إزاحة التمرير )
    │   │   ├── 📄 order-form.tsx    ( نموذج استلام الطلب برقم الطلب وآخر 4 أرقام جوال محمي بـ Turnstile )
    │   │   ├── 📄 process.tsx       ( تبويبات دراسة الحالة الورشة والمنصة، عداد إحصائيات بـ GSAP )
    │   │   └── 📄 recognition.tsx   ( قسم ثقة التجار وشارات التشفير وربط المتجر المستقل و 12 ألف طلب )
    │   │
    │   ├── 📁 providers/            ( client-side providers تُلف حول الـ tree )
    │   │   └── 📄 smooth-scroll-provider.tsx  ( Lenis smooth-scroll مربوط بـ GSAP ticker + ScrollTrigger.update، يحترم prefers-reduced-motion )
    │   │
    │   └── 📁 ui/                   ( shadcn-style primitives — تُستهلك من landing/admin/code-limit )
    │       ├── 📄 button.tsx        ( CVA-driven Button — زوايا حادة، حدود رقيقة، تظليل تكتيكي، يدعم asChild )
    │       ├── 📄 image-or-placeholder.tsx ( بديل ذكي لعرض الصور الحقيقية أو إظهار وميض تحميل أنيق )
    │       └── 📄 input.tsx         ( حقل إدخال بـ حدود رقيقة، زوايا حادة، أضواء نيون زرقاء عند التركيز )
    │
    ├── 📁 lib/                      ( utilities خالصة — لا state ولا UI )
    │   ├── 📄 gsap.ts               ( GSAP singleton — يسجل ScrollTrigger + useGSAP مرة واحدة client-side )
    │   ├── 📄 images.ts             ( سجل مسارات كل الصور بـ web/public/images )
    │   ├── 📄 split-text.ts         ( بديل SplitText مجاني يدعم الحروف العربية بدقة عالية ورشاقة )
    │   └── 📄 utils.ts              ( cn() — clsx + tailwind-merge للـ class composition بدون duplication )
    │
    └── 📁 public/                   ( static assets المتاحة للجمهور )
        ├── 📄 linkup-logo.png       ( الشعار الأصلي بدقة عالية بصيغة PNG )
        ├── 📄 linkup-logo.webp      ( الشعار الرسمي معالج ومحول لصيغة WebP خفيفة )
        └── 📁 images/               ( الصور المصدرية المُولّدة بالذكاء الاصطناعي — بدقة عالية وتنسيق WebP )
            ├── 📄 hero-slide-1.webp ... ( 3 صور للـ Hero Carousel بمقاس 1600x1200 )
            ├── 📄 prod-2fa-a.webp ...   ( 8 صور لتصفح المنتجات بمقاس 1600x1200 )
            ├── 📄 process.webp          ( صورة قسم ورشة العمل بمقاس 1600x1200 )
            ├── 📄 methodology.webp      ( صورة قسم المنهجية بمقاس 1600x1200 )
            ├── 📄 journal-hero.webp     ( صورة المدونة البارزة بمقاس 1600x1200 )
            └── 📄 journal-1.webp ...    ( 3 صور مصغرة للمدونة بمقاس 1600x1067 )
```

> **Build status:** ✅ `next build` يجتاز نظيف (compiled in 3.0s, TypeScript clean, prerendered as static).
> **Routes:** `/` (landing). الـ `/admin` و `/code-limit` و `/api/*` لاحقاً.
> **Bundle health:** zero dynamic imports حتى الآن، lucide-react مع `optimizePackageImports`، GSAP يعمل client-side فقط.

---

## 🎨 Project Metadata

### Design System
- **Library:** shadcn-pattern primitives على Radix + Tailwind v4 (لم نُهيّئ shadcn CLI، بنينا الـ primitives يدوياً للحفاظ على tokens المخصصة)
- **Aesthetic:** Premium tech — glassmorphism nav + aurora hero gradient + grid backdrop + film grain + cursor-following spotlights
- **Theme:** Dark-first (افتراضي force dark)، light-mode tokens جاهزة مستقبلاً
- **RTL:** `<html dir="rtl" lang="ar">` على مستوى الجذر، logical CSS، slide-from-right للـ mobile menu

### Typography
- **UI Display (headings):** IBM Plex Sans Arabic 300/400/500/600/700 — RTL أصلي
- **UI Body (latin fallbacks):** Inter
- **Mono (orders, code):** JetBrains Mono
- **Loading:** `next/font/google` مع `display: swap`، CSS variables `--font-display` / `--font-body` / `--font-mono`

### Color Palette (HSL design tokens)
- **Surfaces:** `--bg` zinc-950 → `--surface` → `--surface-2` → `--surface-3` → `--border` ladder
- **Foreground:** `--fg` near-white → `--fg-muted` → `--fg-subtle`
- **Brand:** `--brand` electric cyan (191° 91% 55%) → `--brand-lo` sapphire (217° 91% 60%) → `--brand-hi` hover
- **Semantic:** `--success` emerald, `--warn` amber, `--danger` rose, `--info` blue
- **All consumed via Tailwind `@theme inline`** فمتاحة كـ utilities (`bg-brand`, `text-fg-muted`, إلخ)

### Animation Stack
- **GSAP 3** + `@gsap/react` (`useGSAP` hook scoped to component refs — يحل cleanup auto)
- **ScrollTrigger** للـ pinned sections + scrub timelines + horizontal panels + garage door
- **Lenis** smooth scroll مربوط بـ GSAP ticker (RAF unified)
- **No Framer Motion** — تجنّب تضارب libraries
- **Reduced motion respect:** كل الحركات `gsap.matchMedia` تستخدم `(prefers-reduced-motion: no-preference)`، fallback عملي

### Tech Stack (Authoritative)

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions, Turbopack) |
| Runtime | React 19 |
| Styling | TailwindCSS 4 + custom design tokens |
| UI primitives | Radix UI (Dialog, Accordion, Slot, Label) + custom shadcn-pattern wrappers |
| Animation | GSAP 3 + @gsap/react + ScrollTrigger |
| Smooth Scroll | Lenis |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| Icons | lucide-react (+ inline SVG لأي brand mark غير موجود) |
| Class composition | clsx + tailwind-merge + class-variance-authority |
| Theming hook | next-themes (مهيّأ، لم يُستخدم بعد — نطلب dark force حالياً) |
| Database | Supabase PostgreSQL 15+ |
| Auth | Supabase Auth + TOTP 2FA (admin) |
| Edge Compute | Cloudflare Workers (webhooks, rate limit) |
| Backend Logic | Supabase Edge Functions (Deno) |
| Scheduling | Supabase pg_cron + Cloudflare Cron Triggers |
| Queue | Custom — Postgres-backed jobs + CF Queues |
| Encryption | pgsodium / Supabase Vault |
| File Storage | Supabase Storage (signed URLs) |
| Email | Resend + React Email |
| WhatsApp | Meta Cloud API (Official) — TBD |
| SMS | Local SA provider (Unifonic / Mobily) — TBD |
| Telegram | Bot API |
| CDN / DNS / WAF | Cloudflare (Free → Pro) |
| Captcha | Cloudflare Turnstile |
| Hosting (Frontend) | Vercel |
| Source / CI | GitHub + Vercel auto-deploy |
| Error Tracking | Sentry |

### Architecture Style
- **Serverless / Edge-first** — لا VPS، لا PM2، لا Nginx manual
- **Multi-zone Next.js:** `delivery.domain.com`, `/admin`, `/code-limit` كـ route groups مع RBAC على مستوى middleware + RLS
- **Webhook-driven:** Storefront → CF Worker → Supabase Edge Function → DB → Notification Queue
- **Atomic distribution:** Round Robin via Postgres `SELECT FOR UPDATE SKIP LOCKED`
- **Idempotent everywhere:** كل mutation له idempotency key، الـ webhooks بـ `event_id` unique

### Security Posture
- pgsodium encryption للحقول الحساسة (passwords, 2FA secrets, Steam shared_secret)
- RLS policies صارمة لكل جدول
- HMAC verification على webhooks المتجر السحابي
- Rate limiting على Cloudflare edge قبل الوصول للـ origin
- Turnstile (Captcha) على واجهة العميل
- Audit logging لكل عملية privileged (who/what/when/where)
- Daily backups عبر Supabase + external snapshot للـ S3-compatible storage

### Brand Identity
- **Name:** **وَصَل / Wasel** — معنى مزدوج "arrived / delivered"، يتطابق مع وعد المنصة
- **Logo:** glyph على شكل `W` مكون من chevron يُكوّن سهم تسليم + نقطة فوق — mono SVG مع linear gradient
- **Wordmark:** Plex Sans Arabic Bold مع text-gradient متحرك (cyan → sapphire → fg)
- **Tagline (Hero):** "استلم منتجك الرقمي خلال ثوانٍ"
- **Footer sign:** "وصلنا. تشرفنا." — pun على الاسم نفسه

### Ownership & Portability
- Repo + DB schema + RLS policies + migrations كلها داخل GitHub repo العميل
- جميع الحسابات (Vercel, Supabase, Cloudflare, GitHub, Resend) باسم العميل
- صفر vendor lock-in قاتل — البديل دائماً متاح (Postgres + Node host أي مكان)
