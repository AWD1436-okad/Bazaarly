# Known Issues

## Current Risks

- Some pages may still feel heavier than they should when large listing sets are loaded
- Auth is functional but still lightweight compared with a full production identity stack
- There is no dedicated admin panel yet for account management or moderation

## Local Repo Notes

- `.env`, `.env.vercel`, and `.env.production.vercel` are local-only files and should not be committed
- There is a stray temp file in the repo root that can be cleaned up locally when not locked by the OS
- Local `next build` is currently affected by a `.next` file lock in this environment
- Local browser verification is currently limited by a `next dev` startup `spawn EPERM` environment issue

## Follow-Up Areas

- Clear the local Windows `.next` file-lock / `spawn EPERM` environment blocker so runtime verification can be rerun cleanly
- Clean up local temp files when the OS is no longer holding them open
- Add more explicit server-side validation and rate limiting
- Add lightweight session and request hardening without introducing paid services or new infrastructure
- Apply the new session-table migration in the target database before relying on the hardening change in a deployed environment
- Apply the new auth-throttle migration in the target database before relying on the new login/register cooldown guards in a deployed environment
- Decide whether the next hardening step should be lightweight abuse resistance on sensitive POST routes or validation coverage for any smaller remaining action routes
- Add observability around slow routes and checkout timing later if still needed
- Review whether the dashboard create-listing picker eventually needs a dedicated searchable selector if very large inventories become common
- Review whether shared navigation data can be trimmed further without losing useful badge/count behavior
- Review whether the default relevance-ranked marketplace search path needs a deeper candidate-pool strategy if search result pools grow much larger in production
