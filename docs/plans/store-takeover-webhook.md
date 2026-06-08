# Store Takeover Logic for Webhook Auto-Linking

Implement store takeover functionality during Salla webhook auto-linking when a different merchant/user connects a store that is already linked in the platform.

## User Review Required

> [!NOTE]
> This takeover logic allows a user with a valid `x-portaliosa-key` to hijack or re-assign a store that is already connected to someone else. This is expected behavior since possession of the `x-portaliosa-key` implies admin authority over the storefront. All previous memberships for this store will be wiped out when a takeover occurs.

## Proposed Changes

### Salla Integrations Component

#### [MODIFY] [auto-link.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/salla/auto-link.ts)

Update the `autoLinkStore` function to:
- Detect if the store (`merchantId`) has any memberships belonging to users other than the one currently connecting.
- If so, delete those other memberships from `store_members`.
- Upsert the current connecting user as the owner (`is_owner: true`, `role: "manager"`).

## Verification Plan

### Automated Tests
- Run compilation verification:
  - `npm run build`

### Manual Verification
- We will execute a scratch script to mock the webhook auto-link with different keys on the same store ID and verify that the database table `store_members` behaves correctly:
  - First link with Key A (User A becomes owner).
  - Second link with Key B (User B becomes owner, User A is removed).

## Review

### Execution Summary
- **Code Changes**: Implemented automatic store takeover inside the `autoLinkStore` function at [auto-link.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/salla/auto-link.ts). It deletes all memberships for the connected store that do not belong to the user possessing the valid `x-portaliosa-key` webhook key, then upserts the current user as the sole manager and owner.
- **Compilation Check**: Executed `npm run build` which passed successfully with all routes compiled and static pages successfully generated.
- **Automated Verification**: Created and ran a custom test suite [test-takeover.mjs](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/scripts/test-takeover.mjs) which successfully simulated local webhook payload calls for User A and User B on a dummy store, validating clean database resets, user takeover, and self-cleaning state. All checks passed.

