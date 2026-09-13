# Task — Flemme Pre-Cooking API v0.1

We are continuing Flemme API development incrementally.

The current backend flow is already implemented and validated up to Recommendation and Cooking Session persistence.

Current HTTP surface:

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

Current implemented business flow:

```text
POST /cooking/recommendations
        ↓
User receives Recommendation output
        ↓
User chooses one recommendation
        ↓
Pre-Cooking HTTP generation     ← CURRENT GAP
        ↓
POST /cooking-sessions
        ↓
Persist + resume Active Cooking progress
        ↓
Complete Cooking Session
```

The next task is to close only this gap:

```text
Pre-Cooking API v0.1
```

Do NOT implement the full Swagger end-to-end cooking flow yet.

Do NOT implement Active Cooking AI orchestration or Completion AI orchestration yet.

---

# Goal

Implement:

```http
POST /cooking/pre-cooking
```

The endpoint should take a user-selected Recommendation recipe plus the relevant current cooking context, invoke the existing Pre-Cooking Agent, validate its structured output, and return a valid `PreCookingOutput`.

The endpoint must NOT create a Cooking Session automatically.

Expected flow:

```text
HTTP Request
    ↓
Development Auth
    ↓
Zod Request Validation
    ↓
Load / Build Relevant Cooking Context
    ↓
Validate Selected Recommendation
    ↓
@flemme/agent Pre-Cooking
    ↓
PreCookingOutputSchema
    ↓
HTTP Response
```

After this task is complete, the returned Pre-Cooking result should be suitable as input for the already-existing:

```http
POST /cooking-sessions
```

But do not wire those two operations together automatically yet.

---

# 1. Audit Existing Contracts First

Before implementing anything, inspect the existing code.

At minimum inspect:

```text
packages/agent
packages/contracts
packages/ingredients
packages/nutrition
packages/db

apps/api/src/cooking
apps/api/src/cooking-recommendation
apps/api/src/cooking-session
```

Identify the actual existing contracts for:

```text
Recommendation output
selected recipe
Pre-Cooking input
Pre-Cooking output
Cooking context
session context
household context
kitchen/equipment context
ingredient requirements
timing guidance
cooking stages
```

The current Agent contracts are the source of truth.

Do not invent a parallel Pre-Cooking shape inside `apps/api`.

---

# 2. Preserve Existing Pre-Cooking Product Decisions

The existing Flemme Pre-Cooking contract has already been designed.

Preserve these decisions.

## Ingredients

`ingredients` represent ingredient requirements/reference:

```text
WHAT is needed
```

They are not an `ingredientPrep` action list.

Ingredient preparation actions belong in:

```text
preparationSteps
```

or the appropriate existing preparation structure.

Do not introduce a new `ingredientPrep` model.

## Timing

Do not introduce exact minute/second duration as the primary cooking-step timing model.

Current timing guidance is qualitative.

Conceptually:

```ts
timing?: {
  level:
    | "very-short"
    | "short"
    | "medium"
    | "long";
  cue?: string;
}
```

Preserve the existing Agent contract exactly.

Do not replace it with:

```text
estimatedMinutes
durationSeconds
```

unless the existing source contract already explicitly requires them.

## Pre-Cooking Structure

The current Pre-Cooking output concept includes:

```text
preparationSummary
ingredients
equipment
preparationSteps
cookingStages
```

Use the actual current Zod schema and types from `@flemme/agent`.

Do not duplicate them in the API layer.

---

# 3. Request Responsibility

The client should send only what is needed to identify the selected Recommendation result and any legitimate current-session context.

Do NOT require the client to resend the entire persistent user profile, household, kitchen, and inventory state if the API can load them from PostgreSQL.

Inspect the current Pre-Cooking Agent input contract before deciding the final HTTP body.

The API request should conceptually contain:

```text
selected recommendation / selected recipe
+
only necessary session-specific context
```

Use the smallest request contract that maps cleanly to the existing Agent input.

Do not invent fields merely for convenience.

---

# 4. Selected Recipe Validation

The endpoint must validate that the selected recipe conforms to the existing Recommendation contract.

Do not accept arbitrary untyped recipe JSON.

Reuse the schema already owned by `@flemme/agent`.

Conceptually:

```text
request.selectedRecipe
        ↓
existing Recommendation / Recipe schema
        ↓
Pre-Cooking orchestration
```

If the current Agent package has a dedicated selected-recipe schema, use it.

If not, derive the selected recipe through the existing Recommendation output contract rather than creating an incompatible duplicate.

---

# 5. Cooking Context

Reuse the existing Cooking Context service where the same persistent context is needed.

Do not duplicate Recommendation context-loading logic.

The existing context builder already understands persisted:

```text
user profile
household
kitchen
kitchen equipment
inventory
```

If Pre-Cooking needs only part of that context, reuse or extend the current domain-specific service carefully.

Avoid introducing a generic “context engine”.

The API should still obey:

```text
request/session override
        ↓ overrides
persistent context
        ↓ otherwise
no invented defaults
```

where the existing Agent input supports that behavior.

---

# 6. Ingredient Boundary

Canonical database-owned ingredient identity remains owned by:

```text
@flemme/ingredients
```

Persisted domain references continue to use:

```text
ingredient_key
```

However, existing Agent snapshots/contracts may remain name-based where they are already name-based.

Do not force canonical keys into Agent structures that do not own that identity.

Do not borrow test catalogs or create API-only aliases.

---

# 7. Agent Invocation

Use the existing Pre-Cooking execution path from:

```text
@flemme/agent
```

Do not create a new AI provider client inside `apps/api`.

Do not duplicate prompts.

Do not create a second Pre-Cooking implementation.

Expected dependency direction:

```text
apps/api
    ↓
@flemme/agent
    ↓
existing provider + prompts + runtime
```

The API only orchestrates the existing capability.

---

# 8. Runtime Output Validation

The AI response must never be returned unchecked.

Validate the result through the existing Pre-Cooking schema.

Conceptually:

```text
Agent result
    ↓
PreCookingOutputSchema
    ↓
HTTP response
```

If the Agent runner already returns validated structured output, keep validation at the API boundary as an additional runtime guarantee if that matches the current Recommendation API pattern.

Do not cast AI output with:

```ts
as PreCookingOutput
```

without schema validation.

---

# 9. Route

Implement:

```http
POST /cooking/pre-cooking
```

Use the existing development auth middleware.

Require:

```http
x-flemme-user-id
```

exactly as the current protected cooking routes do.

Do not introduce another authentication mechanism.

---

# 10. Persistence Behavior

This endpoint is generation/orchestration only.

It must NOT:

```text
create cooking_sessions rows
mutate inventory
advance cooking progress
complete a session
persist a favorite
silently select another recipe
```

Expected behavior:

```text
Recommendation
    ↓
selected recipe
    ↓
POST /cooking/pre-cooking
    ↓
PreCookingOutput returned
```

Persistence begins only when the caller explicitly uses:

```http
POST /cooking-sessions
```

in the next business step.

---

# 11. Error Handling

Reuse the existing API error infrastructure.

Handle meaningful failures such as:

```text
invalid development user
invalid selected recipe
invalid request/session context
missing required persistent context
invalid persisted ingredient key
Agent provider not configured
Agent generation failure
Agent structured output validation failure
```

Use controlled response codes consistent with the existing Recommendation API.

Do not leak:

```text
raw provider response
database internals
stack traces
API keys
provider credentials
```

Do not introduce a second error framework.

---

# 12. Swagger / OpenAPI

Swagger/OpenAPI is part of the Definition of Done.

Register:

```http
POST /cooking/pre-cooking
```

using the same runtime Zod schemas and Hono OpenAPI definitions.

Swagger must document:

```text
x-flemme-user-id
request body
selected recipe structure
response body
expected error responses
```

Do not manually maintain a second schema only for documentation.

The endpoint must appear in:

```text
/docs
/openapi.json
```

---

# 13. Swagger Manual Test Scenario

Extend:

```text
docs/testing/swagger-cooking-flow.md
```

with the next executable step.

The document should now show:

```text
Step 1 — Recommendation

POST /cooking/recommendations

Result:
Recommendation output


Step 2 — Select Recipe

Choose one recipe from the successful Recommendation output.


Step 3 — Pre-Cooking

POST /cooking/pre-cooking

Input:
selected recipe + required session context

Result:
valid PreCookingOutput


Step 4 — Cooking Session

POST /cooking-sessions

STATUS:
existing endpoint, full chained Swagger execution will be validated in the next task
```

Do not yet claim the full Swagger business flow has been validated end-to-end.

That is the next milestone after this task.

---

# 14. Automated Tests

Add focused tests for Pre-Cooking API behavior.

At minimum cover:

```text
successful Pre-Cooking request
development auth
invalid request
invalid selected recipe
persistent cooking context loading where applicable
session override behavior where applicable
Agent failure mapping
invalid Agent output
provider not configured
OpenAPI registration
```

Normal automated tests must not require a live external AI provider.

Replace only the external Agent invocation boundary with deterministic test behavior.

Continue to exercise real:

```text
Hono routing
Zod validation
development auth
PostgreSQL context loading
service orchestration
response validation
```

where appropriate.

---

# 15. Real Provider Validation

After deterministic tests pass, perform or prepare one real provider-backed Pre-Cooking invocation.

Recommended manual sequence:

```text
1. Start PostgreSQL
2. Apply migration
3. Seed development data
4. Start API
5. Open Swagger
6. Run a successful Recommendation request with enough ingredients
7. Choose one returned recipe
8. Send it to POST /cooking/pre-cooking
9. Verify a schema-valid PreCookingOutput
```

Do not make CI/test execution depend on external provider availability.

---

# 16. Do Not Implement Full Swagger Flow Yet

This task stops when Pre-Cooking API v0.1 is independently stable.

Do not yet add automation that directly chains:

```text
Recommendation
→ Pre-Cooking
→ Cooking Session
```

Do not change:

```text
POST /cooking/recommendations
```

to automatically invoke Pre-Cooking.

Do not change:

```text
POST /cooking/pre-cooking
```

to automatically create a Cooking Session.

Explicit boundaries are intentional.

---

# 17. Out of Scope

Do NOT implement:

```text
Active Cooking AI HTTP endpoint
Completion AI HTTP endpoint

Profile CRUD
Household CRUD
Kitchen CRUD
Inventory CRUD
Favorite API

Redis
BullMQ
SSE
WebSocket

production authentication
OAuth
email verification

credits
billing
subscription

deployment infrastructure
```

Do not redesign the existing database schema unless a real blocking mismatch is discovered.

If a blocker is discovered, report it before making a broad schema redesign.

---

# 18. Validation

Run the relevant existing checks.

At minimum:

```text
Pre-Cooking API tests
complete API tests
full workspace tests
database lifecycle validation if relevant
workspace typecheck
workspace build
scoped Biome
git diff --check
```

Verify that:

```text
/openapi.json
```

contains:

```text
POST /cooking/pre-cooking
```

---

# Definition of Done

Pre-Cooking API v0.1 is complete when this isolated flow works:

```text
Real development user
        ↓
POST /cooking/recommendations
        ↓
User chooses one valid recommendation
        ↓
POST /cooking/pre-cooking
        ↓
Development Auth
        ↓
Request + Selected Recipe Validation
        ↓
Relevant Cooking Context
        ↓
@flemme/agent Pre-Cooking
        ↓
PreCookingOutputSchema
        ↓
Valid HTTP Response
```

And the operation does NOT:

```text
create a cooking session
mutate inventory
advance cooking progress
run Active Cooking AI
run Completion AI
```

---

# Expected Final Report

Return a concise implementation report containing:

```text
files added/changed
final Pre-Cooking request contract
selected recipe validation strategy
cooking context reuse
Agent integration
runtime output validation
route + OpenAPI registration
error mapping
automated test results
real provider/manual Swagger result
workspace validation results
deferred work
```

Also show the final implemented boundary:

```text
POST /cooking/pre-cooking
        ↓
Development Auth
        ↓
Zod Request Validation
        ↓
Selected Recipe Validation
        ↓
Cooking Context
        ↓
@flemme/agent Pre-Cooking
        ↓
PreCookingOutputSchema
        ↓
HTTP Response
```

Stop after Pre-Cooking API v0.1 is stable.

The next task after this will be:

```text
Swagger Full Cooking Flow v0.1
Recommendation
→ Recipe Selection
→ Pre-Cooking
→ Cooking Session
→ Active Progress
→ Completion
```
