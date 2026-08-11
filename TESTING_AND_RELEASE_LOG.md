# Testing And Release Log

## 2026-08-11 Alignment Baseline

- Repository root verified: `C:\Projects\Bazaarly` is a regular directory, branch `main`.
- SOP verifier passed: `universal-sop-4.10.0` / digest `956535e96fd9d7a86e70d88187aabb9299fddaf8a61d1b21a1240fdf5bfab655`.
- Baseline code evidence: current Auto Restocker uses 48-hour renewal timestamps, and non-Full-Access plans create approval requests instead of automatically completing purchases.
- Baseline visual evidence: current Settings page has shop name visible without password, but relies on a button-like card and does not provide a rename confirmation step.
- Release evidence for the active goal is pending implementation and the checks listed in `GOAL.md`.

## 2026-08-11 Active Goal Implementation

- Removed the top-header Orders shortcut while retaining the underlying order-history route.
- Rebuilt the active Settings controls as real buttons, kept the shop name visible without a password, and added a two-step confirmation before the existing virtual rename fee is charged.
- Auto Restocker now renews once per 24 hours. Simple restores 50% every 10 minutes, Pro restores 75% every 5 minutes, and Max restores 100% on a saved 1-10 minute interval.
- Every active plan automatically reserves supplier stock, debits only the virtual balance, restores inventory/listing stock, and creates ledger and notification records in one transaction.
- Atomic renewal and cycle claims prevent duplicate daily fees and duplicate concurrent restock cycles. Existing subscriptions move to the daily cadence without a catch-up charge.
- Obsolete pending approval requests are marked skipped; legacy approval endpoints are retained as harmless compatibility responses while clients update.
- Passed after implementation: `npm.cmd run profit:test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run money:audit`, and `npx.cmd next build`.
- Build note: Next.js reports the existing non-blocking `middleware` convention deprecation; this package does not alter routing middleware.
- Browser automation is not available in this workspace, so authenticated Settings review at 360px, 390px, 430px, and 1366px remains a required manual release follow-up. It is not represented as completed evidence.
