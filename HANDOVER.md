# Handover

## Current State

The project is aligned to Universal SOP v4.10.0. The navigation, Settings, and Auto Restocker package in `GOAL.md` is implemented locally and awaiting final quality gates/release.

## Safe Resume Point

Start with the final validation of `components/navigation.tsx`, `components/shop-settings.tsx`, `app/(main)/settings/page.tsx`, `lib/auto-restock.ts`, `lib/simulation.ts`, and the Auto Restocker routes. The old manual-approval UI is removed; compatibility endpoints return no-op/retired responses, and pending requests are safely marked skipped.

## Pending Evidence

- Authenticated Settings and restocker behavior at 360px, 390px, 430px, and 1366px.
- Correct once-per-24-hour renewal behavior without duplicate charges in a running environment.
- Auto-purchase behavior for Simple, Pro, and Max against supplier stock in a running environment.
- Vercel Ready state and public-host verification for the resulting `main` commit.
