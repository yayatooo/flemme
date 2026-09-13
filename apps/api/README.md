# `@flemme/api`

Hono application boundary for Flemme. The API owns request validation,
application orchestration, user ownership, and persistence coordination.

## Local development

Start PostgreSQL and the API from the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/api dev
```

`DATABASE_URL` must be present in the root `.env`. Cooking routes temporarily
use the development-only `x-flemme-user-id` header. Its value must be the UUID
of a real database user. The API refuses to start this adapter when
`NODE_ENV=production` and binds to localhost while the adapter is active.
Swagger exposes this header through its `DevelopmentUser` **Authorize** control.
Run the development seed, copy the UUID printed in its output, and authorize
once before testing protected cooking routes.

Real Recommendation, Pre-Cooking, Active Cooking, and Completion requests also
require the existing Agent provider variables `MUX_API_KEY` and `BASE_URL`. If
they are absent, the API remains available for health, documentation, and
persistence work, while those Agent-backed routes return the controlled
`AGENT_NOT_CONFIGURED` response.

## Routes

```text
GET   /health
GET   /openapi.json
GET   /docs
GET   /profile
PUT   /profile
GET   /household
PUT   /household
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
