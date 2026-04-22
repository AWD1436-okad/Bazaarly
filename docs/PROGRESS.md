# Bazaarly Progress

## Completed

- Foundation setup for Next.js, TypeScript, Prisma, and local scripts
- PostgreSQL Prisma schema and migrations
- Seeded shared world with users, shops, products, listings, orders, bots, and events
- Core marketplace loop from login through checkout
- Password-based auth for real accounts
- Expanded catalog across groceries, drinks, household, clothes, and essentials
- Bot simulation, demand changes, supplier repricing, and trend/event support
- Production deployment on Vercel with shared Neon Postgres
- Region pinning to Sydney to reduce app-to-database latency

## Recent Changes

- Updated marketplace bots so they now score and buy from all active shops instead of only shopping inside a single hard-filtered category
- Added light recent-bot-sales balancing so competitor shops and player shops both receive traffic while better-priced or higher-rated shops still win more often
- Kept bot purchases wired into normal stock, revenue, and order updates so competitor listings visibly move over time without exposing competitor notifications to the player
- Added sold-out listing deletion with long-press, right-click, or overflow access plus confirmation so sellers can remove exhausted listings safely
- Removed the old placeholder-style product visual component and aligned marketplace and shop listings to the same compact card layout
- Tightened listing and supplier spacing so more products fit on screen with less scrolling
- Fixed the known cart and checkout race conditions so only one active cart is allowed per user and checkout now locks and revalidates the active cart before processing
- Fixed order-total drift by making checkout use the stored cart snapshot price consistently and reject stale listing-price changes until the cart is refreshed
- Fixed zero-stock cart update behavior so cart items are removed instead of being left behind with invalid quantities
- Hardened bot purchases so they only complete when wallet balance, listing stock, and seller inventory allocation all still validate inside the transaction
- Removed `Bacon` from the catalog and replaced it with `Lamb` at a base price of AUD $11.00 per kg while keeping the existing meat-category dynamic pricing flow
- Added Lamb into demo seed inventory and demo listings so it appears naturally in supplier and marketplace flows after reseed
- Removed the visible old supplier/buying flow from normal app use and turned that area into a simple catalog browser
- Replaced the previous large mixed catalog with a compact 12-category, 107-item catalog based only on the user-provided list
- Updated product/category handling to the new category set and kept unit-aware AUD pricing visible across catalog, dashboard, marketplace, cart, and listings
- Removed pagination from the catalog browsing area and made search apply only inside the currently selected category there
- Updated onboarding and shop creation so new shops start with starter stock instead of being sent into the old supplier flow
- Replaced the placeholder `B` branding with the provided Bazaarly logo asset in the main app brand areas
- Replaced the old mixed catalog with a single 859-item source-of-truth catalog across 15 exact categories
- Added a dedicated product `unitLabel` field so prices are stored and shown by basis like `/kg`, `each`, `per punnet`, `per 100g`, `per pair`, and `per set`
- Switched product/category UI to the new category set and updated marketplace, supplier, dashboard, cart, and shop displays to show unit-aware AUD pricing
- Reworked seeding so the new catalog can fully replace stale products and print a strict catalog audit after seed
- Expanded the product catalog significantly
- Reworked listing flow so listing creation uses all free stock
- Added sold-out listing behavior
- Improved nav tap targets
- Replaced fragile form flows with POST route handlers
- Updated dashboard pricing to show market averages
- Fixed deployment region mismatch with `vercel.json`
- Started a no-cost performance pass focused on lighter marketplace loads, cheaper dashboard queries, and lower simulation noise
- Added supplier-page pagination to reduce catalog load on the shared free-tier stack
- Reduced dashboard growth cost with paged inventory/listings and a cheaper today-revenue summary query
- Reduced repeated authenticated-page user lookups with request-local session-user caching
- Reduced shared notification badge cost with a capped unread-badge query in the authenticated layout
- Reduced notifications-page cost with paged history loading instead of an unbounded inbox query
- Reduced orders-page cost with bounded buyer and seller history sections instead of loading full order history at once
- Reduced shop-page cost with bounded listing grids instead of loading every listing for a shop at once
- Reduced no-search marketplace browse cost with database-level paging instead of broader listing fetches before slicing
- Reduced query-based marketplace search cost by using lighter explicit-sort search paths and less repeated relevance work
- Reduced remaining dashboard side-read cost by removing the follow-up best-seller product lookup and using a cheaper inventory-presence check

## Current Focus

- Finish-and-launch prep
- Migration, deployment confirmation, and verification readiness
- Keeping production data clean and secure

## Milestone 2 Start

First hardening step completed:
- replaced raw user-id cookies with a Prisma-backed session-token model
- secure random session tokens are now stored as hashed database records with expiry
- login, register, logout, and shared auth lookup now use session tokens instead of trusting a browser-supplied user id

Second hardening step completed:
- added shared stricter validation for sensitive POST routes
- hardened listing save, listing pause, supplier buy, cart add, cart quantity update, and checkout preflight validation
- malformed or out-of-range ids and numeric inputs are now rejected earlier before database work starts

Third hardening step completed:
- added a tiny Prisma-backed auth cooldown model for login and register
- repeated failed login attempts now trigger a short cooldown per request fingerprint plus username/email input
- repeated sign-up attempts now trigger a short cooldown per request fingerprint
- no external rate-limiting service or paid security product was added

## Launch Readiness

Bazaarly is now v1-ready pending:
- applying the latest Prisma migrations in the real database
- confirming deployment against the migrated schema
- completing final manual verification of the core flows

## Milestone 1 Closeout

Milestone 1 is effectively complete.

Biggest zero-cost wins delivered:
- paged heavy marketplace, supplier, dashboard, orders, notifications, and shop-listing views
- reduced repeated authenticated-page reads with request-local session-user caching
- reduced shared navigation badge cost with a capped unread-notification query
- reduced marketplace browse and search work by separating lighter browse/search paths from heavier relevance work
- reduced dashboard side-query cost by removing follow-up lookups and replacing expensive presence checks with cheaper existence checks
- reduced unnecessary simulation calls from hidden, offline, or duplicate tabs

Small leftover items only:
- rerun local runtime/build verification after the already-documented Windows `.next` / `spawn EPERM` environment issue is cleared
- clean up local temp files when they are no longer locked by the OS

## Small Polish Update

- polished the shared Bazaarly logo display so the uploaded logo fills the brand mark more cleanly
- added a deterministic daily featured item panel on marketplace and supplier pages using the existing catalog only
- added a category selector to the supplier header for quick category browsing
- added a few premium catalog items in realistic AUD price bands without changing the stack or adding infrastructure
- replaced text-style product placeholders with shared product-aware visuals on cards and in the featured area
