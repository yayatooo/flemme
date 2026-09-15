# Flemme Landing Page Refactor Task v0.1

## Status

**Completed**

Refactor the current Flemme landing page into small, maintainable section components while preserving the current behavior, content hierarchy, TanStack Router navigation, responsive behavior, and Flemme visual direction.

This task is primarily an **architecture and component-boundary refactor**, not a full visual redesign.

The landing page must continue using:

- React
- Vite
- TanStack Router
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Flemme's neubrutalism + groovy-retro design language

---

# 1. Why This Refactor

The current landing page keeps almost all landing sections, helper components, content arrays, and layout code in one file.

That makes future visual iteration harder because changing one section requires working inside a very large component file.

The goal is to make each landing section independently maintainable.

Expected result:

```text
landing/
├── navbar.tsx
├── banner.tsx
├── brand-ticker.tsx
├── discover-section.tsx
├── recipe-card.tsx
├── about-section.tsx
├── how-it-works-section.tsx
├── personalization-section.tsx
├── pricing-section.tsx
├── final-cta-section.tsx
├── footer.tsx
├── section-heading.tsx
├── brand-mark.tsx
├── recipe-art.tsx
├── data.ts
└── index.ts
```

The exact file count may be adjusted slightly if a component would be unnecessarily small, but the major page sections must no longer live in one large file.

---

# 2. Primary Objective

Convert the landing page from one large implementation into composition-first architecture.

The final page component should be intentionally small.

Expected shape:

```tsx
export function LandingPage() {
  return (
    <main className="overflow-hidden bg-background">
      <LandingNavbar />
      <LandingBanner />
      <BrandTicker />
      <DiscoverSection />
      <AboutSection />
      <HowItWorksSection />
      <PersonalizationSection />
      <PricingSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  )
}
```

The page component should only describe the order of the landing sections.

It should not contain section-specific markup.

---

# 3. Recommended Directory Structure

Use a dedicated landing component directory.

Preferred structure:

```text
apps/web/src/components/landing/
├── navbar.tsx
├── banner.tsx
├── brand-ticker.tsx
├── discover-section.tsx
├── recipe-card.tsx
├── recipe-art.tsx
├── about-section.tsx
├── how-it-works-section.tsx
├── personalization-section.tsx
├── pricing-section.tsx
├── final-cta-section.tsx
├── footer.tsx
├── section-heading.tsx
├── brand-mark.tsx
├── data.ts
└── index.ts
```

If the project already has a stronger feature-based convention, this may instead live under:

```text
apps/web/src/features/landing/
```

Do not create both structures.

Use the convention that best matches the existing project.

---

# 4. Route Responsibility

The TanStack Router route should remain thin.

The route should:

- render the landing page.
- keep route-specific metadata if already present.
- keep loader/search behavior if already present.

The route should not own:

- navbar UI.
- hero/banner markup.
- recipe cards.
- pricing layout.
- footer markup.
- landing data arrays.
- landing-specific styling.

Do not move business logic into the route just because the visual code is being separated.

---

# 5. Component Mapping From the Current Landing Page

Refactor the existing components approximately as follows.

## `navbar.tsx`

Move:

```text
LandingNavbar
```

Responsibilities:

- desktop navigation.
- mobile navigation.
- menu open/close state.
- login link.
- register CTA.
- anchor navigation.
- accessibility attributes.

Preserve:

```text
#about
#discover
#pricing
```

and existing TanStack Router links.

---

## `banner.tsx`

Move the current hero area into the landing banner.

Contains:

```text
HeroSection
HeroVisual
```

The banner owns:

- headline.
- supporting copy.
- primary CTA.
- "See how it works" CTA.
- decorative hero visual.

Keep visual-only helper components local to `banner.tsx` unless they become independently reusable.

Do not create files for every decorative `<span>` or shape.

---

## `brand-ticker.tsx`

Move:

```text
BrandTicker
```

Also move its statement data into `data.ts` if it is cleaner.

Preserve reduced-motion behavior.

---

## `discover-section.tsx`

Move:

```text
DiscoverSection
```

Responsibilities:

- section heading.
- recipe card layout.
- CTA to the next landing section.

The individual recipe presentation must move into:

```text
recipe-card.tsx
```

Do not keep the complete recipe card JSX inside `.map()`.

Expected:

```tsx
<div className="...">
  {recipeCards.map((recipe) => (
    <LandingRecipeCard key={recipe.name} recipe={recipe} />
  ))}
</div>
```

---

# 6. Recipe Card Must Use shadcn `Card`

The recipe/discovery card shown on the landing page must use the existing shadcn Card primitive.

Required:

```tsx
import { Card } from "@/components/ui/card"
```

Do not replace it with:

```tsx
<div className="...">
```

for the root card.

The landing-specific component should wrap the generic primitive:

```tsx
export function LandingRecipeCard(...) {
  return (
    <Card className="...">
      ...
    </Card>
  )
}
```

Important:

> Do not make `components/ui/card.tsx` aware of recipe-specific business or landing-page content.

The shared `Card` primitive may contain Flemme-wide visual defaults such as:

- border language.
- base radius.
- shared shadow behavior.
- focus behavior.

But recipe-specific composition belongs in:

```text
landing/recipe-card.tsx
```

This allows future styling changes without making the global Card primitive overly specific.

---

# 7. Recipe Artwork

The current abstract recipe visual may move into:

```text
recipe-art.tsx
```

The component should only own decorative presentation.

It should not know about:

- routing.
- recipe selection.
- API behavior.
- recommendation logic.

If the landing page later switches from decorative artwork to uploaded/generated images, `LandingRecipeCard` should remain the card boundary while the visual implementation can change independently.

Preferred conceptual API:

```tsx
<RecipeArt tone="bg-mustard" />
```

or later:

```tsx
<RecipeImage src={imageUrl} alt={recipe.name} />
```

The Card component itself should not need to change when this happens.

---

# 8. Buttons Must Use shadcn `Button`

All actionable landing buttons should use:

```tsx
import { Button } from "@/components/ui/button"
```

Examples include:

- Get started.
- Start cooking.
- See how it works.
- recipe arrow action.
- pricing CTA.
- final CTA.
- mobile menu trigger.

Do not introduce raw `<button>` elements when the shared Button component is appropriate.

Navigation anchors may still be anchors/Links, but where the element visually behaves as a button, use the project's shadcn Button composition pattern.

Preserve TanStack Router integration.

Example:

```tsx
<Button render={<Link to="/register" />}>
  Get started
</Button>
```

Use the API supported by the project's existing Button implementation.

---

# 9. Shared shadcn Primitives

The landing refactor should use the existing shared UI layer wherever applicable.

At minimum:

```text
Button
Card
Badge
```

Use additional shadcn primitives only when they are genuinely useful.

Do not add a component merely because shadcn provides one.

Do not install a large set of unused components.

---

# 10. Flemme Styling Rule

shadcn/ui remains the structural primitive layer.

It must not turn the page into default shadcn styling.

Preserve Flemme characteristics:

- bold dark borders.
- strong contrasting surfaces.
- hard/offset shadows.
- rounded expressive shapes.
- cream/background tones.
- orange, green, mustard, pink, lavender accents.
- groovy display typography.
- playful decorative graphics.
- mobile-first spacing.
- clear touch targets.

The existing visual direction should survive the refactor.

This task should make styling easier to improve later, not erase the current identity.

---

# 11. Global UI Primitive vs Landing Component

Follow this rule strictly.

## Shared UI Primitive

Location:

```text
apps/web/src/components/ui/
```

Examples:

```text
button.tsx
card.tsx
badge.tsx
```

These must remain generic.

They can contain Flemme-wide visual language.

They must not contain landing-specific content or recipe logic.

---

## Landing Component

Location:

```text
apps/web/src/components/landing/
```

Examples:

```text
recipe-card.tsx
navbar.tsx
banner.tsx
pricing-section.tsx
```

These may compose shadcn primitives and contain landing-specific layout.

Example:

```text
shadcn Card
    ↓
LandingRecipeCard
    ↓
DiscoverSection
    ↓
LandingPage
```

This is the intended dependency direction.

---

# 12. `section-heading.tsx`

Move the repeated section heading composition into a shared landing helper.

Conceptual props:

```ts
type SectionHeadingProps = {
  kicker: string
  description: string
  children: React.ReactNode
}
```

It may own common:

- kicker typography.
- heading size.
- description positioning.
- responsive section-heading layout.

Do not put every section's unique content into this component.

---

# 13. `brand-mark.tsx`

Move the current Flemme wordmark helper into its own component because it is currently used by multiple sections.

Expected consumers include:

- navbar.
- personalization section.
- footer.

Keep it presentation-only.

Do not add routing behavior into `BrandMark`.

Wrap it with links where needed.

---

# 14. `data.ts`

Move static landing-only arrays out of the main page.

Examples:

```text
recipeCards
tickerStatements
journey
```

Use typed data where useful.

Do not create a complex CMS abstraction.

This is only a cleanup step.

Example:

```ts
export const recipeCards = [...]
export const tickerStatements = [...]
export const journeySteps = [...]
```

Keep static display data simple.

---

# 15. About Section

Move:

```text
AboutSection
```

into:

```text
about-section.tsx
```

Preserve:

- `id="about"`.
- existing content hierarchy.
- decorative supporting graphic.
- current responsive layout.

Do not redesign its content during this task.

---

# 16. How It Works Section

Move:

```text
HowItWorksSection
```

into:

```text
how-it-works-section.tsx
```

The journey data should come from `data.ts`.

The section remains responsible for displaying the steps.

Do not prematurely create a generic workflow engine.

If a small local `JourneyStep` component improves readability, it may remain inside this file.

---

# 17. Personalization Section

Move:

```text
PersonalizationSection
```

into:

```text
personalization-section.tsx
```

Keep the decorative "context stickers" local unless they become reusable.

Avoid extracting tiny components solely to reduce line count.

The goal is meaningful component boundaries.

---

# 18. Pricing Section

Move:

```text
PricingSection
```

into:

```text
pricing-section.tsx
```

The main pricing surface must continue using shadcn `Card`.

The early-access label must continue using shadcn `Badge`.

The CTA must continue using shadcn `Button`.

Preserve the existing register route behavior.

---

# 19. Final CTA Section

Move:

```text
FinalCtaSection
```

into:

```text
final-cta-section.tsx
```

Preserve:

- dark contrast section.
- groovy supporting headline.
- primary register CTA.
- current landing-page hierarchy.

Do not merge this into the footer.

They serve different purposes.

---

# 20. Footer

Move:

```text
LandingFooter
```

into:

```text
footer.tsx
```

Preserve:

- brand mark.
- short Flemme statement.
- internal landing navigation.
- login route.
- dynamic copyright year.

Keep footer-specific styling local.

---

# 21. Barrel Export

Create:

```text
landing/index.ts
```

Optional exports:

```ts
export { LandingNavbar } from "./navbar"
export { LandingBanner } from "./banner"
export { BrandTicker } from "./brand-ticker"
export { DiscoverSection } from "./discover-section"
export { AboutSection } from "./about-section"
export { HowItWorksSection } from "./how-it-works-section"
export { PersonalizationSection } from "./personalization-section"
export { PricingSection } from "./pricing-section"
export { FinalCtaSection } from "./final-cta-section"
export { LandingFooter } from "./footer"
```

Use a barrel only if it makes imports cleaner.

Do not create circular imports.

Internal landing components such as `RecipeArt` do not need to be exported publicly unless another module requires them.

---

# 22. Tailwind Rules

Continue using Tailwind CSS.

Do not introduce:

```text
landing.css
navbar.css
banner.css
recipe-card.css
```

for ordinary component styling.

Keep component-specific Tailwind classes in the relevant component.

Global CSS should remain reserved for:

- theme tokens.
- font definitions.
- global base styles.
- reusable app-wide utilities/effects.

---

# 23. Shared Class Constants

The current landing page has reusable class strings such as heading/kicker/section styles.

During refactor:

Prefer a semantic reusable component such as `SectionHeading` when the class combination represents a UI pattern.

For general section container sizing, either:

1. keep a small shared constant in a landing-only helper, or
2. repeat a short Tailwind container pattern when doing so is clearer.

Do not create an overly abstract styling framework.

Avoid abstractions such as:

```text
LandingTypographyFactory
SectionStyleBuilder
LandingThemeManager
```

This should remain simple React + Tailwind.

---

# 24. Preserve Behavior

This task must not break existing landing behavior.

Preserve:

- `/login` links.
- `/register` links.
- mobile menu open/close.
- anchor navigation.
- `#about`.
- `#discover`.
- `#pricing`.
- `#how-it-works`.
- responsive layouts.
- reduced motion behavior where currently present.
- current accessible labels.
- current semantic elements where valid.

Do not alter authentication behavior.

Do not alter onboarding behavior.

Do not alter TanStack Router configuration.

---

# 25. Responsive Behavior

The landing page remains mobile-first.

Refactoring components must not result in each section inventing a different responsive philosophy.

Keep the existing progression:

```text
mobile
→ tablet
→ desktop
```

Desktop may use additional room for the marketing landing page where appropriate, but this task is not a redesign.

The authenticated Flemme app's compact mobile-oriented desktop rule remains separate from the public marketing landing page where broader compositions can be intentional.

---

# 26. Accessibility

Preserve or improve:

- semantic section structure.
- navigation labels.
- `aria-expanded`.
- `aria-controls`.
- icon `aria-hidden`.
- button labels.
- route link semantics.
- keyboard interaction.
- reduced-motion behavior.

Do not lose accessibility behavior while extracting components.

---

# 27. Do Not Over-Split

The goal is not one file per DOM element.

Good component boundaries:

```text
Navbar
Banner
DiscoverSection
RecipeCard
PricingSection
Footer
```

Bad component boundaries:

```text
HeroOrangeCircle
HeroLeafShape
RecipeCardArrowContainer
FooterCopyrightText
NavbarDesktopGap
```

Keep decorative internals inside the section that owns them unless they are genuinely reused.

---

# 28. Implementation Sequence

Perform the refactor incrementally.

Recommended order:

```text
1. Create landing directory.
2. Extract BrandMark.
3. Extract SectionHeading.
4. Extract Navbar.
5. Extract Banner/Hero.
6. Extract BrandTicker.
7. Extract RecipeCard + RecipeArt.
8. Extract DiscoverSection.
9. Extract AboutSection.
10. Extract HowItWorksSection.
11. Extract PersonalizationSection.
12. Extract PricingSection.
13. Extract FinalCtaSection.
14. Extract Footer.
15. Move static arrays into data.ts.
16. Reduce LandingPage to section composition only.
17. Run typecheck/build/tests.
18. Verify mobile and desktop rendering.
```

Keep the application runnable during the migration.

---

# 29. Important Non-Goals

Do not use this task to:

- redesign the landing page from scratch.
- rewrite marketing copy.
- change the color palette substantially.
- change authentication.
- change the Core User Flow.
- connect recommendation APIs.
- create a CMS.
- introduce another UI framework.
- replace TanStack Router.
- replace Tailwind.
- remove shadcn primitives.
- create generic abstractions for hypothetical future use.

---

# 30. Expected Final Landing Composition

The final landing composition should be readable at a glance.

Example:

```tsx
import {
  AboutSection,
  BrandTicker,
  DiscoverSection,
  FinalCtaSection,
  HowItWorksSection,
  LandingBanner,
  LandingFooter,
  LandingNavbar,
  PersonalizationSection,
  PricingSection,
} from "@/components/landing"

export function LandingPage() {
  return (
    <main className="overflow-hidden bg-background">
      <LandingNavbar />
      <LandingBanner />
      <BrandTicker />
      <DiscoverSection />
      <AboutSection />
      <HowItWorksSection />
      <PersonalizationSection />
      <PricingSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  )
}
```

A developer should be able to understand the entire landing-page structure without scrolling through hundreds of lines of section implementation.

---

# 31. Definition of Done

The task is complete when:

- [x] The landing page is no longer implemented as one large file.
- [x] Major sections are separated into meaningful files.
- [x] Navbar is isolated.
- [x] Banner/Hero is isolated.
- [x] Footer is isolated.
- [x] Discover cards use the shared shadcn `Card` primitive.
- [x] Pricing surface uses the shared shadcn `Card`.
- [x] Landing CTAs use the shared shadcn `Button`.
- [x] Landing Badge usage stays on the shared shadcn `Badge`.
- [x] No landing-specific business logic is added to `components/ui`.
- [x] Recipe-card-specific styling lives in the landing RecipeCard wrapper.
- [x] Tailwind remains the styling system.
- [x] No competing UI framework is introduced.
- [x] Existing route behavior still works.
- [x] Existing anchor navigation still works.
- [x] Mobile menu still works.
- [x] Mobile layout still works.
- [x] Desktop layout still works.
- [x] Typecheck passes.
- [x] Build passes.
- [x] Existing relevant tests pass.
- [x] LandingPage itself is mostly composition code.

---

# 32. Agent Rule

For this refactor, optimize for:

```text
clear ownership
+
small meaningful components
+
shadcn primitives
+
Tailwind styling
+
Flemme identity
```

not for minimum file count and not for maximum abstraction.

The desired architecture is:

```text
shadcn primitive
        ↓
Flemme shared UI behavior
        ↓
landing-specific component
        ↓
landing section
        ↓
LandingPage composition
```

Keep each layer easy to restyle later.
