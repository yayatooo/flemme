# Codex Task — Refine Flemme Landing Hero

## Goal

Refine the existing Flemme landing hero without redesigning the rest of the page.

The current navbar and mascot implementation are already accepted.

This task should only improve:

- hero wording,
- hero vertical scale,
- hero visual balance,
- mascot scale,
- ticker placement.

Do not redesign the navbar or any section below the ticker.

---

# Locked Hero Copy

## Eyebrow

```text
GOOD FOOD. LESS OVERTHINKING.
```

Keep the short orange line before the eyebrow.

---

## Main Headline

```text
Let Flemme do the thinking.
You do the cooking.
```

This wording is locked.

Do not rewrite it.

Do not translate it.

Do not add extra words.

The line break should preferably remain:

```text
Let Flemme do the thinking.
You do the cooking.
```

The first line may wrap responsively on smaller screens, but the intended desktop composition should preserve these two visual statements.

---

## Description

Use:

```text
Tell us what’s in your kitchen. Flemme turns what you have into practical meal ideas and guides you through every step.
```

Keep the description concise and visually quieter than the headline.

Do not add extra explanatory copy.

---

## Primary CTA

Keep the existing primary CTA:

```text
Mulai Sekarang
```

Do not change its route or behavior.

---

## Secondary CTA

Keep:

```text
Lihat Cara Kerjanya
```

Do not change its route or behavior.

---

# 1. Hero Height

The current hero feels too short.

Increase the desktop hero height so the first fold feels like a deliberate banner rather than a normal content section.

Target direction:

```text
desktop hero visual height:
approximately 720–780px
```

Prefer a flexible min-height rather than hardcoding the entire section to `100vh`.

A suitable direction may be:

```css
min-height: clamp(720px, 78vh, 820px);
```

Adapt this to the existing Tailwind/CSS setup.

Do not force an exact value if the existing layout requires a slightly different one.

The visual objective matters more than matching a literal number.

---

# 2. Hero Structure

The hero should behave conceptually like:

```text
Hero Section
├── Navbar
├── Main Hero Content
│   ├── Left Copy
│   └── Right Mascot
└── Brand Ticker
```

The ticker should visually become the bottom edge of the hero.

It should not feel like an unrelated section floating below the banner.

A suitable layout strategy is:

```text
hero
→ flex column

main hero content
→ flex: 1
→ vertically centered within available space

ticker
→ sits at the bottom
```

Do not modify ticker wording in this task.

---

# 3. Desktop Layout

Keep the existing two-column composition.

Left side:

```text
eyebrow
headline
description
CTA group
benefit row
```

Right side:

```text
banner-mascot
```

The hero should feel spacious.

Avoid pushing all content toward the top.

The left and right sides should feel vertically balanced.

---

# 4. Headline Treatment

The headline must remain the strongest element on the left side.

Use the current bold geometric sans direction.

Do not reintroduce:

- Calistoga,
- Shrikhand,
- retro display fonts,
- decorative script fonts.

The headline should feel:

- bold,
- clean,
- modern,
- confident,
- easy to read.

Prefer:

```text
font-weight: 800–900
tight tracking
tight line-height
```

Increase the desktop size if needed so the hero gains more presence.

Suggested visual direction:

```text
mobile:
large but readable

desktop:
approximately 60–72px equivalent

large desktop:
may scale slightly beyond that if the current type system supports it
```

Do not let the headline overflow at 360px or 390px.

---

# 5. Mascot Scale

The mascot currently feels slightly too small relative to the available desktop canvas.

Increase its visual presence.

The mascot should remain:

- uncropped,
- fully visible,
- aspect-ratio preserved,
- `object-fit: contain`.

Do not wrap it in a new card, border, or shadow container.

The mascot should visually balance the headline rather than looking like a decorative side image.

Target direction:

```text
desktop visual width:
roughly 520–620px depending on the existing container
```

Do not blindly hardcode this range if the layout needs another value.

Use runtime balance as the final guide.

---

# 6. Benefit Row

Keep the existing three benefit items.

Do not redesign them into large cards.

They should remain supporting content.

The benefit row must not compete with:

1. headline,
2. mascot,
3. primary CTA.

Keep spacing generous but compact enough that the hero still feels cohesive.

---

# 7. Vertical Rhythm

The current hero should gain more breathing room.

Adjust:

- navbar-to-hero spacing,
- eyebrow-to-headline spacing,
- headline-to-description spacing,
- description-to-CTA spacing,
- CTA-to-benefits spacing,
- bottom spacing above ticker.

Do not solve the height issue by adding one giant arbitrary margin.

The whole composition should feel intentionally distributed.

---

# 8. Mobile Behavior

Do not copy the desktop min-height directly onto mobile.

Mobile should remain content-driven.

Preferred order:

```text
eyebrow
headline
description
CTA group
mascot
benefit row
ticker
```

or preserve the current working mobile order if it produces better runtime balance.

Important:

- no horizontal overflow,
- mascot stays meaningful,
- CTA remains easy to tap,
- headline remains readable,
- ticker remains below the complete hero content.

Do not force the mobile hero to fill the viewport.

---

# 9. Navbar Boundary

The navbar is already accepted.

Do not redesign it.

Do not change:

- its content,
- desktop alignment,
- brand placement,
- CTA,
- mobile menu behavior.

Only adjust surrounding hero spacing if strictly necessary.

---

# 10. Sections Below Hero

Everything below the ticker is out of scope.

Do not modify:

- Discover,
- About,
- Pricing,
- footer,
- section copy,
- section spacing,
- cards,
- responsive behavior outside the hero.

If a global token change would affect these areas, avoid that global change and use a localized hero treatment instead.

---

# 11. Anti-Slop Rules

Do not add:

- gradients,
- glow,
- floating cards,
- fake metrics,
- new badges,
- extra labels,
- new decorative icons,
- AI wording,
- extra CTA buttons,
- hero animations,
- parallax,
- background blobs,
- duplicate mascot UI,
- additional text blocks.

Do not rewrite the accepted mascot composition.

Do not redesign the page while solving hero height.

---

# 12. Verification

Inspect the actual runtime after implementation.

Verify:

```text
360px
390px
768px
1024px
1440px
```

Check:

- headline wrapping,
- hero vertical scale,
- mascot size,
- left/right visual balance,
- navbar spacing,
- CTA spacing,
- benefit row,
- ticker placement,
- no horizontal overflow,
- no accidental changes to sections below.

Use repository scripts that actually exist.

Run the relevant available checks:

```text
typecheck
build
lint / Biome
git diff --check
```

Do not claim runtime verification if it was not actually performed.

---

# Final Report

Report:

1. Files changed.
2. Hero min-height / layout strategy used.
3. Headline typography changes.
4. Mascot sizing changes.
5. How the ticker was attached to the hero boundary.
6. Mobile behavior.
7. Verification performed.
8. Any deviation from this task and why.

---

# Acceptance Criteria

- [ ] Headline is exactly `Let Flemme do the thinking. You do the cooking.`
- [ ] Description uses the locked English copy.
- [ ] Hero feels visibly taller on desktop.
- [ ] Ticker forms the visual bottom edge of the hero.
- [ ] Mascot has stronger visual presence.
- [ ] Navbar remains unchanged.
- [ ] Benefit row remains lightweight.
- [ ] No new decorative or product content is introduced.
- [ ] Mobile remains content-driven and overflow-free.
- [ ] Sections below the ticker remain unchanged.
- [ ] Repository checks are reported truthfully.
