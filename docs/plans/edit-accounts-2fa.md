# Implementation Plan - Edit Accounts and 2FA Code Visibility

This plan outlines the implementation of:
1. General edit capabilities for account details in the admin panel.
2. Improved 2FA code visibility, including live code generation in the admin panel and automatic 2FA code loading on the customer pickup portal.

## User Review Required

> [!NOTE]
> - Editing sensitive credentials (password, TOTP secret, Steam secret, card code) is fully supported. Leaving the fields blank in the edit form will preserve the current encrypted database values.
> - To make the 2FA code instantly visible to the customer on load, the pickup portal will auto-fetch the TOTP/Steam Guard code on mount, bypassing the manual "Get Code" button trigger.

## Proposed Changes

### Database & Server Layer

#### [MODIFY] [accounts.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/db/accounts.ts)
- Add `updateAccount` function to perform database updates on the `accounts` table.
- Encrypt updated credentials on-the-fly and preserve existing encrypted secrets if blank values are submitted.

#### [MODIFY] [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/accounts/actions.ts)
- Add `updateAccountAction` to process the updated account form submission.
- Modify `revealAccountSecretsAction` to calculate and return the active 6-digit TOTP / Steam Guard code along with the remaining seconds.

### Admin Panel UI

#### [MODIFY] [accounts-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/accounts/accounts-client.tsx)
- Integrate an **Edit Icon** (Lucide `Pencil`) on each account card.
- Add an `EditAccountDialog` prefilled with existing account data.
- Display the active 6-digit 2FA code directly inside the account details viewer with a live countdown timer.

### Client Pickup Portal

#### [MODIFY] [totp-code-block.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/totp-code-block.tsx)
- Auto-trigger the TOTP code fetch on component mount (`useEffect`) so the 2FA code displays immediately on load.

## Verification Plan

### Automated Build Verification
- Run Next.js production build: `npm run build` or `npx next build`.

### Manual Verification
- Open the Admin Accounts panel, edit an existing account, and confirm changes persist in the database.
- Click the "View Details" (eye) icon on a 2FA account and verify that the active 6-digit code is displayed and counts down.
- Access the client pickup portal, enter a valid order number, and confirm the 2FA code loads automatically.
