# `@flemme/api`

Hono application boundary for Flemme. The API owns request validation,
application orchestration, user ownership, and persistence coordination.

## Local development

Set `BETTER_AUTH_SECRET` (your own random secret, at least 32 characters),
`BETTER_AUTH_URL=http://localhost:3000`, `WEB_ORIGIN=http://localhost:5173`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `DATABASE_URL`. Missing or
invalid configuration fails startup; no authentication fallback is supplied.
For example, generate a secret locally with `openssl rand -hex 32` and save it
privately. Do not commit it or use a VITE-prefixed variable. Origins must have
no path/trailing slash. Use localhost consistently for browser-facing URLs;
PostgreSQL may still use 127.0.0.1. Do not expose provider secrets through VITE_*.

`/auth/*` delegates requests to Better Auth 1.7.4. A3 enables password signup
and login, automatic sign-in, logout and session restoration. A4 enables Google
login/registration through POST `/auth/sign-in/social` and GET
`/auth/callback/google`. GET `/auth/get-session` retains Better Auth's native
200/null behavior. Application-owned GET `/auth/me` uses the common current-user
boundary and returns only `{ user: { id, email } }`; it never exposes session or
provider tokens, account details, or Product Domain resources.
Use the Google browser flow below for manual authentication.

In Google Cloud Console, create an OAuth **Web application** client. Configure
the consent screen/audience and test users as required by Google. Its Authorized
redirect URI must be exactly `http://localhost:3000/auth/callback/google` locally
(`<BETTER_AUTH_URL>/auth/callback/google` elsewhere), not `/api/auth/...`.
Do not mix localhost and 127.0.0.1. Google client secrets remain on the API.
Open `http://localhost:5173/login` and choose **Continue with Google**. The
official Better Auth client initiates authentication and returns to the protected
User Platform. Do not construct Google authorization URLs manually.

Google requests only openid/email/profile, online access, no incremental scopes.
Extra scopes/authorization parameters and direct ID-token sign-in are disabled.
Same-email password collisions redirect with `account_not_linked`; no implicit
link or second user is created. Google-only → password signup returns native
422 `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`. Provider token retrieval/refresh
and linking/unlinking endpoints are disabled; tokens remain sensitive DB data.
Google name/image belong to Auth users, never Profile.

Password policy is 8–128 characters, using Bun Argon2id. Emails are trimmed and
lowercased before JSON request validation. Password users remain unverified.
Response tokens are omitted from successful JSON; cookies remain the transport.
No recovery-email or verification-email flow is configured.

Built-in in-memory limiting allows 20 requests/minute per password/social sign-in endpoint
bucket (general limit 100/minute). Without a trusted client IP, the current Bun
entry point uses the framework's shared per-path fallback. This is intentionally
conservative locally, not a distributed production solution. Trusted proxy/IP
deployment and multi-instance enforcement must be reviewed before production.

Sessions use PostgreSQL, seven-day expiry, daily renewal, no cookie cache,
HttpOnly host-only SameSite=Lax cookies, and Secure cookies for HTTPS/production.
Explicit WEB_ORIGIN is trusted and allowed credentialed CORS; no wildcard or
dynamic origin reflection. Preflight runs before protected-route authentication.
All linking is currently disabled; implicit linking remains disabled for later
phases. No domain creation hooks exist.

Protected Product Domain routes use one `currentUserId` HTTP boundary.
`current-user-middleware.ts` resolves `auth.api.getSession({ headers })` and sets
only the validated canonical Flemme user UUID. No session means
`401 UNAUTHENTICATED`; there is no alternative adapter or fallback.
Framework auth endpoints stay public to the application middleware and remain
governed by Better Auth. `/auth/me` is the protected narrow identity endpoint.
Production Auth startup is allowed with valid HTTPS API/web origins; the HTTPS
guard remains because it protects cookie and origin transport security.

Focused auth tests inject fresh per-run test secrets, fake Google configuration
and real PostgreSQL. Google callback tests intercept only the token exchange;
real Google OAuth acceptance is complete. Framework endpoints retain native
response contracts rather than manually duplicated Swagger schemas.
Run `bun --env-file=../../.env test src/auth` from apps/api to test this boundary.

Start PostgreSQL and the API from the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/api dev
```

Set the required Auth configuration above in the root `.env`.
For manual API testing, register or sign in through `http://localhost:5173`,
then open `http://localhost:3000/docs` in the same browser. The browser stores
and sends the HttpOnly session cookie; do not paste tokens or user IDs into
Swagger. `CurrentUser` documents cookie authentication, not an editable identity.
Use the same localhost host throughout. See
[`Swagger authentication`](../../docs/testing/swagger-cooking-flow.md#session-authentication)
for browser and cookie-jar instructions.

Real Recommendation, Pre-Cooking, Active Cooking, and Completion requests also
require the existing Agent provider variables `MUX_API_KEY` and `BASE_URL`. If
they are absent, the API remains available for health, documentation, and
persistence work, while those Agent-backed routes return the controlled
`AGENT_NOT_CONFIGURED` response.

## Routes

```text
GET   /auth/me
GET   /health
GET   /openapi.json
GET   /docs
GET   /favorites
POST  /favorites
DELETE /favorites/:id
GET   /profile
PUT   /profile
GET   /household
PUT   /household
GET   /kitchen
PUT   /kitchen
GET   /inventory
POST  /inventory/items
PUT   /inventory/items/:id
DELETE /inventory/items/:id
POST  /cooking/recommendations
POST  /cooking/pre-cooking
POST  /cooking-sessions
GET   /cooking-sessions/:id
GET   /cooking-sessions/:id/nutrition
PATCH /cooking-sessions/:id/progress
POST  /cooking-sessions/:id/active-cooking
POST  /cooking-sessions/:id/completion
POST  /cooking-sessions/:id/complete
```

`/openapi.json` is generated from the Hono route schemas. `/docs` serves the
interactive Swagger UI for that specification.

`GET /profile` returns the authenticated user's persistent cooking preferences
or `PROFILE_NOT_FOUND` when the optional one-to-one profile has not been
created. `PUT /profile` idempotently creates or replaces both
`foodPreferences` and `cookingPreferences`; empty arrays are valid and arrays
replace rather than merge. The request never accepts a user ID. Profile v0.1
does not expose the schema's optional display name or persistence timestamps.
The same stored arrays are consumed directly by Recommendation and Pre-Cooking
context orchestration.

`GET /household` returns the authenticated user's aggregate adults, children,
and toddlers cooking context or `HOUSEHOLD_NOT_FOUND` when the optional
one-to-one household has not been created. `PUT /household` idempotently creates
or replaces all three counts. Counts must be non-negative PostgreSQL-range
integers, and zero is valid for every field. The request never accepts a user
ID. Recommendation and Pre-Cooking consume these same persisted values unless a
request-level household override replaces them for one request.

`GET /kitchen` returns `{ equipment: string[] }` or `KITCHEN_NOT_FOUND`.
`PUT /kitchen` atomically creates the kitchen and replaces its child equipment
rows. Names are trimmed, case is preserved, and duplicates ignoring case are
rejected. Empty equipment is valid. Responses sort names case-insensitively;
input order is not stored. See `docs/testing/swagger-kitchen-flow.md`.

Inventory supports canonical-key item creation, mutable-value replacement, and
deletion. Missing inventory returns `INVENTORY_NOT_FOUND`; an existing empty
inventory returns `{ items: [] }`. POST initializes the parent atomically.
See `docs/testing/swagger-inventory-flow.md` for contracts and examples.

The cooking-session endpoints persist existing generated snapshots; they do
not invoke the cooking agent. Restored JSONB is validated through the schemas
owned by `@flemme/agent` and `@flemme/nutrition`.

`POST /cooking/recommendations` reads the authenticated user's profile
preferences, household counts, kitchen equipment, and canonical-key inventory
from PostgreSQL. Request fields are current-attempt overrides and replace the
corresponding persistent field when supplied. The endpoint invokes the existing
Recommendation Agent and validates its result through the Agent-owned output
schema. It does not mutate inventory or create a cooking session.

Persistent inventory items validate their canonical `ingredient_key` through
`@flemme/ingredients` before passing it to the name-based Agent contract.
Current-attempt inventory overrides remain raw, explicit names at the Agent
boundary. Deterministic nutrition uses the separate production ingredient
catalog and does not borrow test fixtures or invent aliases.

`POST /cooking/pre-cooking` accepts one recipe selected from a successful
Recommendation result plus the required session context and optional
current-attempt context overrides. It loads omitted context through the same
persistent cooking-context service, invokes the existing Pre-Cooking Agent,
and validates the generated plan through `PreCookingOutputSchema`. It does not
persist the plan, mutate inventory, or create a cooking session.

`POST /cooking-sessions/:id/active-cooking` accepts only one current user
message. It restores the owned immutable plan and mutable progress from
PostgreSQL, invokes the existing Active Cooking Agent, and returns validated
guidance with proposed actions. The endpoint performs no persistence; callers
must explicitly use `PATCH /cooking-sessions/:id/progress` to apply an accepted
action.

`POST /cooking-sessions/:id/completion` accepts an optional final message for a
completion-ready session. It restores the historical plan and final progress,
projects completed status only in memory for the existing Completion Agent,
and returns a validated Completion output without changing the database. The
caller may then submit that output as `completionSnapshot` to the separate
`POST /cooking-sessions/:id/complete` persistence endpoint.

`GET /cooking-sessions/:id/nutrition` calculates a read-only nutrition preview
from the owned session's persisted Pre-Cooking plan and selected recipe serving
count. It uses only the production ingredient catalog, curated committed USDA
references, exact unit aliases, and verified portions. It can return
`complete`, `partial`, or `unavailable`; unavailable results intentionally have
no fake totals. The route performs no AI call, USDA network request, inventory
mutation, or Cooking Session mutation and is available for every valid session
status.

`POST /cooking-sessions/:id/complete` accepts only `completionSnapshot`.
Nutrition is recalculated from persisted server state before one database
update stores completion lifecycle fields and both snapshots together. Clients
cannot seed or submit `nutritionSnapshot`, and partial or unavailable coverage
does not prevent a valid session from completing.

Favorites are intentionally not exposed yet. Under the current session-backed
favorite model, future API logic should only favorite an owned, completed
session with a valid selected-recipe snapshot.

Run the real PostgreSQL integration tests with:

```bash
bun run --filter @flemme/api test
```

The incremental Swagger business-flow guide is in
[`docs/testing/swagger-cooking-flow.md`](../../docs/testing/swagger-cooking-flow.md).
