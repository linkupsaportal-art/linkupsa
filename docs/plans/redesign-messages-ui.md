# Plan: Redesign Messages Inputs, Popups, and Dropdown UI

## Goal
Improve the user interface and user experience of the WhatsApp templates section, the custom template builder popup, the configuration dialog, inputs, and dropdown menus to match the premium, state-of-the-art visual style of the other dashboard sections.

## User Review Required

> [!IMPORTANT]
> - Replace basic HTML `<select>` dropdowns with the premium `CustomSelect` component.
> - Overhaul the variable injection badges inside the builder modal to use a high-contrast, modern "code-badge" design (neutral/slate baseline, glowing accent on hover/focus) instead of the low-contrast neon yellow style.
> - Revamp text inputs, textareas, and help text within popups for polished typography, spacing, and focus rings.

## Proposed Changes

### Components - Admin Messages

#### [MODIFY] [whatsapp-messages-client.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/messages/whatsapp-messages-client.tsx)
- Import `CustomSelect` from `@/components/ui/select`.
- Replace the raw `<select>` element for sorting templates with a styled `CustomSelect` instance.
- Redesign the "Available Variables" badges (`variableGroups`) to look like sleek code tags (`bg-surface hover:bg-accent/5 border border-[hsl(var(--hairline-strong))] hover:border-accent/30 text-fg-muted hover:text-accent font-mono transition-all`).
- Update input and textarea fields inside the template builder modal with premium borders, glowing focus rings (`focus:ring-2 focus:ring-accent/30`), and correct typography.
- Polishing the layout of the builder modal (Dialog Content), making it feel highly premium and well-structured.

#### [MODIFY] [whatsapp-config-dialog.tsx](file:///c:/Users/MSI-PC/OneDrive/Documents/freelancing/digital-delivery-platform/components/admin/notifications/whatsapp-config-dialog.tsx)
- Redesign form inputs, textareas, and field wrappers inside the WhatsApp configurations dialog.
- Enhance contrast, typography, and align visual consistency with the rest of the dashboard.

## Verification Plan

### Automated Checks
- Run `npm run build` to verify there are no compilation or type errors.

### Manual Verification
- Check the template builder popups to ensure inputs, textareas, variable badges, and layout have high contrast, premium aesthetics, and responsive layout.
- Check the sorting dropdown menu to ensure it functions correctly and fits visual guidelines.
