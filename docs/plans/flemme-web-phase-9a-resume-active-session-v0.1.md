# Flemme Web — Phase 9A: Resume Active Session v0.1

## Status

**Implementation Task**

Phase 8 Favorite Persistence is complete.

Phase 9A completes Flemme's session-continuity promise by surfacing an existing persisted Active or Paused Cooking Session from Home and routing the user back into the exact persisted cooking state.

## Scope

```text
Home
→ Detect resumable Cooking Session
→ Show Continue Cooking
→ Resume existing session
→ /app/cooking/$sessionId
→ Restore persisted current stage / step
```

This phase does not create a new Cooking Session.

It does not regenerate Recommendation, Pre-Cooking, Completion, Nutrition, or Favorite state.

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

Phase 9A owns:

```text
Resume Active Session
```

---

# 2. Product Principle

This phase exists to enforce the locked Flemme continuity rule:

> Leaving, refreshing, pausing, or returning later must not reset an active cooking session.

The user should be able to leave Flemme and later continue from the persisted session state.

---

# 3. Source of Truth

The persisted Cooking Session is the only durable source of truth.

Use:

```text
sessionId
+
server persisted session state
```

Do not rely on:

```text
preCookingHandoffQueryKey
Recommendation state
local Active Cooking state
browser-only progress
```

---

# 4. Resumable Session Definition

A Cooking Session is resumable when its persisted status is:

```text
active
paused
```

Do not treat:

```text
completed
abandoned
```

as resumable.

---

# 5. Home Integration

Phase 2 already includes:

```text
ActiveSessionCard
```

Phase 9A should connect it to real persisted session data.

Expected Home behavior:

```text
resumable session exists
→ show Continue Cooking card

no resumable session
→ omit the section
```

Do not show a large empty-state card.

---

# 6. Recommended Card Content

Show only the information needed to resume confidently.

Suggested:

```text
Continue Cooking

Nasi Goreng Kentang Telur
Stage 2 · Tumis Bumbu
Paused / Active

[ Continue cooking → ]
```

Use:

```text
customName ?? selectedRecipe.name
```

for the display title.

---

# 7. Active vs Paused Copy

If status is:

```text
active
```

Suggested label:

```text
In progress
```

If:

```text
paused
```

Suggested label:

```text
Paused
```

Optional paused reason may be shown if concise and useful.

Do not expose raw enum values directly.

---

# 8. Resume Behavior

For an `active` session:

```text
Continue cooking
→ navigate directly to /app/cooking/$sessionId
```

For a `paused` session:

Two acceptable patterns:

```text
A. Navigate first, then user presses Resume
```

or:

```text
B. Resume explicitly from Home, then navigate
```

Preferred for v0.1:

```text
navigate to session route
→ paused Active Cooking UI owns Resume
```

This keeps lifecycle mutation in the Active Cooking feature.

---

# 9. No Implicit Resume Mutation

Do not automatically change:

```text
paused → active
```

just because the user opened the session.

Persisted paused state should remain paused until the explicit Resume action is used.

---

# 10. Home Query Requirement

Add or reuse a server-backed query that resolves the user's resumable Cooking Session.

Preferred server authority:

```text
GET resumable/current Cooking Session
```

or reuse the existing Cooking Session list/read capability if it can deterministically identify the active/paused session.

Inspect current API first.

Do not invent duplicate persistence.

---

# 11. Single Resumable Session Rule

Inspect the current domain model.

If the backend already guarantees:

```text
at most one active/paused session per user
```

reuse that invariant.

If multiple resumable sessions are technically possible, do not silently choose one in the browser.

Use a deterministic server-side rule or return the collection explicitly.

For v0.1, prefer a clear single-current-session domain boundary if already consistent with the product.

---

# 12. API Direction

Preferred conceptual endpoint:

```text
GET /cooking-sessions/resumable
```

or:

```text
GET /cooking-sessions?status=active,paused
```

Use the existing API style.

Do not create both.

---

# 13. Ownership

Only return Cooking Sessions owned by the authenticated user.

Do not expose cross-user sessions in Home resume queries.

---

# 14. Canonical Query Key

Create or reuse a stable Home/session-continuity query key.

Conceptually:

```ts
resumableCookingSessionQueryKey()
```

Use the existing:

```ts
cookingSessionQueryKey(sessionId)
```

for the actual session route.

---

# 15. Cache Synchronization

After lifecycle changes in Active Cooking:

```text
pause
resume
advance
complete
abandon
```

ensure the resumable-session query becomes correct.

Examples:

```text
session completed
→ Home Continue Cooking disappears

session abandoned
→ Home Continue Cooking disappears

session paused
→ Home shows Paused
```

Use query invalidation/update consistently.

---

# 16. Completion Interaction

Once session status becomes:

```text
completed
```

the session is no longer resumable.

Home should not show it in Continue Cooking.

Do not wait for Favorite or Nutrition completion to remove it.

---

# 17. Abandon Interaction

Once status becomes:

```text
abandoned
```

remove it from Home resume state.

Do not show `Continue Cooking`.

---

# 18. Refresh Safety

Home refresh must restore the Continue Cooking card from the server.

Expected:

```text
full refresh
→ auth
→ resumable session query
→ card restored
```

No transient Active Cooking state required.

---

# 19. Active Cooking Route Refresh

Existing Phase 5B behavior remains:

```text
/app/cooking/$sessionId
→ GET persisted session
→ current stage/step restored
```

Do not change that architecture.

---

# 20. Current Stage / Step Summary

If Home shows stage context:

resolve using persisted:

```text
currentStageId
currentStepId
```

against the immutable `cookingPlan`.

Do not use array indexes as identity.

If resolution fails:

```text
do not render misleading Continue card
```

Treat it as a controlled corrupt-session state.

---

# 21. Corrupt Session Handling

If resumable session data is corrupt:

- do not show fake progress
- do not silently reset to first step
- show a controlled lightweight Home error only if useful
- keep the rest of Home usable

Do not block CookingPrompt because resume data failed.

---

# 22. Home Resilience

Resume-session query failure must not prevent:

```text
starting a new cooking request
using Quick Start
opening Inventory
viewing Recent Cooking
```

Home primary action remains available.

---

# 23. Loading State

Do not block the full Home page while checking for a resumable session.

Preferred:

```text
Home renders
+
Continue Cooking area skeleton / deferred state
```

Use the existing shared/shadcn Skeleton pattern.

---

# 24. Empty State

No resumable session:

```text
render nothing
```

Do not show:

```text
No active session
```

unless later UX explicitly needs it.

---

# 25. UI Component

Reuse/upgrade:

```text
ActiveSessionCard
```

from Phase 2.

Do not create a second `ResumeSessionCard`.

Keep one canonical Home component.

---

# 26. shadcn Usage

Use existing primitives:

```text
Card
Button
Badge
Skeleton
```

No new UI framework.

---

# 27. Card Hierarchy

Recommended:

```text
status
display name
current stage / current step
continue CTA
```

Avoid showing:

```text
full ingredient list
full cooking plan
all completed steps
all changes
```

Home only needs a resume summary.

---

# 28. customName

Use:

```text
customName ?? selectedRecipe.name
```

Do not duplicate naming logic.

Reuse an existing display-name helper if available.

---

# 29. Paused Reason

If pauseReason is present and short, it may be shown:

```text
Paused · Buying missing ingredients
```

Do not let a long reason dominate the card.

Clamp if necessary.

---

# 30. Navigation

Continue action uses TanStack Router.

Expected:

```text
/app/cooking/$sessionId
```

Do not put Cooking Session objects in URL search params.

---

# 31. No Session Creation

Resume must never call:

```text
POST /cooking-sessions
```

The session already exists.

---

# 32. No Recommendation Regeneration

Resume must produce:

```text
0 Recommendation requests
```

---

# 33. No Pre-Cooking Regeneration

Resume must produce:

```text
0 Pre-Cooking requests
```

---

# 34. No Completion / Nutrition / Favorite Side Effects

Navigating back into an active/paused session must not call:

```text
Completion
Nutrition
Favorite
```

---

# 35. No Inventory Mutation

Resume produces:

```text
zero Inventory mutations
```

---

# 36. Active Cooking Assistant

Do not invoke Active Cooking assistant just because the session is reopened.

The assistant runs only when the user explicitly asks Flemme.

---

# 37. Multiple Tabs / Devices

The server is authoritative.

If another tab/device advances the session:

```text
refresh / refetch
→ latest persisted state
```

Do not assume the Home card's cached stage/step is permanently current.

---

# 38. Stale Cache Strategy

Choose a sensible stale/refetch policy for resumable state.

Recommended:

```text
refetch when Home becomes active/mounted
```

or equivalent current project behavior.

Avoid excessive polling.

No background monitor is required.

---

# 39. App Navigation

Home BottomNavigation behavior remains unchanged.

Resume card lives inside normal Home.

Active Cooking route continues hiding BottomNavigation.

---

# 40. Recent Cooking Separation

Do not include the active/paused session inside:

```text
Recent Cooking
```

if Recent Cooking is intended for completed meals.

Keep concepts distinct:

```text
Continue Cooking
= active/paused

Recent Cooking
= completed
```

---

# 41. Tests — API

Add/extend coverage for:

```text
no resumable session → empty/null
active owned session returned
paused owned session returned
completed not returned
abandoned not returned
cross-user session never returned
current session display data intact
customName preserved
```

If multiple-session invariant exists:

```text
enforce/test it
```

---

# 42. Tests — Web

Add coverage for:

```text
Home no resumable session → section omitted
active session → Continue card
paused session → Paused card
customName title
original-name fallback
current stage shown
current step shown if used
Continue navigates by sessionId
paused navigation does not auto-resume
completed session disappears
abandoned session disappears
resume query failure does not block Home
refresh restores card
```

Preserve all existing tests.

---

# 43. Network Verification

Expected Home with resumable session:

```text
GET resumable/current session
```

Expected Continue:

```text
route navigation
→ canonical session read only if cache/load requires it
```

Verify zero:

```text
Cooking Session create
Recommendation
Pre-Cooking
Completion
Nutrition
Favorite
Inventory mutation
```

---

# 44. Browser Verification

Verify at:

```text
320px
390px
768px
1440px
1920px
```

Check:

- Continue card fits mobile
- long customName wraps/clamps safely
- status readable
- CTA easy to tap
- no horizontal overflow
- Home still uses compact 572px desktop canvas
- BottomNavigation present on Home
- BottomNavigation hidden after entering Active Cooking
- refresh restores card
- paused session remains paused until explicit Resume
```

---

# 45. Validation

Run:

```text
web typecheck
web production build
API build
web tests
API tests
Cooking Session integration tests
Biome
Oxlint
```

Report the existing malformed OpenAI declaration issue separately if standalone API typecheck remains blocked.

---

# 46. Non-Goals

Do not implement:

```text
Cooking History page
Favorites page
Inventory Management page
multiple-session chooser UI
session search/filter
session archive UI
```

Do not redesign Active Cooking.

---

# 47. Suggested Implementation Order

```text
1. Inspect current Cooking Session read/list APIs.
2. Confirm resumable-session domain invariant.
3. Add/reuse one resumable-session API boundary.
4. Add canonical query key.
5. Connect Home ActiveSessionCard to real query.
6. Add loading behavior without blocking Home.
7. Add active state.
8. Add paused state.
9. Add customName display priority.
10. Resolve current stage/step by stable IDs.
11. Wire Continue route navigation.
12. Ensure paused session does not auto-resume.
13. Invalidate/update query after lifecycle terminal changes.
14. Add API tests.
15. Add web tests.
16. Browser/network verify.
17. Run validation.
18. Update architecture/progress docs.
```

---

# 48. Definition of Done

- [ ] Home detects persisted resumable sessions from the server.
- [ ] `active` session is resumable.
- [ ] `paused` session is resumable.
- [ ] `completed` session is not resumable.
- [ ] `abandoned` session is not resumable.
- [ ] Ownership is preserved.
- [ ] ActiveSessionCard uses real persisted data.
- [ ] No resumable session means the section is omitted.
- [ ] Resume-query loading does not block the rest of Home.
- [ ] Resume-query errors do not block the rest of Home.
- [ ] Card uses `customName ?? selectedRecipe.name`.
- [ ] Current stage/step summary uses stable IDs.
- [ ] Corrupt progress is not silently reset.
- [ ] Continue navigates to `/app/cooking/$sessionId`.
- [ ] Paused session does not auto-resume.
- [ ] Active Cooking route restores persisted state.
- [ ] Refresh restores the Continue card.
- [ ] Completion removes the session from resume state.
- [ ] Abandon removes the session from resume state.
- [ ] No new Cooking Session is created.
- [ ] No Recommendation regeneration occurs.
- [ ] No Pre-Cooking regeneration occurs.
- [ ] No Completion/Nutrition/Favorite side effect occurs.
- [ ] No Inventory mutation occurs.
- [ ] BottomNavigation remains visible on Home.
- [ ] BottomNavigation remains hidden in Active Cooking.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

# 49. Agent Rule

Optimize for:

```text
session continuity
+
server-authoritative state
+
one-tap return to cooking
+
minimal Home clutter
+
refresh safety
```

Do not optimize for:

```text
multiple-session management
new cooking flows
client-only resume state
automatic lifecycle mutation
```

Core rule:

> Resume means returning to the exact persisted Cooking Session, not recreating or regenerating any part of the cooking flow.

---

# 50. Phase Boundary

Phase 9A ends with:

```text
Home
→ real persisted Continue Cooking card
→ exact active/paused session
→ refresh-safe Active Cooking return
```

ready for:

```text
Phase 9B
Cooking History
```
