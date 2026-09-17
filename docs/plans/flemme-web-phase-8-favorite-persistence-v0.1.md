# Flemme Web — Phase 8: Favorite Persistence & Review v0.1

## Status

**Implementation Task**

Phase 7 Nutrition & Nutrition Review is complete.

Phase 8 connects the completed Cooking Session to the existing Favorites capability.

## Scope

```text
Nutrition Review
→ Save to Favorites
→ Persist Favorite
→ Favorite Confirmation
→ Return / Continue
```

This phase must reuse the existing Favorites API and existing Cooking Session eligibility rules.

Do not redesign the Favorites domain.

---

## 1. Core Flow Context

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

Phase 8 owns:

```text
Nutrition Review
→ Favorite Persistence
```

---

## 2. Existing Favorites Backend

The Favorites API already exists and has validated behavior for:

```text
create favorite
list favorites
delete favorite
ownership enforcement
completed-session eligibility
duplicate prevention
historical recipe projection
```

Reuse it.

Do not create a second Favorite persistence model.

---

## 3. Eligibility Rule

Favorite creation requires:

```text
completed owned Cooking Session
```

Preserve this rule.

Do not allow:

```text
active
paused
abandoned
cross-user
missing
```

sessions to create a normal Favorite.

---

## 4. Duplicate Rule

Duplicate Favorite creation is already guarded.

Expected:

```text
same eligible Cooking Session
→ one Favorite only
```

If the API returns:

```text
409 FAVORITE_ALREADY_EXISTS
```

treat it as an already-saved product state, not a fatal error.

---

## 5. Favorite Source of Truth

Favorite must be derived from the persisted completed Cooking Session.

Do not construct a Favorite from transient Recommendation or Pre-Cooking state.

```text
sessionId
↓
persisted completed Cooking Session
↓
existing Favorites API
```

---

## 6. customName

Use the established display priority where appropriate:

```text
customName
↓
selectedRecipe.name
```

Do not overwrite the immutable selected recipe name.

Preserve existing historical recipe projection.

---

## 7. Nutrition Independence

Nutrition may be:

```text
complete
partial
unavailable
```

Favorite eligibility must not depend on Nutrition coverage.

A completed meal may still be favorited if Nutrition could not be calculated.

---

## 8. Completion Independence

Do not regenerate Completion during Favorite creation.

Favorite uses the existing completed-session eligibility boundary.

---

## 9. Mandatory UI Stack

Continue using:

```text
React
TanStack Router
TanStack Query
Tailwind CSS
shadcn/ui
Lucide
```

No new UI framework.

---

## 10. Nutrition CTA Integration

Wire the Phase 7 action:

```text
Save to favorites
```

to the real Favorites persistence flow.

Do not leave it as a placeholder.

---

## 11. Preferred Interaction

Keep the Nutrition Review page visible.

Flow:

```text
Save to favorites
↓
pending
↓
favorite persisted
↓
saved state
```

Do not force a route change just to save.

---

## 12. TanStack Query Mutation

Use a dedicated mutation, conceptually:

```ts
useCreateFavoriteMutation(sessionId)
```

Responsibilities:

- call existing Favorites API
- prevent duplicate submission
- handle duplicate state
- return canonical persisted Favorite
- update Favorite query caches

Do not call `fetch()` directly from the visual button component.

---

## 13. Query Keys

Reuse or establish stable Favorite query keys.

Conceptually:

```ts
favoritesQueryKey()
favoriteBySessionQueryKey(sessionId)
```

Do not scatter ad-hoc keys.

---

## 14. Cache Update

After successful creation:

```text
update/invalidate Favorites list cache
```

If a session-specific Favorite query exists:

```text
seed/update it
```

Do not maintain a separate local-only Favorite object.

---

## 15. Duplicate Submission Prevention

While pending:

```text
disable Save to favorites
```

Reuse the backend duplicate guard as durable protection.

---

## 16. Pending State

Suggested copy:

```text
Saving...
```

Keep Nutrition Review visible.

---

## 17. Success State

After success:

```text
Saved to favorites
```

Possible treatment:

```text
filled Heart icon
success Badge
disabled Saved button
```

Keep this compact.

---

## 18. Already Favorited State

If already favorited:

```text
Saved to favorites
```

must be restored from persisted server state.

Do not keep an enabled Save action.

---

## 19. Duplicate API Response

If create returns:

```text
409 FAVORITE_ALREADY_EXISTS
```

converge to the saved state where possible.

Do not show a generic server error.

---

## 20. Error State

On real failure:

- keep Nutrition Review intact
- preserve completed session
- preserve Nutrition snapshot
- show retry
- do not regenerate Completion
- do not regenerate Nutrition

Do not show raw backend errors.

---

## 21. Ownership / Domain Errors

Preserve existing behavior:

```text
cross-user create → 403
missing session → 404
non-completed → 409
corrupt session → controlled error
```

Do not convert invalid states into success.

---

## 22. Favorite UI Component

Create a feature-level component such as:

```text
favorite-action.tsx
```

Responsibilities:

```text
save
pending
saved
retry
already-saved
```

Do not place Favorite business logic in `components/ui`.

---

## 23. Recommended Feature Structure

Preferred:

```text
apps/web/src/features/favorites/
├── favorite-action.tsx
├── favorite-query.ts
├── favorite-mutations.ts
└── index.ts
```

If a Favorites feature already exists, extend it instead of duplicating it.

---

## 24. shadcn Usage

Likely primitives:

```text
Button
Badge
Alert
```

Only where useful.

No dialog is required for a simple one-tap save.

---

## 25. Favorite Title Display

Use:

```text
customName ?? selectedRecipe.name
```

where the Favorite presentation supports session display naming.

Keep original historical recipe snapshot unchanged.

---

## 26. Historical Snapshot Principle

Favorite should preserve historical meal information.

Do not make Favorite depend on live/transient Recommendation state.

If the current Favorites API snapshots recipe summary fields:

```text
keep that behavior
```

---

## 27. Delete Behavior

Delete already exists in the API.

For this phase, prefer:

```text
save only
```

on Nutrition Review.

Full remove/delete UX can live on the Favorites page later.

---

## 28. Refresh Safety

After save:

```text
full refresh
→ saved state restored from server
```

Do not rely on local component state.

---

## 29. Direct Route Safety

Direct visit to:

```text
/app/cooking/$sessionId/nutrition
```

after Favorite persistence must show the correct saved state.

No transient navigation state required.

---

## 30. Bottom Navigation

Keep hidden on Nutrition Review.

Favorite persistence does not change the focused post-cooking layout.

---

## 31. No Inventory Mutation

Favorite creation causes:

```text
zero Inventory mutations
```

---

## 32. No Completion Mutation

Do not modify:

```text
completion_snapshot
```

---

## 33. No Nutrition Mutation

Do not modify:

```text
nutrition_snapshot
```

---

## 34. No Cooking Progress Mutation

Do not change:

```text
status
currentStageId
currentStepId
completedStepIds
changes
```

---

## 35. No Agent Call

Favorite persistence is deterministic product data.

Do not invoke any agent.

---

## 36. History Compatibility

Favorite creation must not create a duplicate Cooking History entry.

History remains based on persisted completed Cooking Sessions.

Favorite is additional preference state.

---

## 37. Future Favorites Page

Persist the canonical Favorite resource so it can later power:

```text
/app/favorites
```

Do not create a Nutrition-only Favorite format.

---

## 38. Tests — API

Preserve and/or extend coverage for:

```text
completed owned session → favorite created
non-completed session → rejected
cross-user create → 403
missing session → 404
corrupt session → controlled error
duplicate → 409 FAVORITE_ALREADY_EXISTS
one row persisted
delete does not delete Cooking Session
historical projection preserved
Nutrition unavailable does not block Favorite
```

---

## 39. Tests — Web

Add coverage for:

```text
Save to favorites available for eligible completed session
pending disables duplicate save
success shows saved state
duplicate response converges to saved state
real error shows retry
refresh restores saved state
customName display where appropriate
complete Nutrition can favorite
partial Nutrition can favorite
unavailable Nutrition can favorite
no Completion regeneration
no Nutrition regeneration
no Inventory mutation
```

---

## 40. Network Verification

On first save:

```text
exactly 1 Favorite create request
```

Verify zero accidental:

```text
Recommendation
Pre-Cooking
Cooking Session create
Active Cooking progress
Completion generation
Nutrition generation
Inventory mutation
```

Refresh must not create another Favorite.

---

## 41. Browser Verification

Verify at:

```text
320px
390px
768px
1440px
1920px
```

Check:

- CTA fits mobile
- pending state readable
- saved state clear
- retry accessible
- no horizontal overflow
- compact desktop canvas preserved
- BottomNavigation hidden
- refresh restores saved state

---

## 42. Validation

Run:

```text
web typecheck
shared contracts typecheck if touched
web production build
API build
web tests
API tests
Favorites integration tests
Biome
Oxlint
```

Report the known OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

## 43. Non-Goals

Do not implement:

```text
full Favorites page
Cooking History page
Resume Active Session UI
Inventory Management UI
Favorite sorting/filtering
Favorite tags
Favorite folders/collections
```

Do not redesign Nutrition.

---

## 44. Suggested Implementation Order

```text
1. Inspect existing Favorites API and response shapes.
2. Confirm create payload is session-based.
3. Confirm duplicate error contract.
4. Confirm persisted Favorite response shape.
5. Reuse/create canonical Favorite query keys.
6. Create Favorite mutation.
7. Wire Nutrition CTA.
8. Add pending state.
9. Add saved/already-saved state.
10. Add retryable error handling.
11. Restore saved state on refresh.
12. Update Favorites list cache.
13. Add tests.
14. Browser/network verify.
15. Run validation.
16. Update architecture/progress docs.
```

---

## 45. Definition of Done

- [ ] Nutrition Review uses the real Favorites API.
- [ ] Only eligible completed owned sessions can be favorited.
- [ ] Nutrition completeness does not affect Favorite eligibility.
- [ ] Duplicate submission is prevented.
- [ ] API duplicate guard remains active.
- [ ] 409 duplicate becomes an already-saved state.
- [ ] Successful save persists canonical Favorite.
- [ ] Saved state survives refresh.
- [ ] Favorite query caches update correctly.
- [ ] Existing display-name logic is respected where appropriate.
- [ ] Original recipe snapshot remains preserved.
- [ ] Completion snapshot remains unchanged.
- [ ] Nutrition snapshot remains unchanged.
- [ ] Cooking progress remains unchanged.
- [ ] Inventory remains unchanged.
- [ ] No agent call occurs.
- [ ] No duplicate History entry is created.
- [ ] BottomNavigation remains hidden.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

## 46. Agent Rule

Optimize for:

```text
one-tap save
+
existing Favorite domain reuse
+
durable saved state
+
duplicate safety
+
clean cache synchronization
```

Do not optimize for:

```text
new Favorite features
collections
tags
history duplication
extra AI behavior
```

Core rule:

> Favorite is persisted preference state for a completed Cooking Session, not a new recipe-generation flow.

---

## 47. Phase Boundary

Phase 8 ends with:

```text
completed Cooking Session
+
Completion snapshot
+
Nutrition snapshot
+
persisted Favorite state
```

ready for:

```text
Resume Active Session
Cooking History
Favorites UI
Inventory Management
```
