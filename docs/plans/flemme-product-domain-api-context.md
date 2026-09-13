# Flemme — Product Domain API Context

## Purpose

This document is the handoff context for the next Flemme backend topic after the Cooking Engine work.

The new topic is focused on the user-owned product/domain APIs:

```text
Profile
→ Household
→ Kitchen / Equipment
→ Inventory
→ Favorites
→ Auth v1
```

The goal is to make the already-built Cooking Engine usable by a real client without relying on seed data or large request-level context overrides.

Do not restart the Cooking Engine architecture discussion unless a real integration blocker is discovered.

---

# 1. Project Overview

Flemme is an AI Cooking Assistant.

Core product promise:

```text
available ingredients
+ kitchen context
+ user preferences
+ household context
        ↓
recipe recommendation
        ↓
pre-cooking plan
        ↓
active cooking guidance
        ↓
completion
        ↓
nutrition
```

Primary UX principle:

```text
Use persistent context before asking the user again.
```

If the application already knows:

```text
household
kitchen equipment
inventory
food preferences
cooking preferences
```

the AI should consume that context rather than repeatedly asking for it.

Request-level cooking context may still override persistent context for a specific session.

---

# 2. Current Technical Stack

Monorepo:

```text
Bun
Turborepo
TypeScript
```

Backend:

```text
Hono
Zod
@hono/zod-openapi
Swagger / OpenAPI 3.1
```

Database:

```text
PostgreSQL
Drizzle ORM
```

Local infrastructure:

```text
Colima
docker-compose
postgres:16-alpine
```

Agent / AI:

```text
@flemme/agent
OpenAI-compatible provider abstraction
```

Ingredient / Nutrition:

```text
@flemme/ingredients
@flemme/nutrition
```

General implementation preference:

```text
minimal
practical
maintainable
no unnecessary abstractions
no premature infrastructure
```

---

# 3. Current Backend Checkpoint

The Cooking Engine implementation is now built through Nutrition Integration.

Implemented cooking capabilities:

```text
Recommendation AI                  ✅
Pre-Cooking AI                     ✅
Cooking Session lifecycle          ✅
Cooking Session restore            ✅
Progress persistence               ✅
Lifecycle guards                   ✅
Active Cooking AI                  ✅
Completion AI                      ✅
Completion persistence             ✅
Canonical Ingredient Foundation    ✅
Production USDA Nutrition Data     ✅
Nutrition Integration              ✅ implementation
Swagger cooking flow               ✅
```

The final Cooking Engine acceptance gate previously required PostgreSQL integration tests and manual Swagger validation after starting PostgreSQL.

Do not claim the final runtime checkpoint is fully accepted unless those final checks have actually been run and confirmed.

The intended milestone after those checks is:

```text
Flemme Cooking Engine v0.1 ✅ COMPLETE
```

---

# 4. Existing HTTP Surface

Core infrastructure:

```text
GET /health
GET /openapi.json
GET /docs
```

Cooking:

```text
POST /cooking/recommendations
POST /cooking/pre-cooking
```

Cooking Session:

```text
POST  /cooking-sessions
GET   /cooking-sessions/{id}
PATCH /cooking-sessions/{id}/progress

POST  /cooking-sessions/{id}/active-cooking
POST  /cooking-sessions/{id}/completion
POST  /cooking-sessions/{id}/complete

GET   /cooking-sessions/{id}/nutrition
```

---

# 5. Core Cooking Architecture That Must Remain Stable

The project intentionally separates AI generation from lifecycle persistence.

## Recommendation

```text
request/session intent
+
persistent user cooking context
        ↓
Recommendation Agent
        ↓
recipe options
```

Recommendation does NOT:

```text
persist a Cooking Session
select a recipe
run Pre-Cooking
mutate inventory
```

## Pre-Cooking

```text
selected recommendation
+
cooking context
        ↓
Pre-Cooking Agent
        ↓
immutable cooking plan
```

Pre-Cooking does NOT:

```text
create a Cooking Session
mutate inventory
```

## Active Cooking

```text
persisted cooking plan
+
persisted progress
+
one user message
        ↓
Active Cooking Agent
        ↓
reply + proposed actions
```

Active Cooking AI does NOT silently mutate state.

Explicit state mutation still uses:

```text
PATCH /cooking-sessions/{id}/progress
```

## Completion AI

```text
completion-ready persisted session
        ↓
in-memory completed-state projection
        ↓
Completion Agent
        ↓
reply + summary + notes
```

Completion AI does NOT mark the session completed.

Persistence happens only through:

```text
POST /cooking-sessions/{id}/complete
```

## Nutrition

Nutrition is deterministic.

```text
persisted cookingPlan
        ↓
production canonical ingredient catalog
        ↓
curated USDA nutrition references
        ↓
verified deterministic conversions
        ↓
@flemme/nutrition
```

No LLM calculates calories or macros.

Nutrition result semantics:

```text
complete
partial
unavailable
```

Important:

```text
unknown nutrition
≠
zero nutrition
```

`unavailable` must not contain fake zero totals.

---

# 6. Nutrition Production Data Foundation

Production ingredient/nutrition data now exists.

Current foundation includes:

```text
10 production canonical ingredients
10 curated USDA FoodData Central mappings
3 Foundation Foods
7 SR Legacy records
5 verified portion conversions
Indonesian + English unit aliases
```

Production references preserve provenance including:

```text
FDC ID
description
USDA data type
publication/release metadata
nutrient IDs
verification date
source URL
```

Runtime calculation is offline.

Do NOT call USDA during normal API requests.

USDA is a curation/verification source only.

Current practical limitation:

```text
Telur Kecap Bawang
→ may legitimately be unavailable
```

because its historical generated plan includes ambiguous or unsupported quantities/units/ingredients.

Do not loosen the data-quality rules just to produce numbers.

---

# 7. Existing Persistence Domains

Schema v0.1 already includes conceptual domains for:

```text
auth
user profile
household
kitchen
kitchen equipment
inventory
inventory items
cooking sessions
favorites
central relations
```

The next phase should expose and stabilize APIs around these existing domains.

Do not redesign tables first.

Inspect the actual current Drizzle schema and reuse it.

Only propose a migration when a concrete product/API requirement cannot be represented safely by the current schema.

---

# 8. Persistent Cooking Context

The Recommendation API already has an internal cooking-context service.

It loads persistent context from PostgreSQL.

Current persistent context conceptually includes:

```text
Profile
├── foodPreferences[]
└── cookingPreferences[]

Household
├── adults
├── children
└── toddlers

Kitchen
└── equipment[]

Inventory
└── items[]
    ├── canonical ingredient key
    ├── quantity
    ├── unit
    └── condition
```

The exact current schema remains the source of truth.

Do not invent additional fields unless required by product behavior.

---

# 9. Context Override Behavior

Current Recommendation behavior:

```text
persistent context
        +
request-level override
        ↓
effective cooking context
```

Important rule:

```text
A supplied field replaces its persistent counterpart as a whole.
```

Arrays replace.

They do not merge implicitly.

Example:

```text
persistent equipment:
[kompor, wajan, blender]

request equipment override:
[wajan]

effective equipment:
[wajan]
```

not:

```text
[kompor, wajan, blender]
```

Missing required persistent domains with no request override may currently produce controlled `422` context errors.

The new CRUD APIs should make it possible for the frontend/mobile app to establish this persistent context properly.

---

# 10. Canonical Ingredient Identity

`@flemme/ingredients` owns ingredient identity.

Database-owned inventory references should use the canonical:

```text
ingredientKey
```

not a competing UUID/name-only ingredient identity.

Canonical keys are language-independent and kebab-case.

Conceptual relationship:

```text
Inventory Item
        ↓
ingredientKey
        ↓
@flemme/ingredients
        ↓
canonical ingredient
```

Do not create a second ingredient master table just for CRUD convenience unless a later requirement truly demands one.

Production catalog and aliases remain owned by the package.

---

# 11. Next Phase Scope

The agreed order is:

```text
1. Profile API
2. Household API
3. Kitchen / Equipment API
4. Inventory API
5. Favorites API
6. Auth v1
```

Keep this order unless a real dependency requires a small adjustment.

---

# 12. Profile API — Intended Responsibility

Profile owns persistent user cooking preferences.

Known current context consumed by Recommendation:

```text
foodPreferences[]
cookingPreferences[]
```

The Profile API should allow the authenticated/current user to:

```text
read profile
create/update profile state as supported by schema
update food preferences
update cooking preferences
```

Do not add unrelated social/profile fields unless they already exist in schema or are required by the product.

Profile is cooking-context data first.

---

# 13. Household API — Intended Responsibility

Household affects recipe recommendation and serving context.

Known current values:

```text
adults
children
toddlers
```

The Household API should make these persistent values manageable by the current user.

Important product history:

Flemme personalization may eventually target:

```text
adult
child
toddler
specific household members
```

but v0.1 currently uses aggregate counts.

Do not prematurely introduce a household-member/person table unless the existing schema already has it or a concrete requirement demands it.

---

# 14. Kitchen / Equipment API — Intended Responsibility

Kitchen represents the user's available cooking environment.

Current Recommendation context consumes:

```text
equipment[]
```

Examples:

```text
kompor
wajan
spatula
pisau
talenan
```

The API should allow the user to manage their persisted equipment.

Use existing Kitchen / Kitchen Equipment schema and cardinality.

Do not create an over-engineered global equipment CMS in v0.1.

The immediate product goal is:

```text
"What equipment does this user actually have?"
```

---

# 15. Inventory API — Intended Responsibility

Inventory is a key source of truth for recipe recommendation.

Inventory items conceptually contain:

```text
ingredientKey
quantity
unit
condition
```

Important rules:

```text
ingredient identity must resolve through @flemme/ingredients
do not invent canonical keys
do not silently map unknown foods
```

The Inventory API should eventually support the client in maintaining real available ingredients.

Do NOT implement automatic recipe-based inventory consumption yet unless separately designed.

Current Nutrition Integration also does NOT mutate inventory.

Inventory mutation based on completed cooking remains a separate future business rule.

---

# 16. Inventory and Production Ingredient Catalog

The production ingredient catalog is intentionally curated and currently limited.

Therefore Inventory API must handle this honestly.

A user-entered ingredient may be:

```text
resolved
or
unresolved / unsupported
```

Do not silently convert an unknown ingredient into the nearest known production ingredient.

Before implementing Inventory create/update behavior, inspect the current DB constraint and ingredient resolver behavior.

Prefer deterministic validation.

---

# 17. Favorites API — Locked Product Direction

Favorites remain separate from generic recipe storage.

Current design direction:

```text
Favorite
should reference an owned completed Cooking Session
with a valid selected-recipe snapshot.
```

Reason:

```text
the selected recipe already exists historically
inside the completed Cooking Session
```

Do not create a duplicate normalized Recipe table only to support Favorites unless a later requirement proves it necessary.

Conceptual behavior:

```text
completed owned Cooking Session
        ↓
favorite
        ↓
saved reference to that historical cooked recipe/session
```

Favorites should not point to another user's session.

Ownership must be enforced.

---

# 18. History

Completed Cooking Sessions are already the current cooking history source.

Do NOT create a duplicate history table.

History conceptually comes from:

```text
Cooking Session
where status = completed
```

Future history endpoints may query Cooking Sessions.

Favorites are an overlay on that history, not a replacement for it.

---

# 19. Auth — Current State

Current API auth is development-only.

Protected routes use:

```http
x-flemme-user-id: <real-user-uuid>
```

Behavior:

```text
validate UUID
check real users table
store currentUserId
```

The API is development-only guarded and is not considered production authentication.

Do not confuse this with Auth v1.

---

# 20. Auth v1 — Deferred Until After Domain APIs

Auth v1 is intentionally last in this phase.

Reason:

```text
the product/domain ownership model can continue to use currentUserId
while CRUD/domain APIs are built
```

Then Auth v1 can replace the development identity transport without forcing every domain service to be redesigned.

Desired principle:

```text
domain service knows currentUserId

not:

domain service knows x-flemme-user-id
```

The header is an HTTP development mechanism, not a domain concept.

Do not hardwire development auth semantics into new services.

---

# 21. API Architecture Convention

Existing preferred flow:

```text
HTTP Request
        ↓
Hono route
        ↓
Zod / OpenAPI validation
        ↓
current user identity
        ↓
domain service
        ↓
@flemme/db / package owner
        ↓
PostgreSQL
        ↓
response
```

Keep route handlers thin.

Business rules belong in services/domain functions.

Do not put significant SQL/business logic directly into Swagger route declarations.

---

# 22. Ownership and Security Pattern

All user-owned domains must enforce ownership server-side.

Relevant domains:

```text
profile
household
kitchen
equipment
inventory
favorites
cooking sessions
```

Do not rely on the client to send a trusted `userId`.

Prefer:

```text
currentUserId from auth context
```

and ownership-aware database predicates.

Follow the existing Cooking Session ownership behavior.

---

# 23. Error Convention

Current API uses a structured error shape conceptually like:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

Existing status conventions include:

```text
400 validation
401 unauthenticated / invalid development user
403 ownership/forbidden where applicable
404 missing resource
409 invalid lifecycle/conflict
422 domain/context validation
500 corrupt persisted/internal state
502 AI/provider output/invocation failure
503 provider configuration unavailable
```

CRUD APIs should reuse the same system.

Do not introduce a second error format.

---

# 24. Swagger / OpenAPI Rule

Swagger/OpenAPI is part of Definition of Done for each new API feature.

For every new domain endpoint:

```text
runtime schema
and
OpenAPI schema
```

should originate from the same Zod contract where possible.

Swagger should remain executable as a manual product-flow checklist.

Detailed workflows may live in docs.

---

# 25. Test Strategy

Existing project strategy:

```text
real PostgreSQL integration tests for persistence behavior
mock external AI invocation only where needed
pure package tests remain offline
```

For Profile / Household / Kitchen / Inventory / Favorites:

```text
no external AI mock should normally be needed
```

because they are deterministic domain APIs.

Tests should focus on:

```text
ownership
validation
create/update/read behavior
database persistence
context-service compatibility
OpenAPI registration
```

---

# 26. Local Development Commands

PostgreSQL:

```bash
docker-compose up -d
docker-compose ps
```

Database:

```bash
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/db db:studio
bun run --filter @flemme/db db:validate-lifecycle
```

API:

```bash
bun run --filter @flemme/api dev
bun run --filter @flemme/api test
```

Swagger:

```text
http://localhost:3000/docs
```

OpenAPI:

```text
http://localhost:3000/openapi.json
```

Important:

```text
use docker-compose
not docker compose
```

for the user's current local environment.

---

# 27. General Definition of Done for New Domain APIs

Each module should normally include:

```text
Zod request/response contracts
service layer
Hono route
ownership enforcement
real PostgreSQL integration tests
Swagger/OpenAPI registration
manual Swagger usability
progress tracker update
typecheck
build
Biome
git diff --check
```

Do not increase scope merely to add abstractions.

---

# 28. Deferred / Out of Scope for This Product-Domain Phase

Unless explicitly selected as the current task, keep these deferred:

```text
Admin API
LLM usage tracking
provider balance
credits
billing
subscriptions
Redis
BullMQ
SSE
WebSocket
generic AI chat history
inventory auto-consumption
shopping list deduction
diet-program engine
production deployment work
```

Production Auth is deferred until `Auth v1` at the end of the current sequence.

---

# 29. Recommended First Task in the New Topic

Start with:

```text
Profile API v0.1
```

Before implementing:

```text
inspect the actual current Drizzle profile schema
inspect existing cooking-context-service expectations
inspect seed data
inspect relations
```

Then build the smallest API that makes Profile persistent cooking preferences manageable by the current user.

Do not implement Household in the same task.

Expected sequence after Profile:

```text
Profile API v0.1
        ↓
Household API v0.1
        ↓
Kitchen / Equipment API v0.1
        ↓
Inventory API v0.1
        ↓
Favorites API v0.1
        ↓
Auth v1
```

---

# 30. Handoff Checkpoint

New-topic starting point:

```text
COOKING ENGINE
Recommendation                         ✅
Pre-Cooking                            ✅
Cooking Session lifecycle              ✅
Active Cooking                         ✅
Completion                             ✅
Ingredient/Nutrition foundation        ✅
Nutrition Integration                  ✅ implementation

PRODUCT DOMAIN APIs
Profile                                ← NEXT
Household                              ⏳
Kitchen / Equipment                    ⏳
Inventory                              ⏳
Favorites                              ⏳
Auth v1                                ⏳
```

Primary objective of this new topic:

> Replace seed/manual cooking-context setup with user-manageable persistent product data, while preserving the Cooking Engine and its current contracts.
