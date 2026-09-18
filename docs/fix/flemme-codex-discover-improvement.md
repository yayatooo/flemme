# Codex Task — Improve Flemme Discover Section

## Goal

Improve the existing `Discover` section so it feels like a natural continuation of the new Flemme hero.

The current hero direction is already accepted:

```text
Let Flemme do the thinking.
You do the cooking.
```

The Discover section should now visually answer:

```text
What can Flemme actually help me make?
```

This task is **not** a full landing-page redesign.

Only improve the Discover section and its recipe-card presentation.

---

# 1. Visual Direction

The Discover section should feel:

- warm,
- clean,
- food-first,
- visually connected to the hero,
- bento-inspired,
- more intentional than a generic recipe grid,
- less like a SaaS card catalogue.

Use the same visual family already established by the hero:

```text
warm cream background
deep green / dark ink text
orange primary accent
soft green supporting accent
warm neutral surfaces
rounded geometry
lightweight shadows/borders
```

Do not introduce a second color system.

Do not bring back the old retro-groovy direction.

---

# 2. Locked Discover Copy

Replace the current heading:

```text
Good food is already in there.
```

with:

```text
See what you can make.
```

Use this description:

```text
Flemme turns what you already have into meals worth cooking.
```

Keep the kicker:

```text
DISCOVER
```

The heading should be visually smaller than the hero headline.

The hero remains the strongest typography moment on the page.

---

# 3. Section Hierarchy

The intended hierarchy is:

```text
DISCOVER

See what you can make.          Flemme turns what you already have
                                into meals worth cooking.

[ featured recipe ]

[ secondary recipe ] [ secondary recipe ]
```

Do not add extra marketing blocks.

Do not add fake stats.

Do not add filters, tabs, categories, search, or new routes.

---

# 4. Bento Recipe Layout

Keep the existing data and existing three recipe cards.

Do not add more recipe data.

Use the existing composition:

```text
Featured recipe
→ full-width across the top

Secondary recipes
→ two cards below on desktop
```

But improve the visual character so the three cards do not feel like identical white catalogue cards.

The featured card should clearly feel primary.

The two secondary cards should feel related but visually lighter.

---

# 5. Color Treatment

Use the current Flemme palette/tokens already present in the project.

Do not hardcode a new independent palette if semantic tokens already exist.

Recommended direction:

```text
Featured card
→ warm orange / peach surface

Secondary card A
→ soft green surface

Secondary card B
→ warm neutral / cream surface
```

The exact implementation should follow existing tokens.

If the current theme does not expose direct semantic variants for these surfaces, use localized classes based on existing brand colors rather than globally redefining theme variables.

Do not change global tokens solely for this section if doing so affects `/app`, auth, onboarding, or other landing sections.

---

# 6. Featured Recipe Card

The featured card should remain a two-column composition on desktop:

```text
image
+
content
```

But reduce the current feeling of excessive empty whitespace.

Current content order should remain approximately:

```text
meta
recipe name
description
nutrition metrics
primary CTA
```

Keep the existing content and data.

Do not invent ingredients, tags, match scores, or additional metadata unless already present in the current recipe data contract.

### Featured visual

The food image should feel large and appetizing.

Keep:

```text
object-cover
rounded corners
```

The image should feel integrated with the card, not like a thumbnail.

### Featured title

Use the current geometric sans visual language.

Do not use old editorial/retro heading styles.

Prefer:

```text
font-semibold / font-bold
tight tracking
clean line-height
```

The title can remain large, but should not visually compete with the main section heading.

### Featured CTA

Keep a full primary CTA:

```text
View recipe →
```

Reuse the existing `Button` primitive.

Do not change its route/behavior unless the current implementation is clearly incorrect.

---

# 7. Secondary Recipe Cards

The two lower cards should not simply duplicate the exact featured-card layout at a smaller size.

Make them feel more compact and poster-like.

Preferred direction:

```text
food image
meta
title
short description
nutrition summary
text/link-style recipe action
```

On desktop, it is acceptable for the cards to remain horizontal if the current composition works better.

The key requirement is hierarchy:

```text
featured
→ primary

secondary
→ compact browse items
```

For secondary cards, the action should be visually quieter than the featured CTA.

Preferred treatment:

```text
View recipe →
```

as a text/link action instead of another large orange button.

Do not create a new button primitive solely for this.

Reuse an existing link or button variant if available.

---

# 8. Recipe Metrics

Keep the existing:

```text
Calories
Protein
```

Do not add new nutrition metrics.

For secondary cards, the metrics may be compressed into a lighter horizontal presentation if that improves balance.

Example direction:

```text
510 kcal · 34g protein
```

Do not change the underlying data.

Do not fabricate nutrition values.

---

# 9. Remove the Redundant Bottom CTA

Remove this bottom Discover CTA:

```text
See what Flemme can do
```

The section already demonstrates what Flemme can do through the recipe cards.

The next landing section should carry the product-flow explanation.

Do not replace it with another CTA.

Do not add a new section.

---

# 10. Spacing and Section Rhythm

The Discover section should remain spacious but not oversized.

The current layout has a lot of empty vertical space inside the featured card.

Improve internal spacing before increasing section height.

Keep the section visually distinct from the hero while using the same visual language.

Suggested rhythm:

```text
section kicker
small gap
heading + description
medium/large gap
featured recipe
small/medium gap
secondary recipes
section end
```

Do not add giant arbitrary margins to simulate a premium layout.

---

# 11. Responsive Behavior

## Desktop

Maintain:

```text
featured full-width
two secondary cards below
```

The section should feel like one bento composition.

## Tablet

Allow the featured card to collapse sensibly if its two-column layout becomes cramped.

Secondary cards may stack if needed.

## Mobile

Preferred flow:

```text
kicker
heading
description
featured recipe
secondary recipe
secondary recipe
```

Each recipe card should become easy to scan vertically.

Avoid:

- tiny side-by-side image/content layouts,
- cramped metrics,
- multiple CTAs competing for width,
- horizontal overflow.

Do not preserve desktop orientation if it harms readability.

---

# 12. Existing Component Boundaries

Start from the current implementation.

Relevant components may include:

```text
DiscoverSection
LandingRecipeCard
SectionHeading
RecipeMetric
```

Reuse the existing component structure where reasonable.

Do not create a large new abstraction unless there is actual reuse value.

Do not move files merely to match an ideal folder structure.

A small visual variant for featured vs secondary is acceptable.

---

# 13. Preserve Existing Data and Behavior

Do not change:

- recipe data source,
- recipe names,
- descriptions,
- nutrition values,
- image paths,
- app APIs,
- auth,
- route guards,
- onboarding,
- backend,
- `/app`.

Do not connect Discover to a real recipe API in this task.

This remains a landing-page presentation task.

---

# 14. Anti-Slop Rules

Do not add:

- gradients,
- glassmorphism,
- AI sparkle icons,
- rating stars,
- fake popularity counts,
- fake recipe counts,
- badges that are not backed by current data,
- extra CTA cards,
- nested cards for decoration,
- hover-only information,
- floating UI fragments,
- random decorative pills,
- different accent color for every card,
- heavy shadows.

Bento does not mean every piece of text needs a box.

Keep the composition clean.

---

# 15. Visual Priority

The Discover section hierarchy should be:

```text
1. Section heading
2. Featured recipe
3. Food photography
4. Recipe names
5. Secondary recipes
6. Nutrition/detail metadata
```

Do not let nutrition metrics or CTA buttons become the dominant visual element.

---

# 16. Runtime Verification

Inspect the real landing page after implementation.

Verify at minimum:

```text
360px
390px
768px
1024px
1440px
```

Check:

- section heading wrapping,
- description width,
- featured-card balance,
- food image crop,
- card heights,
- secondary-card alignment,
- CTA hierarchy,
- metrics readability,
- no horizontal overflow,
- visual continuity with the hero above.

Do not claim runtime verification if it was not actually performed.

---

# 17. Repository Verification

Use only scripts that exist in the repository.

Run relevant checks:

```text
typecheck
web build
lint / Biome
git diff --check
```

Do not modify unrelated files just to make checks pass.

---

# Final Report

Report:

1. Files changed.
2. Discover heading changes.
3. Card color/surface decisions.
4. Featured-card changes.
5. Secondary-card changes.
6. CTA hierarchy changes.
7. Responsive behavior.
8. Verification actually performed.
9. Any deviations from this task and why.

---

# Acceptance Criteria

- [ ] Heading is `See what you can make.`
- [ ] Description is `Flemme turns what you already have into meals worth cooking.`
- [ ] Discover visually matches the hero palette.
- [ ] Featured recipe is clearly the primary card.
- [ ] Secondary recipe cards are more compact and visually lighter.
- [ ] Cards no longer feel like three identical white catalogue cards.
- [ ] Existing recipe data remains unchanged.
- [ ] No fake metrics, filters, categories, or new features are introduced.
- [ ] Bottom `See what Flemme can do` CTA is removed.
- [ ] Mobile layout is intentionally vertical and readable.
- [ ] No unrelated landing sections or `/app` behavior are changed.
- [ ] Repository checks are reported truthfully.
