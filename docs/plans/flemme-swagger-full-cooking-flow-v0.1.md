# Task — Flemme Swagger Full Cooking Flow v0.1

We have completed the first working Flemme core cooking API persistence flow.

Current implemented HTTP surface:

```text
GET   /health
GET   /openapi.json
GET   /docs

POST  /cooking/recommendations
POST  /cooking/pre-cooking

POST  /cooking-sessions
GET   /cooking-sessions/{id}
PATCH /cooking-sessions/{id}/progress
POST  /cooking-sessions/{id}/complete
```

The following pieces are already implemented and validated independently:

```text
Recommendation API              ✅
Pre-Cooking API                 ✅
Cooking Session creation        ✅
Cooking Session restore         ✅
Active progress persistence     ✅
Completion persistence          ✅
Swagger/OpenAPI                 ✅
Development authentication      ✅
```

A manual Swagger test has also already proven the following real flow:

```text
Recommendation
→ Select recipe
→ Pre-Cooking
→ Create Cooking Session
→ Restore Cooking Session
→ Update progress
→ Reach final step
→ Premature completion rejected
→ Mark final step completed
→ Complete Cooking Session
```

The purpose of this task is NOT to add new business features.

The purpose is to turn the current manually-proven flow into a clear, repeatable, documented backend acceptance flow using Swagger.

Do NOT implement Active Cooking AI orchestration yet.

Do NOT implement Completion AI orchestration yet.

Do NOT redesign the API or database schema.

---

# Goal

Create and validate:

```text
Swagger Full Cooking Flow v0.1
```

The complete manual API flow should be executable from:

```text
http://localhost:3000/docs
```

using one development user.

The final documented flow should be:

```text
1. Recommendation
2. Recipe Selection
3. Pre-Cooking
4. Cooking Session Creation
5. Cooking Session Restore
6. Active Cooking Progress
7. Final-Step Guard Validation
8. Cooking Session Completion
9. Completed Session Restore / Verification
```

This task is primarily about:

```text
documentation
repeatability
request/response mapping
Swagger usability
business-flow validation
```

not new domain functionality.

---

# 1. Audit Current Swagger Flow

Inspect:

```text
apps/api/src/app.ts
apps/api/src/cooking-recommendation
apps/api/src/pre-cooking
apps/api/src/cooking-session
docs/testing/swagger-cooking-flow.md
```

Verify that all existing routes required for the flow are visible and executable in Swagger.

Do not change route behavior unless a concrete documentation or usability blocker exists.

---

# 2. Preserve Existing Boundaries

The current boundaries are intentional.

## Recommendation

```http
POST /cooking/recommendations
```

Must:

```text
load/merge context
invoke Recommendation Agent
return validated recommendation output
```

Must NOT:

```text
select a recipe
run Pre-Cooking
create a Cooking Session
mutate inventory
```

## Pre-Cooking

```http
POST /cooking/pre-cooking
```

Must:

```text
accept selected recipe
load/merge context
invoke Pre-Cooking Agent
return validated PreCookingOutput
```

Must NOT:

```text
persist Cooking Session
mutate inventory
run Active Cooking AI
run Completion AI
```

## Cooking Session

```text
POST   /cooking-sessions
GET    /cooking-sessions/{id}
PATCH  /cooking-sessions/{id}/progress
POST   /cooking-sessions/{id}/complete
```

These persist and restore accepted/generated snapshots and mutable progress.

Do not add AI invocation inside these persistence endpoints.

---

# 3. Development Auth

The current Swagger flow uses:

```http
x-flemme-user-id
```

Every protected endpoint must use the same real development user ID.

The guide should clearly explain:

```text
where to obtain the user ID
how to seed one if needed
where to place it in Swagger
```

Do not expose actual developer UUIDs or secrets in committed documentation.

Use safe placeholders such as:

```text
<development-user-id>
```

---

# 4. Prerequisites

Update the Swagger flow guide with explicit prerequisites.

At minimum:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/api dev
```

Document:

```text
Swagger UI: http://localhost:3000/docs
OpenAPI:    http://localhost:3000/openapi.json
```

If the real Recommendation / Pre-Cooking Agent provider requires environment configuration, document only the required variable names.

Do NOT expose their values.

---

# 5. Scenario Data

Use one stable manual test scenario throughout the guide.

Use a practical positive case similar to:

```text
Selected recipe:
Telur Kecap Bawang

Servings:
2

Available time:
45 minutes
```

Recommended inventory context:

```text
telur
kecap manis
bawang merah
bawang putih
minyak goreng
garam
```

Recommended equipment:

```text
kompor
wajan
spatula
pisau
talenan
```

The documentation may use safe example request bodies, but it must explain that:

```text
Recommendation output should be treated as the source of truth
for the selected recipe passed into Pre-Cooking.
```

Do not fabricate a selected recipe independently when the real Recommendation output is available.

---

# 6. Step 1 — Recommendation

Document the exact manual flow for:

```http
POST /cooking/recommendations
```

Include:

```text
development auth header
example request body
what persistent context may be overridden
expected success shape
possible no_viable_recommendation behavior
```

The guide should explicitly explain:

```text
Recommendation does not persist anything.
```

Expected output may be:

```text
recommendations
clarification
no_viable_recommendation
```

For the full-flow positive scenario, require a successful `recommendations` result before continuing.

---

# 7. Step 2 — Recipe Selection

Document that recipe selection is currently a client/manual decision.

Conceptually:

```text
Recommendation response
        ↓
choose one recommendation object
        ↓
copy the exact object
        ↓
selectedRecipe in Pre-Cooking request
```

Do not add a new API endpoint just for selection.

The selected recipe must come from the actual Recommendation response.

---

# 8. Step 3 — Pre-Cooking

Document the exact manual flow for:

```http
POST /cooking/pre-cooking
```

The guide should explain:

```text
selectedRecipe
=
one exact recipe object from Recommendation output
```

If Recommendation used request-level context overrides, document that the same context should normally be reused for Pre-Cooking so both phases reason from the same cooking situation.

Expected response:

```text
PreCookingOutput
```

including the current concepts:

```text
preparationSummary
ingredients
equipment
preparationSteps
cookingStages
```

Explain that this response is still generated output and is not persisted until Cooking Session creation.

---

# 9. Step 4 — Cooking Session Creation

Document:

```http
POST /cooking-sessions
```

Explain the mapping clearly:

```text
Recommendation response
        ↓
recommendationSnapshot

Selected recipe
        ↓
selectedRecipeSnapshot

Pre-Cooking response
        ↓
cookingPlan

Initial active state
        ↓
session
```

Initial session progress should conceptually point to:

```text
first cooking stage
first cooking step
completedStepIds = []
changes = []
status = active
```

Do not invent nutrition data.

If no real nutrition output exists:

```text
nutritionSnapshot should remain omitted/null
```

according to the existing schema.

Do not document fake zero nutrition as valid real data.

---

# 10. Step 5 — Restore Cooking Session

Document:

```http
GET /cooking-sessions/{id}
```

The guide should explain what this proves:

```text
PostgreSQL persisted the session
snapshots are restored
progress state is restored
AI is NOT called again
```

Expected state immediately after creation:

```text
phase = active_cooking
status = active
current stage/step = initial cooking position
completionSnapshot = null
completedAt = null
```

---

# 11. Step 6 — Active Cooking Progress

Document:

```http
PATCH /cooking-sessions/{id}/progress
```

Explain the persistence model:

```text
cookingPlan
= immutable generated snapshot

session progress
= mutable relational state
```

Demonstrate at least one normal transition:

```text
stage-1-step-1
        ↓
mark completed
        ↓
stage-1-step-2 becomes current
```

Explain:

```text
completedStepIds
currentStageId
currentStepId
changes
status
```

Do not require a real cooking-time delay for the manual backend acceptance test.

---

# 12. Step 7 — Final-Step Guard Validation

This is an important acceptance check.

Document the guard explicitly.

Move the session to the final cooking step, but do NOT yet include that final step in `completedStepIds`.

Then call:

```http
POST /cooking-sessions/{id}/complete
```

Expected error:

```text
SESSION_NOT_READY_FOR_COMPLETION
```

with the meaning:

```text
being positioned at the final step
is not the same as
having completed the final step
```

This should be documented as an intentional lifecycle guard, not an error in the implementation.

---

# 13. Step 8 — Mark Final Step Completed

PATCH the Cooking Session again.

The final step should remain the current step while also being present in:

```text
completedStepIds
```

Example conceptual state:

```text
currentStageId = final stage
currentStepId = final step
completedStepIds includes every cooking step
status = active
```

This means:

```text
cooking execution is finished
but completion persistence has not happened yet
```

---

# 14. Step 9 — Completion Persistence

Document:

```http
POST /cooking-sessions/{id}/complete
```

Important current limitation:

```text
Completion AI HTTP orchestration is not implemented yet.
```

Therefore the current endpoint persists an already-valid Completion snapshot.

For the manual persistence acceptance test, a schema-valid completion snapshot may be supplied explicitly.

Clearly label this as:

```text
manual/synthetic completion snapshot for persistence validation
```

not the final production orchestration flow.

Do NOT provide fake nutrition values.

If no real nutrition calculation has occurred:

```text
nutritionSnapshot should remain omitted/null
```

where allowed.

Expected result:

```text
phase = completion
status = completed
completedAt != null
completionSnapshot != null
```

---

# 15. Step 10 — Verify Completed Session

After completion, run:

```http
GET /cooking-sessions/{id}
```

Verify:

```text
phase = completion
status = completed
completedAt exists
completionSnapshot restored
cookingPlan still preserved
recommendationSnapshot still preserved
selectedRecipeSnapshot still preserved
```

This final GET proves the whole persistence lifecycle survives round-trip storage.

---

# 16. Drizzle Studio Verification

Add an optional verification section using:

```bash
bun run --filter @flemme/db db:studio
```

The developer should be able to inspect:

```text
cooking_sessions
```

and confirm that a session row exists and changes across the lifecycle.

Do not make Drizzle Studio a requirement for the API flow.

It is only an inspection aid.

---

# 17. Swagger Documentation Quality

Improve Swagger descriptions only where useful.

Each cooking endpoint should make clear:

```text
what the endpoint does
what it does NOT do
what phase it belongs to
what input is expected
```

Avoid large prose blocks inside OpenAPI metadata.

Keep detailed step-by-step guidance in:

```text
docs/testing/swagger-cooking-flow.md
```

Swagger should remain concise and executable.

---

# 18. Acceptance Checklist

Add a compact checklist to the flow guide.

Example:

```text
[ ] Recommendation returns valid options
[ ] One recipe is selected
[ ] Pre-Cooking returns valid structured plan
[ ] Cooking Session is created
[ ] Session can be restored
[ ] Progress can be updated
[ ] Premature completion is rejected
[ ] Final step can be marked complete
[ ] Completion persistence succeeds
[ ] Completed session can be restored
```

---

# 19. Testing / Validation

Do not add unnecessary new test architecture.

Run the existing relevant validation:

```text
API tests
full workspace tests
database lifecycle validation
workspace typecheck
workspace build
scoped Biome
git diff --check
```

Verify OpenAPI still exposes all required cooking routes.

If useful, add a small integration test only for an uncovered lifecycle behavior.

Do not duplicate test coverage just to increase test count.

---

# 20. Out of Scope

Do NOT implement in this task:

```text
Active Cooking AI HTTP orchestration
Completion AI HTTP orchestration
Nutrition API/orchestration
Profile CRUD
Household CRUD
Kitchen CRUD
Inventory CRUD
Favorite API
Production authentication
Redis
BullMQ
SSE
WebSocket
Billing
Credits
Subscription
Deployment infrastructure
```

Do not redesign:

```text
database schema
Cooking Session lifecycle
Recommendation contracts
Pre-Cooking contracts
```

unless a concrete blocker is discovered.

---

# Definition of Done

This task is complete when:

```text
docs/testing/swagger-cooking-flow.md
```

acts as a repeatable manual acceptance guide for:

```text
Recommendation
→ Recipe Selection
→ Pre-Cooking
→ Cooking Session Creation
→ Session Restore
→ Active Progress
→ Final-Step Guard
→ Completion Persistence
→ Completed Session Restore
```

and the flow is revalidated successfully against the current local API.

The guide must clearly distinguish:

```text
AI generation responsibilities
from
persistence responsibilities
```

and also clearly note that:

```text
Active Cooking AI orchestration
Completion AI orchestration
Nutrition integration
```

are still future work.

---

# Expected Final Report

Return a concise report containing:

```text
files changed
Swagger flow documentation updates
manual flow validation result
lifecycle guard result
Cooking Session completion result
OpenAPI/Swagger verification
tests/typecheck/build/check results
any usability issue found
deferred next work
```

Also provide the final validated business flow:

```text
POST /cooking/recommendations
        ↓
Select Recipe
        ↓
POST /cooking/pre-cooking
        ↓
POST /cooking-sessions
        ↓
GET /cooking-sessions/{id}
        ↓
PATCH /cooking-sessions/{id}/progress
        ↓
final-step completion guard
        ↓
PATCH final progress
        ↓
POST /cooking-sessions/{id}/complete
        ↓
GET completed session
```

Stop after Swagger Full Cooking Flow v0.1 is documented and validated.

The next milestone after this will be:

```text
Active Cooking AI Orchestration v0.1
```
