# Task — Flemme Nutrition Integration v0.1 — Resume & Final Cooking Engine Checkpoint

## Context

The prerequisite data foundation is now complete.

Completed foundation:

```text
Ingredient + Nutrition Production Data Foundation v0.1 ✅
```

Implemented:

```text
10 production canonical ingredients
10 curated USDA FoodData Central mappings
3 Foundation Foods
7 SR Legacy records

FDC provenance metadata preserved
100 g nutrition references
5 verified portion conversions
deterministic Indonesian/English unit aliases

nutrition result semantics:
- complete
- partial
- unavailable

runtime USDA network dependency:
none
```

Important verified behavior:

```text
fully unresolved recipe
→ unavailable
→ no fake calorie/macro totals
```

The existing Telur Kecap Bawang scenario currently evaluates as:

```text
unavailable
```

because its historical Pre-Cooking plan includes unsupported or ambiguous data such as:

```text
ambiguous egg size
unsupported qualified units
unresolved sweet soy sauce
generic cooking oil
missing salt quantity
```

This is valid behavior.

Do NOT modify the data foundation just to force that recipe to become `complete`.

---

# Goal

Resume and finish:

```text
Nutrition Integration v0.1
```

This is the final task for the current Cooking Engine checkpoint.

Target architecture:

```text
GET /cooking-sessions/{id}/nutrition
        ↓
load persisted cookingPlan
        ↓
production ingredient catalog
        ↓
curated USDA nutrition data
        ↓
deterministic normalization
        ↓
@flemme/nutrition
        ↓
complete | partial | unavailable
        ↓
return only
```

and:

```text
POST /cooking-sessions/{id}/complete
        ↓
validate completionSnapshot
        ↓
calculate trusted nutrition server-side
        ↓
persist completionSnapshot
        +
nutritionSnapshot
        ↓
complete session atomically
```

No LLM may participate in nutrition calculation.

---

# 1. Re-Audit the New Production Foundation

Before changing API behavior, inspect the actual finalized public exports from:

```text
packages/ingredients
packages/nutrition
```

Identify the real current APIs for:

```text
production ingredient catalog
production nutrition references
verified portion mappings
unit normalization
recipe calculation
complete result
partial result
unavailable result
coverage issues
```

Use those real contracts.

Do NOT recreate production mapping or nutrition logic inside `apps/api`.

---

# 2. Add a Shared API Nutrition Orchestration Service

Create one reusable API-level service responsible for Cooking Session nutrition orchestration.

Conceptual responsibility:

```text
persisted cookingPlan
        ↓
map Pre-Cooking ingredients
        ↓
resolve canonical ingredients
        ↓
normalize supported quantities
        ↓
use production nutrition references
        ↓
@flemme/nutrition
        ↓
NutritionResult
```

Recommended conceptual name:

```text
calculateCookingSessionNutrition(...)
```

Use project naming conventions.

This service should be shared by:

```text
GET /cooking-sessions/{id}/nutrition
POST /cooking-sessions/{id}/complete
```

Do not duplicate mapping/calculation logic.

---

# 3. Historical Session Is the Source of Truth

Nutrition must use:

```text
persisted cookingPlan
```

from the Cooking Session.

Do NOT:

```text
regenerate Pre-Cooking
reload current inventory quantities
replace old plan ingredients with current inventory
call Recommendation Agent
call Pre-Cooking Agent
call Active Cooking Agent
call Completion Agent
```

Nutrition describes the persisted recipe/session snapshot.

---

# 4. Add Nutrition Preview Endpoint

Implement:

```http
GET /cooking-sessions/{id}/nutrition
```

Requirements:

```text
development auth
owned Cooking Session
restore validated cookingPlan
calculate nutrition deterministically
return NutritionResult
zero database mutation
zero LLM calls
zero USDA runtime network calls
```

The client sends no ingredient payload.

---

# 5. Nutrition Preview Lifecycle

Nutrition describes the stored recipe plan, not an allowed cooking transition.

Allow preview for valid owned sessions regardless of normal cooking interaction lifecycle.

Preferred:

```text
active       ✅
paused       ✅
completed    ✅
abandoned    ✅
```

If existing project constraints require otherwise, document the concrete reason.

Do not reuse Active Cooking or Completion lifecycle guards unnecessarily.

---

# 6. Map Pre-Cooking Ingredients Conservatively

The current persisted Pre-Cooking ingredient shape may contain:

```text
name
quantity?
unit?
```

Map only what can be interpreted deterministically.

Examples:

```text
quantity missing
→ coverage issue

"secukupnya"
→ no numeric mass

recognized but unsupported unit
→ coverage issue

qualified/ambiguous unit
→ do not silently strip semantic meaning if that changes interpretation
```

Do not add heuristics in the API.

The API may normalize obvious syntax only through the owning package's production normalization API.

---

# 7. Use Production Catalog Only

Nutrition Integration must use the production data introduced in the previous milestone.

Do NOT use:

```text
test fixture catalogs
synthetic references
hard-coded API-only nutrient values
demo mappings
manual fake conversion tables
```

The runtime data path must be:

```text
@flemme/ingredients production catalog
        ↓
@flemme/nutrition production references
```

---

# 8. Respect Result Semantics

Return the actual nutrition union/result produced by `@flemme/nutrition`.

Must support:

```text
complete
partial
unavailable
```

Rules:

```text
complete
= trusted calculation covers all required ingredients

partial
= some trusted nutrition was calculated,
  but some ingredients/amounts could not be included

unavailable
= no meaningful trusted nutrition total can be calculated
```

Critical:

```text
unavailable
must NOT contain fake zero total/perServing nutrition
```

Do not reshape `unavailable` into a "successful zero nutrition" API response.

---

# 9. Telur Kecap Bawang Is an Acceptance Case

Use the existing manual Telur Kecap Bawang Cooking Session as a realistic test when convenient.

The expected result may still be:

```text
status = unavailable
```

That is correct if the stored historical plan remains unsupported.

The goal is to prove:

```text
API preserves truthful coverage semantics
```

not:

```text
every recipe produces numbers
```

---

# 10. Integrate Nutrition Into Completion Persistence

Update:

```http
POST /cooking-sessions/{id}/complete
```

The endpoint already:

```text
validates completion readiness
accepts completionSnapshot
persists completion
transitions session state
```

Now add trusted server-side nutrition calculation.

Preferred flow:

```text
validate request
        ↓
load/validate owned completion-ready session
        ↓
calculate nutrition from persisted cookingPlan
        ↓
persist:
- completionSnapshot
- nutritionSnapshot
- completed status
- completion phase
- completedAt
```

All within the existing completion transaction/unit of work.

---

# 11. Client Must Stop Owning nutritionSnapshot

Audit the current `/complete` request schema.

If it currently accepts:

```json
{
  "completionSnapshot": {},
  "nutritionSnapshot": {}
}
```

change the contract so the client is no longer the source of truth for nutrition.

Preferred final request:

```json
{
  "completionSnapshot": {
    "...": "..."
  }
}
```

Nutrition is calculated internally.

Do not trust arbitrary client-provided calories/macros.

If compatibility requires temporarily accepting the old field:

```text
ignore or reject it explicitly
```

but never persist it as authoritative nutrition.

Document the chosen behavior.

---

# 12. Persist `unavailable` Correctly

A completed Cooking Session may legitimately have:

```text
nutritionSnapshot.status = unavailable
```

if that is part of the production NutritionResult contract.

Do not block completion because nutrition is unavailable.

A valid cooking lifecycle must still complete.

Examples:

```text
completionSnapshot valid
nutrition unavailable
        ↓
session completion succeeds
```

Nutrition coverage is metadata, not a lifecycle prerequisite.

---

# 13. Partial Nutrition Also Must Not Block Completion

Similarly:

```text
status = partial
```

is a valid persisted nutrition snapshot.

Do not require complete nutrition coverage before completing a cooking session.

---

# 14. Atomic Completion

Preserve completion atomicity.

Avoid:

```text
session marked completed
        ↓
nutrition calculation/persistence fails
        ↓
half-finished historical state
```

Calculate the deterministic nutrition result before the final persistence mutation where practical.

Persist completion lifecycle + snapshots using the existing transaction.

Do not introduce a new complex transaction abstraction if the project already has one.

---

# 15. Snapshot Validation

When completed sessions are later restored via:

```http
GET /cooking-sessions/{id}
```

validate persisted `nutritionSnapshot` through the owning nutrition schema.

The restored session must support:

```text
complete
partial
unavailable
```

Do not retain an old parser that understands only complete/partial.

---

# 16. Backward Compatibility

Audit historical/dev sessions that may contain:

```text
nutritionSnapshot = null
```

They should remain valid.

Also preserve compatibility with existing partial snapshots if that was guaranteed by the new nutrition contract.

Do not require migration of old `null` snapshots unless technically necessary.

---

# 17. No Runtime USDA Network Access

Assert architecture and tests so:

```text
GET /nutrition
POST /complete
```

do NOT call FoodData Central.

Production runtime must use committed curated data only.

USDA network access belongs only to explicit development verification/curation tooling.

---

# 18. No LLM Usage

Nutrition paths must invoke none of:

```text
Recommendation Agent
Pre-Cooking Agent
Active Cooking Agent
Completion Agent
```

No model/provider credentials should be necessary to calculate nutrition.

---

# 19. Integration Tests — Preview

Add real PostgreSQL integration coverage.

## A. Owned session preview

```http
GET /cooking-sessions/{id}/nutrition
```

Verify:

```text
200
valid NutritionResult
database unchanged
```

## B. Determinism

Call twice against the same unchanged Cooking Session.

Expected:

```text
identical result
```

No network/LLM calls.

## C. Complete coverage

Create/use a fixture Cooking Session whose ingredients use production-supported:

```text
canonical ingredients
quantities
units/verified portions
```

Expected:

```text
status = complete
valid total
valid perServing
```

Do not use synthetic production data to achieve this.

Build the plan from actual supported production entries.

## D. Partial coverage

Use a mix of:

```text
supported ingredient
+
unsupported ingredient/unit/quantity
```

Expected:

```text
status = partial
known subset contributes
coverage issue preserved
```

## E. Unavailable coverage

Use a plan where no meaningful ingredient can be calculated.

Expected:

```text
status = unavailable
no fake totals
```

This is mandatory.

## F. Telur Kecap scenario

Verify the existing realistic plan returns the truthful current status.

If still unsupported:

```text
unavailable
```

is expected.

Do not "fix" the test by loosening production data rules.

---

# 20. Integration Tests — Completion

## G. Complete nutrition persisted

For a completion-ready Cooking Session with complete nutrition coverage:

```http
POST /cooking-sessions/{id}/complete
```

Expected:

```text
session completed
completionSnapshot persisted
nutritionSnapshot.status = complete
GET session restores same snapshot
```

## H. Partial nutrition persisted

Expected:

```text
completion succeeds
nutritionSnapshot.status = partial
```

## I. Unavailable nutrition persisted

Expected:

```text
completion succeeds
nutritionSnapshot.status = unavailable
no fake totals
```

This is mandatory.

## J. Client cannot forge nutrition

If request attempts to submit arbitrary nutrition data, verify chosen final behavior:

```text
field rejected
or
field ignored
```

It must not become persisted trusted nutrition.

## K. Ownership

Another user must not access nutrition preview or completion data for a session they do not own.

Reuse existing ownership semantics.

---

# 21. Error Behavior

Use existing API error conventions.

Expected categories:

```text
401
invalid/missing development auth

403
ownership violation if current convention

404
Cooking Session not found

500
corrupt persisted cookingPlan
broken production nutrition invariant
unexpected internal error
```

Normal nutrition coverage gaps are not 500 errors.

They are domain results:

```text
partial
unavailable
```

No normal `502` or `503` should be needed because nutrition has no provider dependency.

---

# 22. Swagger / OpenAPI

Register:

```http
GET /cooking-sessions/{id}/nutrition
```

Document clearly:

```text
Nutrition is calculated from the persisted Cooking Session plan.

No LLM is used.
No USDA network request is made.
The result may be complete, partial, or unavailable.
The endpoint does not mutate the Cooking Session.
```

Update `/complete` OpenAPI request schema so client-owned nutrition is removed/handled according to the implemented compatibility strategy.

Update OpenAPI route/schema tests.

---

# 23. Swagger Manual Cooking Guide

Update:

```text
docs/testing/swagger-cooking-flow.md
```

Add the final nutrition-aware flow:

```text
Recommendation
        ↓
Pre-Cooking
        ↓
Create Cooking Session
        ↓
GET /nutrition (optional preview)
        ↓
Active Cooking
        ↓
Completion AI
        ↓
POST /complete
        ↓
server calculates nutrition
        ↓
completion + nutrition persisted
        ↓
GET completed session
```

Explicitly explain:

```text
GET /nutrition
= preview/read-only

POST /complete
= recalculates from trusted persisted server state
```

The completion endpoint must not trust a previous preview response from the client.

---

# 24. Manual Acceptance

Perform a real local API validation after automated tests.

At minimum verify:

```text
1. GET nutrition on a valid Cooking Session
2. response status is truthful
3. session remains unchanged
4. complete a completion-ready session
5. nutritionSnapshot is generated server-side
6. restore completed session
7. persisted nutritionSnapshot validates
```

The realistic Telur Kecap result may be `unavailable`.

Also use a controlled production-supported plan to prove `complete` or `partial` if available.

No external AI provider is required for nutrition-specific smoke tests.

---

# 25. No Inventory Consumption

Do NOT mutate inventory.

Nutrition calculation and inventory consumption are separate concerns.

---

# 26. No Data Foundation Expansion Unless Blocked

Do NOT broaden the curated USDA dataset during this task merely to increase coverage.

Only make a data-foundation change if a concrete implementation bug/invariant prevents the already-supported production data from being used correctly.

Any new USDA ingredient mapping should otherwise be deferred to future data curation.

---

# 27. Out of Scope

Do NOT implement:

```text
new USDA bulk imports
TKPI integration
inventory consumption
shopping list deduction
diet programs
medical nutrition advice
nutrition goals
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
production ingredient identity
USDA curation policy
```

unless a concrete blocker is found.

---

# 28. Documentation

Update:

```text
docs/architecture.md
docs/progress-tracker.md
docs/testing/swagger-cooking-flow.md
```

and any nutrition package documentation required by actual contract changes.

When this task passes, change:

```text
Nutrition Integration v0.1
⏸ PAUSED
```

to:

```text
Nutrition Integration v0.1
✅ COMPLETE
```

---

# 29. Final Cooking Engine Checkpoint

If this task succeeds, document the milestone:

```text
Flemme Cooking Engine v0.1 ✅
```

Meaning:

```text
Recommendation AI              ✅
Pre-Cooking AI                 ✅
Cooking Session lifecycle      ✅
Active Cooking AI              ✅
Completion AI                  ✅
Ingredient Production Data     ✅
Nutrition Production Data      ✅
Nutrition Integration          ✅
Swagger end-to-end flow        ✅
```

Do not interpret this as the entire Flemme backend being complete.

Still deferred after this checkpoint:

```text
Profile API
Household API
Kitchen / Equipment API
Inventory API
Favorites API
Auth v1
Admin / usage / credits
```

---

# 30. Validation

Run at minimum:

```text
@flemme/ingredients tests
@flemme/nutrition tests
Nutrition API focused tests
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

No automated test should require:

```text
USDA network access
LLM provider access
```

---

# Definition of Done

Nutrition Integration v0.1 is complete when:

```text
[ ] GET /cooking-sessions/{id}/nutrition exists
[ ] It uses persisted cookingPlan as source of truth
[ ] It uses production ingredient/nutrition data
[ ] It performs zero LLM calls
[ ] It performs zero USDA runtime network calls
[ ] It makes zero database mutation
[ ] It can return complete
[ ] It can return partial
[ ] It can return unavailable
[ ] unavailable contains no fake totals
[ ] /complete calculates nutrition server-side
[ ] client cannot forge nutritionSnapshot
[ ] complete nutrition can persist
[ ] partial nutrition can persist
[ ] unavailable nutrition can persist
[ ] nutrition coverage never blocks valid cooking completion
[ ] completed session restores and validates nutritionSnapshot
[ ] Swagger/OpenAPI is updated
[ ] manual cooking guide is updated
[ ] automated validation passes
[ ] Nutrition Integration is marked complete
[ ] Flemme Cooking Engine v0.1 checkpoint is documented
```

---

# Expected Final Report

Return a concise implementation report containing:

```text
files changed

nutrition endpoint:
- route
- lifecycle behavior
- source of truth

production data integration:
- ingredient catalog usage
- nutrition reference usage
- portion normalization usage

result behavior:
- complete
- partial
- unavailable

completion integration:
- server-side calculation
- transaction behavior
- nutritionSnapshot persistence
- client nutrition field migration behavior

proof:
- zero LLM calls
- zero USDA runtime network calls
- zero mutation on preview

Telur Kecap manual result

complete/partial/unavailable test scenarios

Swagger/OpenAPI updates

test/typecheck/build/check results

remaining known nutrition coverage limitations
```

Finally state explicitly whether:

```text
Flemme Cooking Engine v0.1
```

can now be considered:

```text
COMPLETE
```

Stop after this checkpoint.

Do not continue into Profile / Household / Kitchen / Inventory APIs in the same task.
