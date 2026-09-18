# Flemme Web — Platform Base Styling Foundation v0.1

## Status

**Implemented — Styling Only**

This task establishes the new base visual system for the authenticated Flemme platform before any page-by-page UI migration.

The goal is **not** to redesign layouts, routes, data flow, or component composition.

The goal is to make the frontend styling foundation consistent and ready for later migration.

---

# 1. Scope

Focus only on the authenticated user platform:

```text
/app
/app/profile
/app/inventory
/app/history
/app/favorites
/app/recommendation
/app/pre-cooking
/app/cooking/*
Completion
Nutrition
```

Do **not** migrate Login/Register/Onboarding legacy CSS in this task.

Do **not** change the public Landing page in this task.

Those will be migrated later after the platform base styling is accepted.

---

# 2. Locked Stack

All authenticated platform UI must use:

```text
Tailwind CSS
+
shadcn/ui
```

Use Lucide for icons where appropriate.

Do not introduce:

```text
page-specific vanilla CSS
CSS Modules
styled-components
Emotion
Material UI
Chakra
Mantine
Bootstrap
```

Global CSS remains allowed only for:

```text
CSS variables / semantic theme tokens
font declarations
Tailwind setup
global reset/base rules
focus/accessibility rules
very small app-wide utilities when unavoidable
```

Do not create new semantic page classes such as:

```text
.profile-card
.inventory-card
.platform-header
.primary-button
```

Those should be Tailwind/shadcn composition.

---

# 3. Visual Direction

The authenticated Flemme platform should move toward:

```text
Soft Groovy Neubrutalism
```

Use the same Flemme brand palette and typography already present in the project.

The visual direction should feel:

```text
warm
food-oriented
friendly
editorial
mobile-first
softly physical
clean
playful but controlled
```

Do not copy the prototype layout or content.

Use the prototype only as a **styling reference**.

---

# 4. What Must Stay Unchanged

Do not change:

```text
route structure
TanStack Query behavior
API contracts
auth behavior
session persistence
cooking lifecycle
page section order
page information hierarchy
component ownership
feature boundaries
form behavior
existing responsive logic unless required by the new root container
```

Do not move components around simply to match the reference prototype.

The existing Flemme product structure remains authoritative.

---

# 5. Allowed Layout Change

One layout change is explicitly allowed:

> Replace the current narrow authenticated desktop canvas with a reusable Tailwind platform container.

The current fixed/narrow ~572px desktop canvas should no longer be the global platform constraint.

Use a root container pattern such as:

```tsx
<div className="container mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
	{children}
</div>
```

Exact max width may be adjusted during implementation if visual verification shows a better value.

Preferred range:

```text
max-w-4xl
to
max-w-5xl
```

Default target:

```text
max-w-5xl
```

Requirements:

```text
mobile → full width with safe horizontal padding
tablet → naturally expands
desktop → centered max-width container
large desktop → does not stretch indefinitely
```

Do not introduce a sidebar.

Do not introduce dashboard columns globally.

Page-specific content may remain single-column even inside a wider root container.

---

# 6. Platform Layout Ownership

Keep a simple hierarchy:

```text
viewport
└── AppShell
    └── PlatformContainer
        ├── AppHeader
        ├── Page Content
        └── BottomNavigation
```

The width constraint belongs to the platform root/container.

Individual pages should not repeatedly implement:

```text
mx-auto
max-w-*
container
```

unless a section genuinely needs a narrower reading width.

---

# 7. Create / Refine PlatformContainer

Use or introduce a simple shared component such as:

```text
components/app/platform-container.tsx
```

Conceptually:

```tsx
export function PlatformContainer({
	children,
	className,
}: PlatformContainerProps) {
	return (
		<div
			className={cn(
				"container mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8",
				className,
			)}
		>
			{children}
		</div>
	);
}
```

Keep it small.

Do not create a layout framework.

---

# 8. AppShell Responsibility

`AppShell` should own:

```text
minimum viewport height
platform background
platform theme scope
safe area
global app composition
```

`AppShell` should not contain page-specific styling.

Suggested direction:

```tsx
<div className="min-h-dvh bg-background text-foreground">
	<PlatformContainer>
		...
	</PlatformContainer>
</div>
```

Adapt to the current route structure.

---

# 9. Theme Tokens

Keep brand values centralized.

Use semantic variables rather than hard-coded hex values inside feature components.

Required semantic roles should include the existing shadcn roles:

```text
background
foreground
card
card-foreground
popover
popover-foreground
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
accent
accent-foreground
destructive
border
input
ring
```

Flemme-specific tokens may remain for:

```text
tomato
mustard
leaf
lavender
soft-pink
cream
forest
```

only when genuinely needed.

Feature components should prefer semantic roles.

---

# 10. Platform Theme Scoping

Do not accidentally restyle the Landing page while refining the authenticated platform.

If needed, scope authenticated theme overrides at the AppShell boundary using a platform theme wrapper/data attribute.

Example concept:

```tsx
<div data-theme="platform">
```

Global CSS may define only token overrides for that theme scope.

Do not place layout/component CSS inside the theme scope.

The purpose is:

```text
Landing visual system stays stable
Authenticated platform can evolve safely
```

---

# 11. Typography

Keep the existing Flemme font family choices.

Use typography by role:

```text
Display / serif / groovy font
→ page titles
→ important card titles
→ celebratory moments

Clean sans
→ body
→ form labels
→ metadata
→ buttons
→ navigation

Uppercase tracking
→ eyebrow / kicker / small category labels
```

Avoid using the display font for long body text.

---

# 12. Typography Scale

Standardize a small platform scale.

Recommended direction:

```text
Page title:
text-4xl / sm:text-5xl
font-heading

Section title:
text-xl / text-2xl
font-heading or strong sans depending on context

Body:
text-base
leading-relaxed

Secondary:
text-sm
text-muted-foreground

Eyebrow:
text-xs
font-bold
uppercase
tracking-[0.12em]
```

Do not scatter arbitrary text sizes everywhere.

---

# 13. Surface Hierarchy

Not every section should have the same visual weight.

Use three surface levels.

## Primary Surface

For major feature focus:

```text
strong brand fill
or
strong contrast
or
selective physical shadow
```

Examples:

```text
Continue Cooking
primary CTA surface
important current-state card
```

## Secondary Surface

For normal content:

```text
light card surface
subtle border
soft shadow or no shadow
```

Examples:

```text
History item
Favorite item
Profile section
Inventory item
```

## Neutral Surface

For low-priority supporting information:

```text
background / muted surface
no strong shadow
minimal border
```

Examples:

```text
metadata
helper text
read-only info
```

---

# 14. Border Strategy

Move away from:

```text
every element
→ 3px dark border
```

Preferred authenticated platform treatment:

```text
default:
border
or
border-2

important/interactive:
border-2

special brand moment:
border-[3px] only when intentional
```

Use semantic:

```text
border-border
```

or a controlled foreground opacity.

Do not hard-code forest green in every component.

---

# 15. Shadow Strategy

Hard shadows remain part of Flemme, but use them selectively.

Do not apply heavy offset shadows to every Card.

Preferred hierarchy:

```text
Primary / interactive surface
→ visible soft-hard hybrid shadow

Secondary card
→ subtle shadow or none

Neutral surface
→ no shadow
```

A possible platform shadow can be centralized as a Tailwind utility/token.

Do not use dozens of different arbitrary shadow values.

---

# 16. Radius Strategy

Use a consistent small set.

Recommended:

```text
Inputs:
rounded-xl

Normal cards:
rounded-2xl

Major feature cards:
rounded-3xl

Buttons:
rounded-full or rounded-xl depending on role

Badges:
rounded-full
```

Avoid random radius values per feature.

Do not make every component pill-shaped.

---

# 17. shadcn Card Foundation

Review:

```text
components/ui/card.tsx
```

The generic Card should remain generic.

Platform styling should support:

```text
clean surface
consistent radius
subtle border
reasonable default padding behavior
```

Do not put feature-specific colors/content into Card.

If variants are needed, use a controlled variant approach rather than duplicating components.

Possible conceptual variants:

```text
default
soft
accent
interactive
```

Only add variants actually used.

---

# 18. shadcn Button Foundation

Review:

```text
components/ui/button.tsx
```

Keep existing accessibility and interaction behavior.

Standardize:

```text
primary
secondary
outline
ghost
destructive
link
```

Platform primary action should feel physical and friendly without becoming excessively heavy.

Recommended:

```text
min-h-11 / min-h-12
clear hover
clear active state
visible focus ring
```

Do not create:

```text
OrangeButton
HistoryButton
CookingButton
ProfileButton
```

Use variants.

---

# 19. Form Foundation

Review shadcn:

```text
Input
Textarea
Select
Checkbox
Label
```

Standardize:

```text
minimum 44–48px interactive height
clear focus ring
comfortable horizontal padding
soft background
consistent border/radius
```

Do not introduce page-specific input CSS.

---

# 20. Badge Foundation

Badges should communicate meaningful state.

Use them for:

```text
status
category
warning
saved state
resolution state
```

Do not use Badge for every metadata value.

Keep badge visual weight below primary CTA weight.

---

# 21. AppHeader Foundation

Do not redesign its information structure.

Keep:

```text
brand
profile/avatar entry
```

Refine styling only.

Goals:

```text
aligned to PlatformContainer
comfortable height
subtle separator
clean brand mark
profile control feels intentional
```

Do not introduce notifications or new header actions.

---

# 22. BottomNavigation Foundation

Keep current destinations:

```text
Home
Inventory
History
Favorites
```

Do not copy prototype navigation labels.

Refine styling toward:

```text
forest-green navigation surface
clear active state
comfortable icons
mobile safe area
soft floating/contained feeling
```

Do not add Profile as a fifth nav item.

Profile remains accessible from AppHeader.

---

# 23. PageContainer Foundation

Keep page spacing consistent.

Preferred:

```tsx
className="py-6 sm:py-8"
```

Horizontal padding should primarily come from `PlatformContainer`.

Avoid stacking:

```text
PlatformContainer px-6
+
PageContainer px-6
+
Feature px-6
```

which creates excessive narrowing.

Audit the current padding ownership.

---

# 24. Spacing Scale

Prefer Tailwind's normal spacing scale.

Recommended rhythm:

```text
section gap:
space-y-8 / space-y-10

card internal:
p-4 / p-5 / p-6

small metadata:
gap-2 / gap-3

major actions:
mt-6 / mt-8
```

Avoid excessive arbitrary pixel spacing.

---

# 25. Base Background

Authenticated platform background should remain warm and food-friendly.

Use the existing Flemme cream family.

Avoid pure white page backgrounds.

Cards may use a slightly lighter warm surface for hierarchy.

---

# 26. Color Usage

Use color intentionally.

Recommended hierarchy:

```text
Forest green
→ structural anchor / text / dark navigation

Tomato orange
→ primary action / strong accent

Mustard
→ secondary emphasis / active indicator

Leaf green
→ positive / contextual accent

Lavender / soft pink
→ supporting visual accents

Cream
→ dominant platform canvas
```

Do not use every brand color on every screen.

---

# 27. Interaction Behavior

Standardize basic interaction feel.

Buttons/cards may use:

```text
small translate
soft shadow change
background transition
```

Keep motion subtle.

Respect:

```text
prefers-reduced-motion
```

Do not add large decorative animations in this foundation task.

---

# 28. Focus & Accessibility

Preserve/improve:

```text
visible focus rings
keyboard navigation
sufficient contrast
44–48px touch targets
disabled states
semantic HTML
```

Do not remove focus outlines for visual cleanliness.

---

# 29. Platform Pages Must Not Be Redesigned Yet

Do not redesign:

```text
Home
Profile
Inventory
History
Favorites
Recommendation
Pre-Cooking
Active Cooking
Completion
Nutrition
```

Only allow styling changes that naturally result from the shared foundation.

If a page looks awkward after base tokens/primitives change:

```text
document it
```

Do not immediately restructure it in this task.

Page-level refinement comes later.

---

# 30. Legacy Vanilla CSS Is Out of Scope

Do not migrate these yet:

```text
/login
/register
/onboarding/profile shell
/onboarding/household shell
/onboarding/kitchen
/onboarding/inventory
/onboarding/complete
auth restoration shell
```

Do not remove their legacy selectors yet unless they are already proven dead and entirely unrelated to the platform foundation.

A separate migration task will handle them.

---

# 31. Dead CSS

Do not perform a broad CSS cleanup in this task.

Document known dead selectors.

Remove them later during the dedicated legacy-CSS migration after route verification.

Avoid mixing:

```text
theme foundation
+
large CSS deletion
```

in one change.

---

# 32. Pilot Verification Pages

After base styling is implemented, verify first on:

```text
/app
/app/profile
/app/history
```

Why:

```text
Home
→ varied component hierarchy

Profile
→ forms/settings

History
→ repeated cards/list
```

These three pages are enough to evaluate the base system without changing every page manually.

---

# 33. Regression Protection

Verify that these behaviors remain unchanged:

```text
auth guards
onboarding guards
BottomNavigation routing
profile routing
Home cooking prompt
Resume Active Session
History pagination
Favorites
Inventory CRUD
Recommendation
Pre-Cooking
Active Cooking
Completion
Nutrition
```

This is a styling foundation task only.

---

# 34. Browser Verification

Verify platform pages at:

```text
320px
390px
768px
1024px
1440px
1920px
```

Specifically check:

```text
mobile remains full-width
max-width container centers correctly
desktop has comfortable breathing room
no horizontal overflow
BottomNavigation width/alignment
header alignment
forms remain usable
long titles remain contained
```

---

# 35. Definition of Done

- [x] Authenticated platform has one reusable root container.
- [x] Root uses Tailwind `container`, `mx-auto`, and a mobile-friendly max width.
- [x] Default max width is approximately `max-w-5xl` unless visual testing justifies another value.
- [x] Mobile remains full width with safe padding.
- [x] Platform no longer globally depends on the old ~572px narrow desktop canvas.
- [x] Internal page composition is unchanged.
- [x] No sidebar is introduced.
- [x] Tailwind CSS remains the styling system.
- [x] shadcn/ui remains the component foundation.
- [x] No new page-specific vanilla CSS is introduced.
- [x] Global CSS contains only legitimate global concerns/tokens.
- [x] Semantic theme tokens are consistent.
- [x] Typography roles are consistent.
- [x] Card radius/border/shadow strategy is consistent.
- [x] Button styling is consistent.
- [x] Form controls are consistent.
- [x] Badge styling is consistent.
- [x] Header aligns with platform container.
- [x] BottomNavigation keeps the existing destinations.
- [x] Landing page does not regress.
- [x] Legacy Auth/Onboarding CSS migration is not mixed into this task.
- [x] Home/Profile/History pilot review passes.
- [x] Responsive verification passes.
- [x] Existing functionality/tests remain passing.
- [x] Architecture/progress docs are updated with the new styling foundation.

---

# 36. Agent Rule

For this task, optimize for:

```text
frontend consistency
+
shared styling foundation
+
Tailwind ownership
+
shadcn primitives
+
safe responsive container
+
minimal behavioral change
```

Do not optimize for:

```text
page redesign
prototype duplication
new features
legacy migration
large code deletion
```

Core rule:

> Change the visual foundation first. Do not redesign the product structure.

---

# 37. Next Task After Acceptance

Once this base styling is accepted:

```text
1. Migrate Login / Register from legacy CSS
2. Migrate shared OnboardingStepShell
3. Migrate Kitchen onboarding
4. Migrate Inventory onboarding
5. Migrate Onboarding Completion
6. Remove verified dead legacy selectors
7. Begin page-by-page authenticated UI/UX refinement
```

Do not start those migrations until this base platform theme is visually accepted.
