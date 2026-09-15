# Flemme Web — Phase 3: Recommendation & Recipe Selection v0.1

## Status

**Implementation Task**

Phase 1 App Foundation and Phase 2 Home Composition are considered complete.

Phase 3 connects the Home cooking intent to Flemme's existing Recommendation capability and introduces the recipe selection experience.

Scope:

```text
Home
→ Recommendation Request
→ Recommendation Results
→ Select Recipe
```

This phase ends when the user has selected one recommendation and the app is ready to enter Pre-Cooking.

Do not implement Pre-Cooking execution in this phase.

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

Phase 3 owns:

```text
Home
→ Recommendation
→ Select Recipe
```

The next phase will own:

```text
Selected Recipe
→ Pre-Cooking
```

---

# 2. Existing Domain Contracts

Do not invent a new recommendation model.

Reuse the existing Flemme recommendation contracts.

The current Recommendation input already supports:

```text
inventory
kitchen
household
foodPreferences
cookingPreferences
session
```

Home should primarily contribute the current session request.

Persistent context remains the source of truth unless explicitly overridden.

Expected conceptual request:

```ts
{
	session: {
		request: string;
		servings?: number;
		availableMinutes?: number;
	}
}
```

Do not resend fake or duplicated persistent context from the UI unless the API contract requires it.

---

# 3. Existing Recommendation Output

The existing Recommendation capability can return:

```text
recommendations
clarification
no_viable
```

The web UI must support all three output variants.

Do not assume every successful HTTP response contains recipe cards.

---

# 4. Mandatory UI Stack

Continue using:

```text
React
+
TanStack Router
+
TanStack Query
+
Tailwind CSS
+
shadcn/ui
+
Lucide
```

Use existing shared app components from Phase 1.

Use existing Home components from Phase 2.

Do not introduce another UI framework.

---

# 5. Architecture Direction

Dependency direction remains:

```text
API contract
    ↓
query/mutation layer
    ↓
feature state
    ↓
feature component
    ↓
route
```

UI primitives remain:

```text
shadcn primitive
    ↓
Flemme feature component
```

Do not put API behavior inside `components/ui`.

---

# 6. Recommended Feature Structure

Extend Home only where needed and create a Recommendation feature.

Preferred:

```text
apps/web/src/features/
├── home/
│   ├── cooking-prompt.tsx
│   ├── quick-start.tsx
│   └── ...
│
└── recommendation/
    ├── recommendation-page.tsx
    ├── recommendation-card.tsx
    ├── recommendation-list.tsx
    ├── recommendation-loading.tsx
    ├── recommendation-clarification.tsx
    ├── recommendation-empty.tsx
    ├── recommendation-query.ts
    ├── recommendation-state.ts
    └── index.ts
```

Exact filenames may follow current conventions.

Avoid creating unnecessary layers.

---

# 7. Home Submission Integration

Phase 2 intentionally left Home submission unbound.

Phase 3 must connect:

```text
CookingPrompt
QuickStart
```

to the Recommendation flow.

Both entry points must produce the same conceptual input:

```text
session.request
```

Do not maintain two separate recommendation implementations.

---

# 8. Cooking Prompt Submission

When the user submits:

```text
"Something spicy with chicken"
```

the app should:

1. validate non-empty request
2. prevent duplicate submission
3. preserve current text
4. trigger Recommendation request
5. move into Recommendation UI
6. show loading state while waiting
7. show controlled error state if request fails

Do not clear the prompt immediately.

---

# 9. Quick Start Submission

Quick Start options already populate valid session request strings.

Phase 3 should allow Quick Start to either:

```text
populate → user confirms
```

or, if the current Home UX already indicates direct action:

```text
populate + submit
```

Choose one consistent behavior.

Do not create different API contracts for Quick Start.

---

# 10. Recommendation Route

Create a dedicated Recommendation route.

Recommended direction:

```text
/app/recommendation
```

or an equivalent route compatible with the current TanStack Router structure.

The route should render a feature-level page:

```tsx
<RecommendationPage />
```

Do not place the complete recommendation UI directly inside the route file.

---

# 11. Request State Across Navigation

Do not rely only on transient component state if route navigation would lose the current request.

Use one clear strategy compatible with the project:

```text
router state
search params
feature state
query cache
```

The current session request should survive the immediate Home → Recommendation navigation.

Avoid putting large recipe payloads into URL search params.

---

# 12. TanStack Query

Use TanStack Query for the Recommendation request.

Recommended pattern:

```text
mutation
```

because the user is submitting an intent/request.

The mutation layer should own:

- API call
- loading
- error
- response data

The page should own presentation.

Do not call `fetch()` directly inside visual components.

---

# 13. Recommendation Request Boundary

Create a dedicated query/mutation module.

Example:

```text
recommendation-query.ts
```

Responsibilities:

- call the existing Recommendation endpoint
- send only supported request fields
- preserve typed contracts
- map controlled API failures if needed
- return schema-compatible output

Do not duplicate Zod contract definitions inside the web feature if shared contracts are already available.

---

# 14. Recommendation Page Layout

The Recommendation page should remain inside the compact AppShell.

Conceptual:

```text
┌──────────────────────────────┐
│ ← Recommendations            │
│                              │
│ Based on what you have       │
│                              │
│ [ Recipe Card ]              │
│                              │
│ [ Recipe Card ]              │
│                              │
│ [ Recipe Card ]              │
│                              │
└──────────────────────────────┘
```

Do not turn this into a marketplace grid.

The API returns 1–3 recommendations.

Design for that exact scale.

---

# 15. Recommendation Page Header

Keep the header functional.

Recommended content:

```text
back action
page title
optional request summary
```

Example:

```text
Recommendations

"Something quick with eggs"
```

Do not create another marketing hero.

---

# 16. Recommendation Card

Create:

```text
recommendation-card.tsx
```

Use shadcn `Card`.

Each recommendation should present the most useful decision information.

Recommended anatomy:

```text
Recipe name
Reason
Estimated duration
Servings
Preference matches
Ingredient status summary
Equipment status summary
Required confirmations
Select Recipe CTA
```

Do not show every contract field with equal visual weight.

---

# 17. Recommendation Card Hierarchy

Recommended priority:

```text
1. Recipe name
2. Why it fits
3. Time + servings
4. Ingredient/equipment readiness
5. Required confirmation
6. Select Recipe
```

Optional ingredients should remain secondary.

Avoid creating a dense specification sheet.

---

# 18. Recipe Name

Use Flemme's expressive heading typography.

Keep it readable.

Example:

```tsx
<h2 className="font-heading text-3xl leading-none">
	Ayam Kecap
</h2>
```

Do not make all supporting information use display typography.

---

# 19. Reason

The recommendation `reason` is important because Flemme is not just returning random recipes.

Show it clearly.

Example:

```text
Uses the chicken and sweet soy sauce you already have and fits your 30-minute request.
```

This reinforces personalization.

---

# 20. Estimated Duration

Use the Recommendation output's estimated duration.

Do not invent precise cooking-stage timing here.

This is only recipe-level expected duration.

The existing Pre-Cooking/Active Cooking timing rules remain separate.

---

# 21. Servings

Display recipe servings if provided.

Do not perform additional serving mathematics in the Recommendation card.

Use the contract value.

---

# 22. Ingredient Status

Recommendation output includes ingredient status categories:

```text
available
unconfirmed
missing
```

The UI should summarize these clearly.

Possible treatment:

```text
Available        green
Needs check      mustard
Missing          tomato / warning
```

Use shadcn `Badge` or small status rows.

Do not hide missing ingredients.

---

# 23. Ingredient Status Priority

Do not display a massive ingredient table on Recommendation.

Recommended summary:

```text
5 available
1 needs confirmation
2 missing
```

Optionally expose names in a compact list if useful.

Full ingredient preparation belongs in Pre-Cooking.

---

# 24. Equipment Status

Display whether required equipment fits the user's known kitchen context.

Use existing output.

Do not assume generic equipment such as:

```text
pan
stove
knife
```

unless returned or known from context.

---

# 25. Preference Matches

Preference matches should be shown as positive supporting evidence.

Example:

```text
Matches:
Spicy
One-pan
Indonesian-inspired
```

Use small badges.

Do not show empty sections when there are no matches.

---

# 26. Required Confirmations

This is important.

If the Recommendation output includes:

```text
requiredConfirmations
```

the card must show them before recipe selection.

Example:

```text
Before cooking:
• Cooking oil availability is unknown.
```

Do not silently treat unknown ingredients as available.

---

# 27. Optional Ingredients

Optional ingredients should be visually secondary.

Recommended:

```text
Optional:
Spring onion
Fried shallots
```

Do not imply they are mandatory.

---

# 28. Select Recipe CTA

Every valid recommendation should have a clear primary action:

```text
Select recipe
```

Use shadcn `Button`.

Do not use vague labels:

```text
Continue
Choose
Go
```

unless the surrounding UI makes it explicit.

Preferred:

```text
Select recipe →
```

---

# 29. Selection Behavior

Selecting a recommendation should:

1. keep the exact recommendation object
2. mark it as the selected recipe for the next phase
3. navigate toward Pre-Cooking entry
4. NOT regenerate Recommendation
5. NOT create a Cooking Session yet
6. NOT mutate inventory

Selection means:

> The user chose this proposed recipe.

Nothing more.

---

# 30. Preserve Selected Recommendation

The selected recommendation must survive navigation into the next phase.

Do not reconstruct it from display text.

Preserve the schema-compatible object.

Possible storage boundary:

```text
route state
feature state
query cache
```

Use the simplest existing architecture.

---

# 31. Pre-Cooking Boundary

Phase 3 should end at a clean boundary such as:

```text
selectedRecipe available
+
context/request still available
```

The next phase will call:

```text
POST /cooking/pre-cooking
```

using:

```text
selectedRecipe
+
context
```

Do not call Pre-Cooking inside the Recommendation card unless Phase 4 explicitly owns that transition.

---

# 32. Clarification Variant

The Recommendation capability may return:

```text
clarification
```

Create:

```text
recommendation-clarification.tsx
```

The UI should:

- explain what Flemme needs
- provide an input for the user's answer
- preserve the existing request
- allow resubmission

Do not redirect back to onboarding for session-specific clarification.

---

# 33. Clarification Philosophy

Clarification should only happen when the recommendation agent genuinely cannot proceed.

Existing Flemme principle:

> Use persistent context before asking.

The web UI must not add extra questions beyond what the API returns.

---

# 34. Clarification Submission

A clarification reply should be treated as continuation of the current recommendation attempt.

Do not wipe the original request.

Do not reset the entire Home flow.

Keep the interaction compact.

---

# 35. No Viable Variant

The Recommendation capability may return:

```text
no_viable
```

Create a useful state for this.

Example:

```text
We couldn't find a good match with the current kitchen context.

[ Adjust request ]
[ Check inventory ]
```

Do not present this as a generic system error.

This is a valid domain result.

---

# 36. No Viable vs Error

Keep these distinct.

```text
no_viable
= valid agent/domain response

network/API failure
= error
```

Do not render both using the same error message.

---

# 37. Loading State

Use a Recommendation-specific loading presentation.

Reuse shadcn `Skeleton` and shared loading patterns.

Possible content:

```text
Finding something that fits...
```

Keep it brief.

Do not fake progress percentages.

---

# 38. Request Error

On API/network failure:

- preserve user request
- offer Retry
- offer Back
- do not lose Home input
- do not show raw backend errors

Use the existing shared `ErrorState` if appropriate.

---

# 39. Back Navigation

The user should be able to return to Home and revise the request.

Do not lose the last request unnecessarily.

Expected:

```text
Recommendation
← Home
```

If Home is restored, the textarea should ideally retain the latest request within the current flow.

---

# 40. Bottom Navigation

Recommendation is part of the cooking task flow.

Do not assume global BottomNavigation must remain visible.

For Phase 3, choose one consistent behavior:

### Option A

Keep AppShell but hide BottomNavigation on Recommendation.

### Option B

Keep BottomNavigation temporarily if current architecture makes hiding it costly.

Preferred long-term direction:

```text
task flow
→ reduced global navigation
```

Do not redesign Phase 1 architecture heavily just for this.

---

# 41. Recommended Page Composition

Conceptually:

```tsx
<PageContainer>
	<RecommendationHeader />

	{mutation.isPending ? (
		<RecommendationLoading />
	) : result.type === "recommendations" ? (
		<RecommendationList recommendations={result.recommendations} />
	) : result.type === "clarification" ? (
		<RecommendationClarification result={result} />
	) : (
		<RecommendationNoViable result={result} />
	)}
</PageContainer>
```

Adapt to the actual existing schema discriminator.

Do not invent discriminator names if shared contracts already define them.

---

# 42. Mobile Layout

Cards should stack vertically.

Do not use horizontal carousels as the primary recommendation interaction.

The user should be able to compare 1–3 recipes by natural vertical scrolling.

---

# 43. Desktop Layout

Authenticated compact canvas remains.

Do not transform recommendations into a 3-column desktop marketplace.

The same vertical card flow is acceptable on desktop.

---

# 44. Visual Style

Keep Flemme identity:

- warm cream
- forest green
- tomato orange
- mustard
- lavender
- leafy green
- soft pink
- bold border
- selective hard shadow
- groovy heading moments

But recommendation comparison must stay readable.

Do not make every status badge a different saturated color if it creates visual noise.

---

# 45. Card Styling

Use outer border and spacing thoughtfully.

Avoid excessive nested bordered regions.

Recommended:

```text
Card
├── heading
├── reason
├── metadata
├── readiness summary
└── CTA
```

Not:

```text
Card
├── Card
├── Card
├── Card
└── Card
```

---

# 46. Existing Home Components

Do not rewrite Phase 2 Home unnecessarily.

Only modify:

```text
CookingPrompt
QuickStart
HomePage
```

where needed to enable Recommendation handoff.

Preserve:

```text
ActiveSessionCard
KitchenShortcut
RecentCooking
HomeGreeting
```

unless a direct integration dependency requires a small change.

---

# 47. No Fake Context

Do not add fallback fake values for:

```text
inventory
household
kitchen
preferences
```

The API already owns persistent context loading.

If required context is genuinely unavailable, handle the real API response.

---

# 48. No Fake Recommendation Data in Production

Fixtures may be used for visual development/tests.

Keep them isolated.

Production Home → Recommendation flow must use the actual Recommendation API.

Do not silently retain fixture results after integration.

---

# 49. Tests

Add tests for at least:

```text
Home submit passes request
Quick Start passes valid request
Recommendation loading
Recommendation success
1 recommendation
3 recommendations
clarification result
no viable result
API error
select recipe
back navigation
```

Also preserve existing tests.

---

# 50. Browser Verification

Verify at minimum:

```text
320px
390px
768px
1440px
1920px
```

Check:

- no horizontal overflow
- cards readable
- statuses wrap correctly
- CTA remains reachable
- BottomNavigation behavior is intentional
- back action works
- focus states visible

---

# 51. Validation

Before completion:

```text
typecheck
production build
relevant tests
Biome
Oxlint if currently part of project validation
```

Do not report completion if the actual Recommendation flow is still using fixtures.

---

# 52. Non-Goals

Do not implement:

```text
Pre-Cooking generation
Cooking Session creation
Active Cooking
Completion
Nutrition calculation UI
Favorite mutation
full History
full Inventory
```

Do not mutate inventory during recommendation.

Do not create a cooking session when a recipe is merely selected.

---

# 53. Suggested Implementation Order

Recommended:

```text
1. Inspect existing Recommendation API endpoint and shared schema.
2. Inspect Home submit boundaries from Phase 2.
3. Create recommendation feature directory.
4. Create Recommendation mutation/query module.
5. Connect CookingPrompt to submission.
6. Connect Quick Start to same submission path.
7. Create Recommendation route.
8. Create RecommendationPage.
9. Create RecommendationLoading.
10. Create RecommendationCard.
11. Create RecommendationList.
12. Render ingredient/equipment/preference readiness.
13. Implement clarification variant.
14. Implement no-viable variant.
15. Implement API error/retry.
16. Implement selected-recipe state boundary.
17. Implement Select Recipe CTA.
18. Prepare handoff to Pre-Cooking without calling it yet.
19. Add tests.
20. Browser verify responsive behavior.
21. Run typecheck/build/tests/lint.
22. Update architecture/progress docs.
```

---

# 54. Definition of Done

Phase 3 is complete when:

- [ ] Home cooking prompt submits to the real Recommendation endpoint.
- [ ] Quick Start uses the same Recommendation submission path.
- [ ] Persistent user context remains API-owned.
- [ ] No fake inventory/profile context is introduced.
- [ ] Recommendation route exists.
- [ ] Recommendation page uses the compact authenticated app layout.
- [ ] Loading state exists.
- [ ] API error state exists.
- [ ] Recommendation result variant is supported.
- [ ] 1–3 recommendation cards render correctly.
- [ ] Cards use shadcn `Card`.
- [ ] CTAs use shadcn `Button`.
- [ ] Status elements reuse shadcn `Badge` where appropriate.
- [ ] Reason is visible.
- [ ] Estimated duration is visible.
- [ ] Servings are visible when available.
- [ ] Ingredient readiness is visible.
- [ ] Equipment readiness is visible.
- [ ] Preference matches are visible when present.
- [ ] Required confirmations are not hidden.
- [ ] Optional ingredients remain clearly optional.
- [ ] Clarification variant is supported.
- [ ] No-viable variant is supported.
- [ ] No-viable is not treated as API error.
- [ ] User can go back and adjust request.
- [ ] Recipe can be selected.
- [ ] Exact selected recommendation is preserved.
- [ ] Selecting a recipe does not create a cooking session.
- [ ] Selecting a recipe does not mutate inventory.
- [ ] Selecting a recipe does not regenerate Recommendation.
- [ ] Pre-Cooking is not executed yet.
- [ ] Mobile rendering works.
- [ ] Compact desktop rendering works.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Relevant tests pass.
- [ ] Biome/lint passes.

---

# 55. Agent Rule

For Phase 3, optimize for:

```text
real Recommendation integration
+
easy recipe comparison
+
honest ingredient readiness
+
clear recipe selection
+
preserved persistent context
```

Do not optimize for:

```text
recipe marketplace UI
excessive detail
fake data
additional context questions
premature Pre-Cooking
```

The user should understand:

```text
Why was this recommended?
Can I actually make it?
What is missing or uncertain?
Which recipe do I want?
```

within a few seconds.

---

# 56. Phase Boundary

Phase 3 ends with:

```text
selectedRecipe
+
current recommendation context/request
```

available for the next task.

Next:

```text
Phase 4
Selected Recipe
→ Pre-Cooking
→ Review Plan
```
