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

Real Recommendation requests also require the existing Agent provider
variables `MUX_API_KEY` and `BASE_URL`. If they are absent, the API remains
available for health, documentation, and persistence work, while Recommendation
returns the controlled `AGENT_NOT_CONFIGURED` response.

## Routes

```text
GET   /health
GET   /openapi.json
GET   /docs
POST  /cooking/recommendations
POST  /cooking-sessions
GET   /cooking-sessions/:id
PATCH /cooking-sessions/:id/progress
POST  /cooking-sessions/:id/complete
```

`/openapi.json` is generated from the Hono route schemas. `/docs` serves the
interactive Swagger UI for that specification.

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
Current-attempt inventory overrides remain raw,
explicit names because the repository intentionally does not yet ship a
production ingredient catalog; the API does not borrow the test fixture or
invent aliases.

Favorites are intentionally not exposed yet. Under the current session-backed
favorite model, future API logic should only favorite an owned, completed
session with a valid selected-recipe snapshot.

Run the real PostgreSQL integration tests with:

```bash
bun run --filter @flemme/api test
```

The incremental Swagger business-flow guide is in
[`docs/testing/swagger-cooking-flow.md`](../../docs/testing/swagger-cooking-flow.md).
