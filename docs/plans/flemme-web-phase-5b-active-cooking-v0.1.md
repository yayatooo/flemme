# Flemme Web — Phase 5B: Active Cooking v0.1

## Status

**Implementation Task**

Phase 5A Create Cooking Session is complete.

Phase 5B turns the persisted Cooking Session into the actual cooking experience.

Scope:

```text
Persisted Cooking Session
→ Active Cooking UI
→ Current Stage / Current Step
→ Advance / Previous Step
→ Pause / Resume
→ Record Change
→ Ask Flemme / Clarify
→ Complete Cooking Boundary
```

This phase must use the persisted Cooking Session as the source of truth.

This phase does **not** implement Completion output, Nutrition, Favorite, History, or Inventory mutation yet.

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

Phase 5B owns:

```text
Persisted Cooking Session
→ Active Cooking
→ Completion Boundary
```

The next phase will own:

```text
Completed Cooking Session
→ Completion Output
```

---

# 2. Starting Boundary

Phase 5A already provides:

```text
persisted Cooking Session
+
stable sessionId
+
server-authoritative initial progress
+
refresh-safe /app/cooking/$sessionId route
```

Phase 5B must build on that.

Do not depend on:

```text
Recommendation transient state
Pre-Cooking handoff state
local-only cooking progress
```

The durable source of truth is:

```text
sessionId
↓
persisted Cooking Session
```

---

# 3. Locked Domain Principle

The cooking plan is immutable.

The cooking session progress is mutable.

```text
cookingPlan
= immutable plan snapshot

session
= mutable lifecycle + progress
```

Do not mutate `cookingPlan` in response to user progress.

---

# 4. Existing Active Cooking Contract

Reuse the existing Flemme Active Cooking contract.

Conceptually, persisted session state includes:

```ts
{
  status: "active" | "paused" | "completed" | "abandoned";
  pauseReason?: string;
  currentStageId: string;
  currentStepId: string;
  completedStepIds: string[];
  changes: Array<{
    kind: "ingredient" | "equipment" | "servings" | "step" | "other";
    description: string;
    relatedStepId?: string;
  }>;
}
```

Existing Active Cooking structured actions conceptually include:

```text
advance
previous-step
pause
resume
record-change
complete-cooking
abandon-cooking
clarify
```

Use the actual shared contracts and existing API/runtime.

Do not create a second client-only action model.

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

No new UI framework.

---

# 6. Focused Cooking Layout

Active Cooking is an immersive task flow.

Global BottomNavigation remains hidden.

Recommended composition:

```text
┌──────────────────────────────┐
│ ← Ayam Kecap           •••   │
│ Stage 2 of 4                  │
├──────────────────────────────┤
│                              │
│ Tumis bawang                  │
│                              │
│ Tumis sampai harum dan        │
│ sedikit keemasan.             │
│                              │
│ Quick · until fragrant        │
│                              │
│ Ask Flemme                    │
│ [ message...              ]   │
│                              │
├──────────────────────────────┤
│ Previous        Next Step →   │
└──────────────────────────────┘
```

Hierarchy:

```text
where am I?
↓
what do I do now?
↓
what cue tells me it is ready?
↓
what can I do next?
```

---

# 7. Recommended Feature Structure

```text
apps/web/src/features/active-cooking/
├── active-cooking-page.tsx
├── active-cooking-query.ts
├── active-cooking-mutations.ts
├── stage-progress.tsx
├── current-step-card.tsx
├── cooking-controls.tsx
├── cooking-assistant.tsx
├── pause-cooking-dialog.tsx
├── record-change-dialog.tsx
├── session-status.tsx
├── active-cooking-loading.tsx
├── active-cooking-error.tsx
└── index.ts
```

Follow current project conventions where appropriate.

Do not put Active Cooking domain behavior in `components/ui`.

---

# 8. Route

Continue using:

```text
/app/cooking/$sessionId
```

The route resolves the persisted Cooking Session by `sessionId`.

Do not create another route based on recipe name, array index, or transient state.

---

# 9. Refresh Safety

Every fresh load must work through:

```text
sessionId
→ GET persisted session
→ validate persisted snapshot
→ render Active Cooking
```

Refresh must not depend on Recommendation or Pre-Cooking query state.

---

# 10. Session Validation

Reuse the browser-safe Cooking Session schema established in Phase 5A, such as:

```text
@flemme/contracts/cooking-session
```

Do not import runtime-heavy provider modules into the browser bundle.

---

# 11. Session Status Handling

Handle every persisted lifecycle state intentionally.

## active

Render normal cooking controls.

## paused

Render a clear paused state and Resume action.

Normal step progression should not remain active unless the backend explicitly allows it.

## completed

Do not render active step controls.

Stop at the Completion boundary.

## abandoned

Do not allow progress mutation.

Show a controlled abandoned-session state.

Do not silently reactivate it.

---

# 12. Resolve Current Stage by Stable ID

Use:

```text
session.currentStageId
```

against:

```text
cookingPlan.cookingStages[].id
```

Do not use array index as identity.

If the persisted ID cannot be resolved, treat the snapshot as invalid/corrupt.

Do not silently fall back to the first stage.

---

# 13. Resolve Current Step by Stable ID

Use:

```text
session.currentStepId
```

against stable cooking-step IDs.

Do not infer current step solely from `completedStepIds.length`.

If it cannot be resolved, show a controlled invalid-session state.

---

# 14. Stage Progress

Create:

```text
stage-progress.tsx
```

Show structural progress, for example:

```text
Stage 2 of 4
Cook the chicken
```

A progress bar is acceptable if it represents:

```text
stage position / total stages
```

Do not use it as time remaining.

---

# 15. Current Step Card

Create:

```text
current-step-card.tsx
```

This is the main visual surface.

Display:

```text
step title
description
qualitative timing
completion cue
```

Example:

```text
Tumis bawang

Masak bawang sambil diaduk hingga harum dan sedikit keemasan.

Quick
Until fragrant
```

---

# 16. Timing Rule

Keep qualitative timing.

Do not introduce fake countdown precision.

Preferred wording may map to:

```text
very-short → Very quick
short      → Quick
medium     → A little time
long       → Takes time
```

The completion cue is more important than fake minute precision.

---

# 17. Previous Step

Provide a `Previous` action when a previous cooking step exists.

Use shadcn `Button`.

The action must update persisted session state using existing domain/API behavior.

Do not only move local UI state.

If already at the first cooking step, disable or omit Previous.

Do not wrap around.

---

# 18. Next Step

Provide `Next Step` for normal progression.

Use shadcn `Button`.

Server persistence remains authoritative for:

```text
currentStageId
currentStepId
completedStepIds
```

Do not persist a competing client-calculated session snapshot.

---

# 19. Stage Transition

When advancing from the last step in one stage, the server-authoritative lifecycle should move into the next stage.

Do not duplicate stage-transition rules in the browser if the API already owns them.

---

# 20. Final Step / Completion Boundary

On the final cooking step, change the main action from:

```text
Next Step
```

to:

```text
Finish cooking
```

or wording consistent with the existing lifecycle action.

This phase may persist:

```text
status = completed
```

if that is the existing lifecycle behavior.

Then stop.

Do **not** invoke Completion output yet.

---

# 21. Pause Cooking

Provide a secondary lifecycle action:

```text
Pause cooking
```

Do not visually compete with Next Step.

Recommended location:

```text
overflow menu
secondary action
```

Use shadcn Dialog, Drawer, or DropdownMenu where appropriate.

---

# 22. Pause Reason

The existing contract supports optional:

```text
pauseReason
```

If supported by the API, allow a compact reason.

Examples:

```text
Buying missing ingredients
Need to step away
Waiting for something
Other
```

Do not force it if the backend treats it as optional.

---

# 23. Paused UI

Paused sessions should clearly show:

```text
Cooking paused
```

and the optional reason.

Primary lifecycle action becomes:

```text
Resume cooking
```

Do not leave Next Step visually active while paused.

---

# 24. Resume

Resume must persist server state.

Do not only remove a paused overlay locally.

Refresh after Resume must show the resumed persisted state.

---

# 25. Record Change

Active Cooking must support deviations from the immutable plan.

Examples:

```text
Used less chili
Swapped pan for wok
Cooking for 3 instead of 2
Skipped garnish
Added more water
```

Record these in:

```text
session.changes
```

Do not rewrite `cookingPlan`.

---

# 26. Change Kinds

Reuse the existing contract values:

```text
ingredient
equipment
servings
step
other
```

Do not invent web-only categories.

---

# 27. Record Change UI

Create:

```text
record-change-dialog.tsx
```

Recommended fields:

```text
kind
description
related step when applicable
```

Use shadcn primitives such as Dialog/Drawer, Select, Textarea, and Button if already available or genuinely needed.

---

# 28. Related Step ID

When a change relates to the current step, use the stable current step ID.

Do not use array index.

---

# 29. Cooking Assistant

Create:

```text
cooking-assistant.tsx
```

Allow contextual questions while cooking.

Examples:

```text
"Bawangnya mulai gosong, gimana?"
"Aku ternyata gak punya spatula."
"Ini udah cukup matang belum?"
```

The request must use the existing Active Cooking runtime/API with persisted plan and session context.

---

# 30. Assistant Is Not a Generic Chat App

Keep the interaction compact.

Example:

```text
Ask Flemme
[ message input                    ]
[ Ask ]
```

The current cooking step remains the primary UI.

Do not build a large chat-history product in this phase.

---

# 31. Structured Active Cooking Output

Reuse the existing output contract:

```text
reply
actions[]
```

Do not parse reply text to decide application state.

Only structured actions may trigger lifecycle mutations.

---

# 32. Action Safety

Existing rules remain:

```text
clarify only when needed
one lifecycle action per output
actions may be empty
```

Examples:

```text
reply only
→ show reply
→ no session mutation
```

```text
action = advance
→ persist advance
```

```text
action = record-change
→ persist supported change
```

Do not infer mutations from conversational text.

---

# 33. Clarify

If the assistant returns `clarify`:

- show the reply
- allow user response
- do not advance the step
- do not create a change unless explicitly requested

---

# 34. Assistant Pending/Error State

While asking Flemme:

- keep current step visible
- prevent duplicate submission
- preserve typed input appropriately
- do not block unrelated controls unless required by the domain

On failure:

- keep session unchanged
- preserve progress
- show local retryable error

---

# 35. Query / Mutation Architecture

Recommended separation:

```text
session read query
+
progress/lifecycle mutations
+
active-cooking assistant mutation
```

Reuse the canonical:

```ts
cookingSessionQueryKey(sessionId)
```

Do not keep multiple competing local session copies.

---

# 36. Mutation Concurrency

Prevent conflicting lifecycle mutations.

Examples:

```text
double Next
Next + Pause
Resume + Advance
```

While a lifecycle mutation is pending, disable conflicting actions.

---

# 37. Cache Update

After successful session mutation, update or invalidate the canonical Cooking Session query using the validated server response.

Prefer server-authoritative correctness over complex optimistic state.

---

# 38. Refresh Persistence

Verify browser refresh after:

```text
advance
previous
pause
resume
record change
```

The same state must be restored from the server.

---

# 39. Leaving Active Cooking

Leaving the route must not reset or abandon the session automatically.

If status remains `active` or `paused`, persistence should allow later resume.

---

# 40. Resume Foundation

This phase must preserve the durable state needed for future:

```text
Home
→ Continue Cooking
→ /app/cooking/$sessionId
```

Do not implement the full Home Resume integration unless already trivial.

---

# 41. Abandon Cooking

If the existing backend supports `abandon-cooking`, expose it as a deliberate destructive action.

Recommended:

```text
overflow menu
→ Abandon cooking
→ explicit confirmation
```

Do not place it beside Next Step.

Use shadcn `AlertDialog` or equivalent when appropriate.

---

# 42. Completed / Abandoned Controls

Once status is:

```text
completed
```

or:

```text
abandoned
```

disable normal Active Cooking controls unless the domain explicitly permits post-completion editing.

---

# 43. Step Completion Semantics

Do not mark a step complete merely because it was rendered or scrolled into view.

Progress changes only through explicit persisted lifecycle behavior.

---

# 44. Structural Progress Summary

A compact summary may show:

```text
Step 5 of 9
Stage 2 of 4
```

if derived safely from stable IDs + immutable plan order.

This is structural progress, not time progress.

---

# 45. UI Density

The user may be cooking with one hand while looking at the screen briefly.

Prioritize:

```text
large step title
clear instruction
large CTA
high contrast
minimal clutter
```

Active Cooking should be calmer than Recommendation or Pre-Cooking.

---

# 46. Touch Targets

Primary controls should generally be around:

```text
44–48px minimum
```

where appropriate.

`Next Step` must be especially easy to tap.

---

# 47. Sticky Cooking Controls

A sticky bottom control area is recommended for:

```text
Previous
Next Step
```

If sticky:

- respect safe-area inset
- do not cover content
- handle mobile keyboard correctly
- preserve compact desktop canvas

---

# 48. Focused Cooking Header

Prefer a dedicated cooking header rather than the generic AppHeader.

Suggested content:

```text
Back
Recipe name
Stage progress
Overflow menu
```

Do not restore global navigation here.

---

# 49. Back Behavior

Back navigation must not reset session state.

Leaving the screen should preserve persisted active/paused state.

Do not auto-pause unless the domain explicitly requires it.

---

# 50. Visual Style

Maintain Flemme's palette and visual identity:

```text
warm cream
forest green
tomato orange
mustard
lavender
leaf green
soft pink
```

Use strong borders and hard shadows selectively.

Do not let decoration reduce cooking readability.

---

# 51. shadcn Usage

Expected primitives may include:

```text
Button
Card
Badge
Progress
Textarea
Dialog
Drawer
DropdownMenu
AlertDialog
Select
Skeleton
```

Only add components actually needed.

---

# 52. Loading State

Fresh route loading should indicate the persisted Cooking Session is being restored.

Example:

```text
Getting your cooking session ready...
```

Do not render fake step data before validation.

---

# 53. Route Error States

Handle:

```text
invalid session ID
404 missing session
403 ownership failure
corrupt persisted snapshot
network failure
```

Do not create fallback fake sessions.

---

# 54. No Inventory Mutation

Session changes do not automatically mutate Inventory in this phase.

Example:

```text
Used 1 extra egg
```

may be recorded in `session.changes` only.

---

# 55. No Plan Mutation

If the user changes equipment or ingredients during cooking, record a change.

Do not rewrite the immutable reviewed plan.

---

# 56. No Completion Output Yet

When the persisted session reaches `completed`, stop at that boundary.

Do not yet generate:

```text
Completion reply
Completion summary
Completion notes
```

---

# 57. No Nutrition Yet

Do not calculate or render final Nutrition during Active Cooking.

---

# 58. Tests

Add coverage for at least:

```text
load active persisted session
refresh restores current step
resolve current stage by stable ID
resolve current step by stable ID
invalid stage ID controlled error
invalid step ID controlled error
advance step
advance across stage boundary
previous step
first step previous disabled
final step completion boundary
double Next prevented
pause
pause reason
paused controls disabled
resume
record ingredient change
record equipment change
record serving change
record step change
record other change
stable relatedStepId
assistant reply with no action
assistant clarify
assistant advance action
assistant record-change action
assistant duplicate submission prevented
assistant failure preserves progress
abandon confirmation
completed session disables controls
abandoned session disables controls
refresh after mutation restores persisted state
no inventory mutation
no plan mutation
no Completion output request
```

Preserve all previous tests.

---

# 59. Browser Verification

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
- current step readable
- sticky actions do not cover content
- safe-area behavior
- keyboard focus visible
- Next/Previous easy to tap
- pause/resume usable
- dialogs usable on mobile
- assistant input usable with keyboard
- compact desktop canvas preserved
- BottomNavigation hidden
- refresh restores progress

---

# 60. Network Verification

Verify exactly one intended mutation per lifecycle action.

Examples:

```text
Next Step
→ exactly one progress mutation
```

```text
Pause
→ exactly one pause mutation
```

```text
Resume
→ exactly one resume mutation
```

```text
Record Change
→ exactly one change mutation
```

Confirm normal Active Cooking does not trigger accidental:

```text
Recommendation request
Pre-Cooking request
Cooking Session create request
Inventory mutation
Completion output request
Favorite mutation
```

---

# 61. Validation

Run:

```text
web typecheck
production build
tests
Biome
Oxlint
```

Run relevant API/session integration tests if persistence endpoints are changed.

Report the known OpenAI declaration parser issue separately if it remains.

---

# 62. Non-Goals

Do not implement:

```text
Completion output UI
Nutrition UI
Favorite mutation
History page
Favorites page
Inventory deduction
full Home Resume UX
```

Do not redesign Recommendation or Pre-Cooking.

Do not change the immutable plan schema.

---

# 63. Suggested Implementation Order

```text
1. Inspect existing Active Cooking runtime/contracts.
2. Inspect Cooking Session persistence endpoints.
3. Confirm lifecycle mutation endpoints/actions.
4. Confirm completed/abandoned server behavior.
5. Create active-cooking feature directory.
6. Reuse canonical cookingSessionQueryKey.
7. Build ActiveCookingPage from persisted session.
8. Resolve current stage and step by stable IDs.
9. Create StageProgress.
10. Create CurrentStepCard.
11. Create Previous / Next controls.
12. Persist progress mutations.
13. Handle stage transitions.
14. Handle final-step completion boundary.
15. Implement Pause.
16. Implement Resume.
17. Implement Record Change.
18. Implement contextual Cooking Assistant.
19. Apply structured assistant actions safely.
20. Implement Abandon confirmation if backend supports it.
21. Handle completed / abandoned render states.
22. Add loading/error states.
23. Verify refresh persistence.
24. Add tests.
25. Browser/network verify.
26. Run validation.
27. Update architecture/progress docs.
```

---

# 64. Definition of Done

Phase 5B is complete when:

- [ ] `/app/cooking/$sessionId` renders real persisted Active Cooking state.
- [ ] Route does not depend on transient Pre-Cooking state.
- [ ] Current stage resolves by stable ID.
- [ ] Current step resolves by stable ID.
- [ ] Corrupt IDs produce controlled error state.
- [ ] Current step title and description are prominent.
- [ ] Qualitative timing renders.
- [ ] Completion cue renders when available.
- [ ] Structural stage progress renders.
- [ ] Previous Step works through persisted state.
- [ ] Next Step works through persisted state.
- [ ] Duplicate lifecycle mutations are prevented.
- [ ] Stage transitions persist correctly.
- [ ] Final step reaches the completion boundary.
- [ ] Pause works.
- [ ] Optional pause reason is preserved when supported.
- [ ] Paused UI is clear.
- [ ] Resume works.
- [ ] Record Change works.
- [ ] Change kinds reuse shared contract.
- [ ] Related step uses stable step ID where applicable.
- [ ] Immutable cooking plan is never rewritten.
- [ ] Cooking Assistant can receive contextual user messages.
- [ ] Assistant output uses shared structured contract.
- [ ] Assistant reply alone does not mutate session.
- [ ] Structured actions are applied safely.
- [ ] Clarify does not advance progress.
- [ ] Assistant duplicate submission is prevented.
- [ ] Assistant error preserves persisted progress.
- [ ] Abandon is explicitly confirmed if implemented.
- [ ] Completed sessions disable active controls.
- [ ] Abandoned sessions disable active controls.
- [ ] Refresh restores persisted progress.
- [ ] Leaving the route does not reset progress.
- [ ] BottomNavigation stays hidden.
- [ ] No Inventory mutation occurs.
- [ ] No cooking plan mutation occurs.
- [ ] No Completion output is generated yet.
- [ ] No Nutrition is generated yet.
- [ ] Tailwind remains the styling system.
- [ ] shadcn primitives are reused where appropriate.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Web typecheck passes.
- [ ] Production build passes.
- [ ] Tests pass.
- [ ] Biome/lint passes.
- [ ] Relevant persistence/API integration tests pass.
- [ ] Architecture/progress docs are updated.

---

# 65. Agent Rule

For Phase 5B, optimize for:

```text
current-step clarity
+
persisted progress
+
large practical controls
+
session continuity
+
safe structured actions
```

Do not optimize for:

```text
chatbot complexity
timer precision
showing the whole recipe at once
visual density
client-only progress
```

The user should always be able to answer:

```text
Where am I?
What do I do now?
How do I know this step is done?
What should I press next?
```

without searching the page.

---

# 66. Phase Boundary

Phase 5B ends with:

```text
persisted Cooking Session
+
completed cooking lifecycle when appropriate
+
all progress and changes preserved
```

ready for:

```text
Phase 6
Completed Session
→ Completion Output
→ Completion Review
```
