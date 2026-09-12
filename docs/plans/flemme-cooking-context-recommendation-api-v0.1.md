# Task — Flemme Cooking Context + Recommendation API v0.1

We are continuing Flemme API development incrementally.

Current backend foundation is already complete and validated:

- PostgreSQL + Drizzle Schema v0.1
- Local PostgreSQL through Docker Compose
- Hono API foundation
- Zod runtime validation
- OpenAPI 3.1
- Swagger UI
- Development authentication through `x-flemme-user-id`
- Cooking Session persistence API
- Real PostgreSQL integration tests

Existing API routes:

```text
GET    /health
POST   /cooking-sessions
GET    /cooking-sessions/:id
PATCH  /cooking-sessions/:id/progress
POST   /cooking-sessions/:id/complete
```

Swagger is available at:

```text
GET /docs
```

OpenAPI JSON is available at:

```text
GET /openapi.json
```

The next increment is:

```text
Cooking Context Aggregation
+
Recommendation API v0.1
```

Do NOT implement Pre-Cooking yet.

Do NOT implement Profile, Household, Kitchen, or Inventory CRUD APIs yet.

This task should establish the first API endpoint that actually invokes the existing Flemme Cooking Agent.

---

# Goal

Implement:

```http
POST /cooking/recommendations
```

The endpoint should:

```text
Authenticated Flemme User
        ↓
Load persistent cooking context
        ↓
Merge request/session context
        ↓
Normalize / validate ingredients
        ↓
Build Agent recommendation input
        ↓
Run existing Recommendation Agent
        ↓
Validate Recommendation output
        ↓
Return typed HTTP response
```

This must use the existing contracts and agent runtime.

Do not redesign the Cooking Agent.

---

# Important Architecture Principle

The API is an orchestration layer.

It should connect:

```text
HTTP
→ User Context
→ Database
→ Domain Packages
→ Agent
→ Validated Response
```

It should NOT duplicate the logic already owned by:

```text
packages/agent
packages/ingredients
packages/nutrition
packages/db
```

Maintain clear ownership boundaries.

---

# Step 1 — Audit Existing Contracts

Before implementation, inspect the current source code.

At minimum inspect:

```text
packages/agent
packages/ingredients
packages/nutrition
packages/db
apps/api
```

Specifically identify the actual existing contracts for:

```text
Cooking Recommendation input
Cooking Recommendation output
Cooking context
Ingredient input
Kitchen context
Taste/preferences
Household context
Recommendation runtime
Agent provider
```

Do not invent new request or response contracts until the existing ones have been inspected.

The current Agent contracts are the source of truth.

---

# Existing Product Rules

Preserve the existing Flemme Cooking Agent behavior.

Important existing principles include:

```text
Use available context before asking the user again.

Session/request context overrides persistent profile defaults.

Do not invent inventory.

Do not invent equipment.

Do not invent user preferences.

Do not assume pantry staples exist unless they are actually available.

Household context should influence recommendations.

Multiple cuisine preferences are ranking signals, not rigid quotas.

Recommendation is a separate phase from Pre-Cooking.

Do not silently mutate application state.
```

Do not weaken these rules in the API layer.

---

# Cooking Context Aggregation

Create a dedicated, understandable context-building responsibility.

Prefer a domain-specific module such as:

```text
apps/api/src/cooking/
  cooking-context-service.ts
```

or another kebab-case structure that fits the current API architecture.

Do not place context aggregation directly inside the HTTP route.

Conceptually:

```text
User ID
   ↓
Cooking Context Service
   ├── User Profile
   ├── Household
   ├── Household Members
   ├── Kitchen
   ├── Kitchen Equipment
   └── Inventory
           ↓
      Agent Context
```

Use the actual current database schema.

Do not redesign tables.

---

# Persistent Context vs Session Context

Flemme has two kinds of context.

## Persistent Context

Examples may include:

```text
profile defaults
household
household members
kitchen
equipment
inventory
persistent taste/preferences
```

Only use fields that actually exist in the current schema/contracts.

## Session / Request Context

A recommendation request may contain information that is specific to the current cooking attempt.

Examples might include:

```text
ingredients supplied for this cooking attempt
temporary taste preference
temporary cooking constraint
other existing Agent input fields
```

Use the actual Agent input contract.

Do not invent speculative fields such as budget, calories, cooking time, or diet constraints unless the existing contract already supports them.

---

# Merge Priority

When persistent and request context overlap, use this rule:

```text
request/session context
        ↓ overrides
persistent user context
        ↓ otherwise
existing defaults
```

Never silently create missing context.

Example principle:

```text
Persistent preference:
mild

Current cooking request:
spicy

Recommendation receives:
spicy
```

But if neither exists:

```text
do not invent spicy/mild
```

The merge behavior should be deterministic and easy to test.

---

# Ingredients

Canonical ingredient identity belongs to:

```text
@flemme/ingredients
```

Domain-owned ingredient references use canonical:

```text
ingredient_key
```

Do NOT create another ingredient identity system in the API.

If the recommendation request accepts ingredient names or user-entered ingredient input, use the existing deterministic ingredient resolver where appropriate.

Do not manually maintain API-specific ingredient aliases.

If an ingredient cannot be resolved and the existing Agent contract permits unresolved/raw ingredients, preserve that behavior explicitly.

If the Agent contract requires canonical ingredients, return a controlled validation/domain error.

Follow the existing package behavior rather than inventing new semantics.

---

# Inventory

Persistent inventory must be read from PostgreSQL through:

```text
@flemme/db
```

Do not duplicate database access logic.

Do not mutate inventory during a recommendation request.

Recommendation is read/orchestration behavior.

This request must not:

```text
subtract inventory
add inventory
consume ingredients
create grocery records
```

Inventory mutation belongs to a separate explicit workflow.

---

# Household Context

Use existing household data to build the recommendation context.

Do not introduce new medical, allergy, dietary, or demographic fields in this task.

Use only what the current schema and Agent contracts already support.

If household context is absent, handle it according to the existing contract instead of fabricating household members.

---

# Kitchen Context

Load persistent kitchen/equipment data.

Recommendation must not suggest equipment as available if it is not present in the stored/request context.

Do not build equipment CRUD in this task.

This task only reads the current persisted context.

---

# Recommendation Route

Implement:

```http
POST /cooking/recommendations
```

Use the current development authentication middleware.

The route must require:

```http
x-flemme-user-id
```

exactly as the existing development API does.

Do not create a new authentication mechanism for this route.

---

# Request Contract

Do NOT define the final request structure from assumptions.

First inspect the actual Agent Recommendation input contract.

Then define the smallest HTTP request contract required to supply session-specific values that cannot be derived from persisted user context.

The API should NOT require the client to resend information already stored in:

```text
profile
household
kitchen
inventory
```

unless the value is intentionally overriding stored context for the current session.

Prefer:

```text
client sends current cooking intent/session overrides
API loads persistent context itself
```

instead of:

```text
client reconstructs full user profile on every request
```

---

# Response Contract

The response should represent the existing validated Cooking Recommendation output.

Reuse/export the current Agent recommendation schema.

Do not duplicate the Agent recommendation response shape inside `apps/api`.

Before returning the result:

```text
Agent Output
    ↓
CookingRecommendationSchema validation
    ↓
HTTP Response
```

Never return an unchecked AI response.

---

# Agent Invocation

Use the existing Flemme Agent runtime/provider implementation.

Do not create another OpenAI/Anvia client inside `apps/api`.

Dependency direction should remain conceptually:

```text
apps/api
    ↓
@flemme/agent
    ↓
provider
```

not:

```text
apps/api
    ↓
direct OpenAI SDK
```

The provider configuration should remain owned by the existing Agent package.

---

# Agent Environment

Inspect the existing provider configuration.

Use the current environment variables already required by `packages/agent`.

Do not:

```text
hardcode API keys
print API keys
return provider credentials in errors
include secrets in Swagger examples
```

If required configuration is missing, fail with a controlled configuration/runtime error.

Do not expose raw provider errors directly to the client.

---

# Recommendation Persistence

Do NOT automatically create a cooking session from this endpoint.

The current expected business flow is:

```text
Recommendation
    ↓
User chooses one recipe
    ↓
Pre-Cooking
    ↓
Cooking Session
```

Therefore:

```http
POST /cooking/recommendations
```

should primarily generate and return Recommendation results.

Do not silently persist a selected recipe because no selection has happened yet.

Do not create a cooking session automatically.

If the existing schema already has an explicit recommendation persistence requirement, report it before changing this behavior.

---

# No Pre-Cooking Yet

Do not implement:

```http
POST /cooking/pre-cooking
```

in this task.

The purpose of incremental development is to prove Recommendation independently first.

Once Recommendation API is stable and manually executable through Swagger, Pre-Cooking becomes the next increment.

---

# Error Handling

Use the existing API error convention.

Handle meaningful cases such as:

```text
authenticated user does not exist
missing required recommendation input
invalid ingredient input
invalid canonical ingredient reference
missing required Agent configuration
Agent generation failure
Agent output fails Zod validation
persistent cooking context cannot be loaded
```

Use appropriate HTTP status codes.

Do not leak:

```text
database internals
stack traces
AI provider credentials
raw provider responses containing internal metadata
```

Reuse the current `ApiError` infrastructure where appropriate.

Do not create a competing error system.

---

# OpenAPI + Swagger

Swagger/OpenAPI is part of the Definition of Done for every Flemme API feature.

Add the Recommendation endpoint to the existing OpenAPI registry/routing system.

Swagger must document:

```text
POST /cooking/recommendations
x-flemme-user-id
request schema
response schema
expected error responses
```

The OpenAPI schema must be generated from the same runtime Zod/Hono schemas.

Do not maintain a second manually duplicated documentation contract.

Use the existing:

```text
@hono/zod-openapi
@hono/swagger-ui
```

integration.

---

# Swagger Usability

The endpoint should be practically executable from:

```text
http://localhost:3000/docs
```

A developer should be able to:

```text
1. Enter a valid development user ID
2. Provide the minimum session/request input
3. Execute POST /cooking/recommendations
4. Receive real Recommendation output
```

Provide safe example values where useful.

Do not include secrets in examples.

---

# Swagger Business Flow Documentation

Create or extend a document for manual backend business-flow validation.

Preferred location:

```text
docs/testing/swagger-cooking-flow.md
```

If another existing documentation location is clearly more appropriate, use it instead.

For this increment, document:

```text
Prerequisites

1. PostgreSQL running
2. Migration applied
3. Development seed applied
4. API running
5. Agent provider environment configured

Recommendation Scenario

1. Open /docs
2. Execute POST /cooking/recommendations
3. Provide x-flemme-user-id
4. Provide the required request/session values
5. Verify successful recommendation output
```

Also document what should be observed in the response.

This document will grow incrementally as future endpoints are implemented.

Eventually it should represent:

```text
Recommendation
→ Pre-Cooking
→ Cooking Session
→ Active Cooking
→ Completion
→ History
→ Favorite
```

Do not document future endpoints as if they already exist.

Clearly mark future steps as pending.

---

# Testing Strategy

Add focused tests around the new responsibility.

At minimum cover:

```text
context aggregation
persistent context loading
session override precedence
canonical ingredient handling where applicable
successful recommendation request
missing/invalid development user
invalid request
Agent failure mapping
invalid Agent output handling
```

Do not require live external AI calls for normal automated test execution.

Mock or replace the Agent invocation at the appropriate boundary for deterministic API integration tests.

Do NOT mock:

```text
context merge logic
request validation
response validation
user ownership/auth lookup
```

when those behaviors can be tested normally.

Keep one clear boundary between deterministic tests and real provider execution.

---

# Real Manual Validation

In addition to automated tests, perform or prepare for one real manual recommendation through Swagger using the configured development Agent provider.

This real invocation should verify:

```text
DB Context
+
HTTP Request
+
Agent
+
Zod Output
+
Swagger
```

Do not make normal automated tests depend on external provider availability.

---

# Avoid Premature Abstractions

Do NOT introduce:

```text
generic agent orchestration framework
generic context engine
repository interfaces for every table
dependency injection framework
CQRS
event sourcing
message queues
Redis
BullMQ
workflow engine
```

Keep the implementation specific to the current Flemme cooking workflow.

Prefer:

```text
cooking-context-service
recommendation route
recommendation service
```

over generic infrastructure.

---

# File Naming

Continue Flemme kebab-case codebase naming.

Possible structure:

```text
apps/api/src/cooking/
  cooking-context-service.ts

apps/api/src/cooking-recommendation/
  cooking-recommendation-route.ts
  cooking-recommendation-schema.ts
  cooking-recommendation-service.ts
  cooking-recommendation.integration.test.ts
```

This is a direction, not a mandatory structure.

Preserve a better existing API organization if one already exists.

Do not create unnecessary nested folders.

---

# Out of Scope

Do NOT implement in this task:

```text
Pre-Cooking endpoint
Active Cooking Agent endpoint
Completion Agent endpoint

Profile CRUD API
Household CRUD API
Kitchen CRUD API
Inventory CRUD API
Favorite API

Image ingredient recognition
camera upload
OCR

Redis
BullMQ
WebSocket
SSE

production authentication
OAuth
email verification

billing
credits
subscription

deployment infrastructure
```

---

# Validation

Run the relevant existing project validation.

At minimum:

```text
Recommendation/API tests
full workspace tests
database lifecycle validation if relevant
workspace typecheck
workspace build
scoped Biome
git diff --check
```

Do not spend time fixing unrelated pre-existing formatting issues outside the touched scope.

Also verify:

```text
/openapi.json
```

contains the new Recommendation endpoint.

---

# Definition of Done

This increment is complete when the following business scenario works:

```text
Real development user
        ↓
Persistent Profile / Household / Kitchen / Inventory
        ↓
POST /cooking/recommendations
        ↓
Session-specific context merged
        ↓
Existing Flemme Recommendation Agent invoked
        ↓
Output validated through existing Agent schema
        ↓
Typed response returned
        ↓
Endpoint visible and executable in Swagger
```

The request must NOT:

```text
create a cooking session
run Pre-Cooking
mutate inventory
silently persist a selected recipe
```

---

# Expected Final Report

Return a concise implementation report containing:

```text
files added/changed
context aggregation strategy
persistent context used
session override strategy
ingredient resolution behavior
Recommendation Agent integration
API route
runtime Zod validation
error handling
Swagger/OpenAPI result
automated test result
manual Swagger execution result if performed
workspace validation result
deferred work
```

Also show the final implemented flow:

```text
POST /cooking/recommendations
        ↓
Development Auth
        ↓
Cooking Context Builder
        ↓
PostgreSQL
        ↓
Session Override Merge
        ↓
@flemme/ingredients
        ↓
@flemme/agent Recommendation
        ↓
CookingRecommendationSchema
        ↓
HTTP Response
```

Stop after Recommendation API v0.1 is stable.

Do NOT continue automatically into Pre-Cooking.

We will review and lock this increment first.
