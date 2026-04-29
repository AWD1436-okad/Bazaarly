# Tradex Decisions and Assumptions

## Current Decisions

- Treat the project as a continuation, not a rebuild
- Preserve the existing Next.js, Prisma, Neon, and Vercel stack
- Use the current repo and current docs as the main source of truth
- Use the attached SOP as workflow guidance only, not as the product specification
- Keep project continuity inside the repo, not only in chat
- Treat zero-cost or free-tier-only operation as a hard current constraint
- Treat Milestone 1 as effectively complete except for the already-documented local environment verification blocker
- Keep Milestone 2 limited to the smallest sensible session and request hardening work
- Use a Prisma-backed session table rather than introducing a paid or third-party auth product
- Use lightweight shared route-validation helpers for sensitive POST routes instead of a broad handler rewrite
- Use a tiny Prisma-backed auth-throttle record for login/register instead of any external rate-limiting service

## Current Assumptions

- The production URL remains [https://tradex.vercel.app](https://tradex.vercel.app)
- Neon remains the production database provider unless deliberately changed later
- Single-seller checkout remains acceptable for the current product stage
- The strongest short-term value comes from speed and responsiveness improvements rather than a deeper architecture change
- Improvements should favor lower database load, lighter Vercel usage, and fewer avoidable simulation calls
- The next phase should harden session and request behavior without introducing paid auth products or new infrastructure
- A simple hashed session-token model is the safest incremental auth hardening path inside the current stack

## Open Decisions To Revisit Later

- When to replace the lightweight session approach with a stronger session store or auth framework
- Whether admin/support tools should be built before or after hardening and observability work
- How much simulation activity should happen automatically versus on-demand to balance cost and responsiveness
