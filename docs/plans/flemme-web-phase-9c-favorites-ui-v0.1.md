# Flemme Web — Phase 9C: Favorites UI v0.1

## Status

**Implementation Task**

Phase 9B Cooking History is complete.

Phase 9C turns the existing persisted Favorites capability into a full user-facing Favorites library.

## Scope

```text
Persisted Favorites
→ /app/favorites
→ Favorites List
→ Open Favorite Meal
→ Remove Favorite
→ Empty / Loading / Error States
```

This phase must reuse the existing canonical Favorites API and historical Favorite projection.

Do not create a second Favorites store.

---

# 1. Core Flow Context

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

Phase 9C owns:

```text
Favorites
```

---

# 2. Core Domain Rule

A Favorite represents persisted user preference over an eligible completed Cooking Session.

Do not treat a Favorite as a newly generated recipe.

Preferred model:

```text
completed Cooking Session
+
Favorite relation / snapshot projection
=
saved historical meal
```

Do not regenerate Recommendation or Pre-Cooking from a Favorite just to render it.

---

# 3. Existing Favorites Backend

Reuse the existing API behavior already validated in Phase 8:

```text
create favorite
list favorites
delete favorite
ownership enforcement
completed-session eligibility
duplicate prevention
historical recipe projection
```

Do not redesign the Favorite persistence model.

---

# 4. Ownership

Favorites list must only return Favorites owned by the authenticated user.

Expected:

```text
own favorites → visible
cross-user favorites → never returned
```

Enforce ownership server-side.

---

# 5. Route

Replace the existing placeholder route:

```text
/app/favorites
```

with the real Favorites UI.

Keep the route thin.

Conceptually:

```tsx
function FavoritesRoute() {
	return <FavoritesPage />;
}
```

Do not put full feature markup in the route file.

---

# 6. Recommended Feature Structure

Preferred:

```text
apps/web/src/features/favorites/
├── favorites-page.tsx
├── favorite-list.tsx
├── favorite-card.tsx
├── favorite-empty.tsx
├── favorite-loading.tsx
├── favorite-error.tsx
├── favorite-query.ts
├── favorite-mutations.ts
└── index.ts
```

If the existing Phase 8 feature already contains:

```text
favorite-action.tsx
favorite-query.ts
favorite-mutations.ts
```

extend that directory.

Do not duplicate query or mutation modules.

---

# 7. Page Goal

Favorites should answer:

```text
What meals did I save?
What did I like about them?
When did I cook them?
Can I open the completed meal again?
Can I remove them from Favorites?
```

It is a library, not a recipe marketplace.

---

# 8. Recommended Page Composition

Conceptual:

```text
Favorites

Meals you wanted to keep.

┌──────────────────────────────┐
│ ♥                            │
│ Nasi Goreng Kentang Telur    │
│ Sep 17 · 20:42               │
│                              │
│ Warm savory fried rice...    │
│                              │
│ ~420 kcal · 18g protein      │
│                              │
│ [ View meal → ]        [ ⋯ ] │
└──────────────────────────────┘

┌──────────────────────────────┐
│ ♥ Ayam Kecap                 │
│ ...                          │
└──────────────────────────────┘
```

Directional only.

---

# 9. Favorite Card

Create:

```text
favorite-card.tsx
```

Use shadcn `Card`.

Recommended information priority:

```text
1. saved/favorite indicator
2. display name
3. completed date
4. short persisted Completion summary
5. compact Nutrition summary when available
6. View meal action
7. secondary remove action
```

Do not show:

```text
full cooking plan
all session changes
full Nutrition coverage details
all preparation/cooking steps
```

---

# 10. Display Name

Use the established priority:

```text
customName
↓
selectedRecipe.name
```

Do not introduce a new Favorite-specific naming rule.

If the existing Favorite projection already stores a historical display field, use it consistently.

---

# 11. Historical Integrity

Favorite cards should render from persisted Favorite/historical projection.

Do not depend on live Recommendation state.

Do not regenerate summaries.

Do not silently rewrite old Favorite content when unrelated source data changes.

---

# 12. Completed Date

Prefer the source Cooking Session:

```text
completedAt
```

as the meal date.

Do not use Favorite creation timestamp as the primary cooked date unless the current API intentionally exposes only that.

A Favorite is saved preference over a meal; the meal date is usually more useful.

---

# 13. Completion Summary

If the Favorite projection contains persisted Completion summary:

```text
summary.title
summary.description
```

show a concise preview.

Do not call Completion agent again.

---

# 14. Nutrition Summary

Nutrition may be:

```text
complete
partial
unavailable
```

### Complete / Partial

Show compact values when available:

```text
~420 kcal · 18g protein
```

### Unavailable

Do not display fake zeroes.

Either omit macros or show:

```text
Nutrition unavailable
```

subtly.

---

# 15. View Meal

Primary action:

```text
View meal
```

Reuse the existing canonical completed-session route:

```text
/app/cooking/$sessionId/completion
```

Do not create a duplicate Favorite detail page for v0.1.

This reuses:

```text
Completion
Nutrition
Favorite state
```

already implemented.

---

# 16. Remove Favorite

Phase 9C should expose removal.

Use the existing delete API.

Preferred UX:

```text
overflow menu
→ Remove from favorites
```

or a compact secondary action.

Do not make destructive removal visually compete with View meal.

---

# 17. Remove Confirmation

Because removal is reversible by saving again later, a heavy confirmation flow is optional.

Preferred v0.1:

```text
one explicit Remove action
```

If current UX patterns favor confirmation, use a lightweight shadcn `AlertDialog`.

Do not delete the Cooking Session.

---

# 18. Delete Domain Rule

Removing a Favorite must only delete the Favorite relation/resource.

It must NOT delete:

```text
Cooking Session
Completion snapshot
Nutrition snapshot
History entry/projection
customName
```

The meal remains in Cooking History.

---

# 19. Remove Mutation

Reuse/create a canonical mutation.

Conceptually:

```ts
useDeleteFavoriteMutation(favoriteId)
```

or session-based delete if the API is designed that way.

Responsibilities:

```text
delete persisted Favorite
update Favorites list cache
update Favorite-by-session cache
update History favorite indicator cache
update Nutrition saved state cache
```

Do not maintain disconnected local state.

---

# 20. Duplicate Safety

Remove should be idempotent where practical.

If the Favorite was already removed in another tab/device:

```text
refresh/refetch
→ canonical not-saved state
```

Do not crash the Favorites page.

---

# 21. TanStack Query

Reuse canonical Favorites query keys established in Phase 8.

Preferred:

```text
favoritesQueryKey()
favoriteBySessionQueryKey(sessionId)
```

Do not create parallel query keys for the page.

---

# 22. Pagination

Favorites can grow.

Inspect the existing list API.

If it already supports bounded pagination:

```text
reuse it
```

If not, add the smallest scalable pagination boundary.

Preferred v0.1:

```text
limit 10–20
+
Load more
```

Avoid fetching unbounded Favorite history forever.

---

# 23. Ordering

Preferred:

```text
most recently saved first
```

if the canonical Favorite resource has `createdAt`.

Alternative:

```text
most recently cooked first
```

if the existing product semantics already use completed meal order.

Choose one server-side deterministic rule and document it.

Do not sort only in the browser.

---

# 24. Empty State

Use shared `EmptyState`.

Suggested:

```text
No favorites yet

Save meals you want to cook again.

[ Start cooking ]
```

CTA routes to:

```text
/app
```

Do not use fake favorite cards.

---

# 25. Loading State

Use shadcn/shared `Skeleton`.

Prefer card-shaped skeletons.

Do not block the entire AppShell.

---

# 26. Error State

On list failure:

```text
Couldn't load your favorites.
[ Try again ]
```

Use shared `ErrorState` where appropriate.

BottomNavigation stays usable.

---

# 27. Remove Pending State

While removing:

- disable duplicate remove action
- keep card stable
- show concise pending state if needed
- do not block the entire list

Do not remove optimistically unless existing cache patterns make rollback safe.

Server-authoritative correctness is acceptable.

---

# 28. Remove Error

If delete fails:

- keep Favorite visible
- show controlled local error
- allow retry
- do not affect Cooking History
- do not mutate Nutrition or Completion

---

# 29. Bottom Navigation

Favorites is a global app destination.

Keep:

```text
BottomNavigation visible
```

with:

```text
Favorites
```

active.

Do not use focused cooking layout.

---

# 30. Mobile-First Layout

Use:

```text
single-column list
```

across mobile and compact desktop.

Do not switch to a marketplace-style multi-column grid.

---

# 31. Desktop Behavior

Preserve the existing:

```text
~572px centered app canvas
```

No wide library dashboard.

---

# 32. shadcn Usage

Expected primitives:

```text
Card
Button
Badge
DropdownMenu
Skeleton
AlertDialog (optional)
```

Use only what is needed.

---

# 33. Favorite Indicator

Because this page already represents Favorites, avoid redundant visual noise.

A single:

```text
Heart filled
```

or small `Saved` marker is enough.

Do not repeat multiple Favorite badges.

---

# 34. Search / Filter

Do not implement in v0.1:

```text
search
tags
folders
collections
sorting controls
nutrition filters
date filters
```

Start with a clean saved-meals list.

---

# 35. Re-cook Action

Do not add a `Cook again` flow in Phase 9C unless the existing domain already has a defined behavior.

Why:

```text
Favorite
→ Recipe source
→ new Recommendation/Pre-Cooking context
```

needs product decisions about current inventory/context.

Defer it.

Use:

```text
View meal
```

only for v0.1.

---

# 36. Cache Synchronization — Save

When Phase 8 saves a Favorite:

```text
Favorites page cache should update
```

without requiring app restart.

Reuse existing invalidation.

---

# 37. Cache Synchronization — Remove

When Phase 9C removes a Favorite:

Update:

```text
Favorites list
favorite-by-session state
History favorite indicator
Nutrition Favorite action state
```

Do not let one screen remain stale.

---

# 38. Rename Synchronization

If a completed Cooking Session is renamed:

```text
Favorite card title should update
```

if the Favorite projection intentionally follows session display name.

If Favorite historically snapshots the display title instead, preserve that existing rule.

Do not silently change domain semantics in the UI.

---

# 39. History Relationship

Removing Favorite must NOT remove the meal from:

```text
/app/history
```

The completed Cooking Session remains.

---

# 40. Nutrition Relationship

Removing Favorite must NOT remove or recalculate:

```text
nutrition_snapshot
```

Nutrition page should simply return to:

```text
Save to favorites
```

state after cache refresh.

---

# 41. Completion Relationship

Removing Favorite must NOT modify:

```text
completion_snapshot
```

---

# 42. No Agent Call

Favorites UI is deterministic persistence/retrieval.

No Agent calls.

---

# 43. No Inventory Mutation

Favorites UI causes:

```text
zero Inventory mutations
```

---

# 44. No Cooking Progress Mutation

Favorites UI must not modify session lifecycle/progress.

---

# 45. Tests — API

Preserve/extend coverage for:

```text
list own Favorites only
cross-user excluded
deterministic order
pagination
historical projection
customName/display behavior
completion summary projection
nutrition complete projection
nutrition partial projection
nutrition unavailable projection
delete own Favorite
cross-user delete → 403
missing Favorite behavior
delete leaves Cooking Session intact
delete leaves History intact
```

---

# 46. Tests — Web

Add coverage for:

```text
Favorites route uses real query
loading state
error + retry
empty state
favorite cards render
customName title
original-name fallback
completed date
completion summary
nutrition complete
nutrition partial
nutrition unavailable
View meal route
remove action
remove pending state
remove success
remove error + retry
removed Favorite disappears
History session remains
BottomNavigation visible
Favorites nav active
Load more if implemented
```

Preserve all existing tests.

---

# 47. Network Verification

Initial Favorites visit:

```text
one canonical Favorites list request
```

View meal:

```text
existing Completion route
+
canonical Cooking Session GET as needed
```

Remove:

```text
exactly one Favorite delete request
```

Verify zero accidental:

```text
Recommendation
Pre-Cooking
Cooking Session creation
Active Cooking progress
Completion generation
Nutrition generation
Inventory mutation
Agent requests
```

---

# 48. Browser Verification

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
- long titles stay contained
- Nutrition unavailable looks intentional
- View meal is easy to tap
- Remove action is discoverable but secondary
- BottomNavigation visible
- Favorites nav active
- compact 572px desktop canvas preserved
- removal updates list cleanly
- refresh restores canonical list

---

# 49. Validation

Run:

```text
web typecheck
shared contracts typecheck if touched
web production build
API build
web tests
API tests
focused Favorites integration tests
Biome
Oxlint
```

Report the existing malformed OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

# 50. Non-Goals

Do not implement:

```text
Cook again
search
filters
tags
folders
collections
sharing
recommendation from Favorites
Inventory Management
```

Do not redesign Completion, Nutrition, or History.

---

# 51. Suggested Implementation Order

```text
1. Inspect existing Favorites list/delete API.
2. Confirm Favorite historical projection fields.
3. Confirm ordering semantics.
4. Add/reuse pagination if needed.
5. Extend existing favorites feature directory.
6. Build canonical Favorites query.
7. Replace /app/favorites placeholder.
8. Create FavoritesPage.
9. Create FavoriteCard.
10. Add loading/error/empty states.
11. Wire View meal to Completion route.
12. Add Remove Favorite action.
13. Synchronize caches after delete.
14. Verify History remains intact.
15. Verify Nutrition saved state updates.
16. Add tests.
17. Browser/network verify.
18. Run validation.
19. Update architecture/progress docs.
```

---

# 52. Definition of Done

- [ ] `/app/favorites` uses the real persisted Favorites API.
- [ ] No second Favorite persistence model exists.
- [ ] Only authenticated user's Favorites appear.
- [ ] Favorites list ordering is deterministic.
- [ ] List is bounded/paginated if needed.
- [ ] Existing historical Favorite projection is reused.
- [ ] `customName ?? selectedRecipe.name` behavior is consistent with domain rules.
- [ ] Persisted Completion summary may be previewed.
- [ ] Persisted Nutrition summary may be previewed.
- [ ] Nutrition unavailable does not render fake zeroes.
- [ ] View meal reuses existing Completion route.
- [ ] Remove Favorite uses the real delete API.
- [ ] Remove does not delete Cooking Session.
- [ ] Remove does not delete History.
- [ ] Remove does not mutate Completion.
- [ ] Remove does not mutate Nutrition.
- [ ] Remove does not mutate Inventory.
- [ ] Remove does not mutate cooking progress.
- [ ] No Agent call occurs.
- [ ] Save from Phase 8 updates Favorites list state.
- [ ] Remove updates Favorite-by-session state.
- [ ] Remove updates History favorite indicator.
- [ ] Remove updates Nutrition Favorite action state.
- [ ] Empty state works.
- [ ] Loading state works.
- [ ] Error + retry works.
- [ ] BottomNavigation remains visible.
- [ ] Favorites nav is active.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

# 53. Agent Rule

Optimize for:

```text
saved-meal clarity
+
canonical Favorite persistence
+
simple library browsing
+
safe removal
+
cross-screen cache consistency
```

Do not optimize for:

```text
recipe marketplace behavior
collections
tags
search
Cook Again
new AI flows
```

Core rule:

> Favorites UI is a library of persisted saved meals, not a second recipe-generation system.

---

# 54. Phase Boundary

Phase 9C ends with:

```text
/app/favorites
→ canonical saved-meal library
→ open completed meal
→ remove Favorite safely
```

ready for:

```text
Phase 9D
Inventory Management
```
