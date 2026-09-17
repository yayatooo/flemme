# Flemme Web — Phase 6: Completion Output & Review v0.1

## Status

**Implementation Task**

Cooking Session Rename Dish v0.1 is complete.

Phase 6 begins from a persisted Cooking Session that has reached the terminal cooking-complete boundary and turns that completed session into Flemme's Completion output.

Scope:

```text
Completed Cooking Session
→ Completion Generation
→ CompletionOutput
→ Completion Review
→ Ready for Nutrition
```

This phase does **not** implement Nutrition yet.

It also does not create Favorites or mutate Inventory.

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

Phase 6 owns:

```text
Completed Cooking Session
→ Completion Output
→ Completion Review
```

The next phase will own:

```text
Completion
→ Nutrition
```

---

# 2. Starting Boundary

Phase 5B already provides:

```text
persisted Cooking Session
+
status = completed
+
immutable cookingPlan
+
persisted progress
+
persisted session changes
```

Phase 6 must use the persisted Cooking Session as the source of truth.

Do not depend on:

```text
Recommendation transient state
Pre-Cooking handoff
local-only Active Cooking state
```

The route must remain refresh-safe.

---

# 3. Existing Completion Contract

Reuse the existing Flemme Completion contract.

Conceptually:

```ts
type CompletionInput = {
	cookingPlan: PreCookingOutput;
	session: {
		status: "completed";
		currentStageId: string;
		currentStepId: string;
		completedStepIds: string[];
		changes: Array<{
			kind:
				| "ingredient"
				| "equipment"
				| "servings"
				| "step"
				| "other";
			description: string;
			relatedStepId?: string;
		}>;
	};
	message?: string;
};
```

Completion output conceptually:

```ts
type CompletionOutput = {
	reply: string;
	summary: {
		title: string;
		description: string;
	};
	notes: string[];
};
```

Use the actual shared schemas and exports already present in the project.

Do not create a web-only Completion model.

---

# 4. Completion Domain Principle

Completion is a post-cooking reflection/summary step.

It should summarize what was cooked based on:

```text
immutable cooking plan
+
persisted completed session
+
recorded session changes
```

Completion must not rewrite the original plan.

Completion must not mutate cooking progress.

---

# 5. customName Integration

Cooking Session now supports:

```ts
customName?: string | null;
```

User-facing title priority remains:

```text
customName
↓
selectedRecipe.name
```

Phase 6 must honor that display priority.

However:

> Do not change the Completion contract just to pass `customName`.

Use session metadata for UI display.

Keep Completion agent input focused on the existing Completion contract unless the shared domain contract is intentionally expanded later.

---

# 6. Completion Title Strategy

There are two distinct concepts:

```text
Session display name
CompletionOutput.summary.title
```

Do not conflate them automatically.

Recommended UI hierarchy:

```text
Session display name
= primary page title

Completion summary.title
= generated completion summary label / reflection title
```

If the generated title is redundant with the custom/session name, the UI may visually de-emphasize it.

Do not overwrite `customName` with generated Completion text.

---

# 7. Mandatory UI Stack

Continue using:

```text
React
TanStack Router
TanStack Query
Tailwind CSS
shadcn/ui
Lucide
```

Keep the compact authenticated app canvas.

Do not introduce another UI framework.

---

# 8. Focused Flow Layout

Completion is still part of the focused cooking flow.

Keep:

```text
global BottomNavigation hidden
```

Recommended page concept:

```text
┌──────────────────────────────┐
│ ←  Nasi Goreng Kentang      │
│                              │
│ You made it!                 │
│                              │
│ A warm one-pan rice dish...  │
│                              │
│ What changed                 │
│ • Used less chili            │
│ • Swapped pan for wok        │
│                              │
│ Flemme's notes               │
│ • ...                        │
│                              │
│ [ Continue to nutrition → ]  │
└──────────────────────────────┘
```

Do not turn Completion into a chat screen.

---

# 9. Recommended Feature Structure

Preferred:

```text
apps/web/src/features/completion/
├── completion-page.tsx
├── completion-query.ts
├── completion-summary.tsx
├── completion-changes.tsx
├── completion-notes.tsx
├── completion-loading.tsx
├── completion-error.tsx
└── index.ts
```

Follow existing project conventions if different.

Do not place domain-specific Completion behavior inside:

```text
components/ui
```

---

# 10. Route Direction

Use a persisted session route.

Recommended direction:

```text
/app/cooking/$sessionId/completion
```

or the closest route convention consistent with the current project.

The route must be based on:

```text
sessionId
```

not transient Completion state.

---

# 11. Completion Route Guard

Completion requires:

```text
persisted session exists
+
session.status === "completed"
```

If the session is:

```text
active
paused
```

do not generate Completion.

Provide a controlled route response back to Active Cooking.

If:

```text
abandoned
```

do not treat it as a completed meal.

If the session does not exist or is unauthorized, preserve existing controlled route behavior.

---

# 12. Completion Generation Boundary

Inspect the existing Completion API/runtime first.

Preferred:

```text
existing Completion endpoint
```

If a web/API boundary already exists:

```text
reuse it
```

If the Completion runtime exists but no API endpoint exists yet:

```text
add the smallest API boundary necessary
```

using the existing Completion shared contracts.

Do not create a duplicate agent runtime.

---

# 13. Recommended Endpoint Direction

Use the current backend convention.

Possible direction:

```text
POST /cooking-sessions/:id/completion
```

or:

```text
POST /cooking/completion
```

Do not invent both.

Choose the endpoint shape that best matches the current API architecture.

The API should derive authoritative session data server-side where practical.

---

# 14. Completion Input Authority

Preferred architecture:

```text
sessionId
↓
server loads persisted owned completed session
↓
server builds CompletionInput
↓
Completion runtime
```

This is stronger than trusting the browser to reconstruct the entire completed session payload.

If the existing endpoint contract already expects a full CompletionInput, preserve the established contract.

Do not casually redesign a working API.

---

# 15. Generate Once Per Completed Session

Completion generation must not run repeatedly because of re-renders.

For a given completed session:

```text
generate once
preserve result
```

If Completion output is already persisted in the current architecture:

```text
reuse persisted output
```

If it is not persisted yet, decide explicitly where it should live before relying only on transient browser cache.

---

# 16. Persistence Decision

Preferred:

```text
CompletionOutput should be durable
```

because future features need it:

```text
Nutrition
History
Favorites
returning to completed session
```

If the backend already has Completion persistence, use it.

If Completion is currently only runtime output, this phase should add the smallest durable persistence needed to make refresh safe.

Do not leave Completion as query-cache-only if a full refresh would regenerate or lose it.

---

# 17. Completion Source of Truth

After successful generation:

```text
persisted Completion result
```

should become the source of truth for the Completion page.

Do not call the agent again on every page visit.

---

# 18. Idempotency

Repeated browser actions must not create multiple Completion outputs for the same completed Cooking Session.

Use existing backend uniqueness/idempotency patterns.

At minimum:

```text
completed session
→ one canonical Completion result
```

If user retries after network failure:

```text
return/reuse the same persisted result when already generated
```

Do not duplicate Completion records.

---

# 19. Query Architecture

Use TanStack Query.

Recommended conceptual keys:

```ts
completionQueryKey(sessionId)
```

and, if generation uses mutation:

```ts
useGenerateCompletionMutation(sessionId)
```

Keep the Cooking Session canonical query separate from Completion output query state.

---

# 20. Completion Trigger

Preferred flow:

```text
final Active Cooking action
→ persisted session becomes completed
→ navigate to completion route
→ completion route resolves/generates canonical Completion
```

Do not trigger Completion before the server confirms the session is completed.

---

# 21. Loading State

Create:

```text
completion-loading.tsx
```

Suggested copy:

```text
Wrapping up your cooking session...
```

Use shadcn `Skeleton`.

Do not show fake progress percentages.

Keep the completed dish name visible if already available.

---

# 22. Error State

If Completion generation fails:

- completed Cooking Session must remain completed
- progress must remain untouched
- customName must remain untouched
- show controlled Retry
- do not send the user back into Active Cooking
- do not regenerate Recommendation or Pre-Cooking

The completed session is durable even if Completion generation temporarily fails.

---

# 23. Completion Page Goal

The user should understand:

```text
I finished cooking.
What did I make?
What changed from the original plan?
What useful notes does Flemme have?
What happens next?
```

The page should feel celebratory but still concise.

---

# 24. Page Hierarchy

Recommended:

```text
Focused header

Session display name

Completion reply

Completion summary

Changes made while cooking

Flemme notes

Continue to Nutrition
```

Do not make every section visually equal.

---

# 25. Focused Header

Recommended:

```text
Back / close
session display name
```

Use:

```text
customName ?? selectedRecipe.name
```

Do not show the global AppHeader.

---

# 26. Completion Reply

`CompletionOutput.reply` can be used as the warm post-cooking response.

Example:

```text
Nice work — dinner's ready.
```

Keep it visible but concise.

Do not treat it as a chat message list.

---

# 27. Completion Summary

Create:

```text
completion-summary.tsx
```

Render:

```text
summary.title
summary.description
```

Use Flemme display typography selectively.

Do not overwrite the session display title.

---

# 28. Session Changes

Create:

```text
completion-changes.tsx
```

Display persisted:

```text
session.changes[]
```

This helps the user understand what differed from the approved plan.

Example:

```text
What changed

• Used less chili
• Swapped the frying pan for a wok
• Added one extra egg
```

Do not invent changes not present in the persisted session.

---

# 29. No Changes State

If:

```text
session.changes.length === 0
```

do not render a large empty state.

Either:

```text
omit the section
```

or show a small positive note such as:

```text
You followed the original plan.
```

Keep it lightweight.

---

# 30. Completion Notes

Create:

```text
completion-notes.tsx
```

Render:

```text
CompletionOutput.notes[]
```

Example:

```text
Flemme's notes

• The extra egg likely made the dish richer.
• Your recorded wok swap did not change the main cooking flow.
```

Do not render empty notes as placeholder cards.

---

# 31. Notes Are Informational

Completion notes must not silently mutate:

```text
recipe
plan
session progress
inventory
favorites
```

They are post-cooking output only.

---

# 32. Cooking Plan Immutability

Phase 6 must not alter:

```text
PreCookingOutput
cookingPlan
stage IDs
step IDs
selected recipe
```

The original reviewed plan remains historical truth.

---

# 33. Session Metadata Immutability in Completion

Do not modify:

```text
customName
```

unless user explicitly uses the existing Rename Dish feature.

Completion generation itself must not rename the session.

---

# 34. Nutrition CTA

Primary CTA:

```text
Continue to nutrition
```

Use shadcn `Button`.

Example:

```tsx
<Button size="lg" className="w-full">
	Continue to nutrition
	<ArrowRight />
</Button>
```

This is the boundary to the next phase.

Do not calculate Nutrition yet.

---

# 35. Secondary Exit

A secondary action may allow:

```text
Back to Home
```

only if appropriate for the current flow.

Do not make it visually compete with:

```text
Continue to nutrition
```

The expected core flow continues forward.

---

# 36. Bottom Navigation

Keep hidden on Completion.

The user is still inside the focused post-cooking flow.

---

# 37. Mobile Layout

Mobile remains primary.

Verify:

```text
320px
390px
```

Use natural vertical flow.

Avoid side-by-side summary blocks that create wrapping problems.

---

# 38. Desktop Layout

Keep the compact app canvas.

Do not turn Completion into a wide desktop report.

---

# 39. Visual Style

Maintain Flemme:

```text
warm cream
forest green
tomato orange
mustard
lavender
leaf green
soft pink
```

Completion may be slightly more celebratory than Active Cooking.

Use:

```text
one strong accent
small groovy moment
selective hard shadow
```

Avoid a noisy confetti-heavy screen.

---

# 40. shadcn Usage

Expected primitives:

```text
Button
Card
Badge
Separator
Skeleton
```

Potentially:

```text
Collapsible
```

only if notes/changes become long.

Do not add unnecessary components.

---

# 41. Long Content Handling

If Completion notes or changes are unexpectedly long:

- preserve readability
- wrap naturally
- avoid fixed-height clipping
- use Collapsible only if needed

Do not silently truncate important generated content.

---

# 42. Refresh Safety

After Completion is generated:

```text
full browser refresh
```

must restore:

```text
completed session
customName
CompletionOutput
```

without rerunning Recommendation, Pre-Cooking, or Active Cooking.

Prefer not to rerun Completion agent either when a canonical result already exists.

---

# 43. Direct Route Safety

Visiting:

```text
/app/cooking/$sessionId/completion
```

directly should work when:

```text
session exists
session is owned
session is completed
canonical Completion exists or can be generated once
```

Do not require navigation from the final Active Cooking screen.

---

# 44. Abandoned Session

An abandoned session must not produce normal Completion output.

Handle it separately.

Do not pretend abandoned cooking is completed.

---

# 45. Existing Rename Compatibility

Completion page must immediately respect the persisted display name:

```text
customName ?? selectedRecipe.name
```

If the user renames the session before completion:

```text
Completion shows the custom name.
```

If customName is later cleared:

```text
Completion falls back to original recipe name.
```

Do not duplicate naming logic inconsistently.

---

# 46. No Inventory Mutation

Completion must cause:

```text
zero Inventory mutations
```

---

# 47. No Favorite Mutation

Completion must not automatically favorite the meal.

Favorite belongs later in the flow.

---

# 48. No History Finalization Side Effect

If Cooking History is derived from persisted completed Cooking Sessions, do not create a duplicate history record just because Completion is generated.

Follow the existing domain architecture.

Do not invent a second history store.

---

# 49. No Nutrition Yet

Do not calculate or display Nutrition in this phase.

Phase 6 ends at:

```text
ready for Nutrition
```

---

# 50. Tests — Completion Domain/API

Add coverage for at least:

```text
completed owned session can generate Completion
active session cannot generate Completion
paused session cannot generate Completion
abandoned session does not generate normal Completion
missing session → 404
cross-user session → 403
corrupt persisted session → controlled error
exact cooking plan used
exact persisted changes used
customName does not mutate Completion contract
Completion generated once/idempotently
retry returns canonical result
refresh can retrieve canonical Completion
no Inventory mutation
no Favorite mutation
no Nutrition request
```

---

# 51. Tests — Web

Add coverage for:

```text
completion route loads completed session
loading state
error + retry
customName display priority
original-name fallback
reply renders
summary renders
changes render
no-changes state
notes render
empty notes handled
Nutrition CTA visible
BottomNavigation hidden
direct refresh restores Completion
no duplicate generation
```

Preserve all existing tests.

---

# 52. Network Verification

Expected completion transition:

```text
completed session
→ one canonical Completion generation/read flow
```

Verify there are no accidental:

```text
Recommendation requests
Pre-Cooking requests
Cooking Session create requests
Active Cooking progress mutations
Inventory mutations
Nutrition requests
Favorite requests
```

during normal Completion review.

---

# 53. Browser Verification

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
- customName/title layout is stable
- summary readable
- changes readable
- notes readable
- CTA reachable
- keyboard focus visible
- compact desktop canvas preserved
- BottomNavigation hidden
- refresh works

---

# 54. Validation

Run:

```text
web typecheck
shared contracts typecheck
web production build
API build
web tests
API tests
relevant Completion integration tests
agent Completion tests
Biome
Oxlint
```

Report the known malformed OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

# 55. Non-Goals

Do not implement:

```text
Nutrition
Favorite mutation
History UI
Favorites UI
Inventory deduction
recipe editing
plan editing
new rename behavior
```

Do not redesign Active Cooking in this phase.

---

# 56. Suggested Implementation Order

Recommended:

```text
1. Inspect existing Completion contracts/runtime.
2. Inspect whether a Completion API endpoint already exists.
3. Inspect whether Completion output is already persisted.
4. Decide/reuse one canonical persistence boundary.
5. Add minimal API persistence if missing.
6. Add browser-safe Completion schema export if needed.
7. Create completion feature directory.
8. Create session-status guard.
9. Create Completion query/generation boundary.
10. Add idempotency protection.
11. Create Completion route.
12. Create CompletionPage.
13. Add loading/error states.
14. Create CompletionSummary.
15. Create CompletionChanges.
16. Create CompletionNotes.
17. Apply customName display priority.
18. Add Continue to Nutrition CTA.
19. Verify refresh/direct route.
20. Add tests.
21. Browser/network verify.
22. Run validation.
23. Update architecture/progress docs.
```

---

# 57. Definition of Done

Phase 6 is complete when:

- [ ] Completion is generated only from a persisted completed Cooking Session.
- [ ] Active/paused sessions cannot generate Completion.
- [ ] Abandoned sessions do not receive normal Completion.
- [ ] Session ownership is preserved.
- [ ] Exact immutable cooking plan is used.
- [ ] Exact persisted session changes are used.
- [ ] Existing Completion shared contract is reused.
- [ ] Completion result is durable or otherwise refresh-safe.
- [ ] Duplicate Completion generation is prevented.
- [ ] Retry does not create duplicate Completion results.
- [ ] Completion route is sessionId-based.
- [ ] Direct route access works for valid completed sessions.
- [ ] Page uses `customName ?? selectedRecipe.name`.
- [ ] Completion does not modify customName.
- [ ] Reply renders.
- [ ] Summary title/description render.
- [ ] Persisted session changes render.
- [ ] No-changes state is handled cleanly.
- [ ] Completion notes render.
- [ ] Empty notes are handled cleanly.
- [ ] Continue to Nutrition CTA exists.
- [ ] BottomNavigation remains hidden.
- [ ] No Inventory mutation occurs.
- [ ] No Favorite mutation occurs.
- [ ] No Nutrition generation occurs yet.
- [ ] No Recommendation regeneration occurs.
- [ ] No Pre-Cooking regeneration occurs.
- [ ] No Active Cooking progress mutation occurs.
- [ ] Refresh restores the same Completion.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck/build/tests/lint pass.
- [ ] Architecture/progress docs are updated.

---

# 58. Agent Rule

For Phase 6, optimize for:

```text
completed-session truth
+
durable Completion output
+
clear post-cooking summary
+
recorded-change visibility
+
clean handoff to Nutrition
```

Do not optimize for:

```text
chat UI
recipe rewriting
inventory side effects
favorite side effects
nutrition calculation
```

The user should leave this screen thinking:

> "I finished cooking, Flemme understands what changed, and I can review the result before moving on."

---

# 59. Phase Boundary

Phase 6 ends with:

```text
persisted completed Cooking Session
+
canonical CompletionOutput
+
session display name
```

ready for:

```text
Phase 7
Completion
→ Nutrition
→ Nutrition Review
```
