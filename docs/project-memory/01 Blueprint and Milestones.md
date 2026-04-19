# Bazaarly Continuation Blueprint and Milestones

## Continuation Blueprint

The goal is to strengthen the existing Bazaarly app safely and incrementally. Work should preserve the current stack, keep the shared economy stable, and improve the app where the real codebase shows the most pressure.

## Cost Guardrail

All current continuation work must remain compatible with zero-cost or free-tier-only hosting and services. Performance work should improve both user speed and resource efficiency on Vercel and Neon free tiers.

## Continuity Mapping

- Product overview and run instructions live in [README.md](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\README.md)
- System shape lives in [docs/ARCHITECTURE.md](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\ARCHITECTURE.md)
- Live-state handoff lives in [docs/HANDOFF.md](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\HANDOFF.md)
- Progress summary lives in [docs/PROGRESS.md](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\PROGRESS.md)
- Known risks live in [docs/KNOWN_ISSUES.md](C:\Users\abdul\OneDrive\Documents\Projects\Bazaarly\docs\KNOWN_ISSUES.md)
- This project-memory folder tracks planning continuity and milestone-by-milestone execution

## Recommended Milestones

### Milestone 1

Performance and responsiveness pass for heavy pages and slow flows.

Scope:
- audit dashboard and marketplace query weight
- add pagination or incremental loading where it gives the biggest win
- reduce avoidable server work on page load
- verify critical browse and seller flows still work

Status:
- Effectively complete
- Remaining blocker is local environment verification only, not a confirmed app defect

What Milestone 1 accomplished:
- smaller marketplace result pages instead of oversized result loads
- cheaper dashboard sales insights and supporting query shapes
- lighter simulation triggering to avoid unnecessary background function calls
- bounded notifications, orders, shop listings, and supplier/dashboard growth paths
- lighter authenticated-page support reads and notification badge work
- no paid services, no new infrastructure, no rewrite

Small leftover items only:
- resolve the already-documented local `.next` file-lock and `spawn EPERM` verification issue
- do a final runtime verification pass once the local environment can start and build cleanly
- optional local repo hygiene cleanup for temp files when the OS is no longer holding them

### Milestone 2

Session and request hardening without a full auth rewrite.

Status:
- Started
- First step implemented: raw user-id cookie trust replaced by a Prisma-backed session-token model
- Remaining Milestone 2 work should stay narrow and free-tier-safe

Scope:
- move from direct user-id cookie trust toward a safer server-managed session shape using the current stack
- add tighter validation around sensitive POST routes
- review checkout and seller actions for abuse resistance
- keep everything free-tier-safe and avoid any paid auth products or new infrastructure

Planned implementation shape:
- smallest sensible session hardening first
- input validation tightening on cart, listings, supplier buy, checkout, and account flows
- low-cost request hardening that does not require external services

### Milestone 3

Safety and observability pass.

Scope:
- add rate limiting or simple request throttling on sensitive routes
- add basic route timing or slow-path visibility
- improve checkout and simulation troubleshooting visibility

### Milestone 4

Operational support and moderation foundations.

Scope:
- define minimal admin/support actions
- add safe account-support tooling only where genuinely needed
- keep docs and handoff aligned with production reality

## Safest Next Milestone

Milestone 2 is the safest next milestone now that Milestone 1 is effectively complete. It should stay incremental, free-tier-safe, and focused on session and request hardening without a full auth rewrite.
