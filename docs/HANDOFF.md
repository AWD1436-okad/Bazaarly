# Bazaarly Handoff

## Project Status

Bazaarly is live as a persistent multiplayer marketplace app with working buy/sell flow, stored users, real inventory updates, persistent orders, and shared economy simulation.

Current release posture:

- v1-ready pending migration and verification
- no new feature work is required for launch
- remaining launch work is migration, deploy confirmation, and final manual QA

## What Works

- Registration and password login
- Create-shop onboarding
- Guided seller dashboard flow
- Supplier purchases into inventory
- Listing creation from owned stock
- Marketplace browsing, search, sorting, and filters
- Cart and checkout
- Balance transfer and stock reduction
- Buyer and seller order history
- Stored notifications
- Bot purchases and market events

## Production Shape

- App host: Vercel
- Database provider: Neon
- Database engine: PostgreSQL
- ORM: Prisma
- GitHub repo: `AWD1436-okad/Bazaarly`
- Production URL: [https://bazaarly.vercel.app](https://bazaarly.vercel.app)
- Region preference: Sydney via `vercel.json`

## Operational Notes

- Keep `.env` files out of Git
- If production data is new or reset, run migrations before seeding
- For the catalog replacement pass, run the latest catalog migration and then reseed with `SEED_MODE=reset` if you want the old catalog fully removed from the world data
- Seeded accounts and sample world state are intended for initial world setup only
- Older pre-password accounts should not be reused; recreate them with normal password auth if needed
- Prisma is configured with `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
- Before launch, make sure the latest auth/session migrations are applied
- Product pricing is now stored in AUD cents and products carry a dedicated `unitLabel` for display and pricing basis

## Required Launch Migrations

Apply these in order:

1. `20260418015138_init`
2. `20260418184000_add_password_hash`
3. `20260419110000_add_sessions`
4. `20260419123000_add_auth_throttle`
5. `20260419143000_replace_catalog_categories_and_units`

## Files To Check First

- [README.md](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\README.md)
- [prisma/schema.prisma](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\prisma\schema.prisma)
- [prisma/seed.ts](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\prisma\seed.ts)
- [app/(main)/dashboard/page.tsx](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\app\(main)\dashboard\page.tsx)
- [app/(main)/marketplace/page.tsx](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\app\(main)\marketplace\page.tsx)
- [lib/marketplace.ts](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\lib\marketplace.ts)
- [lib/simulation.ts](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\lib\simulation.ts)

## Launch Blocking Caveat

The only documented non-product blocker is the local Windows verification issue:

- `.next` file locking can block local `next build`
- `spawn EPERM` can block local `next dev`

This does not prove a production defect, but it does block clean local verification on this machine until resolved.
