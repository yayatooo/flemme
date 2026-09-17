# Flemme Web — Phase 7: Nutrition & Nutrition Review v0.1

## Status

**Implementation Task**

Phase 6 Completion Output & Review is complete.

Phase 7 converts the completed Cooking Session into a deterministic Nutrition snapshot and presents an honest Nutrition Review.

## Scope

```text
Completed Cooking Session
+
Completion Snapshot
        ↓
Nutrition Input Projection
        ↓
Ingredient Resolution
        ↓
Nutrition Reference Matching
        ↓
Deterministic Nutrition Calculation
        ↓
Persisted Nutrition Snapshot
        ↓
Nutrition Review
        ↓
Ready for Favorite
```

This phase must use the existing Flemme Nutrition Foundation.

Do **not** replace deterministic nutrition calculation with an AI estimate.

The next phase will own:

```text
Nutrition Review
→ Favorite
```

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

Phase 7 owns:

```text
Completion
→ Nutrition
→ Nutrition Review
```

---

# 2. Starting Boundary

Phase 6 already guarantees:

```text
persisted completed Cooking Session
+
completion_snapshot
+
immutable cookingPlan
+
persisted changes[]
+
customName metadata
```

Phase 7 must derive Nutrition from persisted session data.

Do not depend on transient Recommendation, Pre-Cooking, or Active Cooking state.

---

# 3. Existing Nutrition Foundation

Reuse the existing deterministic Nutrition package.

Current public API conceptually:

```ts
calculateRecipeNutrition({
	recipe: {
		servings,
		ingredients: [
			{
				ingredientKey,
				name,
				grams,
			},
		],
	},
	references: [
		{
			ingredientKey,
			basisGrams: 100,
			nutrition: {
				caloriesKcal,
				proteinG,
				carbsG,
				fatG,
			},
		},
	],
});
```

Use the actual current `@flemme/nutrition` API.

Do not duplicate the calculator in API or Web.

---

# 4. Existing Ingredient Foundation

Reuse the canonical ingredient system from:

```text
@flemme/ingredients
```

Use canonical ingredient keys.

Do not make Nutrition depend on free-text ingredient names when canonical identity can be resolved.

---

# 5. Nutrition Principle

Nutrition in Flemme is:

```text
deterministic
+
reference-driven
+
non-medical
+
honest about coverage
```

It is not:

```text
AI-generated nutrition
medical advice
precision beyond available ingredient/reference data
```

---

# 6. Important Data Problem

The Pre-Cooking contract allows:

```text
ingredient name
optional quantity
optional unit
```

while the Nutrition calculator requires:

```text
grams
```

Therefore Phase 7 must **not assume every session is fully calculable**.

Inspect real available data for each ingredient:

```text
canonical ingredient identity?
quantity?
unit?
gram conversion?
nutrition reference?
```

Do not silently invent grams.

---

# 7. Honest Coverage Rule

Nutrition Review must distinguish:

```text
fully calculable
partially calculable
not calculable
```

Never turn missing data into fake zeroes.

---

# 8. Nutrition Snapshot Ownership

Preferred architecture:

```text
completed Cooking Session
↓
server derives deterministic Nutrition input
↓
calculator
↓
persist nutrition_snapshot
↓
Nutrition Review
```

The browser should not be the calculation authority.

---

# 9. Existing Session Snapshot Field

Phase 6 intentionally left:

```text
nutrition_snapshot
```

empty.

Phase 7 should populate that field or the current canonical Nutrition persistence location.

Do not introduce a duplicate store.

---

# 10. Recommended API Boundary

Preferred:

```text
POST /cooking-sessions/:id/nutrition
```

Server responsibilities:

```text
1. authenticate
2. load owned session
3. require completed status
4. reuse existing snapshot if present
5. derive Nutrition input
6. resolve ingredients/references
7. calculate deterministically
8. persist nutrition_snapshot
9. return canonical result
```

Reuse an equivalent endpoint if one already exists.

---

# 11. Lifecycle Guard

Only:

```text
status = completed
```

is eligible.

Guard:

```text
active
paused
abandoned
missing
cross-user
```

using existing API conventions.

---

# 12. Idempotency

Nutrition must be canonical per completed session.

If snapshot exists:

```text
reuse it
```

Do not recalculate on refresh.

Do not create duplicates.

---

# 13. Refresh Safety

After generation:

```text
full refresh
→ same persisted nutrition_snapshot
```

Do not rerun the calculator just because the page reloads.

---

# 14. Calculation Source

Nutrition should derive from:

```text
cookingPlan.ingredients
+
session.changes[]
```

Do not use marketing/demo values.

Do not rely only on Recommendation ingredients when the approved plan differs.

---

# 15. Planned Ingredients vs Recorded Changes

The plan represents:

```text
what the user intended to use
```

`changes[]` may represent:

```text
what changed while cooking
```

Apply a change numerically only when it is deterministic.

Examples:

```text
used one extra egg
```

may be usable only if quantity is structured.

```text
used less chili
```

is not enough to infer grams.

Do not parse vague natural language into guessed nutrition.

---

# 16. v0.1 Change Handling

For v0.1:

```text
apply only deterministic structured changes
```

If `changes[]` does not contain enough quantitative information:

```text
do not numerically apply it
```

Instead disclose a coverage limitation.

Example:

```text
Nutrition is based on the approved plan.
One recorded ingredient change could not be quantified.
```

---

# 17. Ingredient Resolution

For every ingredient:

```text
ingredient name
↓
canonical resolver
↓
ingredientKey
```

Possible:

```text
resolved
unresolved
```

Reuse existing deterministic resolver behavior.

---

# 18. Nutrition Reference Resolution

Distinguish:

```text
ingredient unresolved
```

from:

```text
ingredient resolved but nutrition reference unavailable
```

These are different coverage problems.

---

# 19. Quantity / Unit Normalization

Only convert to grams when deterministic.

Potentially safe when supported:

```text
g
kg
```

Potentially unsafe without ingredient-specific data:

```text
clove
medium potato
tbsp
piece
cup
```

Do not use guessed conversions.

---

# 20. Ingredient-Specific Conversions

If canonical gram conversion data already exists:

```text
reuse it
```

If not:

```text
do not invent it in Phase 7
```

Mark the ingredient as not numerically covered.

---

# 21. Servings

Use the real serving count from the persisted plan/session.

Do not infer servings from household size if the plan already established servings.

Do not invent missing serving counts.

---

# 22. Calculator Output

Primary macros:

```text
Calories
Protein
Carbohydrates
Fat
```

Do not add micronutrients unless the existing Nutrition Foundation supports them.

---

# 23. Whole Recipe vs Per Serving

Clearly communicate calculation basis.

Preferred:

```text
Per serving
420 kcal
18 g protein
54 g carbs
14 g fat

2 servings
```

Preserve the actual calculator contract.

---

# 24. Coverage Metadata

If the existing snapshot does not already support coverage metadata, add the smallest explicit shape needed.

Conceptual example:

```ts
coverage: {
	status: "complete" | "partial" | "unavailable";
	includedIngredients: string[];
	excludedIngredients: Array<{
		name: string;
		reason:
			| "unresolved-ingredient"
			| "missing-reference"
			| "unknown-quantity"
			| "unsupported-unit"
			| "unquantified-change";
	}>;
}
```

Use project naming conventions.

---

# 25. Snapshot Principle

Persist enough data to render Nutrition Review without recalculation:

```text
nutrition totals
serving basis
coverage status
coverage limitations
```

Do not persist only display strings.

---

# 26. Shared Contract

Add or reuse a browser-safe Nutrition snapshot contract.

Prefer the existing contracts package architecture.

Do not pull server/runtime-heavy modules into the browser.

---

# 27. Nutrition Route

Recommended:

```text
/app/cooking/$sessionId/nutrition
```

The route should:

```text
load completed session
guard lifecycle
resolve/generate canonical snapshot
render Nutrition Review
```

Do not put Nutrition payloads in URL params.

---

# 28. Completion CTA Integration

Wire Phase 6:

```text
Continue to nutrition
```

to:

```text
/app/cooking/$sessionId/nutrition
```

Do not regenerate Completion.

---

# 29. Nutrition Page Goal

The user should understand:

```text
What is the estimated nutrition?
What is the serving basis?
How complete is the calculation?
What could not be calculated?
What should I do next?
```

---

# 30. Recommended UI Composition

```text
← Completion

NUTRITION

Nasi Goreng Kentang Telur

Estimated nutrition

┌──────────────────────────────┐
│ 420 kcal                     │
│ Per serving                  │
│                              │
│ Protein   18 g               │
│ Carbs     54 g               │
│ Fat       14 g               │
└──────────────────────────────┘

2 servings

Calculation coverage
[ Mostly covered ]

Calculated from 5 ingredients.
1 ingredient was not included because
its quantity was unknown.

[ See calculation details ⌄ ]

[ Save to favorites → ]
```

Directional only.

---

# 31. Display Name

Reuse:

```text
customName
↓
selectedRecipe.name
```

Do not add another naming rule.

---

# 32. Nutrition Disclaimer

Keep it concise:

```text
Estimated from the ingredient amounts Flemme could calculate.
```

If partial:

```text
Some ingredients could not be included, so the actual values may be higher or lower.
```

Do not claim clinical accuracy.

---

# 33. Macro Summary

Create something like:

```text
nutrition-summary.tsx
```

Show:

```text
calories
protein
carbs
fat
```

Calories may be visually primary.

Avoid four giant equal-weight cards if they create noise.

---

# 34. Coverage UI

Create something like:

```text
nutrition-coverage.tsx
```

Possible labels:

```text
Complete estimate
Partial estimate
Not enough data
```

Never say:

```text
100% accurate
```

---

# 35. Coverage Details

Use shadcn `Collapsible` or `Accordion`.

Example:

```text
Included
✓ Rice — 200 g
✓ Egg — 50 g

Not included
• Garlic — quantity unknown
• Sambal — nutrition reference unavailable
```

---

# 36. No Fake Zero Values

Excluded ingredients must not become:

```text
0 kcal
```

Show:

```text
Not included
```

plus reason.

---

# 37. Unavailable State

If nothing meaningful can be calculated:

```text
We don't have enough quantity/reference data to estimate this meal yet.
```

Do not show:

```text
0 kcal
0 protein
0 carbs
0 fat
```

The user should still be able to continue the product flow.

---

# 38. Partial State

Partial calculation is valid.

Example:

```text
Estimated nutrition
~350 kcal

Based on 4 of 6 ingredients.
```

Use approximate markers consistently.

---

# 39. No Agent Call

Do not invoke any LLM/agent to calculate Nutrition.

Nutrition values remain deterministic.

---

# 40. No Inventory Mutation

Phase 7 causes:

```text
zero Inventory mutations
```

---

# 41. Favorite Boundary Only

The Nutrition page may expose:

```text
Save to favorites
```

as the next flow boundary.

Do not persist a Favorite yet.

That belongs to Phase 8.

---

# 42. Completion Snapshot

Do not mutate:

```text
completion_snapshot
```

during Nutrition generation.

---

# 43. Nutrition Snapshot Immutability

Once generated:

```text
treat snapshot as historical output
```

Do not silently recalculate old sessions whenever reference data later changes.

Future explicit recalculation/versioning can be separate.

---

# 44. Loading State

Suggested:

```text
Calculating your meal...
```

Use shadcn `Skeleton`.

No fake progress percentages.

---

# 45. Error State

On failure:

- completed session remains completed
- Completion snapshot remains unchanged
- customName remains unchanged
- preserve retry
- allow Back to Completion
- do not rerun Completion

---

# 46. Direct Route Safety

Direct:

```text
/app/cooking/$sessionId/nutrition
```

must work from persisted server state.

Do not require transient navigation state.

---

# 47. Bottom Navigation

Keep hidden during Nutrition Review.

---

# 48. Responsive Rules

Verify:

```text
320px
390px
768px
1440px
1920px
```

Keep the compact 572px desktop canvas.

Do not turn Nutrition into an analytics dashboard.

---

# 49. Visual Style

Maintain Flemme's palette and neubrutalist/groovy-retro character.

Nutrition should feel:

```text
clear
friendly
data-aware
not clinical
```

Use expressive typography sparingly.

---

# 50. shadcn Usage

Expected:

```text
Button
Card
Badge
Separator
Collapsible or Accordion
Skeleton
```

Do not introduce unnecessary table components.

---

# 51. Tests — Projection

Cover:

```text
resolved ingredient + grams
unresolved ingredient
resolved ingredient without reference
unknown quantity
unsupported unit
supported gram conversion
partial coverage
no calculable ingredients
serving basis
recorded unquantified change
```

---

# 52. Tests — API

Cover:

```text
completed owned session generates Nutrition
active rejected
paused rejected
abandoned rejected
missing → 404
cross-user → 403
corrupt snapshot controlled
existing nutrition_snapshot reused
concurrent generation does not duplicate
refresh returns same snapshot
Completion snapshot unchanged
cookingPlan unchanged
progress unchanged
customName unchanged
no Inventory mutation
no Favorite mutation
```

---

# 53. Tests — Web

Cover:

```text
Nutrition CTA from Completion
route lifecycle guard
loading
retryable error
display-name priority
complete state
partial state
unavailable state
calories
protein
carbs
fat
serving basis
coverage summary
coverage disclosure
excluded reasons
BottomNavigation hidden
refresh restores snapshot
Favorite boundary visible
```

---

# 54. Network Verification

First Nutrition visit:

```text
→ one canonical Nutrition generation request
```

Refresh:

```text
GET session
→ persisted snapshot
→ zero regeneration
```

Confirm zero accidental:

```text
Recommendation
Pre-Cooking
Cooking Session create
Active Cooking progress
Completion generation
Inventory mutation
Favorite mutation
```

---

# 55. Validation

Run:

```text
nutrition package tests
ingredient package tests
shared contracts typecheck
web typecheck
web production build
API build
web tests
API tests
focused Nutrition integration tests
Biome
Oxlint
```

Report the known malformed OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

# 56. Non-Goals

Do not implement:

```text
Favorite persistence
History UI
Favorites page
Inventory deduction
medical advice
AI nutrition estimation
large speculative unit-conversion framework
```

Do not redesign Completion.

---

# 57. Suggested Implementation Order

```text
1. Inspect @flemme/nutrition API.
2. Inspect @flemme/ingredients resolver.
3. Inspect nutrition references and gram coverage.
4. Inspect session nutrition_snapshot persistence.
5. Define exact Nutrition snapshot contract.
6. Define deterministic plan → calculator projection.
7. Define partial/unavailable behavior.
8. Add/reuse browser-safe snapshot schema.
9. Add Nutrition API endpoint.
10. Add lifecycle/ownership guard.
11. Add idempotent persistence.
12. Add concurrency protection.
13. Wire Completion CTA.
14. Create Nutrition route.
15. Create NutritionPage.
16. Add loading/error states.
17. Create NutritionSummary.
18. Create NutritionCoverage.
19. Add coverage disclosure.
20. Handle unavailable state without zeroes.
21. Add Favorite boundary CTA.
22. Verify refresh/direct route.
23. Add tests.
24. Browser/network verify.
25. Run validation.
26. Update architecture/progress docs.
```

---

# 58. Definition of Done

- [ ] Existing deterministic Nutrition package is reused.
- [ ] No LLM is used for Nutrition.
- [ ] Only completed owned sessions are eligible.
- [ ] Active/paused/abandoned sessions are guarded.
- [ ] Canonical ingredient resolution is reused.
- [ ] Existing nutrition references are reused.
- [ ] Unsupported ingredients are not guessed.
- [ ] Unknown quantities are not turned into zero.
- [ ] Unsupported units are not guessed.
- [ ] Only deterministic gram conversions are used.
- [ ] Planned ingredients are the primary source.
- [ ] Recorded changes are applied only when quantitatively deterministic.
- [ ] Unquantified changes are disclosed as limitations.
- [ ] Nutrition snapshot persists.
- [ ] Snapshot generation is idempotent.
- [ ] Concurrent duplicate generation is prevented.
- [ ] Refresh restores the same snapshot.
- [ ] Historical snapshots do not silently change with future reference updates.
- [ ] Complete coverage state works.
- [ ] Partial coverage state works.
- [ ] Unavailable state works.
- [ ] Unavailable state does not display fake zero nutrition.
- [ ] Calories render when calculable.
- [ ] Protein renders when calculable.
- [ ] Carbs render when calculable.
- [ ] Fat renders when calculable.
- [ ] Serving basis is clear.
- [ ] Coverage limitations are visible.
- [ ] `customName ?? selectedRecipe.name` is respected.
- [ ] Completion snapshot remains unchanged.
- [ ] Cooking plan remains unchanged.
- [ ] Cooking progress remains unchanged.
- [ ] No Inventory mutation occurs.
- [ ] No Favorite mutation occurs yet.
- [ ] BottomNavigation stays hidden.
- [ ] Favorite is only the next flow boundary.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Tests/build/typecheck/lint pass.
- [ ] Architecture/progress docs are updated.

---

# 59. Agent Rule

Optimize for:

```text
deterministic calculation
+
honest data coverage
+
clear macro summary
+
durable historical snapshot
+
simple Nutrition Review
```

Do not optimize for:

```text
false precision
AI estimates
guessed grams
clinical presentation
analytics-dashboard UI
```

Core rule:

> If Flemme cannot calculate an ingredient honestly, disclose the limitation instead of inventing a number.

---

# 60. Phase Boundary

Phase 7 ends with:

```text
persisted completed Cooking Session
+
Completion snapshot
+
canonical Nutrition snapshot
+
coverage metadata
```

ready for:

```text
Phase 8
Nutrition Review
→ Favorite
→ Favorite Persistence
```
