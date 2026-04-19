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

## Handover Notes

- Existing docs already explain the system shape and live state
- This project-memory folder adds milestone continuity and audit history
- Milestone 1 is effectively complete from a performance and cost-control perspective
- The next phase should be Milestone 2: small, free-tier-safe session and request hardening
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

## Next Planned Phase

Milestone 2 should stay small and free-tier-safe:

- harden the current session approach without a full auth rewrite
- tighten validation on sensitive POST routes
- add the smallest sensible request-abuse protections that fit the existing stack
- avoid paid auth products, new infrastructure, and major architecture changes
