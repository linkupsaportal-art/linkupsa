# Plan: Clean Up Dashboard Tabs and Remove Upgrade Card

## Goal
Remove unnecessary UI tabs ("الفرق", "العملاء", "الاشتراك", "المدفوعات", "التطبيقات") from the admin dashboard and delete the "Upgrade Plan" card as requested. Also update the git remote origin to point to `linkupsa.git` and push the changes.

## Proposed Changes

### Components - Admin Dashboard

#### [MODIFY] [dashboard-tabs.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/dashboard-tabs.tsx)
- Modify the `TABS` array to only contain "النظرة العامة" and "الإعدادات".

#### [MODIFY] [page.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/app/admin/page.tsx)
- Remove the `<UpgradeCard />` element from the main dashboard section.
- Remove the `UpgradeCard` component helper function.
- Adjust layout grid classes from `xl:grid-cols-3` to `xl:grid-cols-2` since only two stat cards remain.

### Git Configuration

- Update remote origin URL to `https://github.com/linkupsaportal-art/linkupsa.git` (or the tokenized equivalent if credential caching/tokens require it).
- Perform `git push` to push commits to the new repository.

## Verification Plan
- Run `npm run build` to verify there are no compilation or type errors.
