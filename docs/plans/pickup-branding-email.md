# Plan: Restrict Store Branding lookup to Linkup.saudi@gmail.com

## Goal
Update the database query on the `/pickup` page to lookup store branding (name and avatar/logo) exclusively for the primary merchant email `Linkup.saudi@gmail.com`.

## Proposed Changes

### Components - Customer Pickup

#### [MODIFY] [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/page.tsx)
- Update `generateMetadata` query to filter by `eq("email", "Linkup.saudi@gmail.com")`.
- Update `PickupPage` query to filter by `eq("email", "Linkup.saudi@gmail.com")`.

## Verification Plan
- Run `npm run build` to verify there are no compilation errors.
