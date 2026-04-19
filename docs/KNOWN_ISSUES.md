# Known Issues

## Current Risks

- Some pages may still feel heavier than they should when large listing sets are loaded
- Auth is functional but still lightweight compared with a full production identity stack
- There is no dedicated admin panel yet for account management or moderation

## Local Repo Notes

- `.env`, `.env.vercel`, and `.env.production.vercel` are local-only files and should not be committed
- There is a stray temp file in the repo root that can be cleaned up locally when not locked by the OS

## Follow-Up Areas

- Add pagination to marketplace and possibly dashboard listings
- Add more explicit server-side validation and rate limiting
- Add observability around slow routes and checkout timing
