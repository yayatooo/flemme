# Flemme Web — Phase 4: Pre-Cooking & Plan Review v0.1

## Status

**Complete**

Phase 3 Recommendation & Recipe Selection is complete.

Phase 4 begins from an already selected recommendation and turns it into an immutable Pre-Cooking plan that the user can review before starting an actual cooking session.

Scope:

```text
Selected Recipe
→ POST /cooking/pre-cooking
→ PreCookingOutput
→ Review Cooking Plan
→ Ready to Start Cooking
```

This phase must NOT create the persisted Cooking Session yet.

The next phase will own:

```text
Create Cooking Session
→ Active Cooking
```

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

Phase 4 owns:

```text
Select Recipe
→ Pre-Cooking
→ Review Plan
```

---

# 2. Existing Pre-Cooking Contract

Reuse the existing shared Flemme contract.

Do not invent another cooking-plan schema.

Current conceptual input:

```ts
{
	selectedRecipe: CookingRecommendation;
	context: CookingRecommendationInput;
}
```

The API already supports the existing persistent-context behavior.

The web should preserve:

```text
selected recipe
+
current recommendation request/context
```

from Phase 3 and submit the supported payload.

Do not reconstruct the recipe from display text.

Use the exact selected recommendation object.

---

# 3. Existing Pre-Cooking Output

The current `PreCookingOutput` shape is:

```text
preparationSummary
ingredients
equipment
preparationSteps
cookingStages
```

Conceptually:

```ts
{
	preparationSummary: {
		overview: string;
		preparationTimeMinutes: number;
		cookingTimeMinutes: number;
	};

	ingredients: Array<{
		name: string;
		quantity?: number;
		unit?: string;
	}>;

	equipment: Array<{
		name: string;
	}>;

	preparationSteps: Array<{
		id: string;
		title: string;
		description: string;
		timing?: {
			level: "very-short" | "short" | "medium" | "long";
			cue?: string;
		};
	}>;

	cookingStages: Array<{
		id: string;
		title: string;
		steps: Array<{
			id: string;
			title: string;
			description: string;
			timing?: {
				level: "very-short" | "short" | "medium" | "long";
				cue?: string;
			};
		}>;
	}>;
}
```

Use the actual shared schema and exports from the project.

Do not duplicate this schema locally if shared types already exist.

---

# 4. Locked Domain Principle

The Pre-Cooking plan is an immutable plan snapshot.

Important:

```text
PreCookingOutput
= WHAT the user should prepare and what cooking plan will be followed

Active Cooking Session
= progress through that plan
```

Do not store mutable progress inside PreCookingOutput.

Do not mark steps complete during this phase.

---

# 5. Ingredients Meaning

Locked principle:

```text
ingredients
= ingredient requirement/reference
```

Ingredients are not ingredient-preparation actions.

Example:

```text
Chicken thigh — 300 g
Garlic — 3 cloves
Sweet soy sauce — 2 tbsp
```

Actions such as:

```text
slice garlic
wash vegetables
marinate chicken
```

belong in:

```text
preparationSteps
```

Do not rename the existing contract to `ingredientPrep`.

---

# 6. Timing Principle

Step timing is intentionally qualitative.

Use:

```ts
timing?: {
	level: "very-short" | "short" | "medium" | "long";
	cue?: string;
}
```

Do not convert step timing into fake exact minute/second values.

Recipe-level preparation/cooking summary minutes may still be displayed because they already exist in `preparationSummary`.

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

Use existing App Foundation.

Use existing compact authenticated app canvas.

Do not introduce another component framework.

---

# 8. Recommended Feature Structure

Create a dedicated Pre-Cooking feature.

Preferred:

```text
apps/web/src/features/pre-cooking/
├── pre-cooking-page.tsx
├── pre-cooking-query.ts
├── pre-cooking-summary.tsx
├── ingredient-requirements.tsx
├── equipment-requirements.tsx
├── preparation-steps.tsx
├── cooking-stages-preview.tsx
├── timing-badge.tsx
├── pre-cooking-loading.tsx
├── pre-cooking-error.tsx
└── index.ts
```

Do not place domain-specific components inside:

```text
components/ui
```

---

# 9. Route

Create a dedicated route for Pre-Cooking.

Recommended direction:

```text
/app/pre-cooking
```

or an equivalent nested cooking-flow route consistent with the current TanStack Router structure.

The route should render:

```tsx
<PreCookingPage />
```

Do not place full UI markup inside the route file.

---

# 10. Route Guard / Entry Guard

Pre-Cooking requires:

```text
selectedRecipe
```

and the corresponding current recommendation/request context.

If the user enters the route without those prerequisites:

Do not generate a new recommendation.

Do not create a fake selected recipe.

Redirect or provide a controlled action back to:

```text
/app
```

or:

```text
/app/recommendation
```

depending on the current preserved flow state.

---

# 11. Pre-Cooking Request

Use TanStack Query mutation or the established request pattern.

Recommended:

```text
mutation
```

because Pre-Cooking generation is triggered from a user-selected recipe.

Flow:

```text
Select Recipe
↓
navigate to Pre-Cooking
↓
generate plan
↓
render immutable result
```

Do not call `fetch()` directly from presentational components.

---

# 12. API Endpoint

Use the existing endpoint:

```text
POST /cooking/pre-cooking
```

Do not create a new web-only backend route.

Reuse the existing persistent context and validation behavior.

---

# 13. No Duplicate Generation

Pre-Cooking generation should not run repeatedly due to incidental re-rendering.

Once a valid plan is produced for the current selection in the current flow:

```text
preserve it
```

Do not regenerate just because a child component re-renders.

---

# 14. Page Responsibility

`PreCookingPage` should mainly orchestrate:

```text
page header
loading
error
generated plan
start-cooking boundary
```

---

# 15. Pre-Cooking UI Goal

The page should answer:

```text
What are we making?
What do I need?
What should I prepare first?
What will the cooking flow look like?
Am I ready to start?
```

It should NOT yet behave like Active Cooking.

This is a review screen.

---

# 16. Recommended Page Composition

Target hierarchy:

```text
Back / Pre-Cooking

Recipe name

Preparation summary

Ingredients
Equipment

Before you cook
Preparation steps

Cooking plan
Stage preview

[ Start cooking ]
```

Do not turn every section into a large decorative card.

---

# 17. Preparation Summary

Create:

```text
pre-cooking-summary.tsx
```

Show:

```text
overview
preparationTimeMinutes
cookingTimeMinutes
```

Do not repeat the full Recommendation rationale here.

Recommendation explains why it fits.

Pre-Cooking explains how to get ready.

---

# 18. Ingredient Requirements

Create:

```text
ingredient-requirements.tsx
```

Use the `ingredients` array exactly as requirement/reference data.

Quantity and unit are optional.

Do not invent missing quantities.

Do not display preparation actions in this section.

---

# 19. Ingredient Layout

Keep it compact and scannable.

Possible style:

```text
Chicken thigh                300 g
Garlic                       3 cloves
Sweet soy sauce              2 tbsp
```

Do not use a heavy Card per ingredient.

---

# 20. Equipment Requirements

Create:

```text
equipment-requirements.tsx
```

Example:

```text
Equipment

Frying pan
Spatula
Knife
Cutting board
```

Keep equipment separate from ingredient requirements.

---

# 21. Ingredients + Equipment Composition

For the compact app canvas, prefer vertical flow.

Recommended:

```text
Ingredients
(full width)

Equipment
(full width)
```

Do not recreate the long two-column layout that caused readability problems in Recommendation.

---

# 22. Preparation Steps

Create:

```text
preparation-steps.tsx
```

Title:

```text
Before you cook
```

Each step should show:

```text
step number/order
title
description
optional timing guidance
optional cue
```

These are review instructions.

Do not add completion/progress controls.

---

# 23. Timing Badge

Create a reusable helper:

```text
timing-badge.tsx
```

Map the enum into user-facing wording.

Example:

```text
very-short → Very quick
short      → Quick
medium     → A little time
long       → Takes time
```

Keep the underlying contract unchanged.

---

# 24. Completion Cue

If a timing cue exists, show it as practical guidance.

Example:

```text
Quick
Until fragrant
```

Do not turn cues into timers.

---

# 25. Cooking Stages Preview

Create:

```text
cooking-stages-preview.tsx
```

The user should understand the upcoming flow without entering Active Cooking.

Example:

```text
Cooking plan

01 Build the sauce
   3 steps

02 Cook the chicken
   4 steps

03 Finish and serve
   2 steps
```

---

# 26. Stage Detail Strategy

Do not show every cooking step expanded by default.

Use shadcn:

```text
Accordion
```

or:

```text
Collapsible
```

to inspect a stage.

Expanded detail may show:

```text
step title
description
timing level
cue
```

No progress controls.

---

# 27. shadcn Usage

Expected primitives:

```text
Button
Card
Badge
Accordion or Collapsible
Separator
Skeleton
```

Use only where meaningful.

Do not wrap every row in Card.

---

# 28. Start Cooking CTA

The primary CTA should be:

```text
Start cooking
```

Use shadcn `Button`.

Recommended:

```tsx
<Button size="lg" className="w-full">
	Start cooking
	<ArrowRight />
</Button>
```

---

# 29. Important Phase Boundary

In Phase 4, `Start cooking` is the handoff to the NEXT phase.

Do not silently create the persisted Cooking Session yet.

Current behavior should preserve:

```text
selectedRecipe
+
request/context
+
exact PreCookingOutput
```

for Phase 5.

---

# 30. Preserve Exact Plan

The exact generated `PreCookingOutput` must survive into the next phase.

Do not reconstruct the plan from rendered DOM.

Do not regenerate the plan when Start Cooking is clicked.

---

# 31. Retry Behavior

If generation fails:

- preserve selected recipe
- preserve request/context
- offer Retry
- offer Back
- do not regenerate Recommendation automatically

Use shared `ErrorState` where appropriate.

---

# 32. Loading State

Use a plan-specific loading state.

Suggested copy:

```text
Preparing your cooking plan...
```

Use shadcn `Skeleton`.

Do not show fake progress percentages.

---

# 33. Back Behavior

Back should return to Recommendation without destroying current flow state unnecessarily.

The user may choose another recipe.

---

# 34. Bottom Navigation

Pre-Cooking is part of the focused cooking flow.

Preferred:

```text
BottomNavigation hidden
```

consistent with Recommendation.

---

# 35. Mobile Layout

Mobile remains the primary target.

Verify:

```text
320px
390px
```

Avoid dense side-by-side sections.

Use natural vertical flow.

---

# 36. Desktop Layout

Remain inside the compact authenticated canvas.

Do not widen Pre-Cooking into a desktop recipe document.

The same vertical flow is acceptable on desktop.

---

# 37. Visual Style

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

Use strong borders and hard shadows selectively.

Pre-Cooking should feel calm and readable.

---

# 38. No Excessive Decoration

Avoid:

```text
large illustrations between every section
multiple saturated cards
excessive stickers
heavy animation
```

Use brand personality selectively.

---

# 39. Data Ownership

Do not mutate:

```text
inventory
household
kitchen
preferences
```

during Pre-Cooking.

No inventory deduction happens here.

---

# 40. No Session Progress

Do not create:

```text
currentStageId
currentStepId
completedStepIds
pauseReason
changes
```

inside Pre-Cooking.

Those belong to Active Cooking session state.

---

# 41. Tests

Add coverage for:

```text
valid selected recipe generates Pre-Cooking plan
missing selected recipe is guarded
loading state
API error + retry
ingredients with quantity
ingredients without quantity
equipment rendering
preparation steps
qualitative timing
cue rendering
cooking stages preview
stage details expand/collapse
Start Cooking preserves exact plan
no session creation occurs
no inventory mutation occurs
```

Preserve all existing tests.

---

# 42. Browser Verification

Verify:

```text
320px
390px
768px
1440px
1920px
```

Check:

- no horizontal overflow
- ingredient rows readable
- preparation steps readable
- stage accordions usable
- Start Cooking CTA reachable
- focused flow has no unwanted BottomNavigation
- keyboard focus visible
- compact desktop canvas preserved

---

# 43. Validation

Run:

```text
web typecheck
production build
tests
Biome
Oxlint
```

If the already-known standalone OpenAI declaration parser issue appears again, report it separately from web acceptance.

---

# 44. Non-Goals

Do not implement:

```text
Cooking Session persistence
Active Cooking progress
step completion
pause/resume
Completion
Nutrition
Favorites
inventory deduction
```

Do not alter the PreCooking contract.

Do not convert timing levels into exact per-step minutes.

---

# 45. Suggested Implementation Order

Recommended:

```text
1. Inspect selected-recipe state from Phase 3.
2. Inspect POST /cooking/pre-cooking.
3. Reuse shared PreCooking schemas.
4. Create pre-cooking feature directory.
5. Create request/mutation module.
6. Create guarded Pre-Cooking route.
7. Create PreCookingPage.
8. Implement loading/error states.
9. Create PreCookingSummary.
10. Create IngredientRequirements.
11. Create EquipmentRequirements.
12. Create PreparationSteps.
13. Create TimingBadge.
14. Create CookingStagesPreview.
15. Add stage detail disclosure.
16. Add Start Cooking CTA boundary.
17. Preserve exact plan for Phase 5.
18. Add tests.
19. Browser verify.
20. Run validation.
21. Update architecture/progress docs.
```

---

# 46. Definition of Done

Phase 4 is complete when:

- [x] Selected recipe enters the real Pre-Cooking endpoint.
- [x] Exact selected recommendation is used.
- [x] Existing context/request is preserved.
- [x] Shared `PreCookingOutput` validation is reused.
- [x] Pre-Cooking route is guarded.
- [x] Loading state exists.
- [x] Retryable error state exists.
- [x] Preparation summary renders.
- [x] Preparation and cooking summary times render.
- [x] Ingredient requirements render.
- [x] Optional quantity/unit values are handled correctly.
- [x] Equipment requirements render.
- [x] Preparation steps render.
- [x] No progress controls exist on preparation steps.
- [x] Qualitative timing renders.
- [x] Completion cues render when present.
- [x] Cooking stages preview renders.
- [x] Stage details can be inspected without starting cooking.
- [x] Start Cooking CTA exists.
- [x] Exact PreCookingOutput is preserved for the next phase.
- [x] Start Cooking does not regenerate Pre-Cooking.
- [x] Start Cooking does not create a persisted session yet.
- [x] Inventory is not mutated.
- [x] BottomNavigation remains hidden in focused flow.
- [x] Tailwind remains the styling system.
- [x] shadcn primitives are reused where appropriate.
- [x] Mobile layout works.
- [x] Compact desktop layout works.
- [x] Typecheck passes.
- [x] Production build passes.
- [x] Tests pass.
- [x] Biome/lint passes.

---

# 47. Agent Rule

For Phase 4, optimize for:

```text
readiness
+
plan clarity
+
preparation confidence
+
immutable plan review
+
clean handoff to cooking
```

Do not optimize for:

```text
progress tracking
timer precision
session persistence
showing every cooking step by default
visual density
```

The user should leave this screen thinking:

> "I know what I need, I know what to prepare, I understand the cooking flow, and I'm ready to start."

---

# 48. Phase Boundary

Phase 4 ends with:

```text
selectedRecipe
+
request/context
+
immutable PreCookingOutput
```

preserved and ready for:

```text
Phase 5
Create Cooking Session
→ Persist Initial Progress
→ Active Cooking
```
