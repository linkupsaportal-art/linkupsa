# Plan: Integrate Dynamic Store Branding on Customer Pickup Page

## Goal
Retrieve the merchant's store name and logo (profile image avatar) from the `profiles` database table and render them dynamically on the public customer pickup page.

## User Review Required

> [!IMPORTANT]
> - Query the `profiles` table for the merchant with the `manager` role.
> - Display the uploaded store avatar/logo image in place of the generic box SVG icon on the `/pickup` page (if configured).
> - Make the page header title and metadata dynamic: `استلام طلبك | [اسم المتجر]`.

## Proposed Changes

### Components - Customer Pickup

#### [MODIFY] [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/pickup/page.tsx)
- Add `generateMetadata` function to fetch the store name and set the document title dynamically.
- Modify the `PickupPage` main function to fetch the `store_name` and `avatar_url` of the primary merchant.
- Update the UI to render the store logo image if uploaded, and append the store name to the main header: `استلام طلبك من [اسم المتجر]`.

## Verification Plan

### Automated Checks
- Run `npm run build` to ensure static page generation compiles successfully with the dynamic metadata and database fetch logic.
