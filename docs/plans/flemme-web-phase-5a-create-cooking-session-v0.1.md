# Flemme Web — Phase 5A: Create Cooking Session v0.1

## Status

**Complete**

Phase 4 Pre-Cooking & Plan Review is complete.

Phase 5 is intentionally split.

This task covers only:

```text
Pre-Cooking
→ Start Cooking
→ Create Persisted Cooking Session
→ Receive Session ID
→ Prepare Active Cooking Route
```

This task does **not** implement the full Active Cooking UI yet.

The goal is to establish a clean persistence boundary between the immutable Pre-Cooking plan and the mutable Active Cooking lifecycle.

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

This phase owns only:

```text
Pre-Cooking
→ Create Cooking Session
```

The next task will own:

```text
Persisted Cooking Session
→ Active Cooking UI
```

---

# 2. Starting Boundary

Phase 4 already preserves an immutable handoff containing:

```text
request
selectedRecipe
PreCookingOutput
```

The current handoff is available through the existing:

```text
preCookingHandoffQueryKey
```

Reuse that exact handoff.

Do not reconstruct the selected recipe.

Do not regenerate Pre-Cooking.

Do not copy plan data manually from rendered UI.

---

# 3. Core Principle

Creating a Cooking Session is the transition from:

```text
immutable plan
```

to:

```text
persisted mutable cooking lifecycle
```

Conceptually:

```text
PreCookingOutput
        ↓
Create Cooking Session
        ↓
Persisted Session Snapshot
        ↓
sessionId
        ↓
Active Cooking
```

After session creation succeeds, the persisted Cooking Session becomes the source of truth.

The transient Pre-Cooking handoff is no longer the primary source of truth.

---

# 4. Important Ownership Rule

Before session creation:

```text
preCookingHandoffQueryKey
= source of truth for current selected plan
```

After successful session creation:

```text
persisted Cooking Session
= source of truth
```

Do not keep Active Cooking dependent on the transient handoff after the server returns a valid session.

---

# 5. Existing Domain Contracts

Inspect and reuse the existing Cooking Session persistence contracts.

Do not invent a parallel web-only session model.

Expected session creation should preserve the immutable plan plus initial progress state.

Conceptually:

```ts
{
	cookingPlan: PreCookingOutput;
	session: {
		status: "active";
		currentStageId: string;
		currentStepId: string;
		completedStepIds: [];
		changes: [];
	};
}
```

Use the actual existing backend contract.

Do not duplicate shared Zod schemas if they already exist.

---

# 6. Initial Session State

A newly created Cooking Session should begin with:

```text
status = active
completedStepIds = []
changes = []
```

Initial navigation should point to the first valid cooking position.

Use the actual domain rule already established by the session API.

Do not invent different initialization logic in the web app.

---

# 7. Preparation Steps vs Active Cooking

Do not create Active Cooking progress from Pre-Cooking preparation steps unless the existing persisted session contract explicitly includes them.

The current domain distinction remains:

```text
Pre-Cooking
= preparation review

Active Cooking
= persisted cooking-stage progress
```

Do not silently merge them.

---

# 8. Mandatory UI Stack

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

This task contains minimal UI changes.

The main work is persistence and route transition.

---

# 9. Recommended Scope

Expected files may include:

```text
apps/web/src/features/cooking-session/
├── create-cooking-session.ts
├── cooking-session-query.ts
├── cooking-session-state.ts
└── index.ts
```

and small changes to:

```text
features/pre-cooking/
routes/
```

Do not create the full Active Cooking feature folder yet unless required for the route placeholder.

---

# 10. Inspect Before Implementing

Before writing new API code:

1. inspect existing Cooking Session backend routes
2. inspect existing session persistence schema
3. inspect ownership/auth rules
4. inspect session lifecycle statuses
5. inspect existing Active Cooking contracts
6. inspect any existing session create/read endpoints
7. reuse them

Do not create a second session persistence path if one already exists.

---

# 11. Start Cooking Behavior

The existing Phase 4 CTA:

```text
Start cooking
```

should now perform:

```text
1. read current Pre-Cooking handoff
2. validate required handoff state exists
3. prevent duplicate submission
4. create persisted Cooking Session
5. receive persisted session identifier
6. transition to Active Cooking route
```

Do not regenerate Recommendation.

Do not regenerate Pre-Cooking.

Do not mutate Inventory.

---

# 12. TanStack Query Mutation

Use a dedicated mutation for session creation.

Recommended conceptual API:

```ts
useCreateCookingSessionMutation()
```

Responsibilities:

- submit creation payload
- expose pending state
- expose controlled failure state
- return persisted session
- prevent accidental duplicate creation

Do not call `fetch()` directly inside the button component.

---

# 13. Duplicate Creation Prevention

This is critical.

Double tap / double click on:

```text
Start cooking
```

must not create two Cooking Sessions.

At minimum:

```text
disable CTA while mutation is pending
```

Also reuse any server-side idempotency/domain guard if already available.

Do not rely exclusively on UI disable if backend already provides stronger protection.

---

# 14. Start Cooking Pending State

While creating:

```text
Start cooking
```

may become:

```text
Starting cooking...
```

or similarly concise wording.

Use the existing shadcn `Button`.

Keep the current Pre-Cooking plan visible while the request is pending.

Do not replace the entire page with a blank loading screen.

---

# 15. Creation Error

If session creation fails:

- keep the Pre-Cooking plan visible
- preserve exact handoff state
- show a controlled error
- allow Retry
- do not regenerate Pre-Cooking
- do not send the user back to Home

Suggested UX:

```text
Couldn't start your cooking session.

[ Try again ]
```

Do not show raw server errors.

---

# 16. Session Create Payload

Send only the fields supported by the actual Cooking Session create API.

Do not add:

```text
fake inventory snapshot
fake household
fake user metadata
render-only labels
UI state
```

The immutable plan should be passed according to the backend contract.

---

# 17. Preserve Exact Plan

The Cooking Session must reference or persist the exact `PreCookingOutput` reviewed by the user.

Do not:

```text
generate a new plan
normalize it differently in the browser
drop timing cues
drop stage IDs
drop step IDs
reorder stages
reorder steps
```

The persisted cooking plan must match what the user approved.

---

# 18. Preserve Stable IDs

This is especially important for:

```text
cookingStages[].id
steps[].id
```

Active Cooking progress will rely on these IDs.

Do not replace them with array indexes.

Do not generate new client-side IDs.

---

# 19. Persisted Initial Progress

The newly created session should contain the server-authoritative initial progress state.

Conceptually:

```text
status
currentStageId
currentStepId
completedStepIds
changes
```

Use the server response.

Do not overwrite it in the browser after creation.

---

# 20. Session Identifier

The server must return a stable identifier for the persisted session.

Conceptually:

```text
sessionId
```

Use the actual field name from the existing API.

Do not generate client-side session IDs.

---

# 21. Active Cooking Route

After creation succeeds, navigate to a route based on the persisted session identifier.

Recommended direction:

```text
/app/cooking/$sessionId
```

or the closest route convention already established in the project.

Do not put the entire Cooking Session object in URL search params.

---

# 22. Route Placeholder

For this task, the target Active Cooking route may contain only a minimal placeholder if the full UI belongs to the next task.

Example:

```text
Cooking session created
```

or a small loading/read boundary.

However, the route must be real and accept the persisted session ID.

Do not implement the complete step UI in this task.

---

# 23. Active Cooking Route Source of Truth

The route must be designed around:

```text
sessionId
→ fetch persisted session
```

not:

```text
route
→ depend on preCookingHandoffQueryKey forever
```

This matters for:

```text
refresh
deep-link recovery
resume session
leave and return
```

The persisted session is the durable boundary.

---

# 24. Refresh Requirement

After successful creation and navigation:

```text
refresh
```

must not require the original Recommendation or Pre-Cooking query state to reconstruct the cooking session.

The route should be recoverable from:

```text
sessionId
+
server persistence
```

This is a core acceptance criterion.

---

# 25. Direct Route Guard

If the user visits:

```text
/app/cooking/<invalid-session-id>
```

the app must handle the real API response.

Possible outcomes:

```text
404 → session not found
403 → not owned
invalid/corrupt snapshot → controlled error
```

Do not fall back to fake session state.

---

# 26. Ownership

Preserve existing Cooking Session ownership rules.

A user may only access their own session unless the existing domain explicitly allows otherwise.

Do not weaken backend authorization because the route is authenticated.

---

# 27. Session Snapshot Validation

If the API already validates persisted session snapshots, reuse that behavior.

On web fetch, validate responses with the available schema-only shared export where appropriate.

Avoid importing provider/runtime-heavy agent modules into the browser bundle.

Follow the same browser-safe schema pattern established in Phase 3 and Phase 4.

---

# 28. Query Keys

Create a stable Cooking Session query key.

Conceptual:

```ts
cookingSessionQueryKey(sessionId)
```

Use it consistently for:

```text
read
future mutation updates
resume
completion
```

Do not scatter ad-hoc query keys.

---

# 29. Cache Seeding

After successful creation, if the response already contains the full persisted Cooking Session:

Seed the TanStack Query cache for:

```text
sessionId
```

before navigation if useful.

This can avoid an unnecessary immediate duplicate fetch.

Only do this if the server response is complete and schema-valid.

Otherwise navigate and fetch normally.

---

# 30. Pre-Cooking Handoff Cleanup

Do not clear the Pre-Cooking handoff before session creation succeeds.

Correct:

```text
create succeeds
↓
persisted session exists
↓
navigate
↓
handoff may be cleared when safe
```

Incorrect:

```text
click Start
↓
clear handoff
↓
request fails
↓
plan lost
```

Preserve recovery.

---

# 31. Recommendation State Cleanup

Do not aggressively delete all previous flow state during this task.

Only clear downstream/transient state once the persisted session safely replaces it.

Avoid breaking Back/Retry behavior before navigation succeeds.

---

# 32. Inventory

Creating a Cooking Session must not mutate Inventory.

No deduction occurs here.

Inventory effects, if ever introduced, belong to a separately defined domain event.

For this task:

```text
zero inventory mutations
```

---

# 33. Favorites / History

Do not create:

```text
favorite
history-completed entry
nutrition result
```

during session creation.

A Cooking Session being created is not the same as a completed meal.

---

# 34. Completion

Do not invoke Completion.

Do not mark the session completed.

Initial status remains the server-defined active state.

---

# 35. Resume Foundation

Although Resume UI is not implemented here, session creation should establish the persistence needed later for:

```text
Home
→ Continue Cooking
→ /app/cooking/$sessionId
```

This is one reason sessionId-based routing is required.

---

# 36. Minimal UI Change to Pre-Cooking

The Phase 4 layout should remain intact.

Only change the final CTA behavior.

Before:

```text
Start cooking
→ preserve handoff only
```

After:

```text
Start cooking
→ create persisted Cooking Session
→ navigate by sessionId
```

Do not redesign the entire Pre-Cooking page in this task.

---

# 37. Accessibility

Start Cooking button must:

- expose disabled state while pending
- keep visible focus behavior
- retain readable text
- not become icon-only

Creation error actions must be keyboard accessible.

---

# 38. Tests

Add coverage for at least:

```text
Start Cooking submits exact approved plan
exact selected recipe/request remain associated
duplicate click creates only one request
pending CTA disabled
successful creation returns session ID
successful creation navigates to session route
creation failure preserves Pre-Cooking plan
retry works
handoff not cleared before success
no Pre-Cooking regeneration
no Recommendation regeneration
no Inventory mutation
no Completion call
invalid session route handled
session ownership response handled
refresh route can reload session from server
```

Preserve all previous tests.

---

# 39. Network Verification

Browser/network verification should confirm:

```text
1 Start Cooking click
→ exactly 1 Cooking Session create request
```

and:

```text
0 Recommendation requests
0 Pre-Cooking requests
0 Inventory mutations
0 Completion requests
```

during that transition.

---

# 40. Browser Verification

Verify at:

```text
320px
390px
768px
1440px
1920px
```

Focus on:

- Start Cooking pending behavior
- no duplicate requests
- error retry
- successful navigation
- compact canvas preserved
- no BottomNavigation regression
- refresh on session route

---

# 41. Validation

Run:

```text
web typecheck
production build
tests
Biome
Oxlint
```

Report any existing unrelated package/parser issue separately.

Do not conflate existing OpenAI declaration tooling issues with this task's acceptance.

---

# 42. Non-Goals

Do not implement:

```text
full Active Cooking UI
Next Step
Previous Step
Pause
Resume action mutation
Record Change
Complete Cooking
Completion generation
Nutrition
Favorites
Inventory deduction
Cooking History UI
```

This task only creates the persisted Cooking Session and establishes the durable route boundary.

---

# 43. Suggested Implementation Order

Recommended:

```text
1. Inspect existing Cooking Session API and persistence schemas.
2. Confirm actual create-session endpoint and payload.
3. Confirm persisted response shape and session ID.
4. Confirm session ownership behavior.
5. Create browser-safe schema export if needed.
6. Create cooking-session feature/query module.
7. Create create-session TanStack mutation.
8. Wire Phase 4 Start Cooking CTA.
9. Prevent duplicate submission.
10. Preserve handoff until success.
11. Add session query key.
12. Add session-by-ID read query.
13. Create /app/cooking/$sessionId route.
14. Add minimal route placeholder/read boundary.
15. Seed cache from creation response if appropriate.
16. Navigate after successful persistence.
17. Verify refresh reloads from server.
18. Handle create errors and retry.
19. Handle invalid/unauthorized session route.
20. Add tests.
21. Browser/network verify.
22. Run validation.
23. Update architecture/progress docs.
```

---

# 44. Definition of Done

Phase 5A is complete when:

- [x] Start Cooking uses the exact Phase 4 handoff.
- [x] Exact immutable PreCookingOutput is submitted/persisted.
- [x] Stable stage IDs are preserved.
- [x] Stable step IDs are preserved.
- [x] Real Cooking Session create API is used.
- [x] Duplicate creation is prevented.
- [x] Pending state is visible.
- [x] Creation failure preserves the plan.
- [x] Retry works.
- [x] Successful creation returns a stable session identifier.
- [x] Persisted server session becomes source of truth.
- [x] Session route uses session ID.
- [x] Session route can load the persisted session from the server.
- [x] Refresh does not require transient Pre-Cooking state.
- [x] Invalid session ID is handled.
- [x] Unauthorized session access is handled.
- [x] Existing ownership rules are preserved.
- [x] Pre-Cooking is not regenerated.
- [x] Recommendation is not regenerated.
- [x] Inventory is not mutated.
- [x] Completion is not invoked.
- [x] Favorites are not mutated.
- [x] Full Active Cooking UI is not implemented yet.
- [x] BottomNavigation focused-flow behavior remains correct.
- [x] Tailwind/shadcn foundation remains unchanged.
- [x] Mobile layout works.
- [x] Compact desktop layout works.
- [x] Typecheck passes.
- [x] Production build passes.
- [x] Tests pass.
- [x] Biome/lint passes.
- [x] Architecture/progress docs are updated.

---

# 45. Agent Rule

For this task, optimize for:

```text
durable persistence
+
exact plan preservation
+
single session creation
+
refresh-safe routing
+
clean lifecycle boundary
```

Do not optimize for:

```text
Active Cooking UI
new design work
extra session features
inventory side effects
premature completion logic
```

The central architecture rule is:

> Once Start Cooking succeeds, the persisted Cooking Session replaces the transient Pre-Cooking handoff as the source of truth.

---

# 46. Phase Boundary

This task ends with:

```text
Persisted Cooking Session
+
stable sessionId
+
server-authoritative initial progress
+
refresh-safe session route
```

ready for:

```text
Phase 5B
Active Cooking UI
→ step navigation
→ pause/resume
→ record changes
→ completion boundary
```
