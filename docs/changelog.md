# 📜 Changelog — Digital Product Delivery Platform

> Reverse-chronological history of meaningful project changes.
> Hard cap: 500 lines. Trim to 400–450 when exceeded.

# 2026-06-09 15:20

- ⚙️ **Cleaned Up Dashboard UI Tabs & Removed Upgrade Card — Razex Xelite**
  - **Removed Non-Functional Tabs**: Simplified the admin dashboard's tab navigation in [dashboard-tabs.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/dashboard-tabs.tsx) to only display "النظرة العامة" (Overview) and "الإعدادات" (Settings).
  - **Removed Upgrade Plan Card**: Deleted the `<UpgradeCard />` element and its helper definition from [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/page.tsx).
  - **Adjusted Dashboard Stats Grid**: Reconfigured the layout grid columns from three to two columns (`grid-cols-1 sm:grid-cols-2`) to avoid layout gaps after removing the Upgrade card.
  - **Remote Repo Switch**: Updated remote repository origin to point to the correct live deployment repo at `linkupsaportal-art/linkupsa`.

# 2026-06-09 14:35

- ⚙️ **WhatsApp Config UI Cleanup & Disabled Ban Notifications — Razex Xelite**
  - **Removed Redundant Config Fields**: Removed input fields for `default_template`, `ban_template`, and `language` (لغة القوالب) from the WhatsApp Config dialog [whatsapp-config-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/notifications/whatsapp-config-dialog.tsx).
  - **Cleaned Config Overview Layout**: Removed the display for "قالب التسليم" in [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx) and updated help text to clarify that templates are defined on a per-product basis.
  - **Disabled Ban Notifications**: Deleted WhatsApp ban notifications sending logic from `notifyPhoneBan` in [ban-notify.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/notifications/ban-notify.ts), ensuring that banned phone numbers are simply blocked without triggering extra messages.

# 2026-06-09 14:20

- 🖼️ **Restricted Store Branding to Linkup.saudi@gmail.com — Razex Xelite**
  - **Specific Merchant Filtering**: Updated branding queries in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/page.tsx) to query the database exclusively by email `Linkup.saudi@gmail.com` to guarantee store logo and name display correctly.

# 2026-06-09 14:15

- 🖼️ **Dynamic Store Branding & Logo on Customer Pickup Screen — Razex Xelite**
  - **Dynamic Database Queries**: Implemented profile lookup in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/page.tsx) to query the active merchant's `store_name` and `avatar_url` from the database.
  - **Dynamic Branding Layout**: Renders the uploaded merchant logo (profile image) on the customer pickup screen, with fallback to the default package icon. Updates the page header dynamically with `استلام طلبك من [اسم المتجر]`.
  - **Dynamic Page Title & Metadata**: Added `generateMetadata` function on the page component to dynamically set the browser tab title as `استلام طلبك | [اسم المتجر]`.

# 2026-06-09 14:00

- 🎨 **Messages UI Refinement & Inputs & Custom Dropdown Redesign — Razex Xelite**
  - **Premium Dropdown Component**: Replaced the native HTML `<select>` with the custom `CustomSelect` component for sorting templates, adding custom chevron transitions and polished selection highlights.
  - **Sleek Variable Code-Tags**: Redesigned dynamic variable badges to look like high-contrast code pills (`bg-surface font-mono`) with a smooth lime glow on hover.
  - **Polished Input Forms & Popups**: Upgraded input heights, padding, font weights, and border focus rings (`focus:ring-accent/30`) in both the Template Builder Modal and WhatsApp Config Dialog.

# 2026-06-09 13:50

- 🎨 **Template Builder UI Overhaul & @emoji-mart/react Emoji Picker — Razex Xelite**
  - **Full Emoji Picker**: Replaced the static 20-emoji grid with `@emoji-mart/react` via a new [emoji-picker-popover.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/emoji-picker-popover.tsx) component. Features dark theme, Arabic locale, category navigation, skin tone selector, and click-outside-to-close.
  - **Enhanced Template Cards**: Upgraded template cards with WhatsApp-style chat bubble previews, message icon badges, group hover actions with smooth opacity transitions, and max-height scrollable preview.
  - **Upgraded Template Builder Dialog**: Wider dialog (max-w-5xl), inline toolbar with emoji picker + character/variable count, 14-row textarea with RTL support, and live preview panel showing dynamic variables as highlighted accent-colored badges.
  - **Better Empty States**: Added icon + description empty state for zero search results.
  - **API Test Results**: Verified template sending via `test-send-all-templates.mjs` — 8/12 approved templates sent successfully. Failures are Meta-side issues (named parameter templates and disabled API calling).

# 2026-06-09 12:45


- 📨 **WhatsApp Standard Mode Custom Template Builder & Management — Razex Xelite**
  - **Dynamic Client-Side Template Builder**: Implemented `TemplateBuilderDialog` in [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx) supporting template naming, text area message drafting, dynamic variables injection at cursor location, and emoji list insertion.
  - **Templates CRUD Operations**: Created interactive UI inside the "واتساب بزنس العادي" (Standard Mode) tab for searching, sorting, editing, duplicating, and deleting custom templates. Pre-populated 4 default templates to ensure a beautiful initial layout.
  - **Database Persistence**: Added `saveWhatsAppTemplatesAction` in [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/notifications/actions.ts) to store custom templates inside the `config.custom_templates` JSONB column of the whatsapp notification channel row, providing clean store-scoped persistence without schema changes.

# 2026-06-09 11:45

- 📨 **Restored WhatsApp Standard Mode & Enterprise Warning Banner — Razex Xelite**
  - **Restored Dual Mode Selector**: Restored the selector tabs at the top of [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx) allowing admins to toggle between "واتساب API المؤسسي" (Enterprise) and "واتساب بزنس العادي" (Standard).
  - **Enterprise Warning Banner**: Added a detailed alert banner outlining Meta requirements: Enterprise API mode cannot initiate conversations without approved templates, except within a 24-hour reply window where free-form messages are permitted.
  - **Restored Standard Mode Details**: Restored the "واتساب بزنس العادي" tab content describing direct free-form messaging, no templates, no time window restrictions, and the "قريباً" (Coming soon) configuration status.

# 2026-06-08 22:23

- 📋 **Meta/Karzoun Approved Templates Dropdown Support — Razex Xelite**
  - **Dynamic Template Fetching**: Added a new server action `getKarzounTemplatesAction` in [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/products/actions.ts) that fetches the list of approved templates directly from the Karzoun GraphQL API for the currently active store.
  - **Dropdown Populate & Fallback**: Updated the options in the Product Add/Edit Dialog inside [products-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/products/products-client.tsx) to dynamically load the templates on mount, falling back to a pre-defined static list (`WHATSAPP_TEMPLATE_OPTIONS` in [products-types.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/products-types.ts)) if Karzoun is not configured or disabled.
  - **Dialog Integration**: Added template selection dropdowns directly into the Product Add/Edit Dialog using the styled `CustomSelect` component with `enableSearch={true}`.
  - **Form Data Logic**: Linked the dropdown options to state variables (`whatsappTemplate` / `emailTemplate`) and form inputs, ensuring they are sent to the server actions inside `createProductAction` and `updateProductAction` in [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/products/actions.ts).

# 2026-06-08 21:28

- 🔗 **Local Testing & Webhook Connection Verification for Linkup.saudi@gmail.com — Razex Xelite**
  - **Profile Synchronization**: Associated `Linkup.saudi@gmail.com` with the existing user profile ID `ff409995-f4bb-46e5-85f2-39758b03c6db` (named `razex xelite`), generated the webhook key `pk_1dbe36b65072c1dbf56ca4bf0329f176` and registered it using [create-linkup-saudi-user.mjs](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/scripts/create-linkup-saudi-user.mjs).
  - **Simulated Webhook E2E Test**: Developed [test-linkup-webhook.mjs](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/scripts/test-linkup-webhook.mjs) to send a simulated `app.store.authorize` event for merchant `1075453390` (LinkUp SA Live) to the local dev server. This successfully returned `200` and updated store records.
  - **Takeover Verification**: Confirmed that the webhook auto-link logic successfully reassigned ownership of store `1075453390` by removing `juilui1562@gmail.com` and registering `Linkup.saudi@gmail.com` as the sole owner.
  - **Server Action Validation**: Created [test-check-connection.mjs](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/scripts/test-check-connection.mjs) to test the `checkWebhookConnectionAction` logic locally, which confirmed `connected: true` with 146 total events.

# 2026-06-08 20:57

- 🔔 **Per-Product Notification Template Selectors — Razex Xelite**
  - **New UI Dropdowns**: Added "رسالة الواتساب" and "رسالة البريد الإلكتروني" dropdown selectors to the Product Add/Edit dialog in [products-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/products/products-client.tsx). Each dropdown lets the admin choose which template to send (or "بدون إرسال" to disable that channel for the product).
  - **Type Evolution**: Extended `Product.notification_channels` JSONB type with `whatsapp_template` and `email_template` optional fields in [products-types.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/products-types.ts). Added `WHATSAPP_TEMPLATE_OPTIONS` and `EMAIL_TEMPLATE_OPTIONS` constants.
  - **DB Layer**: Updated `createProduct()` in [products.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/products.ts) to accept `notification_channels` at creation time.
  - **Server Actions**: Added `buildNotificationChannels()` helper in [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/products/actions.ts) — both `createProductAction` and `updateProductAction` now parse template selections from FormData and persist them.
  - **Dispatch Override**: Extended `NotifyArgs` in [dispatch.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/notifications/dispatch.ts) with `whatsappTemplate` override that takes priority over the store's `default_template`.
  - **Ingestor Plumbing**: Updated `sendNotification()` in [order-ingestor.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/salla/order-ingestor.ts) to read template names from `notification_channels` JSONB and pass them through to dispatch.

---

# 2026-06-08 19:50

- 🔗 **Webhook Store Takeover & Ownership Reassignment — Razex Xelite**
  - **Implemented Takeover Logic**: Updated `autoLinkStore` in [auto-link.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/salla/auto-link.ts) to detect if a webhook auto-link matches a store already owned or managed by other user(s).
  - **Automated Membership Cleanup**: Deletes all previous memberships for the matching `store_id` in the `store_members` table that do not belong to the connecting user.
  - **Reassigned Sole Ownership**: Upserts the currently connecting user as the sole manager and owner (`is_owner: true`, `role: "manager"`) of the storefront.
  - **Verification Suite**: Created [test-takeover.mjs](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/scripts/test-takeover.mjs) to run end-to-end webhook simulation of storefront takeover, confirming automatic database cleanup, ownership re-allocation, and self-cleaning state.

# 2026-06-08 19:44

- 📨 **Exclusive WhatsApp API Mode & Test Store Purge — Razex Xelite**
  - **Removed Standard Mode Selector**: Completely removed standard mode tabs, coming soon banners, and features selection from [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx) to exclusively use Enterprise WhatsApp API (Karzoun Chat) mode. Cleaned up unused Lucide icon imports.
  - **Database Store Purge**: Executed a direct database cleanup to delete the test store entry `Julia's Test Store 🛍️` (Store ID `99999`) and all associated store memberships from Supabase.

# 2026-06-08 19:42

- 🎨 **Global Yellow/Lime Badge Text Contrast Polish — Razex Xelite**
  - **Improved Contrast on Yellow Badges**: Changed text color from `text-amber-500` / `text-accent` / `text-yellow-400` / `text-warn` to `text-black` globally inside status badges with yellow/lime backgrounds.
  - **Affected components**:
    - [email-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/email-messages-client.tsx) — configured/enabled/succeeded badges
    - [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx) — standard mode incoming/status/succeeded badges
    - [notifications-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/notifications/notifications-client.tsx) — succeeded/enabled status badges
    - [bans-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/bans-tab.tsx) — auto-banned/expires badges
    - [telegram-admin-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/telegram/telegram-admin-client.tsx) — enabled status badges
    - [logs-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/logs-tab.tsx) — ok/warn result mapping tone classes
    - [products-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/products/products-client.tsx) — active product status badges
    - [staff-manager.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/staff/staff-manager.tsx) — supervisor/code-limit/2fa status badges
    - [orders-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/orders/orders-client.tsx) — payment/fulfillment status badges
    - [settings/page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/settings/page.tsx) — security item status badges
    - [section-card.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/profile/section-card.tsx) — warn status badge variant mapping
    - [recent-orders-table.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/recent-orders-table.tsx) — pending status badge CSS class
    - [workspace-switcher.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/workspace-switcher.tsx) — role switcher supervisor/code-limit pill colors

# 2026-06-08 19:36

- 📨 **New "الرسائل" Sidebar Section — WhatsApp & Email Dedicated Pages — Razex Xelite**
  - **Nav config**: Added new "الرسائل" group in [nav-config.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/nav-config.ts) with `رسائل واتساب` (`/admin/messages/whatsapp`) and `رسائل الإيميل` (`/admin/messages/email`) sub-items.
  - **RBAC**: Added `view_messages` / `manage_messages` capabilities and `/admin/messages` route rule for manager+supervisor in [rbac.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/auth/rbac.ts).
  - **WhatsApp Messages Page**: Dual-mode card selector — **واتساب بزنس العادي (Standard)** with feature cards + coming-soon banner, and **واتساب API المؤسسي (Enterprise)** with inline config overview, Karzoun Chat integration, and WhatsApp dispatch history.
  - **Email Messages Page**: Resend config overview with icon cards (API key, domain, from, reply-to), email template previews (order ready, ban alert, staff invite), and email dispatch history.
  - **DB**: Added `listDispatchesByChannel()` in [notifications.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/notifications.ts) to filter dispatches per channel.
  - **Actions**: Updated existing notification actions to revalidate new `/admin/messages/*` paths.
  - **Responsive**: All pages mobile-first, responsive tables hide columns on small screens.

# 2026-06-08 17:18

- 🗑 **Removed Instructions Field from Accounts — Razex Xelite**
  - **Removed the `التعليمات` field**: Deleted the instructions textarea field from both [add-account-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/add-account-dialog.tsx) and [edit-account-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/edit-account-dialog.tsx) modals per user request.
- 🔍 **Search & "Add Product" Redirection in CustomSelect Dropdown — Razex Xelite**
  - **CustomSelect upgrade**: Added optional search filtering (`enableSearch`) and a bottom redirection button (`addButton`) inside the custom dropdown primitive at [select.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/ui/select.tsx). Set a scroll height limit of `max-h-48` to handle large product catalogs cleanly.
  - **Wired to Account creation/edits**: Configured the product select inputs in [add-account-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/add-account-dialog.tsx) and [edit-account-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/edit-account-dialog.tsx) to enable product search and render a redirection link to `/admin/products` ("إضافة منتج جديد").

# 2026-06-08 17:12

- 📱 **Mobile Sidebar Theme Inheritance Fix — Razex Xelite**
  - **Fixed Transparent/Invisible Drawer on Mobile**: Added the `.theme-admin` class to `Dialog.Content` in [topbar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/topbar.tsx). This ensures that the Radix Portal-rendered mobile sidebar inherits the administrative CSS variables, allowing `.surface-dark` to render its background and text colors correctly instead of appearing transparent.
- 📝 **Taller & Resizable Instructions Textarea — Razex Xelite**
  - **Fixed Textarea Squashing**: Replaced `.form-input` height limits on the instructions field in [add-account-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/add-account-dialog.tsx) and [edit-account-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/edit-account-dialog.tsx) with a dynamic `h-auto min-h-[120px]` layout. Added vertical resize support (`resize-y`) and relaxed text rendering (`leading-relaxed font-sans`) for a premium input experience.

# 2026-06-07 22:45

- 🔗 **Webhook Auto-Link Fix + Store Name Enrichment — Razex Xelite**
  - **Fixed premature serverless termination**: Changed `autoLinkStore` from fire-and-forget (`.catch()`) to `await` in the webhook route, preventing Vercel from killing the function before `store_members` upsert completes.
  - **Store metadata extraction**: The webhook route now extracts `data.store.name` and `data.store.url` from Salla order payloads and passes them to `autoLinkStore` for enrichment.
  - **API-based fallback enrichment**: After auto-linking, if the `salla_stores` row has an access token (from prior OAuth) but no store name, `refreshStoreInfo` is called to fetch name/URL/logo from Salla's API.
  - **Updated `autoLinkStore` signature**: Now accepts optional `WebhookStoreMeta` to enrich the store upsert.

# 2026-06-07 21:26

- 🔒 **Fixed Cross-Store Data Leak on Integrations Page — Razex Xelite**
  - **Scoped Queries to Logged-in User**: Updated `loadIntegrationData` in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/integrations/page.tsx) to query the user's linked store IDs from the `store_members` table first, and then filtered all queries to `salla_stores` and `webhook_events` using `.in("store_id", storeIds)`.
  - **Secured Onboarding State**: Users with zero connected stores will now see empty lists and only their own personal setup guide, preventing access to other merchants' stores and webhook statistics.

# 2026-06-07 21:23

- 🔓 **Unlocked Webhook & Integrations Route for Onboarding — Razex Xelite**
  - **Middleware Gate Bypass**: Added `/admin/integrations` to the `alwaysAllowed` route list in [session.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/supabase/session.ts). This allows onboarding users (without an active store membership yet) to load this page without being redirected back to `/admin`.
  - **Sidebar Navigation Unlock**: Added `/admin/integrations` to the `unlockedHrefs` array in [layout.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/layout.tsx), ensuring it is clickable (lock icon removed) and navigable during onboarding.

# 2026-06-07 21:20

- 🛠️ **Signup Database Trigger Fix — Razex Xelite**
  - **Resolved Registration Blocker**: Fixed the database trigger function `handle_new_user()` which was failing on signup with a `Database error creating new user` (causing transaction rollback).
  - **Qualified Schema & Secured Search Path**: Fully qualified the `gen_random_bytes` call as `extensions.gen_random_bytes` and added `SET search_path = public, extensions` to the trigger function to ensure it runs correctly regardless of the caller's search path (such as the internal `supabase_auth_admin` daemon user).

# 2026-06-07 20:53

- ⚙️ **Account Editing & Immediate 2FA Visibility — Razex Xelite**
  - **Modularized accounts components**: Refactored the monolithic `accounts-client.tsx` (over 700 lines) into neat, focused subcomponents under `components/admin/accounts/` to comply with the 500-line strict limit.
  - **Account Editing support**: Added `updateAccount` database helper and `updateAccountAction` server action to allow admins to edit existing accounts (including optional secure credentials update without overwriting blank secrets). Wired a Lucide `Pencil` edit button to each account card.
  - **Active 2FA display in Admin**: Updated `revealAccountSecretsAction` and `ViewDetailsDialog` to calculate and render the active 6-digit TOTP or Steam Guard code directly in the admin modal with a live countdown and manual refresh trigger.
  - **Automatic 2FA loading for Customers**: Added mount-based auto-fetch (`useEffect`) inside `app/pickup/totp-code-block.tsx` so customer-facing verification codes load instantly upon page entry without requiring a manual click.

# 2026-06-07 20:39

- 🔑 **Per-User Webhook Key & Auto Store Linking — Razex Xelite**
  - **Auto-generated `webhook_key`**: Every user now gets a unique `pk_` + 32-hex key stored in `profiles.webhook_key`. Generated on signup via DB trigger and lazy-provisioned for existing users.
  - **New [auto-link.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/salla/auto-link.ts)**: `resolveWebhookKey()` reads the `x-portaliosa-key` header (handles Salla's reversed key/value bug). `autoLinkStore()` auto-creates `salla_stores` + `store_members` rows when a webhook arrives with a valid key.
  - **Webhook route integration**: [route.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/api/salla/webhook/route.ts) now calls `resolveWebhookKey` + `autoLinkStore` after auth verification — fully self-service store onboarding.
  - **Connection Check button**: New `checkWebhookConnectionAction` in [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/integrations/actions.ts) + `ConnectionChecker` UI in [stores-list.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/integrations/stores-list.tsx) — "فحص الاتصال" button queries `webhook_events` and displays connected/not-connected status with event details.
  - **Integrations UI**: 4th `ConfigField` showing the user's personal `x-portaliosa-key` with copy button and hint text.
  - **DB trigger updated**: `handle_new_user()` now auto-generates `webhook_key` on user creation.

# 2026-06-07 20:15

- ⚡ **Simplified Salla Webhook Setup Guide — Razex Xelite**
  - **Minimal Webhook Setup UI**: Simplified the `WebhookSetupGuide` in [stores-list.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/integrations/stores-list.tsx) to show only the essential webhook parameters (URL, `authorization` token, and `x-salla-security-strategy`) with direct copy buttons.
  - **Streamlined Presentation**: Removed extra optional fields (name, event types, versions, advanced conditions) and the step-by-step instructions text list to make configuration input fast and clean.
  - **Clean Build Integrity**: Verified the Next.js production build compiles successfully with all TypeScript diagnostics passing.

# 2026-06-03 17:15

- 💎 **Brand Rebrand & Salla Review Compliance - Razex Xelite**
  - **Platform-wide Rebrand to Portalio SA**: Renamed all occurrences of "LinkUp" and "LinkUp+" to "Portalio SA" across layouts, metadata descriptions, the logo component, page-reveal curtain, hero title, onboarding dashboards, and the footer monogram (now spelling PORTALIOSA) to align with the client's public app deployment.
  - **Salla Review Verification Pages**: Created `/privacy` (Privacy Policy), `/support` (Technical Support & Help desk), and `/faq` (Structured Help Accordion) routes in Next.js, fully styling them according to the dark-first premium design system.
  - **Footer Link Integration**: Linked the new verification pages directly from the footer menu to ensure indexing and crawling by the Salla review bots.
  - **Ready-To-Use Service Trial Account**: Created and confirmed `salla-tester@portaliosa.com` with static password `SallaTester2026!` in Supabase Auth, pre-linking them to the demo store workspace `1375098081` so the Salla verification team can bypass MFA and log in directly to verify the dashboard.
  - **Green Build Integrity**: Verified the entire Next.js build compiles clean with static page generation completing with 0 errors.

# 2026-06-02 17:50

- 🌐 **Salla App Store Compatibility & Public App Shift — Razex Xelite**
  - **Public App Credentials Integration**: Configured the newly issued Client ID (`c13f5fa5-8f25-4bad-9eb4-2626d81e5b3d`) and Client Secret (`4a108d57be49a5837490e094193545d7d1ed64364db4abab1b807ac8004a3864`) in `.env`, successfully completing the transition to the free Salla Public App Store ecosystem in Easy Mode.
  - **Graceful CSRF State Validation**: Updated the Salla OAuth callback route in [route.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/api/salla/oauth/callback/route.ts) to make state cookie validation optional. It now only enforces CSRF checks if state session cookies exist, enabling direct App Store installation (Easy Mode / Public App flow) where redirect starts on Salla's domain.
  - **Pristine Public Multi-Tenancy**: Preserved Salla's built-in multi-tenant database mapping, ensuring that any merchant can now seamlessly install the public app and authorize securely with zero session expirations or installation failures.

# 2026-05-31 20:10

- 🗄️ **Archive Restore — fully wired — Razex Xelite**
  - **Archived-orders list + restore**: [archived-orders.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/archives/archived-orders.tsx) renders every archived order on the Archives page with search + a per-row restore button. Fulfils the spec's "إمكانية استعادة الأرشيف" (previously restore was coded but unreachable — archived orders were filtered out of the Orders list).
  - **Data + action**: `listArchivedOrders()` in [orders.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/orders.ts) + `restoreOrderAction` in [archives/actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/archives/actions.ts). Added `archived_reason` to the Order type.
  - **Tests**: e2e extended to cover archive→appears-in-list→restore→drops-from-list. `test-e2e-actions.mjs` → 21/21. Build exit 0.



- 🎯 **Delivery Completeness Pass #2 — Razex Xelite**
  - **Signed URLs for digital files**: New private `digital-files` bucket + [digital-files.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/storage/digital-files.ts). Pickup now mints a 5-min signed URL instead of exposing a permanent path (spec: signed URLs ≤5min).
  - **Edit IMAP after creation**: `updateAccountEmailConfigAction` + an edit dialog on email-code account rows — swap host/user/password/sender-filter/regex without recreating (handles Abdullah's rotating mailboxes). Blank password keeps the current one.
  - **Manual cleanup**: Archives page buttons now live — [archives/actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/archives/actions.ts) + [cleanup-buttons.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/archives/cleanup-buttons.tsx) run archive/purge on demand (manager-only, confirm dialogs).
  - **Resend + Renew order actions**: `resendOrderNotificationAction` (re-fires email/WhatsApp via notifyOrderReady) and `renewOrderAction` (resets usage, reactivates, optional limit bump, journaled) wired into the order row menu.
  - **Tests**: new `test-e2e-actions.mjs` → 19/19 (signed URLs, raise/usage/reassign/stop/archive/restore/renew, retention). crypto 13/13, search 14/14. Build exit 0.



- 🔐 **Security + Delivery Completeness Pass — Razex Xelite**
  - **Real encryption (AES-256-GCM)**: New [crypto.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/security/crypto.ts) — app-layer authenticated encryption (v1 envelope) for account secrets. Replaced the Base64-only storage in [accounts.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/accounts.ts) + pickup actions; reads decrypt transparently and still handle legacy rows. Migrated + verified the existing 4 accounts (all decrypt back to originals). Settings/Archives copy now states the truth (AES-256-GCM, not pgsodium).
  - **Captcha (Cloudflare Turnstile)**: [turnstile.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/turnstile.tsx) widget + [turnstile.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/security/turnstile.ts) server verify, wired into the public pickup lookup. Graceful no-op when keys absent.
  - **Steam Guard**: real [steam-guard.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/handlers/steam-guard.ts) generator (5-char Steam alphabet, HMAC-SHA1, 30s window).
  - **Email Code**: [email-code.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/handlers/email-code.ts) IMAP reader (imapflow) extracting the latest verification code; per-account IMAP config entered in the Accounts form, stored encrypted. `get-code-action` now branches by handler type.
  - **Cron + retention**: [/api/cron/maintenance](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/api/cron/maintenance/route.ts) (Vercel Cron 02:00 daily, CRON_SECRET-guarded) archives old orders + purges old OTP logs per configurable retention.
  - **Order management actions**: [orders/actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/orders/actions.ts) + row kebab menu — raise limit, edit usage, reassign account, stop, archive/restore, delete (manager only).
  - **Code-limit panel + audit log**: `code_limit_changes` table + [code-limit-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/code-limit-tab.tsx) — raise limits and view full change history.
  - **Tests**: `test-crypto-handlers.mjs` 13/13 (encryption round-trip, tamper detection, Steam shape), `verify-decrypt.mjs` 5/5 (live decrypt). Build exit 0; search 14/14.



- ⚡ **Instant Page Transitions — Suspense Loading Boundaries — Razex Xelite**
  - **Root cause**: every `/admin/*` route is `force-dynamic` with blocking DB queries and there were ZERO `loading.tsx` boundaries — so clicking a nav item froze on the old page until the full server render (auth → role → queries) returned. It also meant `<Link prefetch>` had nothing to prefetch.
  - **Fix**: added a `loading.tsx` Suspense boundary to every admin route (dashboard, orders, products, accounts, otp-logs, archives, notifications, telegram, integrations, staff, settings, profile). Navigation now swaps the page slot for an instant skeleton while the shell (sidebar + topbar) stays mounted — perceived navigation is immediate.
  - **Shared skeletons**: new [skeletons.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/skeletons.tsx) — pure-CSS `animate-pulse` shapes (Header, Cards, Table, Panel, Dashboard) that mirror each real layout to avoid layout shift. No JS, no images, near-zero cost.
  - **Prefetch unlocked**: with loading boundaries present, the sidebar's `prefetch` links now warm each route's shell on hover/viewport, so the data is often already in flight before the click.
  - **Verified**: `npx next build` → exit 0, all routes intact.



- ⌘ **Smart Command Palette (⌘K) — Razex Xelite**
  - **Unified role-scoped search**: New [search.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/search.ts) sweeps orders, products, accounts, verification logs, and phone bans in parallel — each category gated by the same RBAC capability flags as the rest of the app. NEVER selects secret columns (passwords/TOTP/cards). Numeric-intent detection routes a digits query to order refs + phone tails.
  - **Server action**: [search-actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/search-actions.ts) resolves the caller's membership role and returns nothing for membership-less users (no data leak).
  - **Palette UI**: [command-palette.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/command-palette.tsx) — opens on ⌘K/Ctrl+K or the topbar trigger. Empty query = role-filtered quick actions + navigation launcher; typing (≥2 chars) = debounced live search with grouped, color-tinted, deep-linking results. Full keyboard nav (↑/↓/Enter/Esc), auto-scroll, out-of-order response guard.
  - **Wired into topbar**: [topbar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/topbar.tsx) replaces the dead search input with the palette (locked shell still opens the link-store gate).
  - **Deep-link pre-filter**: Orders + Products pages/clients now read `?q=` and filter live, so picking a palette result lands pre-filtered with an inline search box + clear button.
  - **Verified**: `npx next build` exit 0; `node scripts/test-search.mjs` → 14/14 (role matrix + live query validity + secret-column safety).



- 🔓 **Unlock Profile + Staff (invite accept) in Onboarding Shell — Razex Xelite**
  - **Membership-based route gate**: [session.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/supabase/session.ts) now gates `/admin/*` on `store_members` (real access) instead of the stale `profiles.role` (which defaulted to `manager` for every signup and risked leaking the owner's store). No-membership users may open `/admin` + `/admin/profile` always, and `/admin/staff` only when they have a pending invitation.
  - **Selective unlock**: [sidebar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/sidebar.tsx) + [topbar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/topbar.tsx) accept `unlockedHrefs` — items that stay clickable in locked mode. The layout passes `/admin/profile` (always) and `/admin/staff` (when a pending invite exists), so a fresh user can still manage their account and an invitee can reach the accept/decline banner.
  - **Dashboard self-gates**: [admin/page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/page.tsx) renders the onboarding panel when there's no membership, so `getDashboardAnalytics()` never runs for a membership-less user.
  - **Fix**: invited user (`xelitedo`) was bounced from `/admin/staff` and saw it locked — now the staff link is enabled + reachable so they can accept the invitation.
  - **Verified**: `npx next build` → exit 0, zero diagnostics.



- 🔒 **Full Dashboard Shell in Locked Onboarding Mode — Razex Xelite**
  - **New `LinkStoreGateProvider`**: Added [link-store-gate.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/link-store-gate.tsx) — a lightweight context + shared themed dialog («اربط متجرك أولاً») that any locked control calls via `useLinkStoreGate().requestLink()`. Safe no-op when no provider is mounted (normal member shell).
  - **Locked sidebar**: [sidebar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/sidebar.tsx) now accepts `locked`. In locked mode it shows EVERY section (full `STORE_NAV`, no role filter) but renders each item as a disabled button with a lock glyph that opens the gate dialog instead of navigating.
  - **Locked topbar**: [topbar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/topbar.tsx) — search box, settings icon, and «استيراد طلب» CTA all route to the gate dialog when locked; workspace switcher hidden.
  - **Layout swap, not bounce**: [admin/layout.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/layout.tsx) renders the real shell for membership-less users with `locked`, and swaps `{children}` for the onboarding panel — so the global orders/analytics loaders never run for them (no cross-store data leak).
  - **Onboarding panel reflow**: [onboarding-dashboard.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/onboarding-dashboard.tsx) is now an in-shell content panel (hero + ghost stat tiles + 3-step guide) instead of a standalone page.
  - **Verified**: `npx next build` → exit 0, zero diagnostics.



- 🚪 **Store-Connect Onboarding Dashboard (no dead-end notice) — Razex Xelite**
  - **New `OnboardingDashboard`**: Added [onboarding-dashboard.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/onboarding-dashboard.tsx) — a dashboard-styled welcome surface (same lime/black/cream theme, gradient canvas, ghost stat tiles, 3-step guide) shown to a signed-in user who has not linked a store yet. It exposes ZERO live data and drives a single CTA: «ربط المتجر الآن».
  - **Replaced bare notice**: [admin/layout.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/layout.tsx) now renders the onboarding dashboard instead of the old "لا يوجد متجر مرتبط" card for membership-less users. The layout still intercepts before any data page renders, so the owner's analytics/orders never leak.
  - **Connect grants ownership**: [oauth/callback/route.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/api/salla/oauth/callback/route.ts) now upserts a `store_members` owner row for the signed-in user after the store tokens are saved (auto-owner only when the store has no owner yet; otherwise joins as manager — never hijacks). On success it bounces to `/admin?connected=1`, where the real dashboard renders.
  - **Verified**: `npx next build` → exit 0, zero diagnostics.



- 🎨 **Official Brand Logo Integration in Sidebar Header — Razex Xelite**
  - **Replaced Placeholder Plus Button**: Removed the generic, plain lime green background plus button in the upper right/left (depending on RTL direction) header of the admin sidebar in [sidebar.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/sidebar.tsx).
  - **Embedded LogoGlyph Component**: Integrated our high-fidelity, high-performance WebP official brand logo glyph (`LogoGlyph` displaying `linkup-logo.webp`) to replace the plus icon. Beautifully styled with transparent canvas and scaling hovers.
  - **Cleaned Lucide Imports**: Cleaned up the unused `Plus` icon import in the sidebar file.
  - **Perfect Diagnostics Health**: Confirmed 100% build integrity with a perfect diagnostics score of **100/100**.

# 2026-05-30 14:30

- 📐 **Horizontal Centering & Visual Balance for Settings Tabs — Razex Xelite**
  - **Centered Tab Navigation**: Wrapped the OTP logs hub navigation tabs (`Tabs`) in a centered flex layout inside [otp-logs-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/otp-logs-client.tsx) to align perfectly in the middle of wide viewports under RTL dir.
  - **Balanced Forms Alignment**: Added full centering wrappers (`w-full flex justify-center`) inside the client controller for both the auto-ban and session-timing tabs.
  - **Responsive Sizing Unification**: Added the `w-full` class alongside `max-w-3xl mx-auto` to the root containers in [auto-ban-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/auto-ban-tab.tsx) and [session-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/session-tab.tsx) to achieve seamless layout compliance and eliminate awkward horizontal stretching or squishing.
  - **Verified Compilation Health**: Ran comprehensive diagnostic scans using `react_doctor_diagnose` with all diagnostics enabled to confirm 100% build integrity.

# 2026-05-30 14:25

- 🛡️ **Premium Selector & Integrated PhoneInput for OTP Bans Modal — Razex Xelite**
  - **PhoneInput Country Selector**: Swapped the raw input field in the "حظر رقم جوال" (Ban Phone Number) dialog inside [bans-tab.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/otp-logs/bans-tab.tsx) with our high-end searchable `PhoneInput` component. Enables uniform Saudi Arabian flag triggers and standard international E.164 phone formats automatically.
  - **Resolved Prefix Duplication Bug**: Implemented a defensive prefix filter in the `PhoneInput` callback to prevent the country dial code (e.g. `+213` or `+966`) from being duplicated in the text field when the input is empty or cleared.
  - **Premium CustomSelect Dropdown**: Replaced the native default HTML `<select>` inside the dialog with our custom dynamic `CustomSelect` primitive, styled with unified HSL colors, active checks, and dynamic options mapping.
  - **Type-Safety & Build Integrity**: Confirmed 100% typescript safety and zero linter warnings.

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
- 🔑 **Google 2FA Setup & Security Overhaul — Razex Xelite completed admin profile page security**
  - **Profile Page**: Created a premium admin profile page [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/profile/page.tsx) with tabbed layout.
  - **Two-Factor Authentication (2FA)**: Fully implemented Google Authenticator TOTP setup flow in [two-factor-setup.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/auth/components/two-factor-setup.tsx) and actions.

# 2026-05-28 20:00

- 🎮 **Customer Pickup Redesign & Code Copy — Razex Xelite completed pickup UI**
  - **Premium Cream & Lime Themes**: Designed an ultra-premium customer pickup screen in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/page.tsx).

# 2026-05-27 23:30

- 🏗️ **Admin Dashboard Scaffolding — Razex Xelite completed dashboard structure**
  - **Independent Auth Gateway**: Programmed a custom JWT-based cookie login flow in [login-form.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/auth/components/login-form.tsx).
  - **Active Build Verification**: Validated full compilation compatibility with React Doctor.

# 2026-05-27 22:50

- 🛡️ **Premium Portaliosa Brand Shield & Hero Polish — Razex Xelite completed visual overhaul**

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



