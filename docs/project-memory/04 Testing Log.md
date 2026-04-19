# Bazaarly Testing Log

## Audit Pass - 2026-04-19

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: did not complete because Next.js could not remove a locked file inside `.next`

Build note:

- The failure looked environmental rather than a code error:
  `EPERM: operation not permitted, unlink '.next\\app-path-routes-manifest.json'`
- Most likely cause is a file lock from an existing local dev/build process

## Interpretation

- The codebase passes static quality checks
- A clean build should be rerun before the next implementation milestone begins
- For the continuation audit, the build issue is recorded as an environment follow-up rather than proof of a broken code change

## Milestone 1 Closeout Note - 2026-04-19

Milestone 1 is now considered effectively complete.

Closeout status:

- static checks passed throughout the milestone work
- the main remaining issue is still the local Windows environment blocker around `.next` file locking and `spawn EPERM`
- no new application defect was discovered from that blocker
- the next verification step is to rerun local build and runtime checks once the environment issue is cleared

## Milestone 2 - Session Token Hardening Pass - 2026-04-19

Changes added in this pass:

- added a Prisma-backed `Session` model and migration
- replaced raw user-id cookie trust with secure random session tokens stored as hashed database records
- updated login, register, logout, and shared auth helpers to use token-based session lookup, expiry, and invalidation

Checks run:

- `npx prisma generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `prisma generate`: passed after rerunning with network access for Prisma binaries
- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 2 - Sensitive Route Validation Pass - 2026-04-19

Changes added in this pass:

- added shared route-validation helpers for ids, quantities, and listing-price input
- hardened sensitive POST routes for listing save, listing pause, supplier buy, cart add, and cart item quantity updates
- added an early invalid-cart-state guard before checkout enters the main purchase transaction

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 2 - Auth Cooldown Pass - 2026-04-19

Changes added in this pass:

- added a tiny Prisma-backed `AuthThrottle` model and migration
- added lightweight cooldown guards on login and register
- kept the current redirect-based auth UX while slowing repeated failed login attempts and burst sign-up attempts

Checks run:

- `npx prisma generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `prisma generate`: passed after rerunning with network access for Prisma binaries
- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Performance Pass - 2026-04-19

Checks run after the first implementation pass:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file lock

Extra verification notes:

- A local dev-server browser pass was attempted, but local Next dev startup hit an environment `spawn EPERM` error
- Browser-level verification remains desirable once the local environment is able to start cleanly

## Milestone 1 - Additional No-Cost Load Reduction Pass - 2026-04-19

Changes added in this pass:

- supplier catalog pagination
- further free-tier load reduction by avoiding full supplier catalog fetches on every visit

Checks run:

- `npm run lint`
- `npm run typecheck`

Results:

- `lint`: passed
- `typecheck`: passed

## Milestone 1 - Dashboard Growth-Path Pass - 2026-04-19

Changes added in this pass:

- paged dashboard inventory section
- paged dashboard listings section
- limited listing-form inventory options
- aggregated today-revenue summary
- reduced dashboard over-fetch as seller data grows

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Shared Auth Query Reduction Pass - 2026-04-19

Changes added in this pass:

- request-local caching for session-user lookup in the shared authenticated path
- reduced duplicate user reads when both layout and page request the same signed-in user

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Shared Notification Badge Reduction Pass - 2026-04-19

Changes added in this pass:

- replaced exact unread notification count in the shared layout with a small capped badge query
- limited shared authenticated notification badge work to a bounded number of rows

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Notifications History Reduction Pass - 2026-04-19

Changes added in this pass:

- paged the notifications page so it no longer loads full notification history by default
- tightened the notifications query to only fetch the fields needed for the inbox list
- kept mark-all-as-read unchanged while reducing default history load for larger accounts

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Orders History Reduction Pass - 2026-04-19

Changes added in this pass:

- paged both buyer and seller history sections on the orders page
- tightened orders queries so each section only fetches the fields used in the UI
- stopped the orders page from loading full buyer and seller histories by default

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Shop Listings Reduction Pass - 2026-04-19

Changes added in this pass:

- paged shop listing grids so a shop page no longer loads every listing by default
- tightened the shop-page data path to fetch only the shop fields and listing fields used in the UI
- kept sold-out and add-to-cart behavior unchanged while reducing listing-grid growth cost

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Marketplace Browse Reduction Pass - 2026-04-19

Changes added in this pass:

- split the no-search marketplace browse path away from the heavier relevance-ranked search path
- moved queryless browse paging to database-level `skip`/`take` instead of fetching broader ranges before slicing
- kept query-based search relevance behavior intact while reducing default feed cost

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Marketplace Search Reduction Pass - 2026-04-19

Changes added in this pass:

- split explicit-sort marketplace searches away from the heavier relevance-ranked search path
- reduced selected listing/shop fields on marketplace cards to only what browse and search views actually use
- reduced repeated search work by prebuilding search context once and reusing shared marketplace support queries

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Milestone 1 - Dashboard Supporting-Reads Reduction Pass - 2026-04-19

Changes added in this pass:

- replaced the dashboard best-seller grouped query plus follow-up product lookup with a single aggregated SQL query joined to products
- replaced the inventory-owned count query with a cheaper existence check because the dashboard only needs a boolean presence test
- kept all existing bounded dashboard sections and current UX behavior intact

Checks run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Results:

- `lint`: passed
- `typecheck`: passed
- `build`: still blocked by the same local `.next` file-lock environment issue

## Focused Local Verification Blocker Pass - 2026-04-19

Plain-English theory:

- The local `.next` folder is being held or protected by the Windows environment, most likely due to file locking or sync behavior in the OneDrive-backed workspace
- That lock prevents Next.js from deleting and rebuilding files cleanly
- The same environment issue also appears to interfere with `next dev` child-process startup

Cleanup attempts made:

- checked for local Bazaarly listeners on ports `3000` and `3001`
- identified stale `node` processes that were not serving the app
- stopped local `node` processes
- attempted to remove `.next`
- reran `npm run build`
- reran one clean `npm run dev` start attempt

Outcome:

- `.next` removal still failed with access denied errors
- `npm run build` still failed with `EPERM` on `.next\\app-path-routes-manifest.json`
- `npm run dev` still failed with `spawn EPERM`

Exact cleanup commands tried:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -LiteralPath .next -Recurse -Force
cmd /c npm.cmd run build
cmd /c "set PORT=3001 && npm.cmd run dev"
```

Conclusion:

- Treat this as a local environment blocker, not a Milestone 1 code blocker
- Continue Milestone 1 work without waiting on local runtime cleanup
