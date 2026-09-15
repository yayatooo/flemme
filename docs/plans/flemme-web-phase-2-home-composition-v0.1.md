# Flemme Web — Phase 2: Home Composition v0.1

## Status

**Implementation Task**

Phase 1 App Foundation is considered complete.

Phase 2 begins the authenticated product experience with the Flemme Home screen.

This phase focuses on:

```text
/app
└── Home
    ├── Greeting
    ├── Primary Cooking Prompt
    ├── Quick Start
    ├── Resume Active Cooking
    ├── Kitchen / Inventory Shortcut
    └── Recent Cooking
```

The goal is to establish the Home screen as the entry point into Flemme's core cooking flow.

This is still primarily a **UI composition and state-presentation task**.

Do not yet over-expand Recommendation, Pre-Cooking, or Active Cooking implementation in this phase.

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

Phase 2 owns the first node:

```text
Home
```

and prepares the transition into:

```text
Recommendation
```

---

# 2. Mandatory UI Stack

Continue using the locked web foundation:

```text
React
+
TanStack Router
+
Tailwind CSS
+
shadcn/ui
+
Lucide
```

Do not introduce another styling or component framework.

All new Home components must use Tailwind CSS.

Use shadcn primitives where appropriate.

---

# 3. Product Direction

Flemme Home is **not a dashboard**.

Do not fill the screen with:

- analytics
- KPI cards
- counts without purpose
- admin-style panels
- dense grids
- generic SaaS dashboard composition

The Home screen has one main job:

> Help the user decide what to cook and continue cooking when a session already exists.

The visual hierarchy should prioritize:

```text
1. Start cooking
2. Resume cooking
3. Useful kitchen shortcuts
4. Recent meals
```

---

# 4. Mobile-First Rule

The authenticated Flemme application remains mobile-first.

Desktop must continue using the compact application canvas established in Phase 1.

Do not introduce:

```text
desktop sidebar
wide dashboard grid
large desktop-only layouts
```

Home should feel like the same product on mobile and desktop.

---

# 5. Home Screen Concept

Expected high-level composition:

```text
┌─────────────────────────────────┐
│ Flemme                     user │
├─────────────────────────────────┤
│                                 │
│ Hello, Tiara!                   │
│ Mau masak apa hari ini?         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Describe what you want...   │ │
│ │                             │ │
│ │                    Start →  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Quick Start                     │
│ [Use my fridge] [Quick meal]    │
│ [For family]    [High protein]  │
│                                 │
│ Continue Cooking                │
│ ┌─────────────────────────────┐ │
│ │ Ayam Kecap                  │ │
│ │ Stage 2 · Tumis Bumbu       │ │
│ │                  Continue → │ │
│ └─────────────────────────────┘ │
│                                 │
│ Your Kitchen                    │
│ Inventory shortcut             │
│                                 │
│ Recent Cooking                  │
│ meal cards...                   │
│                                 │
├─────────────────────────────────┤
│ Home Inventory History Favorite│
└─────────────────────────────────┘
```

This is directional, not pixel-perfect.

---

# 6. Recommended Component Structure

Create or organize Home under a dedicated feature directory.

Preferred:

```text
apps/web/src/features/home/
├── home-page.tsx
├── home-greeting.tsx
├── cooking-prompt.tsx
├── quick-start.tsx
├── active-session-card.tsx
├── kitchen-shortcut.tsx
├── recent-cooking.tsx
└── index.ts
```

If the project already uses another feature convention, follow it.

Do not place Home-specific components in:

```text
components/ui
```

---

# 7. Home Page Responsibility

`home-page.tsx` should mainly compose Home sections.

Expected structure:

```tsx
export function HomePage() {
	return (
		<PageContainer>
			<div className="space-y-8">
				<HomeGreeting />
				<CookingPrompt />
				<QuickStart />
				<ActiveSessionCard />
				<KitchenShortcut />
				<RecentCooking />
			</div>
		</PageContainer>
	);
}
```

The exact spacing may evolve.

The page should not contain large amounts of section-specific markup.

---

# 8. Home Greeting

Create:

```text
home-greeting.tsx
```

Purpose:

- establish personal tone
- use authenticated user's display name
- introduce the main cooking question

Expected:

```text
Hello, Rahmat!
Mau masak apa hari ini?
```

Use the display name logic already fixed in Phase 1.

Do not display the email as the primary identity.

Recommended fallback remains:

```text
name
↓
email username
↓
User
```

Keep the greeting compact.

Do not make this another marketing hero.

---

# 9. Greeting Typography

Use Flemme's expressive heading typography carefully.

Possible hierarchy:

```text
small personal greeting
large cooking question
```

Example:

```tsx
<p className="text-sm font-bold text-muted-foreground">
	Hello, {displayName}!
</p>

<h1 className="font-heading text-4xl leading-none">
	Mau masak apa hari ini?
</h1>
```

Exact values may be adjusted during visual implementation.

---

# 10. Primary Cooking Prompt

Create:

```text
cooking-prompt.tsx
```

This is the most important interaction on Home.

Use shadcn primitives.

Recommended:

```text
Textarea
Button
```

Conceptual:

```text
┌─────────────────────────────────┐
│ Tell Flemme what you want...    │
│                                 │
│ e.g. something quick with eggs  │
│                                 │
│                      Cook →     │
└─────────────────────────────────┘
```

The component should feel prominent but not overly tall.

---

# 11. Cooking Prompt Behavior

Phase 2 may keep submission behavior minimal if Recommendation integration is not yet part of this task.

However, structure the component so it can later support:

```text
session.request
```

from the existing cooking recommendation input contract.

Do not invent a second input model.

The main text input represents the user's current cooking request.

Examples:

```text
"Something spicy"
"Cook my eggs and rice"
"Meal for the kids"
"Something in 20 minutes"
```

---

# 12. Prompt State

The prompt must support:

```text
idle
focused
has-value
submitting
error
```

Even if Recommendation mutation is connected in the next task.

Do not clear user input on temporary errors.

Prevent duplicate submission once real mutation is connected.

---

# 13. Prompt CTA

Use shadcn `Button`.

Example:

```tsx
<Button type="submit">
	Start cooking
	<ArrowRight />
</Button>
```

or a similarly clear label.

Do not use vague actions such as:

```text
Submit
Enter
Send
```

The CTA should communicate the cooking intent.

---

# 14. Quick Start

Create:

```text
quick-start.tsx
```

Quick Start allows users to begin with a useful request without typing everything.

Important existing Flemme principle:

> Quick Start must use known profile/context and must not force the agent to re-ask information already available.

Suggested initial options:

```text
Use what's in my fridge
Something quick
For the family
High protein
```

These are product shortcuts, not navigation destinations.

---

# 15. Quick Start UI

Use compact shadcn buttons or badges depending on interaction style.

Preferred:

```text
Button variant
```

because these are actions.

Conceptual:

```text
Quick Start

[ Use what's in my fridge ]
[ Something quick          ]
[ For the family           ]
[ High protein             ]
```

Avoid tiny chip interactions that are difficult to tap.

Mobile touch targets remain important.

---

# 16. Quick Start Behavior

When selected, a Quick Start option should populate or submit a valid session request.

Example:

```text
Use what's in my fridge
```

can conceptually become:

```text
"Suggest something using what I already have."
```

Do not hardcode fake inventory into the text.

Persistent context remains the source of truth.

---

# 17. Resume Active Cooking

Create:

```text
active-session-card.tsx
```

This section represents Flemme's session continuity principle.

If an active or paused cooking session exists:

```text
Continue Cooking

Ayam Kecap
Stage 2 · Tumis Bumbu
Continue →
```

The Home screen should make resume obvious.

---

# 18. Session Continuity Rule

Existing Flemme principle:

> Active cooking progress must survive refresh, leaving the page, or pausing to buy ingredients.

Therefore:

- do not create a new cooking plan when Resume is selected
- do not restart Recommendation
- do not regenerate Pre-Cooking
- navigate to the persisted active session

The Home component must reflect persisted state rather than inventing local progress.

---

# 19. No Active Session State

If no active session exists:

Do not render a large empty card saying:

```text
No active cooking session
```

Prefer simply omitting the section.

Home should remain focused.

Use an EmptyState only if product design later requires explicit explanation.

---

# 20. Active Session Card Primitive

Use shadcn `Card`.

Example anatomy:

```text
Card
├── status label
├── recipe title
├── current stage / step
└── Continue Button
```

Keep it compact.

The card should not display every completed step.

Detailed cooking progress belongs inside Active Cooking.

---

# 21. Kitchen Shortcut

Create:

```text
kitchen-shortcut.tsx
```

Purpose:

Provide quick access to Inventory Management.

Possible content:

```text
Your Kitchen
12 ingredients available
View inventory →
```

If count data is not yet available in this phase, do not invent a number.

Use a generic label such as:

```text
Manage your ingredients
```

until real inventory summary is connected.

---

# 22. Kitchen Shortcut Behavior

Navigate to:

```text
/app/inventory
```

Use TanStack Router `Link`.

Use shadcn `Card` or `Button` as appropriate.

This is a shortcut, not a full inventory preview.

Do not render large ingredient lists on Home.

---

# 23. Recent Cooking

Create:

```text
recent-cooking.tsx
```

Purpose:

Show a small preview of recent completed cooking sessions.

Expected:

```text
Recent Cooking

Nasi Goreng Sayur
~420 kcal · ~18g protein
♡
```

or a similarly compact summary.

Do not turn Home into Cooking History.

Limit preview count.

Recommended:

```text
2–3 items maximum
```

with a path to:

```text
/app/history
```

---

# 24. Recent Cooking Data

Use completed cooking history when integration happens.

Do not derive Recent Cooking from Favorites.

These are different concepts:

```text
History
= meals cooked

Favorites
= meals explicitly saved
```

A history item may be favorite or non-favorite.

---

# 25. Nutrition Display

Nutrition on Home is secondary supporting information.

If available, use estimated nutrition summary such as:

```text
~420 kcal
~18g protein
```

Do not display full macro breakdown here.

The full Nutrition experience belongs later in the core flow.

---

# 26. Favorite Indicator

Recent cooking cards may show favorite state if known.

Use:

```text
Heart
```

icon.

Do not implement complex favorite mutation behavior in this task unless the existing API integration is trivial and already established.

Home composition comes first.

---

# 27. shadcn Usage

Expected primitives for Phase 2:

```text
Button
Card
Textarea
Badge
Skeleton
```

Potentially:

```text
Separator
```

if useful.

Do not install extra shadcn components without actual usage.

---

# 28. Card Rule

All semantic card surfaces should use the shared shadcn `Card`.

Examples:

```text
ActiveSessionCard
KitchenShortcut
RecentCookingItem
```

Do not duplicate custom bordered `<div>` structures when Card is the right primitive.

Feature-specific layout belongs in feature wrappers, not in `components/ui/card.tsx`.

---

# 29. Button Rule

Actions should use shared shadcn `Button`.

Examples:

```text
Start cooking
Quick Start actions
Continue cooking
View inventory
View history
```

Do not create separate raw button styling per feature.

Use variants and class composition.

---

# 30. Visual Direction

Home should preserve Flemme visual identity but remain functional.

Use:

- warm cream surface
- forest-green text/borders
- tomato-orange primary action/accent
- mustard / lavender / leaf-green supporting accents
- hard shadow selectively
- groovy headings selectively

Avoid making every block bright and decorative.

The user's attention should always return to:

```text
What do you want to cook?
```

---

# 31. Recommended Color Hierarchy

Suggested conceptual roles:

```text
Primary cooking CTA
→ tomato orange

Resume cooking
→ mustard or lavender supporting surface

Kitchen shortcut
→ leaf green supporting accent

Recent history
→ neutral cream/card surfaces
```

Use semantic theme tokens where possible.

Do not scatter hardcoded hex values through feature components.

---

# 32. Layout Spacing

Keep clear separation between major sections.

Suggested pattern:

```text
Greeting

Primary Prompt

Quick Start

Continue Cooking

Your Kitchen

Recent Cooking
```

Use whitespace instead of wrapping every heading in additional containers.

Do not excessively nest Cards.

---

# 33. Compact Desktop Behavior

The Home screen must remain inside the Phase 1 app canvas.

Do not introduce additional max-width containers inside every Home component.

Ownership remains:

```text
AppShell
→ compact max width

PageContainer
→ horizontal page spacing

Home feature
→ vertical composition
```

Avoid:

```text
Home component
→ another max-w-7xl
```

This is not the landing page.

---

# 34. Loading State

Home will eventually depend on multiple data sources:

```text
user
active session
inventory summary
recent history
```

Use existing shared `LoadingState` / shadcn `Skeleton`.

Do not block the entire page if only one secondary section is loading.

Prefer sectional loading when possible.

Example:

```text
Greeting can render
Prompt can render
Active Session can skeleton
Recent Cooking can skeleton
```

---

# 35. Error State

Do not let a failure in Recent Cooking prevent the user from starting a new cooking flow.

Primary action resilience matters.

Example:

```text
history fails
→ Home prompt still works
```

Use local/shared recoverable states.

Do not show raw API exceptions.

---

# 36. Empty States

Home should avoid unnecessary emptiness messaging.

Examples:

```text
No active session
→ omit section

No recent history
→ small friendly empty hint if useful

No inventory
→ KitchenShortcut can encourage adding ingredients
```

Do not stack multiple large EmptyState cards.

---

# 37. Accessibility

Required:

- semantic heading hierarchy
- `<form>` for cooking prompt
- textarea label or accessible name
- visible focus states
- button labels
- route links
- sufficient contrast
- touch-friendly Quick Start actions
- heart/favorite icons must have accessible labels if interactive

---

# 38. Route Responsibility

The `/app` route should render `HomePage`.

Keep route logic minimal.

Conceptually:

```tsx
export const Route = createFileRoute("/app/")({
	component: HomeRoute,
});

function HomeRoute() {
	return <HomePage />;
}
```

Follow the existing TanStack Router route structure.

Do not place the complete Home UI directly inside the route file.

---

# 39. Existing App Foundation

Phase 2 must reuse the Phase 1 components:

```text
AppShell
AppHeader
PageContainer
BottomNavigation
LoadingState
EmptyState
ErrorState
```

Do not recreate equivalents inside Home.

---

# 40. Existing Auth Identity

Reuse the current authenticated user identity.

The header and greeting should share the same normalized display-name source where practical.

Avoid two different name fallback implementations.

Prefer a small shared helper if duplication becomes real.

Do not over-abstract prematurely.

---

# 41. Initial Data Strategy

Build Home against realistic shapes aligned with existing domain contracts.

Do not introduce arbitrary fake product models that will later need rewriting.

Static fixture data may be used temporarily for visual composition.

Keep fixtures clearly separated from production logic.

---

# 42. API Integration Boundary

This phase may prepare integration points but does not need to fully implement Recommendation.

The Home prompt should expose a clean submit boundary such as:

```ts
onSubmit(request: string)
```

or an equivalent form handler.

The next phase/task can connect this to:

```text
POST cooking recommendation
```

using the already established persistent cooking context + session override behavior.

---

# 43. Recommendation Handoff

When the Home cooking request is eventually submitted:

```text
Home request
↓
Recommendation
```

The user should not be asked again for context already known from:

```text
household
kitchen
inventory
food preferences
cooking preferences
```

Home only supplies the current session request unless the user explicitly overrides context.

---

# 44. Suggested Implementation Sequence

Implement in this order:

```text
1. Inspect current /app placeholder.
2. Create features/home directory.
3. Create HomePage composition.
4. Create HomeGreeting.
5. Create CookingPrompt.
6. Create QuickStart.
7. Create ActiveSessionCard.
8. Create KitchenShortcut.
9. Create RecentCooking.
10. Add temporary realistic fixtures if needed.
11. Connect /app route to HomePage.
12. Verify use of Phase 1 AppShell.
13. Verify mobile layout.
14. Verify compact desktop layout.
15. Verify keyboard/focus behavior.
16. Run typecheck.
17. Run production build.
18. Run relevant tests.
19. Run Biome/lint.
```

---

# 45. Non-Goals

Do not implement the full following flow yet:

```text
Recommendation page
Recipe selection page
Pre-Cooking
Cooking Session creation
Active Cooking
Completion
Nutrition page
full History page
full Favorites page
full Inventory page
```

Phase 2 establishes the Home composition and entry points.

---

# 46. Definition of Done

Phase 2 Home Composition is complete when:

- [ ] `/app` renders the new Home screen.
- [ ] Home uses `PageContainer`.
- [ ] Home does not recreate AppShell.
- [ ] Greeting displays authenticated user name.
- [ ] Email is not used as the default greeting identity.
- [ ] Cooking Prompt exists.
- [ ] Cooking Prompt uses shadcn `Textarea`.
- [ ] Primary cooking CTA uses shadcn `Button`.
- [ ] Quick Start exists.
- [ ] Quick Start actions are mobile-friendly.
- [ ] Active Session card exists as a reusable Home feature component.
- [ ] Active Session card uses shadcn `Card`.
- [ ] No-active-session state does not clutter Home.
- [ ] Kitchen shortcut exists.
- [ ] Kitchen shortcut links to `/app/inventory`.
- [ ] Recent Cooking preview exists.
- [ ] Recent Cooking is limited to a small preview.
- [ ] Home remains compact on desktop.
- [ ] No sidebar is introduced.
- [ ] No analytics/dashboard layout is introduced.
- [ ] Tailwind is used for styling.
- [ ] shadcn primitives are reused where applicable.
- [ ] Existing auth/onboarding behavior is preserved.
- [ ] Existing BottomNavigation remains functional.
- [ ] Loading states are supported.
- [ ] Recoverable errors do not block primary Home actions.
- [ ] Mobile layout passes visual verification.
- [ ] Desktop layout passes visual verification.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Relevant tests pass.
- [ ] Biome/lint passes.

---

# 47. Agent Rule

For Home, optimize for:

```text
one obvious primary action
+
fast cooking entry
+
session continuity
+
useful shortcuts
+
small amount of recent context
```

Do not optimize for:

```text
information density
analytics
dashboard complexity
decorative card count
desktop-only layout
```

The Home screen should answer this question immediately:

> "What do I want to cook, or should I continue what I was already cooking?"

---

# 48. Next Phase

After Home composition is accepted:

```text
Phase 3
Home
→ Recommendation
→ Select Recipe
```

The next implementation should connect the Home cooking request and Quick Start actions to the existing Recommendation flow without re-asking persistent context.
