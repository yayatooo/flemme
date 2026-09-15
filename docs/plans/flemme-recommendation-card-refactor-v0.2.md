# Flemme Web — Recommendation Card Refactor v0.2

## Status

**UI Refactor Task**

Refactor the existing Recommendation Card so it behaves as a **decision surface**, not as a full recipe detail page.

Current problem:

```text
Too much information is visible at once.
Ingredient rows, equipment rows, warnings, rationale, statuses, and optional details compete for attention.
```

Target:

```text
Recommendation
= quick decision summary

Pre-Cooking
= detailed preparation review
```

The user should be able to scan a card quickly and answer:

```text
1. What is this recipe?
2. Why does it fit?
3. How long / how many servings?
4. Can I make it with my current context?
5. Is there anything I must confirm?
6. Do I want to select it?
```

---

# 1. Mandatory Stack

Keep using:

```text
React
TanStack Router
TanStack Query
Tailwind CSS
shadcn/ui
Lucide
```

Use existing shared primitives.

Expected shadcn primitives:

```text
Card
Button
Badge
Collapsible or Accordion
Separator
```

Do not introduce another component library.

---

# 2. Primary Refactor Rule

Do not render the entire recommendation contract at equal visual weight.

The card should be layered:

```text
summary
↓
important warning / confirmation
↓
secondary details
↓
expandable detail
↓
select action
```

The card must not feel like a formatted JSON response.

---

# 3. Target Card Anatomy

Use this structure:

```text
RecommendationCard
│
├── Status badge
│
├── Recipe title
├── Short reason
│
├── Duration + servings
│
├── Readiness summary
│   ├── Ingredients
│   └── Equipment
│
├── Required confirmations
│
├── Preference matches
│
├── Collapsible details
│   ├── Ingredient details
│   ├── Equipment details
│   └── Optional ingredients
│
└── Select recipe CTA
```

---

# 4. Recommended Visual Composition

Conceptual layout:

```text
┌──────────────────────────────────────────┐
│ [ Needs a quick check ]                  │
│                                          │
│ Indonesian-Style Potato                  │
│ and Egg Rice Skillet                     │
│                                          │
│ A quick one-pan meal that uses mostly    │
│ what you already have.                   │
│                                          │
│ 🕒 20–30 min     👥 1 serving            │
│                                          │
│ ┌────────────────┐ ┌────────────────┐    │
│ │ INGREDIENTS    │ │ EQUIPMENT      │    │
│ │ 5 available    │ │ 2 available    │    │
│ │ 1 quick check  │ │ All ready      │    │
│ └────────────────┘ └────────────────┘    │
│                                          │
│ ⚠ QUICK CHECK                            │
│ Confirm whether the rice is cooked.      │
│                                          │
│ Matches                                  │
│ [ Indonesian ] [ One pan ]               │
│                                          │
│ [ See ingredients & equipment       ⌄ ]  │
│                                          │
│ [         Select recipe →           ]    │
└──────────────────────────────────────────┘
```

---

# 5. Card Root

Use shadcn `Card`.

Example:

```tsx
<Card className="border-[3px] border-foreground bg-card p-0 shadow-hard">
	...
</Card>
```

Do not replace the card root with a plain `<div>`.

Do not add nested Card components for every subsection.

---

# 6. Status Badge

Top badge should summarize the recommendation state.

Examples:

```text
Ready to cook
Needs a quick check
Missing something
```

Use shadcn `Badge`.

Keep wording compact.

Do not show several status badges before the user has even read the title.

One top-level status is enough.

---

# 7. Recipe Title

Title should be the strongest text after the status.

Use Flemme display typography.

Example:

```tsx
<h2 className="font-heading text-3xl leading-[0.95] sm:text-4xl">
	{recipe.name}
</h2>
```

Do not make supporting copy equally bold or large.

---

# 8. Short Reason

The recommendation rationale should be concise.

Target:

```text
2–3 lines
```

Good:

```text
Uses nearly all your available ingredients and matches your Indonesian preference.
```

Avoid a second long bold paragraph.

Do not duplicate the same idea in multiple sections.

---

# 9. Duration + Servings

Show in one compact metadata row.

Example:

```text
🕒 20–30 min
👥 1 serving
```

Use Lucide icons where appropriate.

Keep this near the top.

---

# 10. Readiness Summary

Replace the long Ingredient | Equipment columns with two compact summary blocks.

Example:

```text
┌─────────────────┐ ┌─────────────────┐
│ INGREDIENTS     │ │ EQUIPMENT       │
│ 5 available     │ │ 2 available     │
│ 1 quick check   │ │ All ready       │
└─────────────────┘ └─────────────────┘
```

Use a simple grid:

```tsx
<div className="grid grid-cols-2 gap-3">
	...
</div>
```

This is the only place where 2-column content is encouraged inside the card.

Do not render full ingredient/equipment item lists here.

---

# 11. Ingredient Summary Rules

Summarize based on existing statuses:

```text
available
unconfirmed
missing
```

Possible display:

```text
5 available
1 quick check
2 missing
```

Do not show `available` as a badge on every individual item.

---

# 12. Equipment Summary Rules

Summarize equipment state.

Examples:

```text
2 available
All ready
1 unavailable
```

Do not show full equipment rows unless details are expanded.

---

# 13. Required Confirmations

Required confirmations should be highly visible.

This is more important than full ingredient detail.

Use a dedicated block:

```text
⚠ QUICK CHECK
Confirm whether the rice is already cooked.
```

Possible Tailwind treatment:

```tsx
<div className="rounded-2xl border-2 border-foreground bg-mustard/30 p-4">
	...
</div>
```

Use theme tokens where possible.

Do not hide confirmations inside the accordion.

---

# 14. Confirmation Copy

Prefer direct wording.

Good:

```text
Confirm whether the rice is already cooked.
```

Avoid:

```text
Rice · About 1 serving, cooked or enough to cook 1 serving.
Confirm whether...
```

The detailed quantity/reference can remain inside expanded details.

---

# 15. Preference Matches

Show only when non-empty.

Example:

```text
Matches
[ Indonesian ] [ One pan ] [ Spicy ]
```

Use small shadcn `Badge` items.

Do not create a large section when no matches exist.

---

# 16. Collapsible Details

Move detailed ingredient/equipment content behind an explicit expand action.

Recommended label:

```text
See ingredients & equipment
```

Collapsed by default.

Use:

```text
Collapsible
```

or:

```text
Accordion
```

from shadcn.

Do not use a custom hand-rolled disclosure if a shared primitive is available.

---

# 17. Expanded Detail Layout

Expanded content should be full-width and vertical.

Do not use Ingredient vs Equipment side-by-side columns.

Target:

```text
Ingredients
✓ Rice
  About 1 serving
  Confirm whether already cooked.

✓ Potato
  1 medium potato

✓ Egg
  1 egg

Equipment
✓ Frying pan
✓ Stove

Optional
Spring onion
Fried shallots
```

This is easier to scan in the compact 572px app canvas.

---

# 18. Ingredient Row Styling

Normal available ingredients should not have repeated `available` pills.

Prefer:

```text
✓ Rice
```

or:

```text
Rice
Available
```

with subtle styling.

Reserve stronger badges for:

```text
Check
Missing
```

This reduces visual noise.

---

# 19. Equipment Row Styling

Same rule as Ingredients.

Available equipment:

```text
✓ Frying pan
✓ Stove
```

Only use badges when attention is required.

---

# 20. Optional Ingredients

Optional ingredients belong in expanded details.

Use a clear label:

```text
Optional
```

Do not mix them with required ingredients.

Do not make them look missing.

---

# 21. Select Recipe CTA

CTA always appears at the bottom.

Use shared shadcn `Button`.

Recommended:

```tsx
<Button className="w-full" size="lg">
	Select recipe
	<ArrowRight />
</Button>
```

The CTA should remain visible without opening details.

Do not force the user to expand all details before selecting.

---

# 22. CTA Hierarchy

The primary action is:

```text
Select recipe
```

The secondary action is:

```text
See ingredients & equipment
```

Do not make both visually equal.

---

# 23. Card Spacing

Use a predictable vertical rhythm.

Suggested structure:

```text
status
gap
title
reason
gap
meta
gap
summary
gap
confirmation
gap
matches
gap
details disclosure
gap
CTA
```

Avoid random per-section margins.

Prefer parent-level `space-y-*` where appropriate.

---

# 24. No Excessive Borders

Neubrutalism does not mean every subsection needs a heavy border.

Use strong borders selectively.

Recommended:

```text
outer Card
readiness summary blocks
confirmation block
CTA
```

Avoid:

```text
border around every label
border around every row
border around every text group
```

Whitespace should do part of the hierarchy work.

---

# 25. Compact App Width

Remember the authenticated app canvas is approximately:

```text
572px
```

Design for this width first.

Do not optimize for wide desktop.

The recommendation card should remain a vertical decision flow even at desktop viewport sizes.

---

# 26. Mobile Behavior

At small widths:

```text
readiness summary
```

may remain 2 columns if readable.

If not, fall back to:

```text
grid-cols-1 sm:grid-cols-2
```

Do not allow labels to overflow.

---

# 27. Accessibility

Required:

- collapsible trigger keyboard-accessible
- `aria-expanded` handled by shadcn primitive
- buttons have visible focus state
- icons do not replace text labels
- missing/check status not communicated by color alone
- CTA remains reachable with keyboard

---

# 28. Suggested Component Refactor

Recommended internal structure:

```text
recommendation-card.tsx

RecommendationCard
├── RecommendationStatus
├── RecommendationMeta
├── ReadinessSummary
├── RequiredConfirmations
├── PreferenceMatches
├── RecommendationDetails
└── SelectRecipeButton
```

Do not necessarily create separate files for every helper.

Small internal components may remain in the same file.

Only extract when reuse or readability justifies it.

---

# 29. Suggested `RecommendationCard` Shape

Conceptually:

```tsx
export function RecommendationCard({
	recommendation,
	onSelect,
}: RecommendationCardProps) {
	return (
		<Card>
			<div className="space-y-6 p-5 sm:p-6">
				<RecommendationStatus recommendation={recommendation} />

				<header className="space-y-3">
					<h2>{recommendation.name}</h2>
					<p>{recommendation.reason}</p>
				</header>

				<RecommendationMeta recommendation={recommendation} />

				<ReadinessSummary recommendation={recommendation} />

				<RequiredConfirmations
					items={recommendation.requiredConfirmations}
				/>

				<PreferenceMatches
					items={recommendation.preferenceMatches}
				/>

				<RecommendationDetails
					recommendation={recommendation}
				/>

				<Button onClick={() => onSelect(recommendation)}>
					Select recipe
				</Button>
			</div>
		</Card>
	);
}
```

Adapt to the exact existing schema.

Do not invent field names if they differ.

---

# 30. Keep Existing Domain Behavior

This task is presentation-focused.

Do not change:

```text
Recommendation API call
request payload
TanStack Query behavior
selected recommendation state
clarification handling
no_viable handling
request restoration
back behavior
Pre-Cooking boundary
```

The exact selected recommendation object must still be preserved.

---

# 31. No Pre-Cooking Yet

Do not call Pre-Cooking as part of this refactor.

Selection behavior remains:

```text
Select recipe
↓
preserve exact selected recommendation
↓
prepare for next phase
```

No session creation.

No inventory mutation.

---

# 32. Tests to Preserve / Add

Preserve all Phase 3 tests.

Add/refine UI tests where practical for:

```text
status summary
readiness summary
required confirmation visibility
collapsible closed by default
collapsible opens
ingredient details visible after open
optional ingredients shown only in detail
select recipe still works
```

---

# 33. Browser Verification

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
- title wraps naturally
- readiness summary remains readable
- confirmation block is obvious
- collapsible works
- CTA visible
- no ingredient column imbalance
- compact desktop canvas remains unchanged

---

# 34. Validation

Run:

```text
typecheck
production build
tests
Biome
Oxlint
```

Use existing project validation commands.

---

# 35. Definition of Done

The refactor is complete when:

- [ ] Recommendation card is visibly easier to scan.
- [ ] Recipe title remains the strongest content element.
- [ ] Reason is concise and no longer visually overpowers the card.
- [ ] Duration and servings appear near the top.
- [ ] Ingredient readiness is summarized.
- [ ] Equipment readiness is summarized.
- [ ] Ingredient and equipment details are collapsed by default.
- [ ] No side-by-side long ingredient/equipment detail columns remain.
- [ ] Required confirmations are visible without expanding details.
- [ ] Available status is not repeated as a pill on every item.
- [ ] Missing/check states remain visually obvious.
- [ ] Preference matches are compact.
- [ ] Optional ingredients remain secondary.
- [ ] Select Recipe CTA stays at the bottom.
- [ ] CTA is available without expanding details.
- [ ] Card uses shadcn `Card`.
- [ ] CTA uses shadcn `Button`.
- [ ] Status uses shadcn `Badge`.
- [ ] Details use shadcn `Collapsible` or `Accordion`.
- [ ] Tailwind remains the styling system.
- [ ] Existing Phase 3 behavior is unchanged.
- [ ] Exact recommendation selection remains unchanged.
- [ ] No Pre-Cooking call is added.
- [ ] Mobile layout works.
- [ ] Compact desktop layout works.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Biome/lint passes.

---

# 36. Agent Rule

For this refactor, optimize for:

```text
scanability
+
decision hierarchy
+
honest readiness
+
compact layout
+
clear CTA
```

Do not optimize for:

```text
showing every field immediately
visual density
repeated badges
nested borders
desktop-wide layout
```

The user should be able to compare recommendations quickly without reading every ingredient detail first.
