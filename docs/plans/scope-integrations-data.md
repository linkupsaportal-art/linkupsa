# Plan - Scope Webhook and Integrations Data to User's Stores

This plan resolves the cross-store data leak on `/admin/integrations` where a newly registered user sees another merchant's connected store and event stats.

## Root Cause Analysis
- The function `loadIntegrationData()` in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/integrations/page.tsx) uses `createServiceClient()` to query all connected stores and webhook events globally, without filtering by the logged-in user's memberships.
- Consequently, any user (even with no stores linked) sees all stores and events on the integrations page.

## Proposed Solution
Scope `loadIntegrationData` to the current user's stores:
1. Accept `userId` in `loadIntegrationData(userId?: string)`.
2. Fetch the user's store IDs from `store_members` where `user_id = userId`.
3. If no store IDs exist, return empty data lists immediately.
4. If store IDs exist, filter all queries to `salla_stores` and `webhook_events` using `.in("store_id", storeIds)`.

## Implementation Steps

- [ ] Modify `loadIntegrationData` in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/integrations/page.tsx) to accept `userId` and filter by user store memberships.
- [ ] Update `IntegrationsPage` in [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/integrations/page.tsx) to pass `user?.id` to `loadIntegrationData`.
- [ ] Run `npm run build` to confirm zero compilation errors.
- [ ] Update `docs/changelog.md` to document the change.

## Verification Plan
- Verify that a user with no stores connected sees 0 active stores and 0 events.
- Verify that a user with linked stores only sees their own store and events.
