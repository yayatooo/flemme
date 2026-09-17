# Flemme Web — Phase 9D: Inventory Management v0.1

## Status

**Implementation Task**

Phase 9C Favorites UI is complete.

Phase 9D completes the current Core User Flow by turning Inventory into a real user-managed persistent cooking-context source.

## Scope

```text
/app/inventory
→ Persisted Inventory
→ Add Ingredient
→ Edit Ingredient
→ Remove Ingredient
→ Canonical Ingredient Resolution
→ Recommendation Context Sync
```

Inventory is not a grocery checklist.

Inventory is part of Flemme's persistent cooking context and directly influences Recommendation.

---

# 1. Core Flow Context

Flemme Core User Flow:

```text
Home
→ Recommendation
→ Select Recipe
→ Pre-Cooking
→ Create Cooking Session
→ Active Cooking
→ Completion
→ Nutrition
→ Favorite
→ Resume Active Session
→ Cooking History
→ Favorites
→ Inventory Management
```

Phase 9D owns:

```text
Inventory Management
```

After this phase, the current Core User Flow is functionally complete end to end.

---

# 2. Product Principle

Locked rule:

> Inventory is the source of truth for what ingredients the user currently has available.

Recommendation must consume persisted Inventory before asking the user again.

Inventory is therefore a cooking-context feature, not a decorative pantry page.

---

# 3. Existing Context Integration

Before implementing, inspect the current persistent cooking-context architecture.

Inventory is already referenced by:

```text
Recommendation
Onboarding
Cooking Context
```

Reuse the existing context/session infrastructure.

Do not create a second inventory source.

---

# 4. Existing Recommendation Boundary

Recommendation input conceptually uses:

```ts
inventory: Array<{
	name: string;
}>
```

or the actual current shared contract.

Inventory Management must preserve compatibility with the existing Recommendation context loader.

Do not require Recommendation UI to reconstruct Inventory manually.

Expected:

```text
Inventory mutation
↓
persistent cooking context updates
↓
next Recommendation automatically receives latest Inventory
```

---

# 5. Mandatory UI Stack

Continue using:

```text
React
TanStack Router
TanStack Query
Tailwind CSS
shadcn/ui
Lucide
```

Do not introduce another UI framework.

---

# 6. Route

Replace the existing placeholder:

```text
/app/inventory
```

with the real Inventory Management feature.

Keep the route thin.

Conceptually:

```tsx
function InventoryRoute() {
	return <InventoryPage />;
}
```

---

# 7. Recommended Feature Structure

Preferred:

```text
apps/web/src/features/inventory/
├── inventory-page.tsx
├── inventory-query.ts
├── inventory-mutations.ts
├── inventory-list.tsx
├── inventory-item.tsx
├── inventory-form.tsx
├── inventory-empty.tsx
├── inventory-loading.tsx
├── inventory-error.tsx
└── index.ts
```

Use existing project conventions if different.

Do not put Inventory business logic inside:

```text
components/ui
```

---

# 8. v0.1 Feature Scope

Inventory v0.1 should support:

```text
list ingredients
add ingredient
edit ingredient
remove ingredient
optional quantity/unit when supported
canonical ingredient resolution
unresolved ingredient state
loading
empty
error
```

Do not expand into advanced pantry management yet.

---

# 9. Non-Goals

Do not implement:

```text
expiry tracking
shopping list
barcode scanning
receipt scanning
automatic inventory deduction
automatic inventory replenishment
pantry analytics
price tracking
storage location
meal-plan reservation
stock forecasting
```

Keep v0.1 practical.

---

# 10. Inspect Existing Persistence First

Before adding schema/API changes:

1. inspect current user inventory persistence
2. inspect onboarding initial inventory storage
3. inspect cooking-context loader
4. inspect Recommendation context projection
5. inspect shared schemas
6. inspect canonical ingredient integration

Reuse existing tables/endpoints if already present.

Do not duplicate Inventory persistence.

---

# 11. Inventory Item Contract

Do not invent a large domain shape if the project already has one.

Preferred minimum conceptual data:

```ts
type InventoryItem = {
	id: string;
	name: string;
	ingredientKey?: string | null;
	quantity?: number | null;
	unit?: string | null;
	resolutionStatus?: "resolved" | "unresolved";
};
```

This shape is conceptual only.

Use the actual existing domain conventions.

---

# 12. Canonical Ingredient Identity

Reuse:

```text
@flemme/ingredients
```

for canonical identity.

Preferred behavior:

```text
user input
↓
deterministic ingredient resolver
↓
resolved canonical ingredient
or
unresolved ingredient
```

Do not invoke an LLM to identify simple Inventory items.

---

# 13. Resolved Ingredient

When an item resolves:

```text
Tomat
↓
canonical ingredient key
↓
stored/displayed as user's ingredient
```

Preserve user-friendly display text while keeping canonical identity available for downstream systems.

Do not make users interact with internal kebab-case keys.

---

# 14. Unresolved Ingredient

If resolver returns:

```text
unresolved
```

do not reject the Inventory entry automatically.

Preferred v0.1:

```text
allow persistence
+
mark unresolved
+
show subtle status
```

Why:

```text
Inventory must remain useful even when the ingredient catalog is incomplete.
```

Do not silently map it to the wrong ingredient.

---

# 15. Unresolved UI

Example:

```text
Daun gedi
Not recognized yet
```

Keep it lightweight.

Do not make unresolved ingredients look like errors that block the page.

---

# 16. Duplicate Ingredient Handling

Define one clear duplicate rule.

Preferred:

If two inputs resolve to the same canonical ingredient:

```text
do not create duplicate rows
```

Instead:

```text
update existing item
or
return controlled duplicate state
```

Use existing API/domain conventions.

For unresolved free-text items:

normalize only according to the deterministic resolver/name rules already available.

Do not aggressively merge unrelated names.

---

# 17. Quantity

Quantity should remain optional unless the current Inventory domain already requires it.

Support:

```text
ingredient name only
ingredient + quantity
ingredient + quantity + unit
```

Do not force users to maintain precise pantry accounting just to use Flemme.

---

# 18. Quantity Validation

If quantity exists:

```text
must be finite
must be positive
```

Do not allow negative stock.

If user clears quantity:

```text
persist unknown / null
```

according to the actual contract.

Do not convert unknown to zero.

---

# 19. Units

Reuse existing units if the project already has a unit model/catalog.

Do not invent a large unit system in the web layer.

If current inventory only supports simple free-text unit:

```text
preserve existing behavior
```

If canonical units exist:

```text
reuse them
```

---

# 20. Nutrition Compatibility

Inventory quantity/unit may later improve Nutrition coverage.

However Phase 9D must not redesign Nutrition conversion logic.

Do not promise that every Inventory quantity can be converted into grams.

Inventory stores what is known.

Nutrition remains responsible for deterministic conversion/coverage.

---

# 21. Inventory API

Inspect current API first.

Preferred capabilities:

```text
GET    /inventory
POST   /inventory
PATCH  /inventory/:id
DELETE /inventory/:id
```

or equivalent existing routes.

Use one canonical API style.

Do not create duplicate endpoints under cooking-context if Inventory already has its own module.

---

# 22. Ownership

Inventory items belong to the authenticated user.

Enforce server-side ownership for:

```text
read
create
edit
delete
```

Cross-user access must not be possible.

---

# 23. TanStack Query

Use stable keys.

Conceptually:

```ts
inventoryQueryKey()
```

Mutations:

```text
create inventory item
update inventory item
delete inventory item
```

Do not call `fetch()` directly from presentational components.

---

# 24. Cache Synchronization

After:

```text
add
edit
remove
```

update/invalidate:

```text
Inventory query
persistent cooking-context query/cache if separate
```

Ensure the next Recommendation gets current server state.

Do not leave stale Recommendation context caches behind.

---

# 25. Recommendation Context Freshness

This is a core acceptance criterion.

Example:

```text
Inventory:
Egg
Rice

User adds:
Chicken

Next Recommendation request
→ must see Egg + Rice + Chicken
```

No logout/refresh should be required.

---

# 26. Existing Active Session Isolation

Changing Inventory must not mutate an already-created Cooking Session's immutable plan.

Example:

```text
Active Cooking exists
↓
user edits Inventory elsewhere
↓
existing cookingPlan remains unchanged
```

Future Recommendation uses updated Inventory.

Current persisted Cooking Session remains historical truth.

---

# 27. No Automatic Session Change

Inventory mutations must not trigger:

```text
Recommendation regeneration
Pre-Cooking regeneration
Active Cooking plan mutation
Completion regeneration
Nutrition recalculation
```

---

# 28. No Automatic Deduction

Completing a Cooking Session must still NOT automatically reduce Inventory in Phase 9D.

This remains deferred.

Do not infer consumed stock from the cooking plan.

---

# 29. Inventory Page Goal

The page should answer:

```text
What ingredients does Flemme know I have?
Can I add something quickly?
Can I correct something?
Can I remove something I no longer have?
```

Keep it simple.

---

# 30. Recommended Page Composition

Conceptual:

```text
Inventory

What do you have right now?

[ Add ingredient ]

┌──────────────────────────────┐
│ Egg                          │
│ 6 pcs                        │
│                        [ ⋯ ] │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Rice                         │
│ 1 kg                         │
│                        [ ⋯ ] │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Daun gedi                    │
│ Not recognized yet           │
│                        [ ⋯ ] │
└──────────────────────────────┘
```

Directional only.

---

# 31. Inventory Card / Row

Use either:

```text
shadcn Card
```

or a lightweight bordered row based on the existing app language.

Do not create a large Card per item if it makes the list visually heavy.

Recommended information:

```text
ingredient name
quantity/unit if known
resolution state only when relevant
secondary edit/remove actions
```

---

# 32. Add Ingredient

Use a primary action:

```text
Add ingredient
```

Recommended UI:

```text
Dialog
or
Drawer on mobile
```

Use existing shadcn/Base UI primitives.

---

# 33. Add Form

Minimum:

```text
Ingredient name
Quantity (optional)
Unit (optional)
```

Do not ask for unnecessary fields.

Ingredient name is required.

---

# 34. Add Resolution Behavior

On submit:

```text
trim name
validate
resolve canonical ingredient deterministically
persist
return canonical Inventory item
```

Do not make the browser authoritative for canonical resolution if the server/context layer already owns it.

Preferred:

```text
server validates/resolves
```

The web may optionally preview resolution.

---

# 35. Edit Ingredient

Use:

```text
Edit
```

from an overflow menu or row action.

Allow editing only fields that belong to Inventory.

Do not allow editing canonical internal keys directly.

---

# 36. Rename / Re-resolution

If ingredient name changes:

```text
rerun deterministic canonical resolution
```

Do not keep a stale ingredientKey attached to a new name.

---

# 37. Remove Ingredient

Provide:

```text
Remove
```

as a secondary/destructive action.

Use confirmation if consistent with current UX patterns.

Removing an Inventory item must not delete historical cooking data.

---

# 38. Remove Semantics

Delete only the current user's Inventory record.

Do not alter:

```text
Cooking Sessions
Completion snapshots
Nutrition snapshots
Favorites
History
```

---

# 39. Empty State

Use shared `EmptyState`.

Suggested:

```text
Your inventory is empty

Add the ingredients you have so Flemme can make better recommendations.

[ Add ingredient ]
```

Do not populate fake pantry defaults.

---

# 40. Loading State

Use shared/shadcn `Skeleton`.

Do not block the whole AppShell.

---

# 41. Error State

On list failure:

```text
Couldn't load your inventory.
[ Try again ]
```

BottomNavigation remains usable.

---

# 42. Mutation Error

Add/edit/delete failure should:

- preserve current form/input where relevant
- show controlled error
- allow retry
- avoid corrupting local list state

Do not show raw backend errors.

---

# 43. Duplicate Submission Prevention

While add/edit/delete is pending:

```text
disable conflicting action
```

Avoid double creation or double deletion.

---

# 44. Bottom Navigation

Inventory is a global app destination.

Keep:

```text
BottomNavigation visible
```

with:

```text
Inventory
```

active.

---

# 45. Mobile-First Layout

Use the compact app canvas.

At:

```text
320px
390px
```

the page must remain fully usable one-handed.

Prefer:

```text
single-column list
large touch targets
simple forms
```

---

# 46. Desktop Behavior

Keep:

```text
~572px centered app canvas
```

Do not convert Inventory into a wide spreadsheet/dashboard.

---

# 47. shadcn Usage

Likely primitives:

```text
Button
Card
Input
Dialog or Drawer
DropdownMenu
Select (only if units require it)
Badge
Skeleton
AlertDialog (optional)
```

Only add primitives actually used.

---

# 48. Search

Do not build Inventory search for v0.1 unless list scale already requires it.

Start with a straightforward list.

---

# 49. Sorting

Preferred simple ordering:

```text
ingredient display name ASC
```

or existing API order.

Keep it deterministic.

Do not add user sorting controls.

---

# 50. Onboarding Compatibility

Onboarding already captures initial Inventory.

Phase 9D must display and edit the same persisted Inventory.

Do not create:

```text
onboarding inventory
+
app inventory
```

as separate stores.

This is a key acceptance criterion.

---

# 51. Onboarding Re-entry

If the user edits Inventory later:

```text
do not force onboarding again
```

Inventory Management is the normal post-onboarding editing surface.

---

# 52. Home Kitchen Shortcut

Phase 2 already has:

```text
KitchenShortcut
```

It should continue routing to:

```text
/app/inventory
```

If a real count is now easy to expose:

```text
N ingredients available
```

may be added.

Only show a count from real persisted Inventory.

Do not invent a number.

---

# 53. Inventory Count Cache

If Home displays count:

```text
Inventory add/edit/remove
→ Home count updates
```

through canonical query/cache synchronization.

Do not create a separate count source.

---

# 54. Tests — Ingredient Resolution

Add coverage for:

```text
resolved ingredient
unresolved ingredient
name normalization
name edit causes re-resolution
same canonical ingredient duplicate behavior
unresolved duplicate behavior according to domain rule
```

Reuse existing `@flemme/ingredients` tests where possible.

---

# 55. Tests — API

Add/extend coverage for:

```text
list own inventory
cross-user isolation
create resolved item
create unresolved item
create name-only item
create with quantity
create with quantity + unit
invalid quantity
duplicate behavior
edit name
edit quantity
edit unit
clear quantity
name edit re-resolves canonical identity
remove own item
cross-user edit/delete blocked
missing item behavior
remove does not mutate historical sessions
```

---

# 56. Tests — Web

Add coverage for:

```text
Inventory route real query
loading
error + retry
empty state
list items
resolved item display
unresolved item display
add dialog/drawer
add name only
add quantity/unit
duplicate pending blocked
edit item
edit reruns resolution
remove item
remove failure
BottomNavigation visible
Inventory nav active
Home shortcut still works
```

---

# 57. Recommendation Integration Test

Required end-to-end integration:

```text
1. User Inventory = Egg
2. Add Rice
3. Submit a new Home Recommendation request
4. Recommendation context receives Egg + Rice
```

Also test removal:

```text
1. Remove Egg
2. New Recommendation context no longer contains Egg
```

This is required.

---

# 58. Existing Session Isolation Test

Required:

```text
1. Create Cooking Session
2. Mutate Inventory
3. Existing session cookingPlan remains unchanged
```

---

# 59. Network Verification

Inventory page visit:

```text
one canonical Inventory GET
```

Add:

```text
exactly one create request
```

Edit:

```text
exactly one update request
```

Remove:

```text
exactly one delete request
```

Verify zero accidental:

```text
Recommendation generation
Pre-Cooking generation
Cooking Session creation
Active Cooking progress
Completion
Nutrition
Favorite
History mutation
Agent requests
```

Inventory changes may affect **future** Recommendation context only.

---

# 60. Browser Verification

Verify at:

```text
320px
390px
768px
1440px
1920px
```

Check:

- no horizontal overflow
- add form works with mobile keyboard
- long ingredient names remain contained
- quantity/unit layout remains readable
- unresolved state is understandable
- edit/remove easy to access
- BottomNavigation visible
- Inventory nav active
- compact 572px desktop canvas preserved

---

# 61. Validation

Run:

```text
ingredient package tests
shared contracts typecheck if touched
web typecheck
web production build
API build
web tests
API tests
Inventory integration tests
Recommendation context integration tests
Biome
Oxlint
```

Report the existing malformed OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

# 62. Non-Goals

Do not implement:

```text
automatic stock deduction
shopping list
expiry dates
barcode scanning
receipt scanning
inventory photos
price tracking
inventory analytics
pantry location
unit-conversion framework expansion
```

Do not redesign Recommendation.

---

# 63. Suggested Implementation Order

```text
1. Inspect current onboarding Inventory persistence.
2. Inspect cooking-context Inventory loader.
3. Inspect existing Inventory API/table/contracts.
4. Reuse canonical ingredient resolver.
5. Define minimal Inventory item contract.
6. Add/reuse Inventory CRUD API.
7. Preserve ownership rules.
8. Add duplicate handling.
9. Add canonical query key.
10. Replace /app/inventory placeholder.
11. Create InventoryPage.
12. Create Inventory list/item UI.
13. Add Add Ingredient form.
14. Add Edit Ingredient flow.
15. Add Remove Ingredient flow.
16. Add unresolved state.
17. Synchronize cooking-context cache.
18. Synchronize optional Home count.
19. Add Recommendation integration tests.
20. Add existing-session isolation test.
21. Browser/network verify.
22. Run validation.
23. Update architecture/progress docs.
```

---

# 64. Definition of Done

- [ ] `/app/inventory` uses real persisted Inventory.
- [ ] Inventory is the same source used by onboarding/cooking context.
- [ ] No duplicate Inventory persistence model is created.
- [ ] User can list Inventory.
- [ ] User can add an ingredient.
- [ ] User can edit an ingredient.
- [ ] User can remove an ingredient.
- [ ] Quantity remains optional unless existing domain requires it.
- [ ] Unit remains optional unless existing domain requires it.
- [ ] Unknown quantity is not converted to zero.
- [ ] Canonical ingredient resolver is reused.
- [ ] Resolved ingredients preserve canonical identity.
- [ ] Unresolved ingredients may be persisted safely.
- [ ] Unresolved ingredients are visibly distinguishable.
- [ ] Renaming an item reruns canonical resolution.
- [ ] Duplicate canonical ingredient behavior is controlled.
- [ ] Ownership is enforced server-side.
- [ ] Add/edit/delete duplicate submissions are prevented.
- [ ] Mutation failures are recoverable.
- [ ] Inventory mutation updates cooking-context freshness.
- [ ] Next Recommendation receives updated Inventory.
- [ ] Removed ingredient disappears from future Recommendation context.
- [ ] Existing Cooking Session plan is not mutated.
- [ ] No automatic Inventory deduction exists.
- [ ] No Recommendation is generated merely from editing Inventory.
- [ ] No Pre-Cooking/session/progress/Completion/Nutrition/Favorite mutation occurs.
- [ ] Home KitchenShortcut still opens Inventory.
- [ ] Real Home Inventory count may be used if implemented.
- [ ] Empty state works.
- [ ] Loading state works.
- [ ] Error + retry works.
- [ ] BottomNavigation remains visible.
- [ ] Inventory nav is active.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

# 65. Agent Rule

Optimize for:

```text
simple pantry management
+
persistent cooking context
+
canonical ingredient identity
+
fast editing
+
Recommendation freshness
```

Do not optimize for:

```text
warehouse-style stock management
precision inventory accounting
automatic deduction
shopping workflows
analytics
```

Core rule:

> Inventory exists to give Flemme an honest, persistent picture of what ingredients the user currently has available.

---

# 66. Core Flow Checkpoint After Phase 9D

When Phase 9D is complete, checkpoint the current Flemme Core User Flow as:

```text
✅ Home
✅ Recommendation
✅ Select Recipe
✅ Pre-Cooking
✅ Create Cooking Session
✅ Active Cooking
✅ Completion
✅ Nutrition
✅ Favorite
✅ Resume Active Session
✅ Cooking History
✅ Favorites
✅ Inventory Management
```

At that point the current v0.1 Core User Flow is complete end to end.

The next work should move into:

```text
refinement
hardening
UX polish
data coverage improvements
additional product features
```

rather than adding another mandatory core-flow stage.
