# Auth v1 A8 — Development Authentication Retirement

## Final boundary

Email/password and Google both establish Better Auth PostgreSQL sessions.
The application calls `auth.api.getSession({ headers })`, validates the canonical
user UUID, and sets `currentUserId: string` in the common HTTP middleware.
Product Domain services retain their existing provider/session-agnostic inputs.
Missing, invalid, expired, and logged-out sessions return `401 UNAUTHENTICATED`.
There is no authentication selector, alternate adapter, or fallback.

`createApp` requires the Auth server and explicit web origin. Framework routes
under `/auth/*` remain governed by Better Auth; application-owned `/auth/me` uses
the same protected boundary as all Product Domain routes. Health, OpenAPI, and
Swagger remain public. `CurrentUser` documents the actual HttpOnly session cookie.

## Test migration

Protected HTTP integration fixtures use reusable Better Auth signup/session
setup and real cookies through the actual application middleware. Pure domain
services continue to accept explicit user IDs directly. Security regressions
retain adversarial legacy headers only to prove they neither authenticate nor
override a valid session. Existing password and controlled Google callback tests
remain the provider regression boundary; accepted A7 manual Google evidence does
not require destructive re-provisioning.

## Transport and production safety

Explicit credentialed CORS, trusted origin and CSRF checks, HttpOnly host-only
SameSite=Lax cookies, and Secure cookies on HTTPS/production remain unchanged.
Production startup permits valid Auth configuration while retaining the HTTPS
API/web origin guard. Proxy/IP trust and distributed rate limiting remain
separate production deployment concerns.

## Environment and manual testing

The backend requires `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`WEB_ORIGIN`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`. The browser receives
only public `VITE_API_URL`. Use canonical localhost API/web origins locally.
Sign in through apps/web before using Swagger in the same browser, or use a
private cookie jar with the official password endpoints. Never paste identity
UUIDs or tokens into Swagger authorization fields.

See [the current manual guide](../testing/swagger-cooking-flow.md#session-authentication).
Older milestone plans are explicitly archival, not current setup instructions.

## Scope

No schema or migration changes. No Admin authorization, account linking UI,
email verification, password recovery, billing, credits, or Redis. A8 is limited
to retiring the temporary authentication path and proving the final boundary.
Acceptance results are recorded in [the progress tracker](../progress-tracker.md).
