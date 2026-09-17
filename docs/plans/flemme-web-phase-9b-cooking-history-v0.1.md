# Flemme Web — Phase 9B: Cooking History v0.1

## Status

**Implementation Task**

Phase 9A Resume Active Session is complete.

Phase 9B adds a real Cooking History experience backed by persisted completed Cooking Sessions.

## Scope

```text
Completed Cooking Sessions
→ History Projection
→ /app/history
→ History List
→ Open Completed Session
```

This phase must **not** create a second History persistence model.

Cooking History is a projection of completed persisted Cooking Sessions.

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

Phase 9B owns:

```text
Cooking History
```

---

# 2. Core Domain Rule

Cooking History is derived from:

```text
persisted Cooking Session
where status = completed
```

Do not create:

```text
history table
history snapshot duplicate
history record on Completion
history record on Favorite
```

unless the existing architecture already has a canonical History resource.

Preferred model:

```text
Cooking Session
= source of truth

History
= read projection
```

---

# 3. Eligibility

A session appears in Cooking History when:

```text
status = completed
```

Do not include:

```text
active
paused
abandoned
```

in the normal Cooking History list.

Abandoned-session history may be a future feature if needed.

---

# 4. Ownership

History must only expose sessions owned by the authenticated user.

Expected:

```text
own completed sessions → visible
cross-user sessions → never returned
```

Do not rely only on client filtering.

Enforce ownership server-side.

---

# 5. Existing Completed Session Data

A completed Cooking Session may already contain:

```text
sessionId
selected recipe
customName
cookingPlan
changes[]
completion_snapshot
nutrition_snapshot
favorite relation/state
createdAt
updatedAt
completedAt
```

History should project only the fields needed for the list.

Do not send the full immutable cooking plan for every history card unless required.

---

# 6. Display Name

Use the locked display priority:

```text
customName
↓
selectedRecipe.name
```

Do not introduce another naming rule.

---

# 7. Ordering

History should be ordered by most recently completed first.

Preferred:

```text
completedAt DESC
```

Use deterministic tie-breaking.

Conceptually:

```text
completedAt DESC
createdAt DESC
sessionId DESC
```

or the existing database convention.

Do not order by client-local time.

---

# 8. API Boundary

Inspect existing Cooking Session list endpoints first.

If an existing endpoint can safely provide completed-session history:

```text
reuse it
```

Otherwise add one focused endpoint.

Preferred direction:

```text
GET /cooking-sessions/history
```

or:

```text
GET /cooking-sessions?status=completed
```

Use the existing API style.

Do not create both.

---

# 9. History Projection Contract

Add/reuse a browser-safe shared contract.

Conceptual shape:

```ts
type CookingHistoryItem = {
	sessionId: string;
	displayName: string;
	completedAt: string;
	summary?: {
		title?: string;
		description?: string;
	};
	nutrition?: {
		status: "complete" | "partial" | "unavailable";
		caloriesKcal?: number;
		proteinG?: number;
	};
	isFavorite?: boolean;
};
```

This is conceptual.

Use the actual current contract naming and existing snapshot shapes.

Do not duplicate large nested session payloads unnecessarily.

---

# 10. Pagination Strategy

History can grow indefinitely.

Use a simple scalable read strategy.

Preferred v0.1:

```text
limit
+
cursor or offset according to current API conventions
```

Recommended initial page size:

```text
10–20 items
```

Do not fetch every historical session forever.

Avoid building a complex infinite-scroll system if the current project does not need it.

A simple:

```text
Load more
```

is acceptable.

---

# 11. Route

Use the existing placeholder route:

```text
/app/history
```

Replace placeholder content with the real History feature.

Keep the route thin.

Conceptually:

```tsx
function HistoryRoute() {
	return <CookingHistoryPage />;
}
```

Do not put full list markup inside the route file.

---

# 12. Recommended Feature Structure

Preferred:

```text
apps/web/src/features/history/
├── cooking-history-page.tsx
├── cooking-history-query.ts
├── cooking-history-list.tsx
├── cooking-history-card.tsx
├── cooking-history-empty.tsx
├── cooking-history-loading.tsx
├── cooking-history-error.tsx
└── index.ts
```

Follow current project conventions.

Do not place History business logic inside:

```text
components/ui
```

---

# 13. Page Goal

History should answer:

```text
What have I cooked?
When did I cook it?
What was the result?
Was it favorited?
Can I reopen the completed session?
```

It is not an analytics dashboard.

---

# 14. Recommended Page Composition

Conceptual:

```text
Cooking History

Your completed meals, all in one place.

┌──────────────────────────────┐
│ Nasi Goreng Kentang Telur    │
│ Sep 17 · 20:42               │
│                              │
│ Warm savory fried rice...    │
│                              │
│ ~420 kcal · 18g protein      │
│                         ♥    │
│                              │
│ View meal →                  │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Ayam Kecap                   │
│ Sep 16 · 18:10               │
│ ...                          │
└──────────────────────────────┘

[ Load more ]
```

Directional only.

---

# 15. History Card

Create:

```text
cooking-history-card.tsx
```

Use shadcn `Card`.

Recommended information priority:

```text
1. display name
2. completed date/time
3. short completion summary
4. nutrition summary when available
5. favorite indicator
6. View meal CTA
```

Do not show:

```text
full cooking plan
all preparation steps
all changes
full Nutrition coverage details
```

Those belong to detail pages.

---

# 16. Completion Summary

If:

```text
completion_snapshot.summary.description
```

exists, show a short preview.

Keep it concise.

Use natural wrapping or line clamp.

Do not generate a new History summary.

Reuse persisted Completion output.

---

# 17. Nutrition Summary

Nutrition may be:

```text
complete
partial
unavailable
```

Recommended:

### Complete / Partial

Show a compact summary if values exist:

```text
~420 kcal · 18g protein
```

Use approximate marker consistently with the persisted Nutrition snapshot.

### Unavailable

Do not show:

```text
0 kcal
```

Either omit the macro row or show:

```text
Nutrition unavailable
```

subtly.

---

# 18. Favorite Indicator

If canonical Favorite state is available:

```text
Heart filled
```

or:

```text
Saved
```

may be shown.

This is read-only in Phase 9B unless the existing canonical Favorite mutation can be reused trivially.

Preferred:

```text
indicator only
```

Full Favorite management belongs to Phase 9C.

---

# 19. Date Formatting

Use the persisted:

```text
completedAt
```

as the historical timestamp.

Do not use:

```text
updatedAt
```

as the primary cooked date if `completedAt` exists.

Format in the user's local locale/timezone using the current app conventions.

Do not manually hardcode month names if the app already uses locale formatting utilities.

---

# 20. View Meal Behavior

History item should open the existing completed-session flow.

Preferred:

```text
/app/cooking/$sessionId/completion
```

because Completion is the canonical post-cooking review.

Do not create a duplicate History detail page unless genuinely necessary.

This reuses:

```text
Completion
Nutrition
Favorite state
```

already implemented.

---

# 21. Detail Route Source of Truth

Clicking History:

```text
sessionId
→ persisted session
→ existing Completion route
```

No transient History object should be required.

Refresh remains safe.

---

# 22. Nutrition Access From History

The existing Completion page can continue forward to:

```text
Nutrition
```

Do not duplicate Nutrition inside the History feature.

---

# 23. Favorite Access From History

Favorite saved state remains canonical.

Do not create a second History-local favorite relation.

---

# 24. Empty State

Use the shared:

```text
EmptyState
```

or a small History-specific wrapper around it.

Suggested:

```text
No cooking history yet

Meals you finish with Flemme will show up here.

[ Start cooking ]
```

The CTA should route to:

```text
/app
```

Do not use fake history examples.

---

# 25. Loading State

Use shared `Skeleton` / loading primitives.

Prefer card-shaped skeletons.

Do not block the whole AppShell.

---

# 26. Error State

History API failure should show:

```text
Couldn't load your cooking history.
[ Try again ]
```

Use shared `ErrorState` where appropriate.

Do not show raw backend errors.

BottomNavigation should remain usable.

---

# 27. Bottom Navigation

History is a global app destination.

Keep:

```text
BottomNavigation visible
```

with:

```text
History
```

active.

Do not use the focused cooking layout here.

---

# 28. Mobile-First Layout

History remains within the compact app canvas.

Use:

```text
single-column vertical list
```

for:

```text
320px
390px
768px
desktop
```

Do not transform History into a 3-column card grid on desktop.

---

# 29. Desktop Behavior

Keep the existing:

```text
~572px centered app canvas
```

Do not introduce a wide timeline/dashboard.

---

# 30. shadcn Usage

Expected primitives:

```text
Card
Button
Badge
Skeleton
```

Potentially:

```text
Separator
```

Use only where helpful.

---

# 31. Query Architecture

Use TanStack Query.

Conceptually:

```ts
cookingHistoryQueryKey(params?)
```

Keep one canonical history query model.

Do not call `fetch()` directly from cards.

---

# 32. Cache Synchronization

History should become current after:

```text
session completes
```

Phase 5B / Phase 6 completion transitions should invalidate/update History query where appropriate.

Do not require a full browser refresh to see a newly completed meal.

---

# 33. Rename Synchronization

If a completed Cooking Session is renamed using `customName`:

```text
History title should update
```

Invalidate/update History query after rename if the History projection uses server data.

Do not keep stale names.

---

# 34. Favorite Synchronization

After Phase 8 Favorite creation:

```text
History favorite indicator should update
```

through canonical query invalidation/cache synchronization.

Do not require duplicate Favorite data.

---

# 35. Nutrition Synchronization

If History displays Nutrition summary and the Nutrition snapshot is generated after Completion:

```text
History should eventually reflect the canonical snapshot
```

Invalidate/update appropriately.

Do not recalculate Nutrition inside History.

---

# 36. History Is Read-Only

Phase 9B should primarily be read-only.

Do not add:

```text
delete cooking session
edit cooking plan
edit completion
edit nutrition
```

unless existing product rules explicitly support them.

---

# 37. Abandoned Sessions

Do not show abandoned sessions in normal Cooking History v0.1.

Do not delete them.

They remain persisted lifecycle records and may support a future filter.

---

# 38. Active / Paused Sessions

Do not show active/paused sessions in Cooking History.

They belong in:

```text
Continue Cooking
```

on Home.

---

# 39. Search / Filter

Do not implement:

```text
search
date filters
favorite filters
nutrition filters
sorting controls
```

in v0.1.

Start with clear chronological history.

---

# 40. Historical Integrity

History must render persisted historical snapshots.

Do not regenerate:

```text
Completion
Nutrition
Recommendation
Pre-Cooking
```

just to display a card.

---

# 41. No Agent Call

History is deterministic retrieval.

No Agent call is required.

---

# 42. No Inventory Mutation

History causes:

```text
zero Inventory mutations
```

---

# 43. No Session Progress Mutation

Viewing History must not mutate:

```text
status
currentStageId
currentStepId
completedStepIds
changes
```

---

# 44. Tests — API

Add coverage for:

```text
only completed owned sessions returned
active excluded
paused excluded
abandoned excluded
cross-user excluded
most recent completed first
deterministic tie-break order
customName display projection
original-name fallback
completion summary projection
nutrition complete projection
nutrition partial projection
nutrition unavailable projection
favorite indicator projection
pagination/limit behavior
```

---

# 45. Tests — Web

Add coverage for:

```text
history route uses real query
loading state
error + retry
empty state
history cards render
customName title
original-name fallback
completed date
completion summary
nutrition complete
nutrition partial
nutrition unavailable
favorite indicator
View meal route
BottomNavigation visible
History nav active
Load more if implemented
```

Preserve all existing tests.

---

# 46. Network Verification

Normal History visit should perform:

```text
auth/onboarding as currently required
+
one History read request
```

Opening a History card:

```text
navigate to existing completed-session route
```

Verify zero accidental:

```text
Recommendation
Pre-Cooking
Cooking Session create
Active Cooking progress
Completion generation
Nutrition generation
Favorite creation
Inventory mutation
```

---

# 47. Browser Verification

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
- long customName wraps/clamps correctly
- dates readable
- summary text does not dominate
- Nutrition unavailable looks intentional
- favorite indicator does not crowd CTA
- View meal easy to tap
- BottomNavigation visible
- History nav active
- compact 572px desktop canvas preserved

---

# 48. Validation

Run:

```text
web typecheck
shared contract typecheck if touched
web production build
API build
web tests
API tests
focused History integration tests
Biome
Oxlint
```

Report the existing malformed OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

# 49. Non-Goals

Do not implement:

```text
Favorites page
Inventory Management
History search
History filters
History deletion
session archive
abandoned-session UI
analytics
streaks
meal statistics
```

Do not redesign Completion or Nutrition.

---

# 50. Suggested Implementation Order

```text
1. Inspect existing Cooking Session list/query capabilities.
2. Define completed-session History projection.
3. Add/reuse browser-safe shared History item contract.
4. Add one History API boundary.
5. Add deterministic ordering.
6. Add simple pagination/limit.
7. Create history feature directory.
8. Create History query.
9. Replace /app/history placeholder.
10. Create CookingHistoryPage.
11. Create HistoryCard.
12. Add loading/error/empty states.
13. Apply customName display priority.
14. Add Completion summary projection.
15. Add Nutrition summary projection.
16. Add Favorite indicator projection.
17. Wire View meal to existing Completion route.
18. Synchronize cache after completion/rename/nutrition/favorite events.
19. Add tests.
20. Browser/network verify.
21. Run validation.
22. Update architecture/progress docs.
```

---

# 51. Definition of Done

- [ ] `/app/history` uses real persisted completed Cooking Sessions.
- [ ] No separate History persistence model is introduced.
- [ ] Only completed sessions appear.
- [ ] Active sessions are excluded.
- [ ] Paused sessions are excluded.
- [ ] Abandoned sessions are excluded.
- [ ] Ownership is enforced server-side.
- [ ] Most recent completed session appears first.
- [ ] Ordering is deterministic.
- [ ] History uses a bounded/paginated query.
- [ ] `customName ?? selectedRecipe.name` is respected.
- [ ] Completed timestamp is displayed.
- [ ] Persisted Completion summary may be previewed.
- [ ] Persisted Nutrition summary may be previewed.
- [ ] Nutrition unavailable never becomes fake zero values.
- [ ] Favorite state may be indicated from canonical Favorite data.
- [ ] No Completion regeneration occurs.
- [ ] No Nutrition recalculation occurs.
- [ ] No Agent call occurs.
- [ ] No Inventory mutation occurs.
- [ ] No Cooking Session progress mutation occurs.
- [ ] Empty state works.
- [ ] Loading state works.
- [ ] Retryable error state works.
- [ ] View meal reuses existing completed-session route.
- [ ] Refresh restores History from server.
- [ ] New completion updates History without requiring app restart.
- [ ] Rename updates History title.
- [ ] Favorite changes update History indicator.
- [ ] Nutrition generation updates History summary when relevant.
- [ ] BottomNavigation remains visible.
- [ ] History navigation state is active.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

# 52. Agent Rule

Optimize for:

```text
historical clarity
+
completed-session truth
+
compact readable cards
+
server-backed projections
+
reuse of existing post-cooking screens
```

Do not optimize for:

```text
analytics
filters
search
duplicate history storage
wide desktop layouts
```

Core rule:

> Cooking History is a read projection of completed Cooking Sessions, not a second lifecycle or persistence system.

---

# 53. Phase Boundary

Phase 9B ends with:

```text
/app/history
→ real completed-session history
→ persisted summary data
→ open existing Completion/Nutrition flow
```

ready for:

```text
Phase 9C
Favorites UI
```
