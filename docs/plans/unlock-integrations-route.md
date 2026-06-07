# Plan - Unlock Integrations and Webhooks Route for Onboarding Users

This plan describes how we will unlock the `/admin/integrations` route for newly registered users who do not have an active store membership yet. This allows them to access their webhook keys, set up the webhook in Salla, and verify their connection to fully unlock their dashboard.

## Root Cause Analysis
- Currently, users without an active `store_membership` are treated as "locked" (onboarding mode).
- The middleware in `lib/supabase/session.ts` gates all `/admin/*` routes, redirecting non-member users back to `/admin` unless the pathname is `/admin` or starts with `/admin/profile`.
- In `app/admin/layout.tsx`, the `unlockedHrefs` list only permits `/admin/profile` (and pending staff invites).
- Consequently, when an onboarding user clicks the "إعداد الويب هوك" (Setup Webhook) button on the onboarding dashboard, they are blocked by the middleware and redirected back to `/admin`. They cannot see their personal webhook key or the setup guide.

## Proposed Solution
We will unlock `/admin/integrations` for onboarding users:
1. **Modify `lib/supabase/session.ts`**: Add `/admin/integrations` to the `alwaysAllowed` list.
2. **Modify `app/admin/layout.tsx`**: Add `/admin/integrations` to the `unlockedHrefs` array so it is navigable.

## Implementation Steps

- [ ] Update [session.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/supabase/session.ts) to include `/admin/integrations` in `alwaysAllowed`.
- [ ] Update [layout.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/layout.tsx) to include `/admin/integrations` in `unlockedHrefs`.
- [ ] Run `npm run build` to ensure the project builds correctly without any TypeScript or lint errors.
- [ ] Update `docs/changelog.md` to document this routing update.

## Verification Plan
- Verify that users without an active store membership can successfully access `/admin/integrations`.
- Ensure the sidebar navigation item for "ربط المتجر و Webhooks" is unlocked (no lock icon) and clickable.
