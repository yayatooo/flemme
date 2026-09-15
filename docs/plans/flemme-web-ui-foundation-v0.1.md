# Flemme Web UI Foundation v0.1

## Status

**Required / Locked**

This document defines the mandatory UI implementation rules for `apps/web`.

All new web UI work and all future UI refactors must follow this foundation unless the architecture documentation explicitly changes it.

---

# 1. Objective

Flemme Web must use:

- Tailwind CSS as the primary styling system.
- shadcn/ui as the primary UI primitive foundation.
- React components for reusable UI composition.
- Existing Flemme visual identity:
  - Neubrutalism.
  - Groovy retro character.
  - Friendly and playful.
  - Mobile-first.
  - Compact application layout.

The purpose of this migration is not to redesign Flemme into a generic shadcn application.

> shadcn/ui is the component foundation, not the visual identity.

The final interface must still look and feel like Flemme.

---

# 2. Installation

Flemme currently uses Vite + TanStack Router inside `apps/web`.

Use the existing project rather than creating a new Vite or TanStack project.

## 2.1 Install Tailwind CSS

From `apps/web`:

```bash
bun add tailwindcss @tailwindcss/vite
```

Add the Tailwind Vite plugin to the existing `vite.config.ts`.

Conceptually:

```ts
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    // existing Flemme plugins
    tailwindcss(),
  ],
})
```

Do not remove existing TanStack Router/Vite plugins.

In the main global stylesheet:

```css
@import "tailwindcss";
```

Keep the existing stylesheet entry/import mechanism used by the app.

---

## 2.2 Ensure `@/*` Alias Exists

shadcn/ui expects a stable source alias.

Preferred alias:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Ensure Vite can resolve the same alias.

If the project already uses `vite-tsconfig-paths`, preserve it instead of creating duplicate alias configuration.

Do not modify working import aliases unnecessarily.

---

## 2.3 Initialize shadcn/ui

After Tailwind and the alias are working:

```bash
bunx shadcn@latest init
```

Run this from:

```text
apps/web
```

Use the existing Vite project.

Do not scaffold a new application.

When prompted, configure shadcn to use the existing source structure and global stylesheet.

---

## 2.4 Add Required Components Incrementally

Example:

```bash
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add input
bunx shadcn@latest add textarea
bunx shadcn@latest add avatar
bunx shadcn@latest add badge
bunx shadcn@latest add dialog
bunx shadcn@latest add drawer
bunx shadcn@latest add skeleton
bunx shadcn@latest add sonner
```

Do not install every shadcn component upfront.

Only add components that Flemme actually needs.

---

# 3. Current Priority

The current UI priority is:

1. Establish Tailwind CSS.
2. Establish shadcn/ui.
3. Establish shared design tokens.
4. Establish reusable UI primitives.
5. Refactor existing web UI to use the new foundation.
6. Continue the Core User Flow UI only after the foundation is stable.

Do not prematurely redesign or fully implement the cooking flow while the UI foundation is inconsistent.

---

# 4. Mandatory Styling Stack

All components inside `apps/web` must use Tailwind CSS for styling.

Preferred:

```tsx
<div className="flex items-center gap-3 border-2 px-4 py-3">
  ...
</div>
```

Avoid inline styling:

```tsx
<div
  style={{
    display: "flex",
    padding: "16px",
  }}
>
```

Avoid component-specific CSS files such as:

```text
home.css
button.css
recipe-card.css
```

unless there is a strong technical reason that cannot reasonably be expressed with Tailwind.

Global CSS is allowed for:

- CSS variables.
- Tailwind setup.
- fonts.
- application-wide reset/base styling.
- reusable theme tokens.
- special global effects that cannot reasonably live inside utilities.

---

# 5. shadcn/ui Is the Primitive Foundation

Use shadcn/ui primitives whenever the required primitive already exists.

Examples:

```text
Button
Input
Textarea
Dialog
Sheet
Drawer
Popover
DropdownMenu
Avatar
Card
Badge
Checkbox
RadioGroup
Tabs
Tooltip
Skeleton
Sonner
```

Do not rebuild these primitives from scratch without a specific reason.

Prefer:

```tsx
<Button variant="default">
  Continue
</Button>
```

over raw HTML buttons when the shared Button primitive already exists.

The Flemme visual system should customize shadcn primitives rather than bypass them.

---

# 6. shadcn Is Not the Final Visual Style

Do not keep the default shadcn appearance untouched.

Flemme requires its own visual language.

The implementation should transform shadcn primitives through:

- Tailwind classes.
- component variants.
- CSS variables.
- reusable visual tokens.

The resulting interface should feel like:

```text
shadcn structure
+
Tailwind implementation
+
Flemme neubrutalism
+
groovy retro personality
```

Not:

```text
default shadcn dashboard
```

---

# 7. Flemme Visual Direction

The main visual direction is:

**Neubrutalism with groovy retro influence.**

Typical characteristics may include:

- strong borders.
- visible shapes.
- expressive typography.
- playful proportions.
- solid surfaces.
- hard or offset shadows.
- strong contrast.
- rounded shapes where appropriate.
- intentionally bold UI hierarchy.
- retro-inspired accent colors.
- playful illustrations or decorative elements where useful.

The interface must remain practical and readable.

Functional hierarchy always comes before decoration.

---

# 8. Design Tokens First

Do not scatter arbitrary visual values throughout feature components.

Prefer centralized semantic tokens.

Conceptual examples:

```css
--background;
--foreground;

--primary;
--primary-foreground;

--secondary;
--secondary-foreground;

--accent;
--accent-foreground;

--surface;
--surface-muted;

--border;
--ring;

--danger;
--success;

--radius;
```

Flemme-specific tokens may later cover:

```text
brand orange
brand green
retro yellow
cream background
hard shadow
border thickness
```

Avoid:

```tsx
className="bg-[#F06C2E] text-[#101010]"
```

Prefer:

```tsx
className="bg-primary text-primary-foreground"
```

Exact values belong to the theme layer.

---

# 9. Neubrutalist Primitive Rules

Reusable Flemme UI primitives should share a common interaction language.

Typical button characteristics:

- clearly visible border.
- strong readable label.
- visible pressed/hover state.
- optional hard shadow.
- sufficiently large touch target.

Interaction can communicate physical movement using:

```text
translate
shadow reduction
border emphasis
background shift
```

Keep interactions subtle enough to remain usable.

---

# 10. Component Architecture

Use three conceptual component levels.

## Level 1 — UI Primitives

Location:

```text
apps/web/src/components/ui/
```

Examples:

```text
button.tsx
input.tsx
textarea.tsx
card.tsx
dialog.tsx
drawer.tsx
badge.tsx
avatar.tsx
```

Rules:

- no Flemme business logic.
- reusable across features.
- may contain Flemme visual variants.
- may extend standard shadcn variants.

---

## Level 2 — Shared Application Components

Recommended location:

```text
apps/web/src/components/
```

Examples:

```text
AppHeader
BottomNavigation
PageContainer
SectionHeader
EmptyState
LoadingState
ErrorState
NutritionBadge
RecipeSummaryCard
```

These components compose UI primitives but remain broadly reusable.

---

## Level 3 — Feature Components

Domain-specific components belong close to their feature.

Examples:

```text
RecommendationCard
PreCookingIngredientList
CookingStageProgress
ActiveCookingStep
CompletionSummary
InventoryItem
FavoriteRecipeCard
```

Do not place business-specific components inside:

```text
components/ui
```

---

# 11. Mobile-First Is Mandatory

Flemme is designed mobile-first.

Think in this order:

```text
mobile
↓
tablet
↓
desktop
```

Not:

```text
desktop
↓
shrink into mobile
```

Interactive targets should generally be around:

```text
44–48px minimum
```

where appropriate.

Avoid tiny icon-only controls without sufficient hit areas.

---

# 12. Desktop Does Not Become a Dashboard

Desktop viewport does not automatically mean:

- wide enterprise dashboard.
- permanent sidebar.
- multiple dashboard columns.
- excessive use of horizontal space.

Flemme should retain its compact application feeling.

Default behavior:

```text
desktop browser

┌──────────────────────────────────────────────┐
│                                              │
│          ┌──────────────────────┐            │
│          │                      │            │
│          │     Flemme App       │            │
│          │                      │            │
│          └──────────────────────┘            │
│                                              │
└──────────────────────────────────────────────┘
```

The main application surface remains centered.

Desktop should primarily provide:

- breathing room.
- slightly more comfortable spacing where useful.
- wider content only when genuinely required.

Do not introduce a desktop sidebar unless a future UX decision explicitly requires one.

---

# 13. Application Width

The default experience should remain close to a mobile application even on larger screens.

Conceptual example:

```tsx
<main className="mx-auto min-h-dvh w-full max-w-xl">
  ...
</main>
```

The exact max width can evolve.

The important rule is:

> Do not stretch standard Flemme pages across the entire desktop viewport.

---

# 14. Navigation Direction

Expected primary app navigation:

```text
Home
Inventory
History
Favorites
```

Mobile-first navigation can remain bottom-oriented.

The desktop version should not automatically transform this into a sidebar.

---

# 15. Cooking Flow Is Different From Global Navigation

These screens:

```text
Recommendation
Recipe Selection
Pre-Cooking
Active Cooking
Completion
Nutrition
```

are part of a task flow, not global navigation destinations.

Mental model:

```text
GLOBAL APP

Home
Inventory
History
Favorites

        ↓ launches

COOKING FLOW

Recommendation
↓
Recipe
↓
Pre-Cooking
↓
Cooking Session
↓
Active Cooking
↓
Completion
↓
Nutrition
```

---

# 16. Preserve Existing Domain Behavior During Refactor

The UI migration must not casually change working application behavior.

Preserve where possible:

- routes.
- API contracts.
- TanStack Query behavior.
- mutations.
- schemas.
- authentication.
- session persistence.
- business validation.
- cooking lifecycle rules.

Refactor primarily:

```text
presentation
component composition
layout
styling
interaction hierarchy
```

Do not rewrite domain logic merely because the visual component is changing.

---

# 17. Tailwind Usage Rules

Prefer Tailwind utilities directly in JSX.

Use reusable abstractions when class combinations become meaningful design patterns.

Good:

```tsx
<Card className="border-2 shadow-hard">
```

Good:

```tsx
<Button variant="brutal">
```

Avoid abstraction only for the sake of hiding simple Tailwind classes.

Do not over-engineer the design system.

---

# 18. Variants Instead of Duplicated Components

Use variants when behavior is shared but appearance differs.

Example:

```tsx
<Button variant="default" />
<Button variant="secondary" />
<Button variant="ghost" />
<Button variant="destructive" />
```

Flemme-specific variants may be introduced where justified:

```tsx
<Button variant="retro" />
<Card variant="interactive" />
<Badge variant="nutrition" />
```

Avoid creating:

```text
OrangeButton
GreenButton
RecipeButton
CookingButton
LargeCookingButton
```

---

# 19. Responsive Rules

Avoid arbitrary breakpoint-specific redesigns.

Prefer:

```text
same information hierarchy
same primary actions
same navigation model
more breathing room
slightly larger container if useful
```

instead of turning mobile and desktop into two different products.

---

# 20. Groovy Retro Usage

Groovy retro styling should mostly appear through:

- typography.
- illustration.
- accent colors.
- decorative shapes.
- icon treatment.
- section composition.
- micro-interactions.

Decorative typography is best suited for:

```text
headings
hero text
brand moments
empty states
special labels
```

Body copy and functional controls should remain highly readable.

---

# 21. Accessibility

Required considerations:

- sufficient color contrast.
- visible focus states.
- keyboard support where applicable.
- accessible labels.
- semantic HTML.
- sufficient touch targets.
- understandable disabled states.
- errors must not rely only on color.

Preserve Radix/shadcn accessibility behavior during customization.

---

# 22. Loading, Empty, and Error States

Every data-driven screen must eventually support:

```text
loading
empty
error
success/content
```

Use shared primitives where possible.

Avoid blank screens during API operations.

---

# 23. Avoid Generic SaaS UI

Do not generate layouts that look like:

```text
admin dashboards
analytics products
enterprise SaaS panels
generic shadcn demos
```

Avoid defaulting to:

- sidebars.
- KPI cards everywhere.
- excessive tables.
- tiny muted text.
- multiple nested neutral cards.
- gray-on-gray interfaces.

Flemme is a consumer cooking assistant.

---

# 24. Avoid Excessive Card Nesting

Do not wrap every section in a Card.

Bad:

```text
Card
 └ Card
    └ Card
       └ Button
```

Whitespace, typography, borders, and layout can create hierarchy without excessive containers.

---

# 25. Existing Web Migration Strategy

Expected migration order:

```text
1. Tailwind foundation
2. shadcn setup
3. global theme tokens
4. base UI primitives
5. app-level shared components
6. existing page migration
7. core-flow screen implementation
```

Do not rewrite the entire application in one pass.

Keep the app runnable during incremental migration.

---

# 26. Dependency Rule

Do not introduce another general UI framework unless explicitly approved.

Do not add:

```text
Material UI
Chakra UI
Ant Design
Mantine
Bootstrap
styled-components
Emotion
```

for normal Flemme UI work.

Standard stack:

```text
React
+
Tailwind CSS
+
shadcn/ui
```

---

# 27. Installation Responsibility

Tailwind CSS and shadcn/ui installation/configuration may be performed manually by the project owner.

When working after installation:

1. inspect the existing setup.
2. use the installed configuration.
3. do not reinstall or replace the setup unnecessarily.
4. do not migrate to a different styling stack.
5. do not overwrite theme configuration without checking existing project decisions.

If a shadcn component is missing, add only the required component.

---

# 28. Core User Flow Context

Current Flemme Core User Flow:

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

Future UI implementation must respect this lifecycle.

Visual refactoring must not collapse lifecycle boundaries already represented by the domain model.

---

# 29. Current Home Layout Direction

The existing design sketch is a directional reference, not a pixel-perfect specification.

Important ideas to preserve:

```text
Flemme / profile header

personal greeting

large primary cooking input

quick-access areas

recent / highlighted cooking history

persistent primary navigation

compact centered app composition
```

Exact content, spacing, cards, typography, and visual treatment may evolve.

Preserve the hierarchy and mobile-first philosophy rather than copying the sketch literally.

---

# 30. Definition of Done for New Web Components

A new or refactored web component is consistent when:

- [ ] Styling uses Tailwind CSS.
- [ ] Existing shadcn primitive is reused where applicable.
- [ ] Business logic is not placed inside `components/ui`.
- [ ] Flemme visual styling is preserved.
- [ ] Mobile view is the primary target.
- [ ] Desktop remains compact unless wider layout is justified.
- [ ] No unnecessary sidebar/dashboard transformation is introduced.
- [ ] Theme tokens are preferred over arbitrary colors.
- [ ] Interaction states exist where appropriate.
- [ ] Accessible shadcn/Radix behavior is preserved.
- [ ] Existing API/domain behavior remains intact during UI refactors.
- [ ] No competing UI framework is introduced.
- [ ] The component remains understandable and maintainable.

---

# 31. Agent Rule

For every future task inside `apps/web`, assume:

> Tailwind CSS + shadcn/ui + Flemme's neubrutalism/groovy-retro design language are the default UI architecture.

Do not ask whether a new component should use Tailwind or shadcn.

It should.

Only deviate when a task explicitly requires an exception.

When an exception is required, explain the technical reason before introducing it.
