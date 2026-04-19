# Bazaarly Deployment and Handover

## Live Setup

- Hosting platform: Vercel
- Production app URL: [https://bazaarly.vercel.app](https://bazaarly.vercel.app)
- Database provider: Neon
- Database engine: PostgreSQL
- ORM: Prisma
- Preferred runtime region: `syd1`

## Deployment Expectations

- Keep `DATABASE_URL` and `DATABASE_URL_UNPOOLED` configured
- Run migrations before seeding when the database is new or reset
- Keep environment files out of Git
- Keep repo docs and project-memory files updated when milestones are completed
- Keep the current setup free-tier compatible and avoid changes that require paid hosting or add-on services
- Apply the session-table migration before relying on the new session-token auth flow in any environment
- Apply the auth-throttle migration before relying on the new login/register cooldown guards in any environment
- Apply the catalog/category/unit migration before relying on the new 15-category, unit-aware catalog in any environment
- If the goal is full catalog replacement, run the seed in reset mode so old catalog products and their stale dependent rows are removed before the new catalog is inserted

## Handover Notes

- Existing docs already explain the system shape and live state
- This project-memory folder adds milestone continuity and audit history
- Milestone 1 is effectively complete from a performance and cost-control perspective
- Milestone 2 is effectively complete for the smallest sensible hardening goal
- Bazaarly should now be treated as v1-ready pending migration and verification
- Before any future launch or major handoff, this file should be updated with:
  - latest production state
  - latest verification results
  - any manual steps the owner must know

## Local Verification Caveat

The current local workspace has a Windows environment issue affecting Next.js build output:

- `.next` files may remain locked and block clean rebuilds
- `next dev` may fail with `spawn EPERM`

If local verification is needed later, try these steps in this order:

1. close any local Next.js or Node processes
2. pause OneDrive syncing for the project folder if possible
3. delete `.next`
4. rerun `npm run build`
5. rerun `npm run dev`

This is currently documented as an environment issue, not as a confirmed Bazaarly application defect.

## Launch Checklist Summary

Before calling v1 launched:

1. apply all Prisma migrations in the real database
2. confirm the deployment is running against the migrated schema
3. run final manual QA for auth, onboarding, supplier, listings, cart, checkout, notifications, orders, dashboard, and marketplace flows
4. confirm no launch-blocking issue appears during that QA pass

## Required Launch Migrations

Apply these in order:

1. `20260418015138_init`
2. `20260418184000_add_password_hash`
3. `20260419110000_add_sessions`
4. `20260419123000_add_auth_throttle`
5. `20260419143000_replace_catalog_categories_and_units`
