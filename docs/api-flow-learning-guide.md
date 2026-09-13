# Flemme API Flow Learning Guide

This guide explains the Flemme backend flow implemented since the API
foundation was introduced. It is written as a learning map: start at process
startup, follow one request through each layer, and then compare Recommendation
generation with Cooking Session persistence.

## 1. Responsibility Map

Flemme separates responsibilities by package:

```text
apps/web
= browser UI and future API client

apps/api
= HTTP, authentication, request validation, orchestration, authorization,
  and persistence coordination

packages/agent
= structured cooking reasoning through the AI model

packages/db
= PostgreSQL schema, Drizzle client, migrations, seed, and persistence

packages/ingredients
= canonical ingredient identity rules

packages/nutrition
= deterministic nutrition calculation and schemas
```

The important rule is that the API coordinates these packages. It does not
duplicate their contracts or move their responsibilities into route handlers.

## 2. Current HTTP Surface

The route registry lives in [`apps/api/src/app.ts`](../apps/api/src/app.ts).

```text
GET   /health
GET   /openapi.json
GET   /docs

POST  /cooking/recommendations

POST  /cooking-sessions
GET   /cooking-sessions/{id}
PATCH /cooking-sessions/{id}/progress
POST  /cooking-sessions/{id}/complete
```

There is no generic `/cooking` endpoint. The file
`cooking-context-service.ts` is an internal context builder used by the
Recommendation service, so it is not supposed to appear independently in
Swagger.

Pre-Cooking, Active Cooking AI, and Completion AI HTTP endpoints have not been
implemented yet.

## 3. API Startup Flow

The executable entry point is [`apps/api/index.ts`](../apps/api/index.ts).

```text
root .env
   ↓
read DATABASE_URL
   ↓
create @flemme/db client
   ↓
read Agent provider configuration
   ↓
create @flemme/agent model when configured
   ↓
createApp({ db, recommendationRunner })
   ↓
Bun.serve on 127.0.0.1:3000
```

`DATABASE_URL` is required because every protected route verifies a real user
in PostgreSQL. The API can still serve health, Swagger, and persistence routes
without Agent provider variables, but Recommendation returns a controlled
`AGENT_NOT_CONFIGURED` error.

The API currently refuses to start in production mode because development auth
must be replaced before production deployment.

## 4. Application Factory and Route Registration

`createApp()` constructs an `OpenAPIHono` application and registers:

1. the health endpoint,
2. the Recommendation route group,
3. the Cooking Session route group,
4. the generated OpenAPI document,
5. Swagger UI, and
6. shared error handling.

The application receives its database and Recommendation runner as
dependencies. This keeps module imports safe and lets tests replace only the
external AI invocation while exercising real routing, validation, context
loading, and PostgreSQL behavior.

## 5. Common Protected-Request Flow

All cooking endpoints currently require the development header:

```http
x-flemme-user-id: <real-user-uuid>
```

The middleware in
[`development-auth-middleware.ts`](../apps/api/src/auth/development-auth-middleware.ts)
does not blindly trust the header.

```text
HTTP request
   ↓
validate header as UUID
   ↓
query users table
   ↓
user missing? → 401 UNAUTHENTICATED
   ↓
store currentUserId in Hono request context
   ↓
continue to route handler
```

This is deliberately basic development authentication. The important
architecture is already present: services receive a real current-user ID, and
user-owned data is never accessed without it.

## 6. Route, Schema, Service, Database Pattern

The API uses a small layered flow:

```text
Route
   ↓
Zod request validation
   ↓
Domain-specific service
   ↓
@flemme/db / @flemme/agent
   ↓
Zod response validation
   ↓
HTTP response
```

The route owns HTTP concerns such as method, path, headers, status codes, and
OpenAPI metadata. The service owns the application operation. Database tables
and Agent contracts stay in their owning packages.

## 7. Recommendation Flow

The Recommendation endpoint is:

```http
POST /cooking/recommendations
```

Its files are grouped under
[`apps/api/src/cooking-recommendation`](../apps/api/src/cooking-recommendation).

### 7.1 Minimal Request

The client supplies information specific to the current cooking attempt:

```json
{
  "session": {
    "request": "I want a simple savory dinner.",
    "servings": 2,
    "availableMinutes": 45
  }
}
```

The client does not need to rebuild the user's stored profile, household,
kitchen, and inventory on every request.

### 7.2 Persistent Context Loading

The internal
[`cooking-context-service.ts`](../apps/api/src/cooking/cooking-context-service.ts)
loads:

```text
user_profiles
→ foodPreferences
→ cookingPreferences

households
→ adults
→ children
→ toddlers

kitchens + kitchen_equipment
→ available equipment

inventories + inventory_items
→ canonical ingredient keys
→ quantity/unit
→ condition
```

The Recommendation operation is read-only. It does not subtract inventory or
create a cooking session.

### 7.3 Context Merge

The request may temporarily override a complete context field:

```text
request field supplied
        ↓
use request value

request field omitted
        ↓
use persistent value
```

For example:

| Persistent value | Request override | Agent receives |
| --- | --- | --- |
| `foodPreferences: ["mild"]` | omitted | `["mild"]` |
| `foodPreferences: ["spicy"]` | supplied | `["spicy"]` |
| equipment contains stove and wok | `{ equipment: ["rice cooker"] }` | rice cooker only |

Arrays are replaced, not merged. This makes precedence predictable and avoids
silently retaining a persistent value the user intentionally replaced for the
current attempt.

Missing Household, Kitchen, or Inventory context produces a controlled 422
error when the request does not provide an override. The API does not invent
defaults.

### 7.4 Ingredient Boundary

Persistent inventory uses `ingredient_key`, such as `salt` or
`chicken-thigh`. The key is checked through the schema owned by
`@flemme/ingredients` before entering the Agent context.

The current Recommendation Agent contract is name-based, and the repository
does not yet contain a production ingredient catalog. Therefore:

```text
persistent inventory
→ validated canonical ingredient key

request inventory override
→ explicit raw ingredient name
```

The API does not borrow the test ingredient catalog or invent aliases.

### 7.5 Agent Invocation

After aggregation, the API builds the existing
`CookingRecommendationInput` and invokes `runCookingAgent()`.

```text
validated cooking context
   ↓
shared cooking instructions
   +
Recommendation prompt
   ↓
configured AI provider
   ↓
CookingRecommendationOutputSchema
```

The output is one of:

```text
recommendations
clarification
no_viable_recommendation
```

The API validates the result again at its Agent invocation boundary. Invalid
or failed model output never reaches the client unchecked.

### 7.6 What Recommendation Does Not Do

```text
does not create a cooking session
does not select a recipe
does not run Pre-Cooking
does not mutate inventory
does not persist the recommendation automatically
```

The user must choose a recommendation before the cooking lifecycle continues.

## 8. Cooking Session Persistence Flow

Cooking Session endpoints live under
[`apps/api/src/cooking-session`](../apps/api/src/cooking-session).

These endpoints do not call the AI model. They persist and restore structured
results that have already been generated and accepted.

### 8.1 Create Session

```http
POST /cooking-sessions
```

Conceptual flow:

```text
validated Recommendation snapshot
+ selected recipe snapshot
+ immutable Pre-Cooking plan
+ initial Active Cooking progress
        ↓
Cooking Session service
        ↓
insert cooking_sessions row
```

The current API does not yet provide the Pre-Cooking generation endpoint, so a
caller must already have a valid `PreCookingOutput` before creating the
session.

### 8.2 Restore Session

```http
GET /cooking-sessions/{id}
```

```text
session ID + current user ID
   ↓
load PostgreSQL row
   ↓
verify ownership
   ↓
parse each JSONB snapshot through its owning Zod schema
   ↓
return restored plan and relational progress
```

This is the critical resume behavior. The stored plan is restored without
asking the AI to regenerate historical cooking instructions.

### 8.3 Update Progress

```http
PATCH /cooking-sessions/{id}/progress
```

Only mutable progress fields change:

```text
status
pause reason
current stage ID
current step ID
completed step IDs
recorded session changes
```

The service validates stage and step references against the immutable stored
Pre-Cooking plan. It does not rewrite that plan while the user moves through
the instructions.

### 8.4 Complete Session

```http
POST /cooking-sessions/{id}/complete
```

Completion requires an active session positioned at a recorded-complete final
cooking step. The operation then updates:

```text
phase → completion
status → completed
completed_at
completion JSONB snapshot
optional nutrition snapshot
```

The completed `cooking_sessions` row is the current source for cooking history.
There is no duplicate history table.

## 9. Relational State Versus JSONB Snapshots

The database follows this rule:

```text
Need ownership, filtering, lifecycle queries, or constraints?
→ relational column/table

Need to preserve generated structured output exactly?
→ JSONB snapshot
```

Relational examples:

```text
user_id
phase
status
current_stage_id
current_step_id
completed_step_ids
started_at
completed_at
```

JSONB examples:

```text
recommendation_snapshot
selected_recipe_snapshot
pre_cooking_plan_snapshot
completion_snapshot
nutrition_snapshot
```

PostgreSQL preserves JSONB, but it does not prove that old JSON matches the
current TypeScript contract. The API therefore parses restored snapshots using
schemas from `@flemme/agent` and `@flemme/nutrition`.

## 10. Error Flow

Expected errors use one response shape:

```json
{
  "error": {
    "code": "COOKING_SESSION_NOT_FOUND",
    "message": "Cooking session not found"
  }
}
```

Examples include:

```text
400 → request validation failed
401 → development user is missing or invalid
403 → cooking session belongs to another user
404 → cooking session does not exist
409 → lifecycle state does not allow the operation
422 → cooking context/progress is structurally unsuitable
502 → Agent generation or output validation failed
503 → Agent provider is not configured
500 → invalid persisted snapshot or unexpected internal failure
```

Raw database errors, provider responses, stack traces, and credentials are not
returned to clients.

## 11. Swagger Flow

Each route is defined with the same runtime Zod schema used by the handler.
Hono generates:

```text
/openapi.json → OpenAPI specification
/docs         → Swagger UI reading that specification
```

Swagger displays HTTP routes, not internal services. A service becomes visible
only when an OpenAPI route calls it and that route is registered in
`app.ts`.

The manual workflow is documented in
[`testing/swagger-cooking-flow.md`](testing/swagger-cooking-flow.md).

## 12. Test Strategy

API integration tests use real PostgreSQL for:

```text
development user lookup
context aggregation
ownership
session create/restore/update/complete
JSONB corruption handling
```

Recommendation tests replace only the AI invocation with a deterministic
runner. They do not mock request validation, context merging, auth lookup, or
database behavior.

One manual provider-backed request separately proves the real path:

```text
HTTP
→ PostgreSQL context
→ Agent provider
→ structured Zod output
```

This keeps automated tests reliable and offline from the provider while still
verifying the real integration manually.

## 13. Local Learning Commands

Start PostgreSQL and prepare data:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
```

Start the API and web application:

```bash
bun run dev
```

Inspect the API:

```text
Swagger UI: http://localhost:3000/docs
OpenAPI:    http://localhost:3000/openapi.json
Health:     http://localhost:3000/health
```

Inspect PostgreSQL through Drizzle Studio:

```bash
bun run --filter @flemme/db db:studio
```

Run validation:

```bash
bun run --filter @flemme/api test
bun run --filter @flemme/db db:validate-lifecycle
bun run typecheck
bun run build
```

## 14. Suggested Code Reading Order

Read the implementation in this order:

1. [`apps/api/index.ts`](../apps/api/index.ts) — process startup and dependency creation.
2. [`apps/api/src/app.ts`](../apps/api/src/app.ts) — route registration and global errors.
3. [`development-auth-middleware.ts`](../apps/api/src/auth/development-auth-middleware.ts) — current-user resolution.
4. [`cooking-recommendation-schema.ts`](../apps/api/src/cooking-recommendation/cooking-recommendation-schema.ts) — transport contract.
5. [`cooking-context-service.ts`](../apps/api/src/cooking/cooking-context-service.ts) — persistent context and overrides.
6. [`cooking-recommendation-service.ts`](../apps/api/src/cooking-recommendation/cooking-recommendation-service.ts) — Agent orchestration.
7. [`cooking-recommendation-route.ts`](../apps/api/src/cooking-recommendation/cooking-recommendation-route.ts) — HTTP and OpenAPI binding.
8. [`cooking-session-schema.ts`](../apps/api/src/cooking-session/cooking-session-schema.ts) — persistence transport contracts.
9. [`cooking-session-service.ts`](../apps/api/src/cooking-session/cooking-session-service.ts) — lifecycle and snapshot restoration.
10. [`cooking-session-route.ts`](../apps/api/src/cooking-session/cooking-session-route.ts) — session HTTP endpoints.
11. API integration tests — executable examples of the intended behavior.

## 15. Current Gap and Next Boundary

The implemented pieces currently form this partial flow:

```text
POST /cooking/recommendations
        ↓
user chooses one recommendation outside the current API
        ↓
Pre-Cooking HTTP generation is pending
        ↓
POST /cooking-sessions with an already generated plan
        ↓
persist and resume Active Cooking progress
        ↓
complete the persisted session
```

The next API milestone should close one explicit gap at a time. It should not
silently combine Recommendation, Pre-Cooking, Active Cooking, and Completion
into one large endpoint.
