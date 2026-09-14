# Flemme User Platform — F2 Empty Inventory Initialization

## Purpose

This task closes the onboarding product gap discovered after O1.

Current onboarding milestone:

```text
O1  Onboarding Flow Foundation     ✅ ACCEPTED
F1  Redirect Loop Fix              ✅ COMPLETE
F2  Empty Inventory Initialization ← CURRENT TASK
O2  Profile Preferences            ⏳
O3  Household                      ⏳
O4  Kitchen Equipment              ⏳
O5  Initial Inventory              ⏳
O6  Completion → Home              ⏳
O7  End-to-End Acceptance          ⏳
```

The product decision is locked:

```text
Profile
[Continue] [Skip]

Household
[Continue] [Use default]

Kitchen
[Continue] [Skip]

Inventory
[Continue] [I'll add ingredients later]
```

The onboarding principle is:

```text
Skip
≠
leave resource missing

Skip
→ persist a valid initialized state
→ onboarding considers that step complete
```

Profile, Household, and Kitchen already have a valid way to persist empty/default state.

Inventory currently does not.

F2 exists only to close that Inventory gap.

Do NOT implement the Inventory onboarding UI yet.

Do NOT implement O2–O5 forms.

Do NOT redesign Inventory item CRUD.

Do NOT add onboarding-progress persistence.

---

# 1. Current Inventory API

Existing accepted surface:

```http
GET    /inventory
POST   /inventory/items
PUT    /inventory/items/{id}
DELETE /inventory/items/{id}
```

Current persistence model:

```text
one inventory parent per user
        ↓
inventory_items
```

Current missing behavior:

```text
valid authenticated user
+
no inventories row
        ↓
GET /inventory
→ 404 INVENTORY_NOT_FOUND
```

Existing empty behavior:

```text
inventory parent exists
+
zero inventory items
        ↓
GET /inventory
→ 200
{
  "items": []
}
```

This distinction is intentional and must remain.

---

# 2. Product Blocker

Onboarding currently treats:

```text
INVENTORY_NOT_FOUND
```

as:

```text
Inventory onboarding incomplete
```

The user must be allowed to choose:

```text
"I'll add ingredients later"
```

That choice means:

```text
Inventory initialized
+
currently contains zero items
```

But the current API has no public operation that creates an empty Inventory parent without creating an Inventory item.

Therefore the frontend cannot persist:

```text
Inventory initialized but empty
```

without inventing a separate onboarding flag.

This is the concrete blocker F2 solves.

---

# 3. Locked Direction

Add the smallest current-user Inventory initialization operation.

Preferred public API:

```http
PUT /inventory
```

Semantics:

```text
inventory does not exist
→ create empty Inventory parent

inventory already exists
→ return current Inventory state
```

The operation must be idempotent.

Conceptually:

```text
PUT /inventory
        ↓
ensure current user's inventory exists
        ↓
return
{
  "items": [...]
}
```

For a new empty Inventory:

```json
{
  "items": []
}
```

Do not require an item payload.

---

# 4. Why PUT

Use `PUT /inventory` unless repository conventions reveal a concrete blocker.

Reasoning:

```text
resource:
current user's Inventory

PUT:
ensure/set that resource exists

idempotent:
repeating request does not create duplicates
```

Do NOT introduce:

```http
POST /inventory/initialize
POST /inventory/empty
POST /onboarding/inventory/skip
```

Onboarding wording must not leak into the Product Domain API.

The backend operation is domain-level:

```text
initialize current Inventory resource
```

not:

```text
skip onboarding
```

---

# 5. Authentication / Ownership

Use the existing final Auth v1 boundary:

```text
Better Auth session
        ↓
currentUserId
```

Never accept:

```text
userId
inventoryId
```

from the request for ownership.

Conceptually:

```ts
ensureInventory(currentUserId)
```

Do not modify Auth.

Do not reintroduce development authentication.

---

# 6. Existing Inventory Service Audit

Before implementation, inspect:

```text
apps/api/src/inventory/
packages/db inventory schema
```

Determine the current parent-creation path used by:

```http
POST /inventory/items
```

Reuse the same domain logic where practical.

Do not duplicate competing parent-initialization logic.

If item creation currently performs:

```text
ensure inventory parent
+
insert item
```

extract/reuse only the smallest safe helper if needed.

Avoid unnecessary service abstraction.

---

# 7. Database Behavior

Existing schema already supports:

```text
one Inventory per user
```

No migration is expected.

Use the existing unique user relationship to make initialization idempotent and concurrency-safe.

Preferred behavior under concurrent requests:

```text
PUT /inventory
PUT /inventory
```

must still result in:

```text
exactly one inventory parent
```

Use PostgreSQL conflict handling / existing uniqueness appropriately.

Do not rely only on an application-level "check then insert" race-prone sequence.

---

# 8. Response Contract

Reuse the existing Inventory read representation.

Preferred response:

```ts
{
  items: InventoryItemResponse[];
}
```

For newly initialized empty Inventory:

```json
{
  "items": []
}
```

If Inventory already contains items:

```http
PUT /inventory
```

must NOT delete or replace them.

It should return the current Inventory state.

Example:

```text
existing:
egg
rice

PUT /inventory

result:
egg
rice
```

NOT:

```text
[]
```

This endpoint initializes the parent; it is NOT full Inventory replacement.

---

# 9. Status Code

Choose the smallest coherent status behavior based on existing API conventions.

Preferred:

```text
newly created
→ 200 or 201, whichever best matches repository conventions

already existed
→ 200
```

If returning different status codes complicates an otherwise idempotent resource operation, `200` for both states is acceptable.

Document the final decision.

Do not use:

```text
204
```

if the endpoint is intended to return the Inventory representation.

---

# 10. Request Contract

Preferred request body:

```text
none
```

or an empty strict object only if Hono/OpenAPI conventions require a JSON body.

Do NOT accept:

```text
items
ingredientKey
userId
onboardingSkipped
isInitialized
```

The operation has exactly one responsibility:

```text
ensure the current user's Inventory exists
```

---

# 11. Missing Inventory Semantics

Keep existing GET semantics unchanged.

Before initialization:

```http
GET /inventory
→ 404 INVENTORY_NOT_FOUND
```

After:

```http
PUT /inventory
```

then:

```http
GET /inventory
→ 200
{
  "items": []
}
```

This transition is the core F2 acceptance condition.

Do NOT change GET missing Inventory to automatically return an empty collection.

The distinction:

```text
missing
vs
initialized empty
```

is required by onboarding.

---

# 12. Existing Item CRUD Must Remain Stable

Do not change accepted behavior for:

```http
POST /inventory/items
PUT /inventory/items/{id}
DELETE /inventory/items/{id}
```

Existing rules remain:

```text
exact production ingredientKey only
no fuzzy mapping
unknown key → controlled 422
duplicate canonical ingredient → 409
ingredient identity immutable
quantity positive or null
quantity/unit paired
condition = fresh | use_soon | unknown
```

F2 must not weaken any item validation.

---

# 13. Parent Initialization + Existing Item Creation

After F2, both of these flows must work:

```text
Flow A:

PUT /inventory
→ empty parent

POST /inventory/items
→ add first item
```

and:

```text
Flow B:

POST /inventory/items
→ existing behavior may initialize parent automatically
→ add first item
```

Do not force clients to call `PUT /inventory` before item creation.

The new endpoint is an additional domain capability for explicit empty initialization, not a prerequisite for existing item CRUD.

---

# 14. Onboarding Meaning

After F2, the frontend will eventually implement:

```text
Inventory
[I'll add ingredients later]
```

as:

```http
PUT /inventory
```

Then:

```text
invalidate/refetch Inventory
invalidate/refetch onboarding decision
```

and the onboarding step becomes complete because:

```http
GET /inventory
→ 200
```

Do NOT implement this frontend action in F2 unless strictly needed only for runtime API acceptance.

O5 owns the real Inventory onboarding UI.

---

# 15. Do Not Add Initialization Flags

Do NOT add:

```text
inventories.isInitialized
users.onboardingComplete
onboarding_progress
inventorySkipped
inventorySetupComplete
```

The existence of the Inventory parent already represents initialization.

Keep the data model minimal.

---

# 16. Service Design

Prefer a small Inventory service capability conceptually:

```ts
ensureInventory(currentUserId)
```

or reuse an equivalent existing internal helper.

Expected result:

```ts
{
  items: [...]
}
```

Keep route handlers thin.

Do not put substantial SQL logic directly in Swagger/Hono route declarations.

---

# 17. Transaction Behavior

If the operation is a single upsert/insert-on-conflict:

```text
no explicit transaction needed
```

If implementation requires multiple dependent statements:

```text
use a transaction
```

Do not add transaction complexity without need.

Document the final behavior.

---

# 18. Concurrency

Add integration coverage where practical for repeated/idempotent initialization.

At minimum prove:

```text
PUT /inventory
PUT /inventory
```

results in:

```text
one Inventory parent
```

No duplicate-parent error.

No data loss.

Existing items remain intact.

---

# 19. Error Handling

Reuse the existing structured Flemme error format for application-owned failures:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

Expected normal cases:

```text
authenticated user + missing Inventory
→ success

authenticated user + existing Inventory
→ success
```

Unauthenticated:

```text
401 UNAUTHENTICATED
```

Unexpected database failure:

```text
500 existing internal-error convention
```

Do not invent unnecessary Inventory initialization error codes.

---

# 20. OpenAPI / Swagger

Register:

```http
PUT /inventory
```

in:

```text
/openapi.json
/docs
```

Use the existing `CurrentUser` cookie-session security scheme.

Do not document retired development headers.

Swagger/manual flow should become:

```text
authenticated user
→ GET /inventory
→ 404

PUT /inventory
→ success

GET /inventory
→ 200 { items: [] }
```

Also verify:

```text
PUT on existing populated Inventory
→ preserves items
```

---

# 21. Backend Integration Tests

Use real PostgreSQL.

At minimum cover:

```text
1. authenticated user with no Inventory
   → GET returns 404

2. PUT /inventory creates parent

3. newly initialized Inventory returns items: []

4. GET after PUT returns items: []

5. repeated PUT is idempotent

6. repeated PUT does not create duplicate parent

7. PUT on existing populated Inventory preserves items

8. item CRUD still works after explicit initialization

9. POST item can still initialize parent without prior PUT

10. unauthenticated PUT returns 401

11. ownership remains current-user scoped

12. OpenAPI registers PUT /inventory
```

Use Better Auth session fixtures.

No development auth.

---

# 22. Cooking Context Compatibility

An explicitly initialized empty Inventory should be visible to the existing cooking-context service as:

```text
inventory exists
items = []
```

Do not change Recommendation override semantics.

Do not change the Cooking Engine.

Add focused compatibility coverage if existing service tests do not already prove this state.

---

# 23. Frontend Onboarding Compatibility

Do not implement O5.

However, verify conceptually that after:

```http
PUT /inventory
```

the existing O1 onboarding decision reads Inventory as complete.

A focused integration/unit test may be added if useful.

Expected:

```text
Profile     ✅
Household   ✅
Kitchen     ✅
Inventory   missing
→ nextStep inventory

PUT /inventory

Inventory   ✅ empty
→ onboarding complete
```

Do not persist any additional progress state.

---

# 24. No Migration Expected

Expected:

```text
NO DATABASE MIGRATION
```

If implementation reveals that empty parent persistence is impossible with the current schema:

```text
stop
report the concrete schema blocker
```

Do not redesign Inventory tables speculatively.

---

# 25. No Auth Changes

Do not modify:

```text
Better Auth
/auth/me
session cookies
current-user middleware
Google
password login
```

The new endpoint simply uses the existing authenticated `currentUserId`.

---

# 26. No F1/O2 Changes

Do not alter F1 routing unless an acceptance test discovers a direct regression caused by F2.

Do not implement Profile preference UI.

Keep F2 backend-focused.

---

# 27. Runtime Acceptance

Run real:

```text
apps/api
```

with Better Auth session authentication.

Using a user without Inventory:

```text
GET /inventory
→ 404

PUT /inventory
→ success

GET /inventory
→ 200
{
  "items": []
}
```

Then call:

```text
PUT /inventory
```

again.

Expected:

```text
success
same Inventory
still items: []
```

Add an item.

Then:

```text
PUT /inventory
```

Expected:

```text
item still exists
```

---

# 28. Regression Gates

Run:

```text
focused Inventory tests
Product Domain integration tests
full API suite
database lifecycle validation
workspace typecheck
API build
web build
Drizzle check
scoped Biome
git diff --check
```

If frontend onboarding tests are touched for compatibility, run them too.

---

# 29. Documentation

Update:

```text
apps/api/README.md
docs/architecture.md where relevant
docs/progress-tracker.md
Swagger Inventory testing guide
onboarding context/plan if necessary
```

Record:

```text
F1 Redirect Loop Fix            ✅
F2 Empty Inventory Init         ✅
O2 Profile Preferences          ← NEXT
```

Do not mark O2 implemented.

---

# 30. Required Report

Return:

```md
# Flemme User Platform F2 — Empty Inventory Initialization Report

## Existing Inventory Model

- parent table:
- user relationship:
- uniqueness:
- item relationship:

## API

- method:
- path:
- auth:
- request:
- response:

## Initialization Semantics

### Missing Inventory
- behavior:

### Existing Empty Inventory
- behavior:

### Existing Populated Inventory
- behavior:

## Idempotency

- repeated PUT:
- duplicate parent:
- concurrency behavior:

## Service

- service function:
- parent creation:
- SQL/upsert strategy:
- transaction:

## GET Semantics

- before initialization:
- after initialization:

## Item CRUD Regression

- create:
- update:
- delete:
- implicit parent creation:

## Cooking Context

- empty inventory:
- Recommendation compatibility:

## Onboarding Compatibility

- before PUT:
- after PUT:
- additional onboarding state:

Expected:
None.

## OpenAPI / Swagger

- registration:
- CurrentUser:
- manual flow:

## Database Changes

Expected:
No migration required.

## Tests Added

## Runtime Acceptance

- GET before:
- PUT first:
- GET after:
- PUT repeat:
- populated preservation:

## Validation Results

- focused Inventory:
- Product Domain:
- full API:
- lifecycle:
- typecheck:
- API build:
- web build:
- Drizzle:
- Biome:
- git diff --check:

## Files Changed

## Decisions / Constraints Discovered

## Final Status

F2 Empty Inventory Initialization ✅ ACCEPTED

or explain the blocker.

## Next Task

User Platform O2 — Profile Preferences

Do not implement O2 in this task.
```
