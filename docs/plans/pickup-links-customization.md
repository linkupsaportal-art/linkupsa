# Plan: Integrate Support Links and Telegram Override in Settings

## Goal
Integrate settings configuration for the customer-facing support link and Telegram username override. Make them editable in the admin settings page and render them dynamically on the pickup page.

## Proposed Changes

### Database Layer
- Added `getPickupCustomizationSettings` and `updatePickupCustomizationSettings` in `lib/db/platform-settings.ts` using the `pickup_customization` key in `platform_settings` table.

### Components & Pages
- **[NEW]** [pickup-customization-form.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/settings/pickup-customization-form.tsx): client-side settings form card.
- **[MODIFY]** [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/settings/page.tsx): rendered customization form section.
- **[MODIFY]** [actions.ts](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/settings/actions.ts): added `updatePickupCustomizationSettingsAction`.
- **[MODIFY]** [pickup-form.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/pickup-form.tsx): use dynamic `supportUrl` prop.
- **[MODIFY]** [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/page.tsx): read custom settings and support override.

## Verification
- Local build runs with exit code 0.
