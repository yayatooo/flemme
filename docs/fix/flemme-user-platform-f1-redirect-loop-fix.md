# Flemme User Platform — F1 Onboarding Redirect Loop Fix

## Purpose

This task is a focused fix before continuing to O2 Profile Preferences.

Current onboarding milestone:

```text
O1  Onboarding Flow Foundation     ✅ ACCEPTED
F1  Redirect Loop Fix              ← CURRENT TASK
F2  Empty Inventory Initialization ⏳
O2  Profile Preferences            ⏳
O3  Household                      ⏳
O4  Kitchen Equipment              ⏳
O5  Initial Inventory              ⏳
O6  Completion → Home              ⏳
O7  End-to-End Acceptance          ⏳
```

The goal of F1 is to eliminate the current:

```text
Error: Too many redirects
```

behavior observed for a newly authenticated user whose onboarding Product Domain resources are all missing.

Do NOT implement O2 forms.

Do NOT implement F2 Inventory initialization yet.

Do NOT change backend Product Domain semantics.

Do NOT add onboarding progress persistence.

---

# 1. Current Valid Fresh-User State

For a brand-new authenticated user, these responses are expected:

```text
GET /profile
→ 404 PROFILE_NOT_FOUND

GET /household
→ 404 HOUSEHOLD_NOT_FOUND

GET /kitchen
→ 404 KITCHEN_NOT_FOUND

GET /inventory
→ 404 INVENTORY_NOT_FOUND
```

These four 404 responses are legitimate onboarding state.

They are NOT application failures.

The expected derived decision is:

```text
profile   missing
household missing
kitchen   missing
inventory missing

nextStep = profile
required = true
```

Expected navigation:

```text
/app
→ /onboarding/profile
```

or:

```text
/onboarding
→ /onboarding/profile
```

There must be no redirect cycle.

---

# 2. Existing O1 Architecture

The current onboarding sequence is locked:

```text
profile
→ household
→ kitchen
→ inventory
→ complete
```

The onboarding decision is derived from persisted Product Domain state.

Existing relevant areas include:

```text
apps/web/src/onboarding/onboarding-query.ts
apps/web/src/routes/app.tsx
apps/web/src/routes/onboarding.tsx
apps/web/src/routes/onboarding/profile.tsx
apps/web/src/routes/onboarding/household.tsx
apps/web/src/routes/onboarding/kitchen.tsx
apps/web/src/routes/onboarding/inventory.tsx
apps/web/src/onboarding/onboarding-step-shell.tsx
```

Do not redesign this structure unless a concrete bug requires a small adjustment.

---

# 3. Reproduce the Redirect Loop First

Before changing code, reproduce the current failure with a fresh authenticated user.

Expected network state:

```text
/profile   404
/household 404
/kitchen   404
/inventory 404
```

Observed bug:

```text
Too many redirects
```

Determine the exact redirect cycle.

Document the actual cycle, for example conceptually:

```text
/app
→ /onboarding/profile
→ /onboarding
→ /onboarding/profile
→ ...
```

or whatever the repository actually does.

Do NOT fix by trial-and-error before identifying the concrete cycle.

---

# 4. Inspect Route Guard Responsibilities

Audit all onboarding-related `beforeLoad` / loader / redirect logic.

Explicitly inspect:

```text
/app
/onboarding
/onboarding/profile
/onboarding/household
/onboarding/kitchen
/onboarding/inventory
```

For each route, answer:

```text
What state does it load?
When does it redirect?
What is its canonical destination?
Can it redirect back to a parent/child route that redirects to it again?
```

The route hierarchy must have one clear ownership of orchestration.

---

# 5. Desired Redirect Responsibility

Prefer a simple deterministic model.

Conceptually:

```text
/app
→ if onboarding complete:
     allow /app
  else:
     redirect to /onboarding/{nextStep}
```

```text
/onboarding
→ if onboarding complete:
     redirect /app
  else:
     redirect /onboarding/{nextStep}
```

```text
/onboarding/{step}
→ if onboarding complete:
     redirect /app
  else if step !== nextStep:
     redirect /onboarding/{nextStep}
  else:
     allow route
```

A route that already matches:

```text
/onboarding/{nextStep}
```

must NOT redirect again to itself or its parent.

Self-redirect and parent-child redirect cycles must be impossible.

---

# 6. Canonical Step Check

When evaluating a step route, compare the route's own step identity to the derived:

```ts
nextStep
```

If they match:

```text
allow
```

Do NOT redirect to the same path.

Example:

```text
current route:
  /onboarding/profile

derived:
  nextStep = profile

result:
  allow
```

NOT:

```text
redirect /onboarding/profile
```

This is a likely redirect-loop risk and must be explicitly tested.

---

# 7. Parent Route Behavior

If `/onboarding` is a parent layout route for child steps, ensure its loader/guard does not continuously redirect even while a child route is already being resolved.

Inspect TanStack Router parent/child `beforeLoad` behavior carefully.

If the parent route always redirects to:

```text
/onboarding/{nextStep}
```

and also executes for child routes, ensure it does not re-trigger a redirect to the currently matched child.

Use the smallest correct TanStack Router pattern.

Do not add imperative `useEffect` redirects to work around router configuration.

---

# 8. `/app` Behavior

`/app` should remain the authenticated product entry.

For incomplete users:

```text
/app
→ first incomplete onboarding step
```

For complete users:

```text
/app
→ allowed
```

It should not redirect to `/onboarding` first if the exact persisted `nextStep` is already known, unless the existing router structure requires that path.

Prefer one deterministic redirect.

---

# 9. Missing Resource Semantics

Keep existing O1 rules unchanged.

Expected Product Domain 404s mean:

```text
missing onboarding resource
```

Only these known codes should contribute to missing-state derivation:

```text
PROFILE_NOT_FOUND
HOUSEHOLD_NOT_FOUND
KITCHEN_NOT_FOUND
INVENTORY_NOT_FOUND
```

Unexpected failures remain:

```text
unknown/error
```

Do not "fix" the redirect loop by treating errors as completed resources.

---

# 10. Unknown/Error State

If onboarding state cannot be safely derived because of an unexpected failure:

```text
500
network failure
invalid response
```

do NOT redirect repeatedly.

Render or surface the existing real error boundary/state.

The router must fail stable rather than bounce between routes.

---

# 11. Loading State

While onboarding queries are unresolved:

```text
loading
```

do not redirect to an arbitrary onboarding step.

Wait until the decision is available.

Avoid:

```text
loading
→ assume Profile missing
→ redirect profile
→ actual state arrives
→ redirect another step
```

This is both a flicker risk and potential redirect-loop contributor.

---

# 12. Preserve Persisted Resume Behavior

The fix must preserve O1 acceptance behavior.

Examples:

```text
Profile ❌
→ /onboarding/profile
```

```text
Profile ✅
Household ❌
→ /onboarding/household
```

```text
Profile ✅
Household ✅
Kitchen ❌
→ /onboarding/kitchen
```

```text
Profile ✅
Household ✅
Kitchen ✅
Inventory ❌
→ /onboarding/inventory
```

```text
all complete
→ /app
```

Do not weaken direct-step reconciliation.

---

# 13. Direct Navigation

For a user whose next step is:

```text
kitchen
```

these direct visits:

```text
/onboarding/profile
/onboarding/household
/onboarding/inventory
```

should redirect once to:

```text
/onboarding/kitchen
```

Visiting:

```text
/onboarding/kitchen
```

must render without redirecting again.

Fully complete user:

```text
/onboarding/*
→ /app
```

---

# 14. Fresh User Acceptance

For a new authenticated user with all resources missing:

```text
/app
→ /onboarding/profile
```

The final browser state must be:

```text
/onboarding/profile
```

with the onboarding step shell rendered.

The console must NOT contain:

```text
Too many redirects
```

Expected 404 network responses may still appear in development tools unless the API client intentionally suppresses logging.

Do not alter backend 404 behavior solely to remove console noise.

---

# 15. Auth Boundary

Do not change Auth.

The user is already authenticated through:

```text
Better Auth session
```

The fix must not:

```text
modify /auth/me
modify Auth guards
reintroduce x-flemme-user-id
introduce token storage
```

Auth 401 remains separate from onboarding 404.

---

# 16. Do Not Implement Skip Yet

The product direction is now agreed:

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

However F1 is ONLY the redirect-loop fix.

Do NOT implement these actions yet.

F2 will handle the required empty Inventory initialization backend gap.

O2–O5 will implement the actual step interactions.

---

# 17. No Backend Changes Expected

Expected:

```text
NO backend changes
NO migration
NO API contract changes
```

If the redirect loop truly originates from backend behavior, stop and report evidence before modifying the API.

This should primarily be a TanStack Router / query orchestration fix.

---

# 18. Tests — Fresh User

Add or update frontend route/onboarding coverage for:

```text
all resources missing
→ nextStep = profile
```

Then verify:

```text
/app
→ /onboarding/profile
```

and:

```text
/onboarding
→ /onboarding/profile
```

with no repeated redirect.

---

# 19. Tests — Self-Redirect Prevention

Explicitly cover:

```text
current route = /onboarding/profile
nextStep = profile
→ allow
```

Similarly:

```text
current household + nextStep household
current kitchen + nextStep kitchen
current inventory + nextStep inventory
```

None should redirect to themselves.

---

# 20. Tests — Reconciliation

Cover mismatched steps.

Example:

```text
nextStep = kitchen

visit /onboarding/profile
→ redirect /onboarding/kitchen
```

Verify exactly one redirect decision.

Do not test only the pure `deriveOnboardingDecision()` helper; include route-guard behavior where practical.

---

# 21. Tests — Complete User

```text
complete = true
```

Verify:

```text
/app
→ allowed
```

and:

```text
/onboarding
/onboarding/profile
/onboarding/household
/onboarding/kitchen
/onboarding/inventory
→ /app
```

without cycles.

---

# 22. Tests — Unexpected Error

If one Product Domain request returns an unexpected error:

```text
500
```

verify the application does not redirect in a loop.

It must enter the existing error path/state.

---

# 23. Manual Browser Acceptance

Run real:

```text
apps/api
apps/web
```

using Better Auth.

Use a fresh user.

Verify:

```text
/profile   → 404
/household → 404
/kitchen   → 404
/inventory → 404
```

then:

```text
/app
→ /onboarding/profile
```

and the route remains stable.

Browser console:

```text
NO "Too many redirects"
```

Refresh:

```text
/onboarding/profile
→ remains /onboarding/profile
```

Logout/re-login:

```text
→ /onboarding/profile
```

---

# 24. Regression Acceptance

Re-run existing O1 scenarios:

```text
Profile complete
→ Household

Profile + Household complete
→ Kitchen

first 3 complete
→ Inventory

all complete
→ /app
```

Refresh/re-login persistence must remain intact.

---

# 25. Validation Gates

Run:

```text
onboarding focused tests
full apps/web tests
workspace typecheck
web build
API build
full API suite
web lint
scoped Biome
git diff --check
```

No backend migration expected.

---

# 26. Documentation

Update progress tracker only if necessary.

Record F1 separately:

```text
O1 Onboarding Foundation ✅
F1 Redirect Loop Fix     ✅
F2 Empty Inventory Init  ← NEXT
```

Do not mark O2 started.

---

# 27. Required Report

Return:

```md
# Flemme User Platform F1 — Redirect Loop Fix Report

## Root Cause

Explain the exact redirect cycle that caused:
Too many redirects

## Route Responsibility

### /app
- ...

### /onboarding
- ...

### /onboarding/:step
- ...

## Fix

- files changed:
- routing change:
- self-redirect prevention:
- loading/error behavior:

## Fresh User

- Profile:
- Household:
- Kitchen:
- Inventory:
- final route:
- redirect count/behavior:

## Direct Navigation

- matching step:
- mismatched step:
- complete user:

## Error Handling

- expected 404:
- unexpected error:
- 401:

## O1 Regression

- Profile missing:
- Household missing:
- Kitchen missing:
- Inventory missing:
- complete:
- refresh:
- logout/re-login:

## Backend Changes

Expected:
None.

## Tests Added

## Manual Browser Acceptance

- fresh user:
- refresh:
- console redirect error:
- persisted resume:

## Validation Results

- focused tests:
- web tests:
- full API:
- typecheck:
- web build:
- API build:
- lint:
- Biome:
- git diff --check:

## Files Changed

## Final Status

F1 Redirect Loop Fix ✅ ACCEPTED

or explain the blocker.

## Next Task

F2 — Empty Inventory Initialization

Do not implement F2 in this task.
```
