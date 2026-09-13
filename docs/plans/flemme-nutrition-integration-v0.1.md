# Task — Flemme Nutrition Integration v0.1

## Context

Flemme's core AI cooking lifecycle is now implemented and validated:

```text
Recommendation AI                     ✅
Pre-Cooking AI                        ✅
Cooking Session persistence           ✅
Active Cooking AI API                 ✅
Completion AI API                     ✅
Completion persistence                ✅
Swagger Full Cooking Flow             ✅
```

Current Completion flow:

```text
final cooking step completed
        ↓
POST /cooking-sessions/{id}/completion
        ↓
Completion Agent
        ↓
{ reply, summary, notes }
        ↓
NO database mutation
        ↓
POST /cooking-sessions/{id}/complete
        ↓
persist completionSnapshot
        ↓
session becomes completed
```

Nutrition foundation already exists in:

```text
packages/nutrition
```

and canonical ingredient identity already exists in:

```text
packages/ingredients
```

Important architecture rule:

```text
Nutrition must be deterministic.
LLM must NOT calculate calories/macros.
```

Do not ask Recommendation, Pre-Cooking, Active Cooking, or Completion AI to invent nutrition values.

---

# Goal

Implement:

```text
Nutrition Integration v0.1
```

The server should be able to derive a real nutrition result from an owned persisted Cooking Session using:

```text
persisted cookingPlan
        ↓
ingredient identity resolution
        ↓
deterministic quantity/unit normalization where supported
        ↓
nutrition references
        ↓
@flemme/nutrition
        ↓
Nutrition result
```

Then the same trusted server-side calculation should be usable when a Cooking Session is completed so `nutritionSnapshot` no longer depends on fake/manual client data.

The final intended flow is:

```text
Cooking Session
        ↓
persisted Pre-Cooking plan
        ↓
Nutrition Service
        ↓
@flemme/ingredients
        ↓
@flemme/nutrition
        ↓
NutritionOutput
        ↓
preview via API
and/or
persist as nutritionSnapshot during completion
```

---

# 1. Audit Existing Nutrition Contracts First

Before writing API code, inspect the actual current implementation in:

```text
packages/nutrition
packages/ingredients
packages/agent
packages/db
apps/api
```

Specifically identify the real current public contracts for:

```text
nutrition input
nutrition output
nutrition reference
ingredient resolution
unit normalization
partial coverage
error behavior
```

Do NOT assume the conceptual shapes in this task are more authoritative than the code.

Reuse the existing public API wherever possible.

Do NOT create a second competing nutrition contract in `apps/api`.

---

# 2. Preserve Package Ownership

The ownership boundaries should remain:

```text
@flemme/ingredients
    owns canonical ingredient identity/resolution

@flemme/nutrition
    owns nutrition references
    owns deterministic nutrition calculation
    owns nutrition-specific normalization behavior

apps/api
    owns HTTP orchestration
    owns Cooking Session lookup
    maps persisted plan data into nutrition package input
```

Do NOT move ingredient identity rules into the API.

Do NOT put nutrition math inside route handlers.

Do NOT make the Agent package calculate nutrition.

---

# 3. Source of Truth

Nutrition for a Cooking Session must be derived from the persisted historical session.

Use:

```text
cookingSession.cookingPlan
```

as the primary recipe snapshot.

Do NOT regenerate Pre-Cooking.

Do NOT query current inventory and replace historical ingredient quantities.

Do NOT use current profile/preferences to calculate nutrition.

The Cooking Session represents what the user actually chose to cook.

---

# 4. Ingredient Identity

For each ingredient in the persisted cooking plan:

```text
resolve it through @flemme/ingredients
```

where deterministic resolution is possible.

Preferred conceptual pipeline:

```text
plan ingredient name
        ↓
resolveIngredient(...)
        ↓
canonical ingredient key
        ↓
nutrition reference lookup
```

If an ingredient cannot be resolved:

```text
do not invent a key
do not silently map it to a similar ingredient
```

Treat it according to the existing nutrition package's partial/unresolved behavior.

If the existing package already supports unresolved coverage reporting, reuse it.

---

# 5. Quantity and Unit Normalization

This is the most important design constraint in this task.

Current Pre-Cooking output may contain quantities such as:

```text
4 butir telur
2.5 sendok makan kecap
2 siung bawang merah
1.5 sendok makan minyak
garam secukupnya
```

The deterministic nutrition calculator may ultimately need gram-based quantities.

Do NOT introduce heuristic or fabricated conversions in the API.

Examples of unacceptable logic:

```text
1 egg is always guessed as 50 g
1 clove is always guessed as 3 g
1 tablespoon is guessed differently per request
"secukupnya" becomes an arbitrary gram value
```

Instead:

1. Inspect whether `@flemme/nutrition` already owns deterministic unit normalization.
2. If it already supports these units, reuse it.
3. If a conversion is not supported, preserve that limitation explicitly.
4. If the existing package supports partial nutrition coverage, return partial coverage.
5. If exact calculation is impossible, return a controlled result rather than fake precision.

Any new deterministic conversion table, if truly required, must belong in:

```text
packages/nutrition
```

not in `apps/api`.

Only add conversions when they are explicit, stable, testable domain references.

Do not add open-ended culinary guessing.

---

# 6. Nutrition API Endpoint

Add a read-only endpoint for an owned Cooking Session.

Preferred route:

```http
GET /cooking-sessions/{id}/nutrition
```

This endpoint should:

```text
authenticate development user
load owned Cooking Session
restore cookingPlan
run deterministic nutrition calculation
return schema-valid nutrition output
perform zero database mutation
```

Because calculation is based entirely on persisted server state, the client should not send ingredient data.

Do not create a generic:

```text
POST /nutrition/calculate
```

in this task unless an existing project convention strongly requires it.

The Cooking Session is the context boundary for MVP.

---

# 7. Lifecycle Rules for Nutrition Preview

Nutrition should be readable while the Cooking Session exists.

Recommended behavior:

```text
active       ✅ allowed
paused       ✅ allowed
completed    ✅ allowed
abandoned    ✅ allowed if the plan is still valid
```

Reason:

Nutrition describes the persisted cooking plan, not whether the user is currently allowed to continue cooking.

Do not couple nutrition preview to Active Cooking lifecycle restrictions.

If the existing domain has a stronger rule, document why before changing this recommendation.

---

# 8. Nutrition Result Semantics

Reuse the actual existing `@flemme/nutrition` output contract.

The result should make coverage explicit.

Conceptually it may contain information such as:

```text
estimated
servings
status
total
perServing
coverage / unresolved ingredients / missing references
```

but use the real package schema.

Important distinction:

```text
complete nutrition coverage
        ≠
partial nutrition coverage
        ≠
nutrition unavailable
```

Do not collapse all three into zero values.

Never use:

```json
{
  "caloriesKcal": 0,
  "proteinG": 0,
  "carbsG": 0,
  "fatG": 0
}
```

as a placeholder for unknown nutrition.

Unknown must remain unknown.

---

# 9. Completion Integration

Update the existing completion persistence path so trusted server-side nutrition can be stored as:

```text
nutritionSnapshot
```

when the session is completed.

Preferred design:

```text
POST /cooking-sessions/{id}/complete
        ↓
validate completionSnapshot
        ↓
calculate nutrition server-side
        ↓
persist completionSnapshot
        ↓
persist nutritionSnapshot if calculation produced a valid result
        ↓
mark session completed
```

Important:

```text
client must not be the source of truth for nutritionSnapshot
```

Audit the current `/complete` request schema.

If it currently accepts:

```text
nutritionSnapshot
```

remove/deprecate that client responsibility in the smallest safe way.

Prefer:

```json
{
  "completionSnapshot": {
    "...": "..."
  }
}
```

with nutrition derived internally.

If removing the field would create a large compatibility problem, preserve backward compatibility temporarily but ignore/reject client-provided nutrition rather than trusting it.

Document whichever migration strategy is chosen.

---

# 10. Shared Nutrition Service

Create one API-level orchestration service that can be reused by:

```text
GET /cooking-sessions/{id}/nutrition
```

and:

```text
POST /cooking-sessions/{id}/complete
```

Conceptually:

```ts
calculateCookingSessionNutrition(...)
```

Responsibilities:

```text
load/accept restored plan
resolve ingredients
normalize supported quantities
load nutrition references
invoke @flemme/nutrition
return validated result
```

Do not duplicate nutrition mapping logic between the preview endpoint and completion service.

Keep route handlers thin.

---

# 11. Completion Must Remain Atomic

If nutrition is persisted during completion, preserve transactional integrity.

The intended completed state is:

```text
completionSnapshot persisted
nutritionSnapshot persisted when available
phase = completion
status = completed
completedAt set
```

Avoid this bad state:

```text
session marked completed
but nutrition persistence failed halfway
```

Use the existing transaction boundary if one exists.

If current completion already runs in a transaction, integrate nutrition before/inside the same completion unit of work where appropriate.

Do not introduce a complex new transaction framework.

---

# 12. Partial Nutrition Must Not Block Completion

Nutrition coverage may be incomplete because:

```text
ingredient unresolved
reference missing
unit cannot be normalized
quantity unknown
```

A valid Cooking Session completion should NOT fail just because nutrition coverage is partial.

Preferred behavior:

```text
completion lifecycle succeeds
nutritionSnapshot stores the valid partial result
```

If the nutrition package's actual contract represents unavailable output differently, follow that contract.

Only fail completion when there is a genuine internal corruption/error, not ordinary missing nutrition coverage.

---

# 13. No Inventory Consumption Yet

Do NOT decrement inventory in this task.

Even though nutrition uses the cooking plan ingredients:

```text
nutrition calculation
        ≠
inventory consumption
```

Inventory consumption/business rules should be designed separately.

---

# 14. No LLM Nutrition

Add explicit tests/architecture assertions so Nutrition Integration does not call:

```text
Recommendation Agent
Pre-Cooking Agent
Active Cooking Agent
Completion Agent
```

The nutrition path must be deterministic and offline apart from database access.

---

# 15. Integration Tests

Use real PostgreSQL integration tests consistent with the existing API suite.

Cover at least:

## Scenario A — Nutrition Preview

Given an owned Cooking Session with supported nutrition inputs:

```http
GET /cooking-sessions/{id}/nutrition
```

Expected:

```text
HTTP 200
schema-valid nutrition output
correct servings
deterministic totals/per-serving values
database unchanged
```

---

## Scenario B — Determinism

Call nutrition preview twice for the same unchanged session.

Expected:

```text
same normalized inputs
same nutrition result
```

No LLM/provider call occurs.

---

## Scenario C — Partial Coverage

Use a plan containing at least one ingredient/reference/unit that cannot be fully resolved.

Expected:

```text
HTTP 200 if this is normal domain behavior
partial/unresolved status represented explicitly
known ingredients still contribute where supported
unknown values are not replaced with zero placeholders
```

Follow the actual nutrition package contract.

---

## Scenario D — Unresolved Ingredient

Verify an unresolved ingredient:

```text
does not get silently mapped
does not crash the whole API if partial coverage is supported
```

---

## Scenario E — Unsupported Unit / Unknown Quantity

Examples:

```text
secukupnya
unsupported household measure
missing quantity
```

Verify:

```text
no fabricated grams
coverage reflects the limitation
```

---

## Scenario F — Ownership

Wrong user must not receive another user's nutrition data.

Use the existing ownership semantics.

---

## Scenario G — Completion Persistence

Use a completion-ready session.

Generate/prepare a valid `completionSnapshot`, then:

```http
POST /cooking-sessions/{id}/complete
```

Expected:

```text
completion succeeds
nutrition calculated server-side
nutritionSnapshot persisted
GET completed session restores it
```

---

## Scenario H — Partial Nutrition Does Not Block Completion

A completion-ready session with partial nutrition coverage should still complete.

Expected:

```text
status = completed
phase = completion
completionSnapshot persisted
partial nutritionSnapshot persisted if supported
```

---

## Scenario I — No Client Nutrition Trust

If the `/complete` request previously accepted `nutritionSnapshot`, test the new behavior.

A client must not be able to persist arbitrary nutrition numbers as trusted historical data.

---

# 16. Swagger / OpenAPI

Register:

```http
GET /cooking-sessions/{id}/nutrition
```

in Swagger/OpenAPI.

Description should clearly state:

```text
- Nutrition is derived from the persisted Cooking Session plan
- Calculation is deterministic
- No LLM is called
- Unsupported ingredients/units may produce partial coverage
- Endpoint does not mutate the session
```

Update the `/complete` Swagger contract/documentation if the client no longer provides `nutritionSnapshot`.

Update OpenAPI verification tests.

---

# 17. Swagger Cooking Flow Guide

Extend:

```text
docs/testing/swagger-cooking-flow.md
```

with Nutrition Integration.

Suggested flow:

```text
Pre-Cooking plan persisted
        ↓
GET /cooking-sessions/{id}/nutrition
        ↓
inspect deterministic nutrition result
        ↓
continue cooking
        ↓
Completion AI
        ↓
POST /complete
        ↓
server calculates nutrition again from persisted plan
        ↓
completionSnapshot + nutritionSnapshot persisted
        ↓
GET completed session
```

Explain why the server recalculates at completion rather than trusting a previous preview response:

```text
preview is informational
completion snapshot must be generated from trusted server state
```

---

# 18. Real Scenario Validation

Use the existing practical manual scenario if convenient:

```text
Telur Kecap Bawang
2 servings
```

But do not force a fake "complete" nutrition result if some units or references are unsupported.

The correct result may legitimately be:

```text
partial
```

That is acceptable and preferable to fabricated precision.

For manual validation, record:

```text
which ingredients resolved
which references were found
which quantities normalized
which ingredients were excluded/unresolved
final coverage status
```

Do not expose internal implementation details as public API fields unless they already belong to the contract.

---

# 19. Package-Level Tests

If normalization/reference changes are required in `packages/nutrition`, add focused pure tests there.

Examples:

```text
known canonical ingredient + supported amount
unsupported unit
missing quantity
partial coverage
per-serving math
reference lookup integrity
```

Keep deterministic calculations offline.

Do not make package tests depend on PostgreSQL or network access.

---

# 20. Error Mapping

Follow existing API conventions.

Expected categories:

```text
400
invalid path/request where applicable

401
invalid development user

403
ownership violation if existing convention

404
Cooking Session missing

500
corrupt persisted cooking plan
unexpected nutrition invariant failure
```

Normal missing nutrition coverage should not become:

```text
500
```

unless the underlying persisted data is actually corrupt.

No `502/503` should be needed for normal nutrition calculation because no external AI provider is involved.

---

# 21. Out of Scope

Do NOT implement:

```text
inventory consumption
shopping list deduction
nutrition goals
diet programs
medical recommendations
AI-estimated nutrition
Admin API
LLM usage tracking
credits
provider balance
billing
subscriptions
production auth
Redis
BullMQ
SSE
WebSocket
```

Do not redesign:

```text
Recommendation
Pre-Cooking
Active Cooking
Completion AI
Cooking Session lifecycle
```

unless a concrete integration blocker is discovered.

---

# 22. Definition of Done

Nutrition Integration v0.1 is complete when:

```text
GET /cooking-sessions/{id}/nutrition
```

can:

```text
1. authenticate user
2. load owned Cooking Session
3. restore persisted cookingPlan
4. resolve supported ingredients canonically
5. normalize only supported deterministic quantities
6. invoke @flemme/nutrition
7. return schema-valid nutrition output
8. represent incomplete coverage honestly
9. make zero database mutation
10. make zero LLM calls
```

And completion integration can:

```text
POST /cooking-sessions/{id}/complete
        ↓
calculate trusted nutrition server-side
        ↓
persist completionSnapshot
        ↓
persist valid nutritionSnapshot
        ↓
complete session atomically
```

The following must remain true:

```text
unknown nutrition
≠
zero nutrition

unsupported conversion
≠
guessed conversion

nutrition calculation
≠
LLM generation
```

---

# 23. Validation

Run at minimum:

```text
Nutrition package focused tests
Nutrition API integration tests
Completion integration tests
all API tests
full workspace tests
database lifecycle validation
workspace typecheck
API build
web build
scoped Biome
git diff --check
OpenAPI verification
```

If the project has package-level nutrition integrity checks, run them too.

---

# 24. Progress Tracker

Update:

```text
docs/progress-tracker.md
```

Only mark:

```text
Nutrition Integration v0.1
```

complete after all acceptance criteria pass.

Expected roadmap after this task:

```text
Nutrition Integration                       ← this task
        ↓
Profile / Household / Kitchen / Inventory APIs
        ↓
Favorites
        ↓
Auth v1
        ↓
MVP Backend Complete
```

Do not start those next modules in the same task.

---

# Expected Final Report

Return a concise report containing:

```text
files changed
existing nutrition contracts discovered
ingredient resolution strategy
quantity/unit normalization strategy
unsupported/partial coverage behavior
nutrition endpoint added
completion integration changes
client nutrition trust changes
proof of zero LLM usage
Swagger/OpenAPI updates
test results
manual scenario result
deferred limitations
```

Also show the final architecture:

```text
GET /cooking-sessions/{id}/nutrition
        ↓
load persisted plan
        ↓
canonical ingredient resolution
        ↓
deterministic normalization
        ↓
@flemme/nutrition
        ↓
nutrition result
        ↓
return only
```

and:

```text
POST /cooking-sessions/{id}/complete
        ↓
trusted server-side nutrition calculation
        ↓
persist completionSnapshot
        +
nutritionSnapshot
        ↓
completed session
```

Stop after Nutrition Integration v0.1 is implemented and validated.

Do not continue into Profile / Household / Kitchen / Inventory APIs in the same task.
