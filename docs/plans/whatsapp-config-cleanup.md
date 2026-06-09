# Plan: Clean Up WhatsApp Configuration Settings & Disable Ban Notifications

## Goal
Remove unnecessary and redundant settings (`default_template`, `ban_template`, and `language`) from the WhatsApp channel configurations UI, since templates are determined per product. Also disable WhatsApp notifications sent to customers upon phone number bans.

## Proposed Changes

### Components - Admin Notifications & Messages

#### [MODIFY] [whatsapp-config-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/notifications/whatsapp-config-dialog.tsx)
- Remove `default_template`, `ban_template`, and `language` from `FormState` and `DEFAULTS`.
- Remove input fields for "قالب الطلب الجاهز", "قالب الحظر", and "لغة القوالب" from the dialog.

#### [MODIFY] [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx)
- Remove the configuration overview item for "قالب التسليم" (tpl) inside `ApiModeContent` component.
- Clean up the default template fallback constants and loading states.

### Backend - Notification Services

#### [MODIFY] [ban-notify.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/lib/notifications/ban-notify.ts)
- Delete `sendBanWhatsApp` invocation inside `notifyPhoneBan` to prevent sending WhatsApp message alerts to banned users.
- Clean up `sendBanWhatsApp` helper function.

## Verification Plan
- Run `npm run build` to verify there are no compilation or type errors.
- Run `node scripts/test-ban-notify.mjs` (simulating a mock run, or checking for clean behavior).
