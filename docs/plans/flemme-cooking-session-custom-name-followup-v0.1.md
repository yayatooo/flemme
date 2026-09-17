# Flemme Web — Follow-up: Cooking Session customName / Rename Dish v0.1

## Status

**Small Follow-up Task**

Phase 5B Active Cooking is complete.

This task adds user-editable dish naming without mutating the immutable recipe or cooking plan.

## Scope

```text
Persisted Cooking Session
→ optional customName
→ Rename Dish UI
→ persisted display name
```

This is a session-metadata feature only.

Do not change:

```text
selectedRecipe.name
PreCookingOutput
cookingPlan
session.changes[]
```

---

## 1. Domain Decision

Locked rule:

```text
selectedRecipe + cookingPlan
= immutable historical source

CookingSession.customName
= mutable user-facing display metadata
```

A rename is not a recipe mutation and is not an Active Cooking change record.

---

## 2. Shared Contract

Extend the canonical Cooking Session contract with:

```ts
customName?: string | null;
```

Use the existing shared contract package:

```text
@flemme/contracts/cooking-session
```

Do not create a web-only duplicate type.

---

## 3. Display Name Priority

User-facing session titles resolve as:

```ts
const displayName =
	session.customName?.trim() ||
	session.selectedRecipe.name;
```

Priority:

```text
customName
↓
original selected recipe name
```

Do not overwrite the original recipe name.

---

## 4. Preserve Original Recipe

Example:

```text
Original:
Indonesian-Style Potato & Egg Rice Skillet

User rename:
Nasi Goreng Kentang Telur
```

Persist:

```text
customName = "Nasi Goreng Kentang Telur"
```

while keeping:

```text
selectedRecipe.name =
"Indonesian-Style Potato & Egg Rice Skillet"
```

unchanged.

---

## 5. Do Not Use `changes[]`

Do not persist rename as:

```ts
{
	kind: "other",
	description: "Renamed dish..."
}
```

`changes[]` remains for cooking deviations:

```text
ingredient
equipment
servings
step
other cooking-related changes
```

Dish naming is session metadata.

---

## 6. Persistence API

Add one persisted rename/update boundary.

Preferred:

```text
PATCH /cooking-sessions/:id
```

Payload:

```json
{
  "customName": "Nasi Goreng Kentang Telur"
}
```

If the existing API style strongly favors explicit routes, this is also acceptable:

```text
PATCH /cooking-sessions/:id/name
```

Use one approach only.

---

## 7. Validation

Recommended rules:

```text
- trim surrounding whitespace
- whitespace-only input must not persist
- sensible max length
- plain text only
```

Suggested max length:

```text
80–120 characters
```

Follow existing project validation conventions.

---

## 8. Clear Rename

Support returning to the original recipe name.

Preferred semantics:

```json
{
  "customName": null
}
```

Then display automatically falls back to:

```text
selectedRecipe.name
```

Do not copy the original name into `customName`.

---

## 9. Ownership

Preserve existing Cooking Session authorization.

Expected:

```text
own session → allowed
cross-user session → 403
missing session → 404
```

Do not weaken backend ownership rules.

---

## 10. Lifecycle States

Preferred metadata behavior:

```text
active     → rename allowed
paused     → rename allowed
completed  → rename allowed
abandoned  → rename allowed
```

This makes custom naming useful later for History/Favorites.

If current persistence policy forbids terminal-state edits, keep that existing policy and document it rather than inventing a conflicting UI rule.

---

## 11. Active Cooking UI Entry

Add rename as a secondary action in the focused header overflow menu.

Conceptual:

```text
⋯
Rename dish
Record change
Pause cooking
Abandon cooking
```

Do not make Rename a primary action.

---

## 12. shadcn UI

Use existing primitives:

```text
DropdownMenu
Dialog
Input
Button
```

If the current focused Active Cooking layout already uses Drawer/Sheet on mobile, reuse that pattern.

---

## 13. Rename Dialog

Conceptual:

```text
Rename this dish

[ Nasi Goreng Kentang Telur ]

Cancel        Save name
```

Preload the input with:

```text
customName ?? selectedRecipe.name
```

This is editing UX only.

Do not persist the fallback original name unless the user actually changes it.

---

## 14. Save Behavior

On Save:

```text
1. trim input
2. validate
3. prevent duplicate submission
4. persist customName
5. update canonical Cooking Session query cache
6. close dialog on success
7. update header from persisted server result
```

Do not keep the rename only in local component state.

---

## 15. TanStack Query

Use a dedicated mutation, for example:

```ts
useRenameCookingSessionMutation(sessionId)
```

Reuse the canonical query key:

```ts
cookingSessionQueryKey(sessionId)
```

After success:

```text
validated server response
→ canonical session cache
```

Avoid maintaining a second session copy.

---

## 16. Pending / Error UX

While saving:

```text
Save name
→ Saving...
```

Disable duplicate submits.

On error:

- keep dialog open
- preserve typed value
- show controlled local error
- allow retry
- keep cooking progress untouched

Do not show raw backend errors.

---

## 17. Concurrency Safety

Rename must not overwrite newer lifecycle state.

If actions such as these are already pending:

```text
Next
Previous
Pause
Resume
Complete
Abandon
```

reuse the existing Cooking Session mutation-locking strategy.

If the rename endpoint returns the full session snapshot, it must be the latest server state.

Do not replace the cache with stale progress.

---

## 18. Refresh Safety

After rename:

```text
full browser refresh
```

must restore `customName` through:

```text
GET /cooking-sessions/:id
```

Transient local/query-only state is not enough.

---

## 19. Header Display

The Active Cooking header should use:

```text
customName ?? selectedRecipe.name
```

Long names must wrap or truncate intentionally without pushing controls off-screen.

---

## 20. Downstream Compatibility

The same display-name rule should later be reusable by:

```text
Completion
Home Resume
Cooking History
Favorites
```

A small helper such as:

```ts
getCookingSessionDisplayName(session)
```

is acceptable if it removes real duplication.

Do not prematurely refactor screens that do not exist yet.

---

## 21. Completion Compatibility

Phase 6 should later display:

```text
customName ?? selectedRecipe.name
```

Do not modify Completion contracts in this task.

---

## 22. No Plan / Progress Mutation

Rename must not alter:

```text
cookingPlan
status
pauseReason
currentStageId
currentStepId
completedStepIds
changes
```

Stage IDs and step IDs remain untouched.

---

## 23. No Agent Call

Rename is deterministic metadata.

Do not invoke:

```text
Recommendation Agent
Pre-Cooking Agent
Active Cooking Agent
Completion Agent
```

No AI call is required.

---

## 24. No Inventory Mutation

Rename must produce:

```text
zero Inventory mutations
```

---

## 25. Likely Files

Follow the actual project structure, but likely areas include:

```text
packages/contracts/
  cooking-session contract

apps/api/src/modules/cooking-session/
  route
  service
  validation

apps/web/src/features/active-cooking/
  focused header
  overflow menu
  rename dialog
  rename mutation

apps/web/src/features/cooking-session/
  canonical query/cache helpers
```

---

## 26. Tests — Shared Contract

Cover:

```text
customName absent
customName valid
customName null
invalid length
whitespace-only request behavior
```

Place normalization tests at the actual responsibility boundary.

---

## 27. Tests — API

Cover:

```text
rename own session
clear customName
missing session → 404
cross-user rename → 403
original recipe remains unchanged
cooking plan remains unchanged
progress remains unchanged
terminal state rename behavior
```

---

## 28. Tests — Web

Cover:

```text
Rename dish action visible
dialog opens
input preloads current display value
save persists customName
header updates
duplicate save prevented
error preserves typed input
clear rename falls back to original recipe name
refresh restores custom name
rename does not trigger Active Cooking agent
rename does not trigger progress mutation
```

Preserve all existing tests.

---

## 29. Network Verification

One rename should produce:

```text
exactly 1 Cooking Session metadata mutation
```

and:

```text
0 Recommendation requests
0 Pre-Cooking requests
0 Active Cooking agent requests
0 progress mutations
0 Inventory mutations
0 Completion requests
0 Favorite mutations
```

---

## 30. Browser Verification

Verify at:

```text
320px
390px
768px
1440px
1920px
```

Check:

- dialog fits mobile
- input does not overflow
- keyboard focus visible
- save/cancel easy to tap
- long custom names do not break focused header
- compact desktop canvas unchanged
- refresh preserves renamed title

---

## 31. Validation

Run:

```text
web typecheck
shared contracts typecheck
production web build
API build
web tests
API tests
Cooking Session integration tests
Biome
Oxlint
```

Report the existing OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

## 32. Non-Goals

Do not implement:

```text
Phase 6 Completion
Nutrition
Favorite redesign
History UI
Home Resume redesign
Inventory mutation
recipe editing
cooking-plan editing
AI-generated rename suggestions
```

---

## 33. Suggested Implementation Order

```text
1. Inspect current Cooking Session shared contract.
2. Add optional customName.
3. Update persisted validation/serialization.
4. Add DB/storage migration if needed.
5. Add rename/update API boundary.
6. Preserve ownership rules.
7. Return latest validated Cooking Session.
8. Add canonical web mutation.
9. Reuse cookingSessionQueryKey.
10. Add Rename dish to Active Cooking overflow.
11. Add shadcn rename dialog.
12. Update focused header display name.
13. Implement clearing customName.
14. Verify refresh persistence.
15. Add tests.
16. Browser/network verify.
17. Run validation.
18. Update architecture/progress docs.
```

---

## 34. Definition of Done

- [ ] Shared Cooking Session supports `customName?: string | null`.
- [ ] Original selected recipe name remains unchanged.
- [ ] Immutable cooking plan remains unchanged.
- [ ] Rename persists server-side.
- [ ] Ownership rules are preserved.
- [ ] Rename does not use `changes[]`.
- [ ] Rename does not invoke an AI agent.
- [ ] Rename does not mutate cooking progress.
- [ ] Rename does not mutate Inventory.
- [ ] Active Cooking exposes `Rename dish` as a secondary action.
- [ ] Rename uses shadcn UI primitives.
- [ ] Dialog is mobile-friendly.
- [ ] Validation exists.
- [ ] Duplicate submission is prevented.
- [ ] Failure preserves typed input.
- [ ] Success updates canonical session cache.
- [ ] Header uses `customName ?? selectedRecipe.name`.
- [ ] Clearing customName restores original recipe name.
- [ ] Refresh preserves renamed display.
- [ ] Long names do not break the focused header.
- [ ] Existing Active Cooking lifecycle still passes.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

## 35. Agent Rule

Optimize for:

```text
simple metadata
+
immutable recipe history
+
persisted display name
+
safe session cache updates
+
small unobtrusive UI
```

Do not optimize for:

```text
recipe editing
plan mutation
AI naming
large rename workflow
```

Core rule:

> The user may rename the Cooking Session, but the original selected recipe and approved cooking plan remain immutable historical truth.
