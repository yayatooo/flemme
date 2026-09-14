# `@flemme/web`

React/Vite User Platform using TanStack Router and TanStack Query.

## Public environment

Set the public API origin in the root `.env`:

```env
VITE_API_URL=http://localhost:3000
```

This must be an exact HTTP(S) origin. It is public browser configuration, not a
secret. Never expose `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`,
`DATABASE_URL`, session tokens, or OAuth tokens through `VITE_*` variables.

The API must use the matching `WEB_ORIGIN`. Better Auth sessions are required.

## Authentication

The official Better Auth React client owns email/password registration, login,
Google initiation, and server logout. Its base path is `/auth`; browser requests
include credentials. Flemme identity is restored separately through
`GET /auth/me`, which returns only the canonical user UUID and email.

No session or provider token is stored in localStorage/sessionStorage. The User
Platform authenticates exclusively with server-managed HttpOnly cookies.

Routes:

- `/` — public landing page.
- `/login` and `/register` — guest-only Auth pages.
- `/app` — protected User Platform entry.
- `/onboarding` — protected, bounded setup-status shell.

After authentication, TanStack Query checks Profile, Household, Kitchen and
Inventory. Their documented `*_NOT_FOUND` 404 responses mean onboarding is
required; an existing empty Inventory is initialized. Unexpected failures remain
errors. Auth state contains only the current user/loading status; Product Domain
data remains separate server state.

Logout invalidates the server session, clears the complete query cache, records
an unauthenticated Auth result, and navigates to login. A Product Domain 401 does
the same cache cleanup before returning to login. Product Domain 404 responses
do not invalidate Auth.

## Commands

```bash
bun run test
bun run typecheck
bun run build
```

The lightweight Bun tests cover credentialed Product Domain requests, Auth
restore/actions, route-guard decisions, onboarding missing/initialized/error
states, and logout cache isolation without adding a DOM test framework.
