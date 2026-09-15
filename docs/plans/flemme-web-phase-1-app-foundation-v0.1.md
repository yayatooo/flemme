# Flemme Web — Phase 1: App Foundation v0.1

## Status

**Implementation Task / Required Foundation**

Phase ini membangun fondasi UI untuk seluruh authenticated Flemme application.

Scope utama:

```text
/app
├── App Shell
├── App Header
├── Page Container
├── Bottom Navigation
├── Shared Loading State
├── Shared Empty State
└── Shared Error State
```

Phase ini belum fokus ke Recommendation, Active Cooking, History data, atau feature integration secara penuh.

Tujuannya adalah memastikan seluruh core user flow berikutnya berjalan di atas layout dan component system yang konsisten.

---

# 1. Core User Flow Context

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

Phase 1 hanya membangun application foundation yang akan digunakan oleh flow tersebut.

---

# 2. Mandatory UI Stack

Semua UI di `apps/web` wajib menggunakan:

```text
React
+
TanStack Router
+
Tailwind CSS
+
shadcn/ui
```

Gunakan Lucide untuk icon apabila icon yang dibutuhkan tersedia.

Do not introduce another general UI framework.

Jangan menambahkan:

```text
Material UI
Chakra UI
Ant Design
Mantine
Bootstrap
styled-components
Emotion
```

---

# 3. UI Architecture Rule

Dependency direction:

```text
shadcn primitive
        ↓
shared Flemme component
        ↓
feature component
        ↓
route / page
```

Contoh:

```text
shadcn Button
        ↓
BottomNavigationItem
        ↓
BottomNavigation
        ↓
AppShell
```

atau:

```text
shadcn Card
        ↓
shared EmptyState
        ↓
Home / Inventory / History
```

`components/ui` tetap generic.

Jangan memasukkan domain-specific behavior ke dalam shadcn primitive.

---

# 4. Visual Direction

Authenticated application tetap menggunakan visual identity Flemme:

```text
Neubrutalism
+
Groovy Retro
+
Mobile-first
```

Gunakan:

- strong border
- deep forest-green foreground
- warm cream background
- tomato-orange accent
- mustard accent
- leafy green
- lavender
- soft pink
- hard shadow
- expressive heading typography
- readable body typography

Namun application UI harus lebih restrained dibanding marketing landing page.

Landing page boleh sangat expressive.

Authenticated application harus lebih practical.

Prinsip:

> Functional clarity first, Flemme personality second.

---

# 5. Mobile-First App Philosophy

Flemme adalah cooking assistant.

User kemungkinan besar menggunakan aplikasi sambil:

- berada di dapur
- memegang handphone
- menyiapkan bahan
- mengikuti cooking steps

Karena itu authenticated UI harus selalu dirancang dari mobile terlebih dahulu.

Think:

```text
mobile
↓
tablet
↓
desktop
```

Bukan:

```text
desktop
↓
shrink to mobile
```

---

# 6. Desktop Must Stay Compact

Ini adalah keputusan UX yang locked.

Authenticated Flemme application tidak berubah menjadi dashboard desktop yang lebar.

Jangan membuat:

- permanent sidebar
- multi-column enterprise dashboard
- full viewport content
- analytics-style layout

Desktop hanya memberikan breathing room.

Expected:

```text
desktop viewport

┌───────────────────────────────────────────────┐
│                                               │
│          ┌─────────────────────────┐          │
│          │                         │          │
│          │       Flemme App        │          │
│          │                         │          │
│          │                         │          │
│          │                         │          │
│          └─────────────────────────┘          │
│                                               │
└───────────────────────────────────────────────┘
```

Default app canvas tetap centered.

Recommended conceptual width:

```text
max-w-xl
```

atau ukuran lain yang tetap mempertahankan mobile-app feeling.

Jangan stretch standard app pages ke seluruh desktop width.

---

# 7. Layout Ownership Pattern

Gunakan struktur yang konsisten:

```text
viewport
└── AppShell
    ├── AppHeader
    ├── PageContainer
    │   └── route content
    └── BottomNavigation
```

Conceptually:

```tsx
<AppShell>
	<AppHeader />

	<PageContainer>
		<Outlet />
	</PageContainer>

	<BottomNavigation />
</AppShell>
```

---

# 8. Recommended Structure

Gunakan struktur seperti berikut:

```text
apps/web/src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   │
│   └── app/
│       ├── app-shell.tsx
│       ├── app-header.tsx
│       ├── page-container.tsx
│       ├── bottom-navigation.tsx
│       ├── empty-state.tsx
│       ├── error-state.tsx
│       ├── loading-state.tsx
│       └── index.ts
│
└── routes/
    └── app/
        ├── route.tsx
        └── index.tsx
```

Exact naming may follow the project's current convention.

Do not create duplicate architecture if equivalent structure already exists.

---

# 9. App Shell

Create:

```text
components/app/app-shell.tsx
```

Responsibilities:

- provide authenticated app canvas
- center application on large screens
- own minimum viewport height
- provide background around the app
- account for fixed/sticky navigation
- host application-wide layout structure

Conceptual:

```tsx
type AppShellProps = {
	children: React.ReactNode;
};

export function AppShell({
	children,
}: AppShellProps) {
	return (
		<div className="min-h-dvh bg-muted">
			<div
				className="
					mx-auto
					min-h-dvh
					w-full
					max-w-xl
					bg-background
				"
			>
				{children}
			</div>
		</div>
	);
}
```

Exact styling may evolve.

Important rule:

> `AppShell` owns the compact application canvas.

Feature pages must not independently recreate the max-width shell.

---

# 10. App Header

Create:

```text
components/app/app-header.tsx
```

Initial responsibility:

```text
Flemme branding
+
profile/account entry
```

Conceptual layout:

```text
┌─────────────────────────────┐
│ Flemme.                 👤  │
└─────────────────────────────┘
```

Use shadcn where appropriate.

Examples:

```text
Button
Avatar
DropdownMenu
```

Do not introduce account business logic if it is not required yet.

Phase 1 may initially expose a visual/profile entry placeholder if the full profile flow is not available.

---

# 11. Header Behavior

Recommended:

- stay visually simple
- compact height
- enough touch area
- mobile-first
- consistent horizontal padding with page content

Avoid:

- dashboard breadcrumbs
- excessive action icons
- notification center unless product requires it
- desktop-only toolbar complexity

Flemme Header is not an admin header.

---

# 12. Page Container

Create:

```text
components/app/page-container.tsx
```

Its responsibility is consistent page spacing.

Example:

```tsx
type PageContainerProps = {
	children: React.ReactNode;
	className?: string;
};

export function PageContainer({
	children,
	className,
}: PageContainerProps) {
	return (
		<div
			className={cn(
				"px-5 py-6 sm:px-6",
				className,
			)}
		>
			{children}
		</div>
	);
}
```

Do not duplicate:

```text
px-5
sm:px-6
```

across every page without reason.

The shared page container should establish the normal app spacing system.

---

# 13. Bottom Navigation

Create:

```text
components/app/bottom-navigation.tsx
```

Initial destinations:

```text
Home
Inventory
History
Favorites
```

These represent global application destinations.

Do not put:

```text
Recommendation
Pre-Cooking
Active Cooking
Completion
Nutrition
```

inside global navigation.

Those belong to the cooking task flow.

---

# 14. Bottom Navigation Layout

Expected conceptual UI:

```text
┌─────────────────────────────────┐
│                                 │
│          page content           │
│                                 │
├─────────────────────────────────┤
│ Home  Inventory  History  ♥     │
└─────────────────────────────────┘
```

Navigation should remain available on compact desktop layout as well.

Do not automatically convert it to a sidebar.

---

# 15. Navigation Items

Recommended icons:

```text
Home      → Home
Inventory → Refrigerator / Package
History   → History
Favorites → Heart
```

Use Lucide icons if suitable.

Each navigation item must have:

- icon
- visible label
- active state
- sufficient touch target
- keyboard/focus state

Do not rely on icon-only navigation.

---

# 16. Active Navigation State

Use TanStack Router location awareness.

The current route should be visually clear.

Possible treatment:

```text
inactive
icon + label

active
accent background
stronger border
or stronger foreground
```

Do not overdecorate active navigation.

The result should remain readable and compact.

---

# 17. Bottom Navigation Positioning

The bottom navigation may be:

```text
sticky
```

or:

```text
fixed within the app canvas
```

depending on the current route/layout implementation.

If fixed:

- ensure content has bottom padding
- avoid covering buttons/content
- account for mobile safe-area

Recommended consideration:

```css
env(safe-area-inset-bottom)
```

where appropriate.

---

# 18. Cooking Flow Exception

Global BottomNavigation should not necessarily remain visible during immersive cooking screens.

Future examples:

```text
Pre-Cooking
Active Cooking
Completion
```

may use a dedicated Cooking Flow Layout.

Do not tightly couple BottomNavigation into every possible route.

Phase 1 should make it possible for future routes to opt into another layout.

---

# 19. App Route Layout

The authenticated `/app` route should own the application shell.

Conceptually:

```tsx
export function AppLayout() {
	return (
		<AppShell>
			<AppHeader />

			<main className="pb-app-navigation">
				<Outlet />
			</main>

			<BottomNavigation />
		</AppShell>
	);
}
```

Do not wrap every individual feature page with AppShell.

The route layout should provide it once.

---

# 20. Route Direction

Recommended initial route structure:

```text
/app
/app/inventory
/app/history
/app/favorites
```

Future cooking flow may evolve into:

```text
/app/cooking/...
```

or another route group.

Do not redesign existing route contracts unnecessarily during this task.

---

# 21. Shared Loading State

Create:

```text
components/app/loading-state.tsx
```

Use shadcn `Skeleton` where applicable.

It should provide a reusable loading presentation for authenticated screens.

Avoid:

```text
blank screen
plain "Loading..."
large spinner for every situation
```

Prefer layout-aware skeletons.

Keep the component generic.

Example conceptual API:

```tsx
<LoadingState />
```

or:

```tsx
<LoadingState rows={3} />
```

Do not over-engineer configuration.

---

# 22. Shared Empty State

Create:

```text
components/app/empty-state.tsx
```

Use when:

- history has no entries
- favorites are empty
- inventory is empty
- no active session exists
- no optional content is available

Suggested API:

```ts
type EmptyStateProps = {
	title: string;
	description?: string;
	icon?: React.ReactNode;
	action?: React.ReactNode;
};
```

Example:

```tsx
<EmptyState
	title="No favorites yet"
	description="Meals you save will show up here."
	action={
		<Button>
			Start cooking
		</Button>
	}
/>
```

The component must remain generic.

Do not create separate primitives such as:

```text
HistoryEmptyState
FavoriteEmptyState
InventoryEmptyState
```

unless a feature later requires genuinely different behavior.

---

# 23. Shared Error State

Create:

```text
components/app/error-state.tsx
```

Use for recoverable page-level failures.

Suggested API:

```ts
type ErrorStateProps = {
	title?: string;
	description?: string;
	onRetry?: () => void;
};
```

Example:

```tsx
<ErrorState
	title="Couldn't load your kitchen"
	description="Try again in a moment."
	onRetry={refetch}
/>
```

Use shadcn `Button` for retry actions.

Avoid exposing raw backend errors directly to users.

---

# 24. shadcn Primitive Usage

Phase 1 should reuse shadcn primitives wherever appropriate.

Likely primitives:

```text
Button
Avatar
DropdownMenu
Card
Skeleton
```

Only add a shadcn component if Phase 1 actually uses it.

Do not install all primitives preemptively.

---

# 25. App Component Styling

Shared app components should consume semantic Tailwind/theme values.

Prefer:

```tsx
className="border-foreground bg-background text-foreground"
```

Avoid:

```tsx
className="border-[#123A2B] bg-[#F5E8D5]"
```

unless there is a clear brand-specific exception that belongs outside semantic tokens.

Keep the Flemme palette centralized.

---

# 26. Neubrutalist Treatment

Authenticated UI should retain Flemme character using restrained elements such as:

```text
2–3px borders
hard shadow
bold active state
retro accent surfaces
groovy heading moments
```

Do not apply hard shadows to every element.

Avoid making every navigation item a heavy decorative card.

Hierarchy matters more than decoration.

---

# 27. Touch Targets

Interactive controls should generally have a minimum target around:

```text
44–48px
```

where appropriate.

Especially:

- bottom nav items
- profile control
- menu actions
- primary buttons
- icon buttons

Do not create tiny controls optimized only for desktop pointer input.

---

# 28. Accessibility

Required:

- semantic `header`, `main`, `nav`
- `aria-label` for navigation when necessary
- visible focus state
- keyboard interaction
- sufficient contrast
- navigation labels
- active state must not rely on color alone
- preserve shadcn/Radix accessibility behavior

Do not remove focus outlines globally.

---

# 29. Safe Area

Because Flemme is mobile-first and may be used as an installed/web-app-like experience, consider bottom safe areas.

Bottom navigation should not collide with device UI.

Conceptually:

```tsx
className="pb-[max(1rem,env(safe-area-inset-bottom))]"
```

Use only if compatible with the project's Tailwind setup.

---

# 30. Scroll Behavior

The page content should be the natural scrolling surface.

Do not introduce nested scrolling containers unnecessarily.

Avoid:

```text
body scroll
+
app shell scroll
+
page scroll
```

unless required by a future immersive cooking experience.

Phase 1 should keep scrolling simple.

---

# 31. Header and Navigation Relationship

Do not make the AppHeader and BottomNavigation responsible for feature content.

Example:

Bad:

```text
AppHeader loads current inventory count
BottomNavigation fetches cooking session
```

Good:

```text
AppHeader owns app-level navigation/presentation
BottomNavigation owns global destinations
feature page owns feature data
```

Keep responsibilities narrow.

---

# 32. Route Guard Preservation

If `/app` already has:

- authentication guard
- onboarding completion guard
- profile/context redirect behavior

preserve it.

Do not remove or simplify working route guards while refactoring layout.

Phase 1 is a presentation/layout foundation task.

---

# 33. Existing Behavior Preservation

Do not casually rewrite:

- authentication
- Google login/register
- onboarding
- persistent cooking context
- favorites API
- cooking sessions
- recommendation contracts
- history behavior
- inventory behavior

Only modify what is necessary to establish app layout infrastructure.

---

# 34. Initial `/app` Page

Phase 1 does not need to finish the actual Home feature.

`/app` only needs enough placeholder composition to verify:

```text
AppShell
AppHeader
PageContainer
BottomNavigation
responsive behavior
```

Do not prematurely implement Recommendation integration in this phase.

A minimal placeholder may be used temporarily.

Example:

```tsx
<PageContainer>
	<h1>Home</h1>
</PageContainer>
```

This placeholder should be removed during Phase 2.

---

# 35. Responsive Verification

Verify at minimum:

```text
small mobile
standard mobile
tablet
desktop
large desktop
```

Expected behavior:

### Mobile

```text
full-width app canvas
header
content
bottom nav
```

### Desktop

```text
outer background visible
centered compact app canvas
same navigation philosophy
no sidebar transformation
```

---

# 36. Recommended App Shell Visual Concept

Desktop:

```text
outer page / background

        ┌───────────────────────────┐
        │ Flemme               👤   │
        ├───────────────────────────┤
        │                           │
        │       page content        │
        │                           │
        │                           │
        ├───────────────────────────┤
        │ Home Inv History Fav      │
        └───────────────────────────┘
```

Mobile:

```text
┌───────────────────────────┐
│ Flemme               👤   │
├───────────────────────────┤
│                           │
│       page content        │
│                           │
│                           │
├───────────────────────────┤
│ Home Inv History Fav      │
└───────────────────────────┘
```

The application identity stays consistent across viewport sizes.

---

# 37. App Shell vs Landing Page

Do not reuse the landing page container behavior blindly.

Marketing landing:

```text
full-width expressive sections
large max-width containers
editorial layouts
```

Authenticated app:

```text
compact centered canvas
mobile-first hierarchy
task-focused interaction
persistent navigation
```

They share design tokens and UI primitives, but not necessarily the same layout architecture.

---

# 38. Public Component Exports

Create:

```text
components/app/index.ts
```

Recommended exports:

```ts
export { AppHeader } from "./app-header";
export { AppShell } from "./app-shell";
export { BottomNavigation } from "./bottom-navigation";
export { EmptyState } from "./empty-state";
export { ErrorState } from "./error-state";
export { LoadingState } from "./loading-state";
export { PageContainer } from "./page-container";
```

Use the barrel as the public app-layout component API.

Avoid exporting internal helper components unless another module actually needs them.

---

# 39. Do Not Over-Abstract

Do not create abstractions such as:

```text
AppLayoutManager
ResponsiveNavigationProvider
AppShellFactory
StateRendererFactory
```

Phase 1 should remain straightforward React composition.

Prefer:

```text
simple component
+
clear ownership
+
Tailwind
+
shadcn
```

---

# 40. Suggested Implementation Order

Implement in this order:

```text
1. Inspect current /app route and existing guards.
2. Create components/app directory.
3. Create AppShell.
4. Create PageContainer.
5. Create AppHeader.
6. Create BottomNavigation.
7. Wire TanStack Router active navigation.
8. Create LoadingState.
9. Create EmptyState.
10. Create ErrorState.
11. Create components/app/index.ts.
12. Integrate AppShell into /app route layout.
13. Add temporary /app page content for validation.
14. Verify safe content padding around bottom nav.
15. Verify mobile responsive behavior.
16. Verify desktop compact behavior.
17. Run typecheck.
18. Run build.
19. Run relevant tests.
20. Run Biome/lint checks.
```

---

# 41. Non-Goals

Do not implement the following during this phase:

```text
Home feature composition
Recommendation UI
Recommendation API call
Recipe selection
Pre-Cooking UI
Cooking Session creation UI
Active Cooking UI
Completion UI
Nutrition UI
Favorites feature page content
History feature page content
Inventory feature page content
```

Those belong to later phases.

---

# 42. Future Phase Compatibility

Phase 1 must make these future compositions easy:

```text
AppShell
└── Home

AppShell
└── Inventory

AppShell
└── History

AppShell
└── Favorites
```

And also allow an alternate future cooking layout:

```text
CookingFlowLayout
├── CookingHeader
├── CookingContent
└── CookingActions
```

Do not force immersive cooking routes to inherit BottomNavigation.

---

# 43. Acceptance Criteria

Phase 1 is complete when:

- [ ] `AppShell` exists.
- [ ] `AppHeader` exists.
- [ ] `PageContainer` exists.
- [ ] `BottomNavigation` exists.
- [ ] `LoadingState` exists.
- [ ] `EmptyState` exists.
- [ ] `ErrorState` exists.
- [ ] Components use Tailwind CSS.
- [ ] shadcn primitives are used where applicable.
- [ ] No competing UI framework is introduced.
- [ ] `/app` uses the shared AppShell.
- [ ] AppShell is provided once by the route layout.
- [ ] App width remains compact on desktop.
- [ ] No desktop sidebar is introduced.
- [ ] BottomNavigation contains Home, Inventory, History, Favorites.
- [ ] Active navigation state works.
- [ ] Navigation labels remain visible.
- [ ] Touch targets are mobile-friendly.
- [ ] Content is not hidden behind BottomNavigation.
- [ ] Existing auth/onboarding guards still work.
- [ ] Existing domain behavior is unchanged.
- [ ] Mobile layout works.
- [ ] Tablet layout works.
- [ ] Desktop layout works.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Existing relevant tests pass.
- [ ] Biome/lint checks pass.

---

# 44. Agent Rule

For Phase 1, optimize for:

```text
simple layout ownership
+
mobile-first behavior
+
compact desktop canvas
+
Tailwind CSS
+
shadcn/ui primitives
+
Flemme visual identity
```

Do not optimize for:

```text
desktop dashboard patterns
maximum abstraction
feature implementation
complex responsive transformations
```

The final architecture should make Phase 2 easy:

```text
App Foundation
      ↓
Home
      ↓
Recommendation
```

without requiring another major layout rewrite.
