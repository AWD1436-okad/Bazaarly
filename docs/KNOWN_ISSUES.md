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

- Add pagination to marketplace and possibly dashboard listings
- Consider pagination or tighter limits for larger dashboard sections if seller data grows further
- Add more explicit server-side validation and rate limiting
- Add observability around slow routes and checkout timing
- Review whether the dashboard create-listing picker eventually needs a dedicated searchable selector if very large inventories become common
- Review whether shared navigation data can be trimmed further without losing useful badge/count behavior
- Review remaining supporting pages for smaller repeat-load queries, especially places that still read broad stats or lists on every authenticated visit
