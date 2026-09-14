# Flemme User Platform — O2 Profile Preferences

## Purpose

F2 — Empty Inventory Initialization is accepted.

Current onboarding milestone:

```text
O1  Onboarding Flow Foundation     ✅ ACCEPTED
F1  Redirect Loop Fix              ✅ ACCEPTED
F2  Empty Inventory Initialization ✅ ACCEPTED
O2  Profile Preferences            ← CURRENT TASK
O3  Household                      ⏳
O4  Kitchen Equipment              ⏳
O5  Initial Inventory              ⏳
O6  Completion → Home              ⏳
O7  End-to-End Acceptance          ⏳
```

Implement only:

```text
O2 — Profile Preferences
```

Do NOT implement Household, Kitchen, or Inventory forms yet.

Do NOT modify Auth.

Do NOT redesign Profile API.

Do NOT add displayName to Profile v0.1.

---

# 1. Existing Profile API

Use the accepted API:

```http
GET /profile
PUT /profile
```

Current public contract:

```ts
{
  foodPreferences: string[];
  cookingPreferences: string[];
}
```

Missing Profile:

```text
404 PROFILE_NOT_FOUND
```

`PUT /profile` is full-resource replacement for both arrays.

Do not introduce:

```text
PATCH /profile
/profile/food-preferences
/profile/cooking-preferences
```

---

# 2. Product Responsibility

The Profile onboarding step collects only persistent cooking-personalization signals.

Scope:

```text
foodPreferences[]
cookingPreferences[]
```

Out of scope:

```text
displayName
avatar
email
Auth name
Household
Kitchen
Inventory
diet medical data
budget
```

Important boundary:

```text
Auth users.name
≠
Product Profile displayName
```

Do not copy Auth name into Product Profile.

---

# 3. Locked UX

The Profile onboarding step must support:

```text
Profile
[Continue] [Skip]
```

Meaning:

```text
Continue
→ persist current selections

Skip
→ persist:
{
  foodPreferences: [],
  cookingPreferences: []
}
```

Skip is NOT:

```text
navigate without persistence
```

After Skip, Profile must exist.

That allows onboarding state to advance without any additional progress flag.

---

# 4. Route

Use the existing onboarding route:

```text
/onboarding/profile
```

Replace the current placeholder/shell content with the real Profile Preferences UI.

Keep:

```text
Auth guard
O1 onboarding reconciliation
resume behavior
```

unchanged unless a concrete integration issue appears.

---

# 5. Missing Profile Behavior

When:

```http
GET /profile
→ 404 PROFILE_NOT_FOUND
```

render a valid empty selection state:

```ts
foodPreferences = []
cookingPreferences = []
```

Do NOT persist automatically on page load.

The Profile becomes initialized only when the user explicitly chooses:

```text
Continue
or
Skip
```

---

# 6. Existing Profile Behavior

When:

```http
GET /profile
→ 200
```

prepopulate the current persisted values.

The route must also work as an edit surface when revisited.

Existing selections must not be lost before the user saves.

---

# 7. Preference UX

Use a practical multi-select UI.

Prefer:

```text
chips
selectable cards
toggle pills
```

over:

```text
free-form JSON
comma-separated raw text
```

The UI must clearly distinguish:

```text
selected
unselected
```

and remain keyboard accessible.

Do not rely only on color for selected state.

---

# 8. Preference Vocabulary Audit

Before hardcoding values, inspect the repository for existing Profile/Agent fixtures, design docs, or agreed preference strings.

Reuse existing stable values when present.

If no canonical UI vocabulary exists, define a small v0.1 list only.

Do NOT build a preference CMS or database master table.

Document the chosen stored values in the implementation report.

---

# 9. Food Preference Semantics

Food preferences are personalization/ranking signals.

They should not imply hard filtering unless the underlying Cooking Engine explicitly treats a value as a restriction.

Potential concepts may include:

```text
Indonesian
Asian
Western
spicy
savory
sweet
```

But inspect current Agent contracts and fixtures first.

Do not invent semantics that conflict with the Cooking Engine.

---

# 10. Cooking Preference Semantics

Cooking preferences are cooking-style/practicality signals.

Potential concepts may include:

```text
quick
simple
one-pan
low-effort
grilled
fried
```

Again, inspect the repository before deciding exact values.

Keep the v0.1 list small and understandable.

---

# 11. Stored Values vs Labels

Prefer stable stored values.

Example conceptually:

```text
UI label:
Masak Cepat

stored value:
quick
```

or use the repository's current language convention if one already exists.

Do not introduce a localization framework in O2.

Do not store unstable purely-presentational strings if avoidable.

---

# 12. Empty Values Are Valid

This is a valid persisted Profile:

```json
{
  "foodPreferences": [],
  "cookingPreferences": []
}
```

Do not require:

```text
at least one food preference
at least one cooking preference
```

The user must be able to:

```text
Skip
```

and continue onboarding.

---

# 13. Continue Behavior

On Continue:

```http
PUT /profile
```

with the complete current state:

```json
{
  "foodPreferences": [...],
  "cookingPreferences": [...]
}
```

Because Profile uses full replacement, always submit both arrays.

Do not send only the field that changed.

---

# 14. Skip Behavior

On Skip:

```http
PUT /profile
```

with:

```json
{
  "foodPreferences": [],
  "cookingPreferences": []
}
```

After success:

```text
Profile exists
→ onboarding state recomputed
→ move to next incomplete step
```

For a fresh user, expected:

```text
/onboarding/household
```

---

# 15. TanStack Query Integration

Use TanStack Query for persisted Profile state.

Unsaved selections may remain local form/component state.

Do not put unsaved preferences in:

```text
Auth context
global app store
localStorage
```

---

# 16. Query Cache Synchronization

O1 observed potential stale onboarding state after same-session mutations.

O2 must explicitly fix this mutation flow.

After successful:

```http
PUT /profile
```

invalidate/refetch at least:

```text
Profile query
Onboarding decision dependencies
```

Use the actual existing query keys.

Expected:

```text
PUT success
→ Profile cache updated/invalidated
→ onboarding resources re-evaluated
→ nextStep recalculated
→ navigation
```

Do not require page refresh.

---

# 17. Navigation After Save

Do not blindly hardcode:

```text
/profile
→ /household
```

Instead:

```text
save
→ recompute onboarding decision
→ navigate to actual nextStep
```

Typical fresh-user result:

```text
Profile ✅
Household ❌
→ /onboarding/household
```

But if Household is already complete and Kitchen is missing:

```text
→ /onboarding/kitchen
```

If all domains are complete:

```text
→ /app
```

---

# 18. Revisiting Completed Profile

A user may revisit:

```text
/onboarding/profile
```

according to the existing O1 route rules.

If route reconciliation currently prevents revisiting completed earlier steps, inspect and preserve the agreed behavior from O1/F1.

Do not weaken onboarding correctness only to turn this route into a general Settings page.

A future settings/profile surface may be separate.

---

# 19. Loading State

Handle:

```text
initial GET /profile
PUT mutation
post-save refetch
```

clearly.

Avoid duplicate submits.

Disable Continue/Skip while the same mutation is pending.

Do not show a false successful transition before persistence succeeds.

---

# 20. Error Semantics

Expected:

```text
GET /profile 404 PROFILE_NOT_FOUND
→ normal new-user state
```

Auth:

```text
401
→ existing Auth behavior
```

Validation/domain error:

```text
show useful form feedback
do not advance
```

Unexpected:

```text
500
network error
invalid response
→ real error state
```

Do not mark Profile complete on failed PUT.

---

# 21. API Error Contract

Product Domain errors use:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

Use the existing Product Domain API helper.

Do not mix Better Auth native errors into Profile mutation handling.

---

# 22. Responsive UX

Validate at minimum:

```text
390px mobile width
desktop width
```

No horizontal overflow.

Preference controls should wrap naturally.

Keep UI aligned with the existing Flemme mobile-first visual direction.

---

# 23. Accessibility

Preference controls must be usable via keyboard.

Expose selected state through semantics such as:

```text
aria-pressed
checkbox semantics
selected text/icon
```

as appropriate.

Continue and Skip must have clear labels.

---

# 24. No Backend Changes Expected

Expected:

```text
NO backend changes
NO migration
NO new endpoint
```

The current Profile API already supports all O2 requirements.

If a genuine blocker appears:

```text
stop and report it
```

before changing API contracts.

---

# 25. Cooking Context Compatibility

After save, the persisted values must remain visible to the existing cooking-context service.

Existing backend integration already proves Profile feeds:

```text
foodPreferences
cookingPreferences
```

into Recommendation context.

Do not modify the Cooking Engine.

Run existing backend regression where appropriate.

---

# 26. Tests

Add frontend coverage for at least:

```text
1. missing Profile renders empty selections

2. existing Profile prepopulates food preferences

3. existing Profile prepopulates cooking preferences

4. food preference can be selected/unselected

5. cooking preference can be selected/unselected

6. Continue submits both arrays

7. Skip submits both empty arrays

8. empty arrays are accepted as completed Profile

9. duplicate submit is prevented while pending

10. successful mutation synchronizes Profile query

11. successful mutation recomputes onboarding decision

12. fresh user advances to Household

13. another partially initialized user advances to actual next step

14. complete user resolves to /app where applicable

15. failed PUT does not navigate

16. 404 is treated as missing Profile

17. unexpected GET failure is treated as error

18. existing persisted values can be edited
```

Use the existing web testing approach.

---

# 27. Manual Browser Acceptance

Run:

```text
apps/api
apps/web
```

with Better Auth.

## Fresh user — Continue

```text
register/login
→ /onboarding/profile
→ choose preferences
→ Continue
→ PUT succeeds
→ immediately navigate to next incomplete step
```

No refresh.

## Fresh user — Skip

```text
/onboarding/profile
→ Skip
→ persist [] / []
→ immediately navigate to next incomplete step
```

Verify:

```http
GET /profile
→ 200
```

after Skip.

## Existing Profile

Use an account with Profile already persisted.

Verify:

```text
current values visible
→ edit
→ save
→ backend values updated
```

## Refresh

After completing Profile:

```text
refresh/re-login
→ onboarding must not return to Profile if Profile still exists
```

---

# 28. Cache-Staleness Acceptance

Specifically reproduce the O1 nuance.

Without a browser refresh:

```text
Profile missing
→ PUT /profile
→ Profile becomes complete
```

Expected immediately:

```text
onboarding decision sees new state
→ navigation advances
```

There must be no stale same-session requirement to manually refresh.

Document which queries were invalidated/refetched.

---

# 29. Regression Gates

Run:

```text
O2 focused frontend tests
full apps/web tests
workspace typecheck
web build
API build
full API suite
web lint
scoped Biome
git diff --check
```

No migration expected.

---

# 30. Documentation

Update:

```text
docs/progress-tracker.md
apps/web docs if necessary
onboarding plan/context if a new locked preference vocabulary is introduced
```

Checkpoint:

```text
O1  Onboarding Flow Foundation      ✅
F1  Redirect Loop Fix               ✅
F2  Empty Inventory Initialization  ✅
O2  Profile Preferences             ✅
O3  Household                       ← NEXT
```

Do not implement O3 as part of this task.

---

# 31. Required Report

Return:

```md
# Flemme User Platform O2 — Profile Preferences Report

## Route

- path:
- auth:
- onboarding reconciliation:

## UI

### Food Preferences
- control:
- options:

### Cooking Preferences
- control:
- options:

### Actions
- Continue:
- Skip:

## Stored Values

### Food
- ...

### Cooking
- ...

Explain value/label conventions.

## Missing Profile

- GET behavior:
- initial form:
- persistence trigger:

## Existing Profile

- prepopulation:
- editing:

## Continue

- payload:
- mutation:
- navigation:

## Skip

- payload:
- mutation:
- resulting Profile:
- navigation:

## Query Synchronization

- Profile query:
- onboarding decision:
- invalidation/refetch:
- stale-cache fix:

## Error Handling

- 404:
- 401:
- mutation failure:
- unexpected error:

## Cooking Context

- persisted values:
- Recommendation compatibility:

## Backend Changes

Expected:
None.

## Tests Added

## Manual Acceptance

### Continue
- result:

### Skip
- result:

### Existing Profile
- result:

### Refresh/Re-login
- result:

### Same-session Cache
- result:

## Validation Results

- O2 tests:
- web tests:
- full API:
- typecheck:
- web build:
- API build:
- lint:
- Biome:
- git diff --check:

## Files Changed

## Decisions / Constraints Discovered

## Final Status

User Platform O2 ✅ ACCEPTED

or explain the remaining blocker.

## Next Task

User Platform O3 — Household

Do not implement O3 in this task.
```
