# Bazaarly

Bazaarly is a full-stack online marketplace simulation built with Next.js and Prisma. Players share one persistent economy, each own one shop, buy stock from a supplier, publish listings, compete on price and rating, and sell to both human players and bots.

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Vercel hosting

## Current Scope

- Account registration and password login
- Shop onboarding and seller-first guidance
- Supplier purchasing
- Inventory and listing management
- Marketplace browse, search, sort, and filters
- Shop pages
- Single-seller cart and checkout
- Persistent orders, notifications, and balances
- Bot purchases, demand shifts, supplier repricing, and market events

## Project Structure

- `app/` Next.js routes, pages, layouts, styles, and POST handlers
- `components/` shared UI pieces
- `lib/` auth, marketplace logic, simulation, helpers, and catalog data
- `prisma/` schema, migrations, and seed script
- `docs/` handoff and lightweight project documentation

## Local Development

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run `npm run db:migrate`
4. Run `npm run db:seed`
5. Start the app with `npm run dev`
6. Open [http://localhost:3000/login](http://localhost:3000/login)

## Deploy

1. Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
2. Run `npm run db:deploy`
3. Run `npm run db:seed` if the target database is new
4. Build with `npm run vercel-build`

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run vercel-build`

## Docs

- [Architecture](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\ARCHITECTURE.md)
- [Handoff](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\HANDOFF.md)
- [Progress](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\PROGRESS.md)
- [Known Issues](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\KNOWN_ISSUES.md)
