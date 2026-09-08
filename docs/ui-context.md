# UI Context

## Product Feel

Flemme should feel:

- fun,
- warm,
- playful,
- approachable,
- food-oriented,
- expressive,
- slightly game-like,
- friendly for everyday use.

The product should not feel like a traditional SaaS dashboard.

Flemme should feel closer to an interactive cooking companion that users can
casually open from their phone when deciding what to cook or while actively
cooking.

The interface should reduce decision fatigue and make cooking feel enjoyable.

---

## Primary Device Strategy

Flemme is mobile-first.

Most users are expected to access Flemme through a smartphone browser,
especially during:

- ingredient input,
- recipe selection,
- cooking sessions,
- timers,
- step-by-step guidance.

Design and implementation must therefore prioritize mobile behavior before
desktop enhancement.

### Mobile Rules

- Design the smallest meaningful viewport first.
- Primary actions must be reachable and easy to tap.
- Touch targets must be comfortable.
- Avoid hover-dependent interaction.
- Avoid layouts that require precise pointer interaction.
- Avoid dense tables or desktop-style dashboards for primary flows.
- Critical cooking information must remain readable without zooming.
- Text must remain readable while the phone is placed at cooking distance.
- Primary actions should normally occupy generous width on mobile.
- Avoid excessive horizontal scrolling.
- Respect safe-area spacing where relevant.

Desktop layouts may become more spacious, but should preserve the same
interaction hierarchy as mobile.

---

## Visual Direction

Flemme takes inspiration from playful editorial food/lifestyle websites.

The visual language combines:

- warm neutral backgrounds,
- deep dark-green/ink outlines,
- bright accent colors,
- oversized rounded shapes,
- offset shadows,
- expressive typography,
- playful decorative illustrations,
- large breathing room between sections.

The result should feel intentional and memorable without becoming chaotic.

Avoid:

- generic SaaS dashboard aesthetics,
- excessive glassmorphism,
- futuristic AI visual language,
- neon cyberpunk styling,
- overly sterile white interfaces,
- excessive gradients,
- excessive micro-card layouts,
- dense enterprise UI patterns.

---

## Surface Style

Prefer soft neo-brutalist surfaces.

Typical characteristics:

- visible dark outlines,
- large rounded corners,
- offset hard or semi-hard shadows,
- clear separation between foreground and background,
- strong visual hierarchy.

Examples:

Primary button:

[ bright surface ]
[ dark outline ]
[ dark offset shadow ]

Cards:

[ light surface ]
[ dark border ]
[ slight offset shadow ]

Do not apply heavy borders and shadows to every element.

Use them primarily for:

- CTA buttons,
- important cards,
- navigation containers,
- active cooking controls,
- highlighted states.

Secondary text and informational elements should remain visually lighter.

---

## Color Direction

The palette should feel food-friendly, playful, and warm.

Preferred roles:

### Background

Warm off-white / cream.

Avoid pure white as the dominant page background.

### Ink

Deep green-black or very dark forest green.

Used for:

- primary text,
- borders,
- large dark surfaces,
- offset shadows.

### Primary Accent

Warm orange / coral.

Used for:

- main Flemme actions,
- active states,
- cooking progress,
- playful emphasis.

### Secondary Accent

Fresh lime / yellow-green.

Used selectively for:

- alternative CTA,
- successful states,
- highlights,
- playful UI accents.

### Supporting Accent

Soft lavender / muted purple.

Used sparingly for:

- secondary shadows,
- tags,
- decorative emphasis.

### Neutral

Warm beige / cream variations.

Exact color tokens must be defined before production UI implementation.

Components should use semantic CSS variables rather than arbitrary hardcoded
colors.

---

## Typography

Typography should contribute to Flemme's personality.

Use two complementary roles:

### Primary Sans

Used for:

- interface text,
- navigation,
- buttons,
- recipe information,
- cooking instructions.

Characteristics:

- highly readable,
- friendly,
- modern,
- slightly rounded or humanist.

### Display / Editorial Accent

A serif or expressive italic typeface may be used selectively for:

- hero emphasis,
- marketing headings,
- section highlights,
- celebratory moments.

Example:

"Cook what you have,
make it yours."

The expressive font must not be used for long body text or critical cooking
instructions.

Cooking-session readability always has priority over visual personality.

---

## Border Radius

Flemme uses generous rounded geometry.

General direction:

- buttons: large pill / rounded-full where appropriate,
- navigation: large rounded container,
- cards: large rounded corners,
- badges: pill-shaped,
- small controls: medium rounded corners.

Avoid inconsistent random radius values.

A shared radius scale should be established.

---

## Buttons

Primary buttons should feel tactile.

Typical characteristics:

- strong contrast,
- visible border,
- generous height,
- bold label,
- rounded shape,
- optional offset shadow.

Primary mobile CTA should generally be large and easy to press.

Examples:

- Start Cooking
- Continue
- Choose Recipe
- Finish Cooking

Secondary actions should remain visually quieter.

Avoid having multiple competing primary buttons on one screen.

---

## Navigation

Navigation should feel like a floating or contained element rather than a
traditional enterprise navbar.

Desktop may use a wide rounded navigation container.

Mobile navigation should prioritize:

- product identity,
- current primary action,
- essential navigation only.

Do not shrink desktop navigation into an overcrowded mobile header.

Mobile navigation may use a different composition if needed.

---

## Decorative Elements

Flemme may use small food-related or playful illustrations.

Examples:

- sparkles,
- ingredient doodles,
- utensils,
- flames,
- leaves,
- cooking symbols.

Illustrations should feel hand-drawn or simple rather than photorealistic.

They are decorative and must never interfere with readability.

---

## Image Treatment

Food photography should feel appetizing and natural.

Images may be placed inside editorial-style frames inspired by printed
photographs or cards.

Optional treatments:

- slight rotation,
- thick border,
- offset shadow,
- caption underneath.

Do not overuse tilted cards.

Image treatments should remain secondary to the food itself.

---

## Layout

Prefer generous spacing and clear content blocks.

The layout should not feel like a dense dashboard.

Recommended pattern:

Section label
↓
Strong heading
↓
Short explanation
↓
Primary content / visual
↓
Primary action

Desktop sections may use asymmetric two-column editorial layouts.

Mobile should normally collapse into a single clear vertical flow.

---

## Cooking Session

The cooking session is the most important interactive experience in Flemme.

It should feel like progressing through an activity rather than reading a
traditional recipe page.

Primary structure:

Current Step
↓
Instruction
↓
Optional timer / checkpoint / tip
↓
Complete / Continue
↓
Progress Feedback
↓
Next Step

One cooking instruction should dominate the screen.

Supporting information such as:

- duration,
- tip,
- warning,
- household adjustment,
- checkpoint

must remain visually secondary.

Large text and clear controls are especially important because users may view
the screen from a distance while cooking.

---

## Gamification

Flemme may use lightweight game-like interaction.

Recommended:

- visible cooking progress,
- step completion,
- animated state transitions,
- completion feedback,
- small celebrations,
- encouraging messages,
- playful loading states.

Examples:

"Step 3 of 7"

"Nice 🔥 bawangnya sudah harum."

"Almost there!"

"Cooking complete 🎉"

Avoid unnecessary game systems such as:

- XP,
- levels,
- leaderboards,
- competitive rankings,
- excessive badges.

Gamification exists to make cooking engaging, not to turn Flemme into a game.

---

## Motion

Motion should support feedback and progression.

Good uses:

- button press feedback,
- cooking-step transitions,
- progress updates,
- recipe card selection,
- successful completion,
- subtle decorative motion.

Avoid constant background animation.

Avoid animation that delays interaction.

Motion should remain lightweight on mobile devices.

Magic UI may be used selectively where animation genuinely improves the
experience.

---

## Component Foundation

Frontend foundation:

- Tailwind CSS
- shadcn/ui
- Lucide React
- Magic UI when useful

shadcn/ui provides implementation primitives, not Flemme's visual identity.

Default shadcn appearance should be customized to match Flemme.

Generated shadcn components should not be modified without a clear reason.
Prefer composition and class overrides around the primitive when possible.

---

## Responsive Principles

Flemme follows:

mobile-first
→ tablet enhancement
→ desktop enhancement

Not:

desktop design
→ shrink until it fits mobile

Desktop may introduce:

- larger whitespace,
- editorial two-column sections,
- floating imagery,
- wider navigation,
- decorative compositions.

Mobile must preserve:

- clear hierarchy,
- readable instructions,
- large actions,
- comfortable spacing,
- straightforward vertical navigation.

---

## Accessibility

Playful design must not compromise accessibility.

Requirements:

- sufficient text contrast,
- readable font sizes,
- visible focus states,
- keyboard accessibility where applicable,
- meaningful button labels,
- icons should not be the only representation of critical actions,
- reduced-motion preferences should be respected.

Color must not be the only indicator of important state.

---

## Design Principle

When choosing between:

a visually impressive interaction

and

an immediately understandable interaction,

prefer the understandable interaction.

Flemme should be playful without making cooking harder.
