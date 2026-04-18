# Bazaarly

Bazaarly is a full-stack online multiplayer marketplace simulation built with Next.js and Prisma. Every player owns a single shop in one shared economy, competes on price and reputation, buys stock from a supplier, lists products, and sells to both human players and bots.

## Stage 1 Foundation

This starter includes:

- Next.js with TypeScript configuration
- Prisma configuration for local development
- Environment variable template
- Seed entry point
- Scripts for local development, migrations, generation, and seeding

## Hosting Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. Install dependencies with `npm install`.
4. Run `npm run db:deploy`.
5. Run `npm run db:seed`.
6. Deploy with `npm run vercel-build` or use that command as your Vercel build command.

The application is configured for PostgreSQL-backed shared-world hosting so multiple players can use the same persistent economy.

## What Works

- Persistent account login with stored users
- Create-your-shop onboarding flow
- Seller dashboard with guided first steps
- Supplier purchasing
- Inventory management and listing publishing
- Marketplace browse, search, sort, and filters
- Shop pages
- Cart with single-seller checkout
- Transaction-safe order creation and balance transfer
- Seller notifications and low-stock alerts
- Buyer and seller order history
- Bot-driven simulation loop
- Demand shifts, supplier repricing, and an active market event
- Discovery panels for trending products and top shops

## Architecture

- `app/`: Next.js App Router pages, layouts, styles, route handlers, and server actions
- `components/`: shared UI components like navigation, listing cards, and simulation heartbeat
- `lib/`: database access, authentication helpers, catalog data, marketplace ranking, money formatting, and market simulation
- `prisma/`: schema, migrations, and seed script

## Local Run Flow

1. `copy .env.example .env`
2. `npm install`
3. `npm run db:migrate`
4. `npm run db:seed`
5. `npm run dev`
6. Open [http://localhost:3000/login](http://localhost:3000/login)

## Verification Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run vercel-build`

## Notes for Expansion

- The schema and cart model are structured so multi-seller checkout can be added later.
- The simulation loop already updates demand, reprices supplier stock, and lets bots purchase from active shops.
- The application is prepared for a shared PostgreSQL deployment on platforms like Vercel.

## Build Order Used

1. Foundation files
2. Prisma schema
3. Seed data
4. Core playable loop
5. Simulation systems and analytics
