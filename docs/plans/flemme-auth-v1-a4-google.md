# Auth v1 A4 — Google Login & Registration

> Archived A4 checkpoint and provider acceptance evidence. Temporary domain
> authentication and startup restrictions below were superseded by A8. Current
> setup is in [apps/api/README.md](../../apps/api/README.md).

## Boundary and configuration

Better Auth 1.7.4 owns POST `/auth/sign-in/social` and GET
`/auth/callback/google`, alongside the existing password/logout/session endpoints.
No aliases, /auth/me, web/admin UI, domain hooks or migration. Product Domain
routes still require x-flemme-user-id; cookies do not populate currentUserId
until A5. The production startup guard remains until A8.

Real API startup now requires nonblank GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET,
BETTER_AUTH_SECRET (32+ characters), BETTER_AUTH_URL, WEB_ORIGIN and DATABASE_URL.
No Google enable flag or insecure fallback. Pure domain tests need no Auth
configuration; Auth tests inject deterministic fake Google credentials and a
random Auth secret, while using PostgreSQL. Actual .env is not edited by A4.
Production-shaped auth config requires HTTPS; the whole API is still guarded
against production startup while development authentication remains.

## Google Cloud setup

1. Configure the Google OAuth consent screen/branding, audience and test users
   for your project. Use an OAuth client of type **Web application**.
2. Set Authorized redirect URI to exactly
   `http://localhost:3000/auth/callback/google` when
   BETTER_AUTH_URL=http://localhost:3000. Not /api/auth/callback/google.
3. Store the client ID and client secret privately in the API environment.
   Never commit them, log them or expose the secret through VITE_*.
4. Use WEB_ORIGIN=http://localhost:5173 consistently. Do not mix localhost with
   127.0.0.1 for browser URLs. PostgreSQL host configuration is independent.
5. In another deployment, register `<BETTER_AUTH_URL>/auth/callback/google`
   exactly; deployment domains are not assumed here.

Only openid/email/profile are requested. accessType=online and
includeGrantedScopes=false avoid requesting offline/incremental API access.
Native social input can request additional scopes/authorization parameters, so
a small Better Auth middleware rejects those beyond the identity-only policy
with 400 GOOGLE_IDENTITY_SCOPES_ONLY. Direct ID-token sign-in is disabled: A4
supports the server-owned authorization-code flow, not a second browser token flow.

## Native browser flow

POST `/auth/sign-in/social` from WEB_ORIGIN, using credentials/cookies:

```json
{
  "provider": "google",
  "callbackURL": "http://localhost:5173/",
  "errorCallbackURL": "http://localhost:5173/?auth=error",
  "disableRedirect": true
}
```

The response's `url` points to Google. Preserve the state cookie in the same
browser, then navigate to that URL. Google returns to the API callback; Better
Auth consumes state, exchanges the code with its PKCE verifier, resolves/creates
identity, sets the HttpOnly session cookie and redirects to the approved web
destination. Google navigation does not require adding Google to CORS.
No custom state, token exchange, signature verification or callback handler.

The framework validates callbackURL, newUserCallbackURL, errorCallbackURL and
Origin. External untrusted destinations/origins return 403; a callback without
the initiating browser's state cookie redirects with state_mismatch and cannot
create a session. CSRF/origin checks are explicitly enabled in tests and runtime.

## Persistence and identity

- New Google subject + unused email → one users UUID, one auth_accounts row
  (providerId=google, accountId=Google sub, userId=users.id), and a DB session.
- Default provider mapping uses email/name/email_verified/picture for Auth
  email/name/emailVerified/image. Verification status comes from provider claims,
  not an email-string heuristic. Test verified claims persist true; passwords
  still register with false. Name/image never populate user_profiles.
- Returning subject resolves the existing account/user, adds a session and does
  not duplicate identity. Default returning-login behavior does not overwrite
  name/image; no overrideUserInfoOnSignIn or updateUserInfoOnLink is enabled.
- No Profile, Household, Kitchen, Inventory, Favorite or credits rows are created.
- Sessions are shared with passwords: seven-day expiry, daily renewal, no cookie
  cache, HttpOnly/host-only/SameSite=Lax, Secure for HTTPS/production.
- GET `/auth/get-session` has the same user/session response; raw session tokens
  remain omitted from JSON. Logout removes only the current DB session.

## Collision and linking policy

accountLinking.enabled=false and disableImplicitLinking=true remain locked.
An existing password email causes Google callback to redirect with
`error=account_not_linked`. No Google account, replacement hash, second user,
email verification change or new session is persisted. Use the existing password
login. Google-only email followed by password signup returns native 422
USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL, without enrolling a password.

No explicit linking UX. Framework /link-social and /unlink-account paths are
disabled to keep provider management outside the accepted product surface.

## Sensitive provider tokens

Better Auth persists accessToken, idToken, accessTokenExpiresAt and comma-delimited
scope from the token response in auth_accounts. A refreshToken/expiry is supported
by schema but absent from the controlled online fixture; actual Google issuance
must be inspected privately during real acceptance. No offline token requested.
No application Google API calls or logging of token values. Native
/get-access-token and /refresh-token are disabled (404), so those tokens are not
exposed through a provider-token HTTP API. Treat DB/backups as secret-bearing;
no new encryption/storage scheme is introduced in A4.

## Limiting

Built-in memory limiter: password and social initiation paths each use 20/60s;
callback retains general 100/60s. No callback exemption. Successful tests prove
normal initiation and callbacks work within these separate path buckets. Current
runtime has a shared per-path fallback without trusted IP integration; trusted
proxy/IP handling and multi-instance protection remain production follow-ups.

## Automated validation and limits

From apps/api:

```bash
bun --env-file=../../.env test src/auth/google-auth.integration.test.ts src/auth/auth-environment.test.ts src/auth/auth-server.integration.test.ts
bun --env-file=../../.env test src/auth/password-auth.integration.test.ts
```

Tests use real PostgreSQL and the mounted Hono handler with cookie jars. Only
outbound Google token-exchange fetch is intercepted during controlled callbacks;
it checks the callback URL, client credentials and S256 verifier. Test claims are
delivered through that test-only response, not a production getUserInfo override
or verification bypass. The pinned code-flow provider reads its profile from
the trusted HTTPS token response. These fixtures prove provisioning/ownership,
not real Google signatures, consent, credential validity or Cloud configuration.
Native state/PKCE, persistence, account linking and cookie behavior stay intact.
Test users and their auth rows, plus test OAuth states, are cleaned up.

## Real runtime acceptance — complete

Local credentials and all six required runtime variables pass configuration
validation. PostgreSQL migrations are current. Real API initiation returned the
Google destination with the exact localhost callback, identity-only scopes,
S256 PKCE and state cookie; no token endpoint interception was used.

Real Google signup and returning login completed in the same browser flow.
Both resolved the same canonical Flemme users.id UUID without duplicating the
user or Google account. Session restoration returned that UUID without a raw
session token. Logout removed the current database session, and replaying the
logged-out cookie remained unauthenticated. No Profile, Household, Kitchen,
Inventory, Favorite, credits or Cooking Session rows were provisioned.

Private database inspection confirmed the Google account retained accessToken
and idToken, no refresh token, and Google's equivalent identity scopes. No
sensitive token values were printed or exposed through HTTP. Password/Google
collision behavior remains covered by the controlled real-PostgreSQL tests.

The existing `bun run --filter @flemme/api dev` command runs the accepted flow.
The web destination remains an existing local page; A7 owns login/callback UI.
Swagger still documents the temporary DevelopmentUser flow for domain APIs.

## Validation results

- Focused Auth: 16 passed, including three Google callback/security scenarios.
- Full API: 128 passed; A3 original migrated password login/hash preservation and
  all Product Domain regression scenarios remain green.
- Workspace typecheck and API/web build: pass.
- Drizzle schema check, database lifecycle and preservation migration test: pass.
- Biome on Auth source/tests and git diff --check: pass.
- No new migration, dependency, frontend change or persistent acceptance server.

## Reference and next task

Provider options were checked against installed 1.7.4 source and the official
[Google provider documentation](https://www.better-auth.com/docs/authentication/google)
and [account-linking documentation](https://www.better-auth.com/docs/concepts/users-accounts).
Next implementation is A5 Session → currentUserId, not part of A4.
