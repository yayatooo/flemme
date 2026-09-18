# Codex Task — Align the Landing Page Theme with the `/app` Bento UI

## Objective

Inspect the visual implementation **actually used by the `/app` route**, then use the audit findings to align the theme of the public landing page `/`.

Flemme is moving from the **retro groovy** direction to a **bento UI that follows the current application**. Do not invent a new interpretation of bento based on generic templates, memory, or generated images.

**The existing Flemme application is the visual source of truth. The landing page must follow `/app`; do not change `/app` to match the landing page.**

This task requires **an audit followed by styling implementation**, not recommendations alone. Complete safe changes within the following boundaries; report genuine blockers without expanding the scope.

---

## 1. Reference Priority

Use this order:

1. The task boundaries and latest decisions in this document.
2. The actual `/app` implementation, its enclosing layouts, and the components rendered within it.
3. Shared primitives, design tokens, and styling conventions already used by that application.
4. Project documents that remain relevant to architecture, product behavior, and accessibility.
5. Previous retro groovy documents as historical context only, not visual rules that override the new direction.

Read `AGENTS.md` and relevant UI/architecture documents if present. Previous context documents may be named:

- `ui-context.md`
- `flemme-web-landing-frontend-architecture-context.md`
- `flemme-retro-groovy-landing-visual-context.md`

These names are references; locate their actual paths rather than inventing paths.

### Previous Decisions That Are No Longer Mandatory

Calistoga, Shrikhand, extremely oversized retro typography, stickers, tilted cards, checkerboards, thick outlines, and hard-offset shadows **are no longer landing page requirements**. Retain a treatment only if it is still a consistent part of the current `/app` UI.

Do not automatically replace everything with new fonts, colors, or shadows. First identify the system already used by `/app`. The logo/wordmark is a separate brand asset; do not replace it merely because the heading font changes.

### Role of the Banner Concept Images

The previous sketch and bento images illustrate a possible banner direction for a later task. They are **not implementation specifications for this task** and do not change decisions about the navbar, copy, features, or brand assets.

**Do not implement rotation animations, card swapping, carousels, or a new banner composition now.**

---

## 2. Change Boundaries

### Allowed Changes

- Styling classes and the use of existing variants.
- Colors/surfaces through tokens already used by the application.
- Typography: family, weight, size, line-height, and hierarchy aligned with `/app`.
- Radius, borders, shadows, spacing, padding, and grid gaps.
- Wrapper styling and alignment/icon placement that do not change the order or meaning of content.
- Visual responsive behavior that keeps the existing composition readable.
- Removal of landing-specific retro decorations that no longer fit.
- Small visual composition extractions where genuinely necessary to avoid duplication.
- Updates to affected visual documentation.

### Disallowed Changes

- Functionality, flows, state, event handlers, queries, mutations, APIs, schemas, or product data.
- Authentication, session restoration, route guards, onboarding, or redirect behavior.
- Working routing and navigation destinations.
- Section order, primary content, card counts, or the overall page composition.
- Marketing copy, feature names, recipe metadata, or pricing information merely to fill the design.
- Changes to the `/app` UI to accommodate the landing page changes.
- New features/routes/cards, discovery integrations, billing, or cooking-session data.
- New dependencies, styling frameworks, or design-system packages.
- Banner animations, hover-flips, auto-rotating cards, parallax, or new animated decorations.

Apply the bento treatment to cards/surfaces and grids that **already exist**. Record major composition changes for a later task instead of implementing them silently.

---

## 3. Phase A — Audit the Actual Implementation

### A. Locate Entry Points and Styling Dependencies

Start with the routes that resolve to `/app` and `/`, then trace the components and layouts actually rendered. Do not assume the `/app` URL necessarily maps to a physical `routes/app` directory.

Inspect as needed:

- Route components and their enclosing layouts.
- The app home and bento cards that represent the main visual pattern, rather than experiments or unused components.
- Shared `Button`, `Card`, `Badge`, input, container, and other relevant compositions.
- Global stylesheets, CSS variables, Tailwind/shadcn configuration, and font-loading mechanisms.
- Landing-specific classes or stylesheets that still carry the retro theme.
- Shared-style usage by authentication/onboarding to understand the risks of global changes.

Use the existing project structure. Do not move files merely to match an idealized folder structure.

### B. Document the Visual System You Find

Create a concise audit record with traceable file or symbol evidence:

| Aspect | Actual Findings in `/app` | Source File/Component/Token | Application to the Landing Page |
| --- | --- | --- | --- |
| Background and surfaces | Populate from the audit | Actual path | Planned reuse |
| Text and accent colors | Populate from the audit | Actual path | Planned reuse |
| Typography and font loading | Populate from the audit | Actual path | Planned reuse |
| Radius, borders, and shadows | Populate from the audit | Actual path | Planned reuse |
| Card padding and grid gaps | Populate from the audit | Actual path | Planned reuse |
| Buttons, badges, and icons | Populate from the audit | Actual path | Planned reuse |
| Containers and responsive rules | Populate from the audit | Actual path | Necessary marketing adjustments |
| Focus, hover, and active states | Populate from the audit | Actual path | States to preserve |

Do not populate the table with estimated values. If patterns conflict, identify the inconsistencies and choose the dominant pattern from reusable components actually in use. Do not generalize a single inline style into a design system.

### C. Review the Running Application When Available

Run the application using commands that actually exist in the repository. Inspect `/app` and the landing page before making changes, on mobile and desktop, when browser tooling and test access are available.

Do not disable authentication or modify guards to capture screenshots. If access prevents a runtime review of `/app`, continue with the code audit where possible and state the verification limits.

---

## 4. Phase B — Apply the Theme to the Landing Page

### A. Typography

Use the fonts and hierarchy found in the application. The landing page may use larger headings for its marketing role, but it must remain within the same visual family.

Do not retain retro fonts just because an older document calls them locked. Do not remove fonts globally before checking their usage on other routes. If the application already uses Plus Jakarta Sans, reuse the same loading implementation; do not assume that font is active without checking.

### B. Colors

Prioritize semantic tokens already used by `/app`. Do not bring the entire old palette into every section merely because it is available.

Preserve Flemme's color identity as actually used in the application. Text on CTAs and colored surfaces must use clearly readable foreground/background pairings rather than automatically using white/cream text on every accent.

Do not create a second palette specifically for the landing page or change global values just to make one section fit.

### C. Surfaces and Bento Character

Follow the application's radius, padding, borders, shadows, and gaps. If the application uses calm surfaces with thin borders, do not bring retro hard-offset shadows back into the landing page.

Bento does not mean wrapping every piece of text in a card. Maintain clear distinctions between:

- Section headings and explanations.
- Visual areas/recipe cards.
- CTAs.
- Supporting content.

Use consistent alignment and spacing. Do not add nested cards, mini-stats, badges, or empty boxes to make the design look denser.

### D. Shared Primitives Without Regressions

Reuse existing components and variants before writing replacements.

If the landing page needs specific styling, use composition or localized class overrides. Do not change shared `Card` or `Button` defaults solely for the landing page if doing so changes the appearance of `/app`, login, or onboarding.

Do not copy app-card markup together with logic that introduces queries, mutations, or session behavior. Reuse the appropriate visual layer without bringing product dependencies into the public landing page.

### E. Navigation and Content

This is not an information architecture task. Preserve working navigation and CTAs.

The previously discussed navbar intent is:

```text
About · Discover · Pricing       Flemme.       Get Started
```

Do not replace it with navigation from a generated image, such as `Recipes / How it works / Get the app`. If the actual implementation differs from that intent, report the difference; do not use a styling task as a reason to create new routes.

Do not add dummy links, recipe metrics, ratings, testimonials, prices, or cooking statuses to complete cards. Record existing content/link issues separately from the theme changes.

### F. The Landing Page Remains Marketing; `/app` Remains the Application

Share the visual language, not the entire app shell.

Do not move dashboard headers, internal navigation, personalized greetings, or user-session content into `/`.

Preserve the landing page's existing containers and overall composition. Width differences from `/app` do not automatically need to be removed: align the visual treatment without turning the landing page into a dashboard copy or widening the application's layout.

---

## 5. Mobile, Interaction, and Anti-Slop

Work mobile-first. Ensure headings do not overflow, CTAs remain comfortable to tap, metadata stays readable, and existing grids are not forced into miniature desktop layouts.

Do not add interactions that require hover. Preserve focus states and keyboard navigation. Do not remove working button feedback just because banner animation is out of scope.

Reject the following treatments unless they are genuinely established, consistent patterns in `/app`:

- Gradients/glows, glassmorphism, floating blobs, or generic “AI sparkles.”
- Heavy shadows, thick outlines, and a different color on every card.
- Decorative icons that convey no information.
- Turning every section into an identical card grid.
- Cards nested inside cards merely to suggest complexity.
- Repeated arbitrary spacing or radius values without shared tokens/patterns.
- Emojis, stock marketing copy, or new features added to fill empty space.

**Flemme's bento design must feel like a continuation of the existing application, not a bento SaaS template with food photos pasted onto it.**

---

## 6. Verification

Find the scripts in `package.json` and follow the repository's package manager and conventions. Do not invent commands or add tooling just to complete a checklist.

Run the available checks:

- Typecheck and web build.
- Lint/Biome according to the project configuration.
- Relevant tests, if available.
- `git diff --check`.

Review the landing page at **360, 390, 768, 1024, and 1440 px** viewports when browser tooling is available. Check overflow, heading wrapping, alignment, CTAs, focus, and navigation. Compare `/app` before and after the changes on at least mobile and desktop to confirm there are no unintended visual changes.

Ensure the diff contains no changes to logic, routing, APIs, or authentication, and no manually edited generated files. Remove unused retro styles **only after tracing their usage**.

Do not claim runtime, responsive, or accessibility verification based only on reading code. Distinguish actual test results, static checks, baseline errors, and environment blockers.

---

## 7. Documentation and Final Report

Use existing UI/progress documentation where appropriate; if there is no suitable location, create one concise note rather than a new documentation system.

Record that the landing page's visual direction now follows the **`/app` Bento UI** and that the previous retro rules have been superseded within the relevant visual scope. Do not remove architecture, product, or accessibility rules that remain applicable.

The final report must include:

1. The visual sources found in `/app`, including paths/components/tokens.
2. Changed files and their main styling changes.
3. Reused primitives/tokens and the reasons for any genuinely necessary exceptions.
4. Verification results, screenshots where available, and areas that remain unverified.
5. Blockers or separate follow-up work, including the banner animation that has not been implemented.

### Acceptance Criteria

- [ ] The audit is based on the actual `/app` implementation, not assumptions from mockups.
- [ ] The landing page uses the application's visual language for fonts, colors, surfaces, radius, spacing, and controls.
- [ ] Retro decorations that conflict with the new direction are no longer forced into the design.
- [ ] There are no changes to functionality, primary content, routing, section order, or overall page composition.
- [ ] `/app`, authentication, and onboarding have no unrequested changes.
- [ ] No new features, cards, routes, data, dependencies, or metrics have been added.
- [ ] No banner animation or card rotation has been implemented.
- [ ] Responsive checks and repository checks are reported according to actual results.
- [ ] Documentation no longer presents two conflicting visual directions as active rules.

**Start by tracing the `/app` route and the components it renders. Once the visual source of truth is clear, implement the landing page theme alignment within this task's boundaries.**

---

## Implementation Record — 2026-09-18

### `/app` Visual Audit

| Aspect | Actual findings in `/app` | Source evidence | Landing application |
| --- | --- | --- | --- |
| Background and surfaces | Cream `background`, paper `card`, and focused forest/orange/lime/mustard/lavender/pink tiles | `apps/web/src/index.css`; `features/home/cooking-prompt.tsx`; `quick-start.tsx` | Landing root now opts into the same scoped semantic theme; existing sections keep their roles but use those surfaces. |
| Text and accent colors | Forest foreground with semantic accent/foreground pairs; cream is used explicitly on forest controls | `index.css`; `active-session-card.tsx`; `bottom-navigation.tsx` | Landing uses semantic `foreground`, `muted-foreground`, `primary-foreground`, and established accent tokens rather than a second palette. |
| Typography and loading | Lexend Deca Variable for headings and Plus Jakarta Sans Variable for body/interface copy, loaded locally | `index.css` imports and `@theme`; `home-greeting.tsx`; `app-header.tsx` | Marketing sizes remain larger where needed, but all headings now stay in Lexend Deca; Shrikhand was removed after repository-wide usage tracing. |
| Radius, borders, shadows | Medium rounded Bento cards/controls, one-pixel semantic borders or transparent colored-card borders, `shadow-card` and `shadow-control` | `components/ui/card.tsx`; `button.tsx`; `app-header.tsx`; `quick-start.tsx` | Thick three-pixel outlines, hard offset shadows, and tilted cards/stickers were replaced with the app patterns. |
| Card padding and grid gaps | Shared cards use spacing 4/5; Home uses compact gaps 3–6 and responsive single-/two-column grids | `components/ui/card.tsx`; `features/home/home-page.tsx`; `quick-start.tsx` | Existing landing grids and content order remain; cards and journey tiles use tighter 3–5 gaps and established padding. |
| Buttons, badges, icons | Shared Button and Badge variants, Lucide icons, 44–56px controls, visible focus rings | `components/ui/button.tsx`; `badge.tsx`; `bottom-navigation.tsx` | Existing Landing Button/Badge compositions and Lucide icons were retained and inherit platform states. |
| Containers and responsive rules | `/app` owns one `max-w-xl` mobile-first column through PlatformContainer; no desktop shell replacement | `routes/app.tsx`; `components/app/platform-container.tsx`; `app-shell.tsx` | Landing retains its wider marketing container and existing responsive composition while adopting the visual language only. |
| Focus, hover, active states | Ring-based keyboard focus, tokenized hover color/elevation, route-derived active navigation | `button.tsx`; `app-header.tsx`; `bottom-navigation.tsx` | Shared interactive primitives and their focus/disabled behavior were preserved; no hover-only feature was added. |

Conflicting patterns were localized Landing overrides: Shrikhand display accents,
three-pixel outlines, hard shadows, rotations, and oversized retro geometry.
The dominant reusable `/app` patterns above were selected instead.

### Assets Found

Landing currently renders:

- `apps/web/public/nasi-goreng.jpeg`
- `apps/web/public/ayam-kecap.jpeg`
- `apps/web/public/Creamy-Sambal-Pasta-Recipe.jpg`
- `apps/web/public/flemme-mascot.png`
- `apps/web/public/brain-flemme.png`

`brain-flemme-recolored.png` and `src/assets/hero.png` were also inspected but
are not referenced by the Landing composition. No image was added or replaced.

### Scope Notes

- The pre-existing desktop navbar label `Home` still links to `#about`, while
  the mobile label remains `About`. This content mismatch was not changed in a
  styling-only task.
- No `/app`, authentication, onboarding, route, query, mutation, handler,
  marketing copy, section order, or card data was changed.
- Banner animation, card rotation, and any new banner composition remain
  separate follow-up work.
