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

## Current Focus

- Performance and responsiveness
- Keeping production data clean and secure
- Maintaining documentation and project continuity
