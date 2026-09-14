# Auth v1 A7 — apps/web Integration

> Archived A7 checkpoint and browser acceptance evidence. Temporary environment
> selection below was retired by A8; current configuration is documented in
> [apps/api/README.md](../../apps/api/README.md).

## Boundary

A7 connects the React/Vite User Platform to the accepted Better Auth backend.
The official Better Auth React client uses the public `VITE_API_URL` origin and
`/auth` base path for password registration/login, Google initiation and logout.
HttpOnly cookies remain the only session transport. The browser stores no Auth
or OAuth token and never sends `x-flemme-user-id`.

TanStack Query restores the narrow application identity through `GET /auth/me`.
Auth state contains only loading, authenticated/unauthenticated status and the
canonical `{ id, email }` user. Profile, Household, Kitchen, Inventory and all
other user data remain independent Product Domain queries.

## Navigation

`/` remains public. `/login` and `/register` are guest-only after session restore.
`/app` and `/onboarding` await restored Auth before making a route decision.
Authenticated `/app` loads the Product Domain onboarding decision and routes to
the bounded onboarding shell when setup is incomplete.

The decision treats `PROFILE_NOT_FOUND`, `HOUSEHOLD_NOT_FOUND`,
`KITCHEN_NOT_FOUND` and `INVENTORY_NOT_FOUND` as expected missing setup. A 200
Inventory response with an empty items array is initialized. Other 404s, invalid
responses, network failures and server failures remain errors. A7 adds no setup
forms or Auth-owned onboarding field.

## Session lifecycle

Successful password registration is already auto-signed-in; login and
registration both refresh `/auth/me` before navigation. Google returns directly
to `/app`; the protected route restores `/auth/me` and applies the same onboarding
decision. `account_not_linked` on the login URL maps to a safe existing-method
message without adding linking UI.

Logout calls Better Auth sign-out before clearing the complete QueryClient cache,
records Auth as unauthenticated and navigates to login. Product Domain 401 does
the same cache isolation and returns to login. Product Domain 404 does not alter
Auth. This prevents User A data from surviving into User B's browser session.

## Acceptance

Mobile browser acceptance passed for registration, automatic authentication,
`/auth/me`, onboarding resource detection, refresh restoration, logout, stale
session rejection, existing-user login, generic credential rejection and a
User A → logout → User B cache-isolation flow. Better Auth generated the Google
authorization redirect without a custom Google SDK or React callback handler.
Final canonical localhost browser acceptance was completed manually by the user,
who confirmed the remaining issue was resolved by changing `.env` to
`AUTH_MODE=better-auth`. A7 is accepted on that user-reported manual evidence
alongside the automated and agent-observed acceptance above.

A7 introduces no API behavior, database migration, Admin/RBAC feature, account
linking, recovery, verification, credits, billing or Redis. A8 remains responsible
for removing the backend development adapter and header documentation.
