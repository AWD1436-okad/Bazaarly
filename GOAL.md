# Active Goal

## Outcome

Polish navigation, Settings, and Auto Restocker so shop controls are obvious buttons and all restocker plans automatically purchase supplier stock with the requested schedule.

## Approved Scope

- Remove the top-header Orders shortcut while retaining buyer/seller history routes.
- Replace ambiguous clickable Settings text with consistent buttons; shop name remains visible without a password.
- Add a clear two-step rename confirmation before charging the existing virtual rename fee.
- Recompose Settings into compact, responsive shop and restocker sections.
- Change Auto Restocker renewals to every 24 hours at the existing plan price, with no retroactive or duplicate charge.
- Set Simple to 50% of sold-out listings every 10 minutes, Pro to 75% every 5 minutes, and Max to 100% at a user-selected 1-10 minute interval.
- Make every active plan automatically pay virtual balance, buy supplier stock, restore inventory/listing quantities, and notify the shop owner.

## Out Of Scope

- Real payment systems, production data wiping, account identity changes, broad redesign of unrelated pages, and new paid services.

## Technical Gates

- Preserve transaction-level balance, supplier-stock, listing, and inventory validation.
- Existing subscriptions must not receive a retroactive extra renewal when moved to the 24-hour cadence.
- Verify at 360px, 390px, 430px, and 1366px in rendered browser states; authenticated Settings testing requires an existing safe test account.
- Required checks: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run money:audit`, and `npx.cmd next build`.
- Production release: exact `main` commit, Vercel Ready status, public host check, and no new financial commitment.

## Status

Product outcome: implemented locally. Engineering: awaiting final quality gates and release. Experience delivery: Settings and restocker UI updated; authenticated browser-width review remains pending. Consequential action: commit, push, and Vercel verification authorised.
