# Flemme Web — Retro Groovy Landing Visual Context

> **Status:** LOCKED  
> **Purpose:** implementation context for coding agents working on the Flemme public landing page and shared web visual foundation.  
> **Scope:** visual language, typography, palette, landing information architecture, navbar direction, section composition, interaction tone, and implementation guardrails.  
> **Primary goal:** make Flemme feel like a memorable consumer cooking brand — not a generic SaaS or AI product.

---

# 1. Product Positioning

Flemme is a cooking companion.

Core promise:

> **Buka kulkas, bukan kebingungan.**

Flemme helps users decide what to cook from:

- available ingredients,
- kitchen equipment/context,
- food preferences,
- cooking preferences,
- household context,

then guides the user through:

```text
Recommendation
→ Pre-Cooking
→ Active Cooking
→ Completion
→ Nutrition
```

The landing page should communicate this product value without relying on technical AI terminology.

Do **not** position Flemme as:

- an AI chatbot,
- an AI productivity tool,
- a generic recipe database,
- a SaaS dashboard,
- a developer product.

AI may power the product, but it is not the visual identity.

---

# 2. Locked Visual Identity

The visual direction is:

> **Retro Groovy Editorial + Soft Neo-Brutalism + Modern Cooking Product**

The intended feeling:

- warm,
- playful,
- expressive,
- food-oriented,
- memorable,
- slightly funky,
- modern enough for daily use,
- approachable,
- not childish.

The public marketing surface may be more visually expressive than the authenticated application.

```text
Landing
→ expressive
→ editorial
→ oversized
→ asymmetric
→ colorful
→ brand-led

/app
→ calmer
→ more readable
→ interaction-led
→ still uses the same tokens and identity
```

Do not make the landing page look like a large version of the product dashboard.

---

# 3. Visual References — What to Extract

The design references should be treated as **directional inspiration**, not templates to reproduce.

## Reference qualities to borrow

### Groovy food / burger reference

Use for:

- oversized display typography,
- strong color blocking,
- editorial asymmetry,
- playful food framing,
- large visual statements.

Do not copy exact layout, typography, or branding.

### Character-led cooking reference

Use for:

- mascot/illustration energy,
- large framed sections,
- bold graphic blocks,
- playful but structured composition.

### Retro lifestyle / garden reference

Use for:

- decorative doodles,
- section transition strips,
- checker/pattern accents,
- hand-drawn supporting illustrations,
- vintage editorial rhythm.

The final design must still feel distinctly Flemme.

---

# 4. Typography — LOCKED

Use three typography roles.

## 4.1 Brand / Groovy Display

```text
Calistoga
```

Use for:

- hero headline,
- major landing section headings,
- oversized numeric statements,
- large brand statements,
- strong editorial moments.

Calistoga is the main display voice.

It should feel:

- chunky,
- curvy,
- retro,
- confident,
- food-editorial,
- legible at large sizes.

Do not use Calistoga for:

- body copy,
- form labels,
- recipe metadata,
- dense product UI,
- long paragraphs.

---

## 4.2 Special Groovy Accent

```text
Shrikhand
```

Use sparingly.

Good usage:

- 1–3 word emphasis,
- sticker text,
- short playful interjection,
- small expressive phrase,
- isolated hero accent.

Examples:

```text
hungry?
let's cook
so good
tonight?
```

Do not use Shrikhand for:

- full hero paragraphs,
- long section headings,
- navigation,
- body text,
- recipe instructions,
- core UI controls.

**Rule:** if Shrikhand appears everywhere, the design has failed.

---

## 4.3 UI / Body

```text
Plus Jakarta Sans
```

Use for:

- navbar,
- body copy,
- buttons,
- badges,
- labels,
- recipe metadata,
- forms,
- pricing details,
- product UI,
- authenticated app UI.

This remains the primary readability font.

---

# 5. Typography Composition Rules

Typography should feel intentionally composed, not randomly “retro”.

Example hero hierarchy:

```text
Buka kulkas,        ← Calistoga / Ink
bukan               ← Shrikhand / Orange
kebingungan.        ← Calistoga / Ink / oversized
```

Example discover section:

```text
DISCOVER                         ← Plus Jakarta Sans / small label

9,628                            ← Calistoga / oversized
things you could cook.           ← Calistoga

Hungry yet?                      ← optional Shrikhand accent
```

Rules:

- display typography may be very large,
- line breaks should be editorial and intentional,
- use asymmetry, not random misalignment,
- body copy should remain short,
- do not combine multiple expressive fonts inside the same sentence,
- do not use more than one “special” accent treatment per local composition.

---

# 6. Locked Color Palette

Use semantic CSS variables.

```css
--cream:        #F6EEDB;
--ink:          #16352D;

--orange:       #E95B32;
--tomato:       #C93627;

--mustard:      #F4B73F;
--lime:         #A9C958;

--lavender:     #B9A1D6;
--soft-pink:    #E9A6A0;
```

## Color roles

### Cream

Primary canvas.

Use as the dominant page background.

Avoid pure white as the main background.

### Ink

Primary text, borders, strong surfaces, and offset shadows.

Prefer this over pure black.

### Orange

Primary Flemme action color.

Use for:

- CTA,
- major accent,
- active emphasis,
- important brand moments.

### Tomato

Secondary warm red.

Use for:

- visual depth,
- selected editorial surfaces,
- secondary emphasis.

Do not let tomato compete with orange as the main CTA color.

### Mustard

Use for:

- section backgrounds,
- numbers,
- retro supporting accents.

### Lime

Use selectively for:

- fresh ingredient cues,
- playful highlights,
- secondary CTA states,
- supporting sections.

### Lavender

Use sparingly for:

- softer visual contrast,
- decorative backgrounds,
- tags,
- select section moments.

### Soft Pink

Use sparingly for:

- decorative supporting surfaces,
- secondary card backgrounds,
- food/editorial warmth.

---

# 7. Color Composition Strategy

Flemme should use colors that “nabrak” but still feel controlled.

Do **not** place every accent color in every section.

Recommended rhythm:

```text
Hero
→ Cream + Ink + Orange

Ticker / marquee
→ Orange + Cream

Discover
→ Mustard + Ink + Cream

About
→ Cream + Ink + Lime accent

How It Works
→ Lime + Ink

Personalization
→ Lavender + Ink + Orange accent

Pricing
→ Cream + mixed card surfaces

Final CTA
→ Ink + Orange / Cream
```

Use contrast through large blocks, not through dozens of small colored chips.

---

# 8. Surface Style

Use **soft neo-brutalism**, not aggressive brutalism.

Typical qualities:

- visible dark outline,
- generous rounded corners,
- selective offset shadow,
- strong foreground/background separation,
- tactile CTA treatment.

Apply stronger border/shadow treatment mainly to:

- CTA buttons,
- key recipe cards,
- navigation container,
- important feature blocks,
- selected states.

Do not put:

- 2px border,
- offset shadow,
- bright background,
- large radius

on every element.

That creates visual noise.

---

# 9. Radius Direction

Keep generous rounded geometry.

Recommended role-based direction:

```text
buttons
→ pill or large rounded

navbar
→ large rounded container

major feature block
→ large rounded

cards
→ medium-large rounded

badges/chips
→ pill

small controls
→ medium rounded
```

Use a shared scale.

Do not invent arbitrary radius values per component.

---

# 10. Border and Shadow Direction

Borders:

- use Ink,
- clean and intentional,
- slightly stronger on important interactive surfaces.

Shadows:

- prefer offset hard/semi-hard shadow,
- keep the offset consistent,
- do not use generic SaaS blur shadows,
- do not use glowing shadows.

The visual identity should feel printed/tactile rather than glassy.

---

# 11. Navbar — LOCKED DIRECTION

Desktop structure:

```text
About      Discover      Pricing          Flemme.          Get Started
```

Preferred behavior:

- left side: primary public navigation,
- center: Flemme brand,
- right side: primary CTA,
- Login may appear as a quiet secondary action near Get Started or inside the menu/footer.

The navbar should feel like a consumer brand navigation, not a dashboard header.

Possible desktop composition:

```text
┌───────────────────────────────────────────────────────────────┐
│ About   Discover   Pricing          Flemme.      Get Started │
└───────────────────────────────────────────────────────────────┘
```

It may be floating/contained, but avoid heavy visual chrome.

## Mobile navbar

Do not shrink the desktop navigation into a tiny crowded row.

Use a different mobile composition:

```text
Flemme.                                  Menu
```

Menu contains:

- About,
- Discover,
- Pricing,
- Login,
- Get Started.

Get Started remains the primary action.

---

# 12. Public Route Direction

The public landing and authenticated application must remain compositionally separate.

Recommended public route direction:

```text
/
├── /about
├── /discover
├── /pricing
├── /login
├── /register
│
├── /onboarding/*
└── /app/*
```

The landing page may preview About, Discover, and Pricing, while dedicated routes can contain deeper content later.

Do not mix `/app` product behavior into the public marketing page.

---

# 13. Landing Page Information Architecture — LOCKED DIRECTION

Recommended initial section order:

```text
Navbar
↓
Hero
↓
Ticker / Brand Statement Strip
↓
Discover
↓
About Flemme
↓
How Flemme Works
↓
Personalized to Your Kitchen
↓
Pricing
↓
Final CTA
↓
Footer
```

This order is preferred over a generic SaaS sequence such as:

```text
Hero
Features
Testimonials
Pricing
FAQ
```

The landing should feel like a food editorial/product story.

---

# 14. Hero — LOCKED DIRECTION

The hero must communicate Flemme in one glance.

Primary message:

> **Buka kulkas, bukan kebingungan.**

Supporting concept:

```text
Tell Flemme what you have.
We’ll figure out what you can cook.
Then cook it together, step by step.
```

Primary CTA:

```text
Start Cooking
```

Secondary CTA:

```text
See How It Works
```

## Desktop composition direction

```text
ABOUT      DISCOVER      PRICING           FLEMME.         GET STARTED


     Buka kulkas,
     bukan
     kebingungan.                ┌─────────────────────┐
                                 │                     │
 Tell Flemme what you have.      │  FOOD / INGREDIENT  │
 We'll figure out what           │     COMPOSITION     │
 you can cook tonight.           │                     │
                                 └─────────────────────┘

 [ START COOKING ]    SEE HOW IT WORKS


 ✦ YOUR INGREDIENTS   ✦ YOUR KITCHEN   ✦ YOUR TASTE   ✦ YOUR PEOPLE
```

The right-side hero visual should **not** be a generic dashboard screenshot.

Preferred visual ingredients:

- illustrated ingredients,
- plate/pan composition,
- herbs,
- kitchen utensils,
- one or two small recipe UI fragments,
- hand-drawn decorative elements,
- optional Flemme character/mascot if available.

The visual should communicate:

```text
food
+
playfulness
+
helpfulness
```

before it communicates software.

---

# 15. Brand Ticker / Transition Strip

Use a horizontal statement strip as a visual transition.

Example copy:

```text
WHAT'S IN YOUR FRIDGE?
✦
LET'S COOK
✦
NO MORE “MAKAN APA YA?”
✦
COOK WHAT YOU HAVE
```

Implementation:

- orange/ink/lime background depending surrounding sections,
- short repeated statements,
- optional subtle motion,
- respect reduced-motion,
- do not animate aggressively.

---

# 16. Discover — LOCKED CONCEPT

Discover is an important public-facing Flemme concept.

Avoid making it look like a generic recipe marketplace.

Preferred headline direction:

```text
Discover what you can cook.
```

Possible expressive copy:

```text
9,628 things you could cook.
```

or:

```text
What's cooking?
Thousands of ideas and counting.
```

If a number is shown, it must come from real data.

Do not hardcode fake production metrics.

Safe fallback:

```text
Discover thousands of recipes
```

Supporting copy may say:

```text
Recipes generated and personalized by Flemme.
```

## Discover grid

Prefer editorial asymmetry over uniform e-commerce cards.

Example direction:

```text
┌───────────────┐ ┌──────────────────────┐
│ Nasi Goreng   │ │                      │
│   IMAGE       │ │   Ayam Kecap         │
│  18 min       │ │      IMAGE           │
└───────────────┘ │                      │
                  └──────────────────────┘

        ┌────────────────┐
        │ Pasta Sambal   │
        │     IMAGE      │
        └────────────────┘
```

Rules:

- varied card scale is allowed,
- keep grid readable,
- avoid random masonry chaos,
- content hierarchy must stay clear,
- mobile should collapse into a simple vertical rhythm.

---

# 17. About Flemme

Purpose:

explain what Flemme actually does.

Core message:

> **Your fridge already has ideas.**

Explain that Flemme considers:

- ingredients,
- kitchen equipment,
- food preferences,
- cooking preferences,
- household context.

Do not explain internal agent architecture.

Do not mention implementation details.

Keep the section product-first.

---

# 18. How Flemme Works

Avoid generic SaaS feature cards numbered 1–2–3.

Preferred flow:

```text
Tell us what you have
→ Pick a meal
→ Prepare
→ Cook together
→ Done 🔥
```

Alternative visual flow:

```text
What's in my kitchen?
↓
What can I cook?
↓
Prepare
↓
Cook step-by-step
↓
Finish + nutrition
```

This may be:

- a horizontal journey on desktop,
- a vertical sequence on mobile,
- illustrated with simple cooking symbols.

The section should feel like progression through an activity.

---

# 19. Personalization Section

Concept:

> **Personalized to your kitchen.**

Show that Flemme adapts to:

```text
Your ingredients
Your kitchen
Your taste
Your household
Your time
```

Possible visual treatment:

- ingredient stickers,
- small playful labels,
- editorial cards,
- simple doodles,
- one central composition.

Avoid making it look like an analytics dashboard.

---

# 20. Pricing Direction

Pricing should feel consumer-friendly.

Avoid:

- enterprise SaaS pricing tables,
- dense feature matrices,
- corporate comparison grids.

Preferred:

- 2–3 large pricing cards,
- clear difference between plans,
- strong CTA,
- retro color-block treatment,
- simple feature summary.

Pricing hierarchy should remain understandable before decorative styling.

---

# 21. Final CTA

Preferred tone:

```text
Still wondering what to cook?
Open your fridge.
```

Primary CTA:

```text
Let Flemme cook with you
```

or:

```text
Start Cooking
```

This section may use a strong Ink background with Orange/Cream text and one oversized display line.

---

# 22. Illustration Direction

Use:

- food doodles,
- flames,
- utensils,
- ingredients,
- leaves,
- sparkles,
- plate/pan motifs,
- simple hand-drawn shapes.

Illustrations should feel:

- simple,
- expressive,
- hand-drawn,
- not overly polished,
- not photorealistic.

Avoid:

- AI robots,
- futuristic holograms,
- generic gradient blobs,
- random abstract 3D objects,
- corporate isometric illustration.

---

# 23. Food Photography

If food photography is used:

- prioritize appetizing natural photography,
- use editorial framing,
- thick border is allowed,
- slight rotation is allowed,
- offset shadow is allowed,
- use sparingly.

Do not tilt every card.

Food remains the focus.

---

# 24. Motion Rules

Motion should support personality and interaction.

Good:

- button press feedback,
- subtle marquee,
- short section entrance,
- small card lift,
- recipe card selection,
- subtle illustration motion.

Avoid:

- constant floating,
- heavy parallax,
- slow reveal animations,
- animations that delay access,
- motion on every decorative element.

Respect:

```text
prefers-reduced-motion
```

---

# 25. Mobile-First Rules

Flemme remains mobile-first.

Design at the smallest meaningful viewport first.

Minimum target:

```text
390px
```

Mobile priorities:

- readable headline,
- clear CTA,
- comfortable tap target,
- no tiny metadata,
- no hover-only interaction,
- no desktop grid squeezed into mobile,
- no excessive horizontal scroll,
- no overcrowded navbar.

Desktop may become more editorial and asymmetric.

Mobile must remain straightforward.

---

# 26. Shared Product Consistency

The public landing can be expressive.

However, these visual primitives should remain reusable later:

- Button,
- Input,
- Badge,
- Card,
- Container,
- SectionHeading,
- Logo,
- typography tokens,
- colors,
- radius scale,
- border scale,
- shadow scale.

Do not create landing-specific primitives if the same concept can be a general Flemme primitive.

At the same time:

do not force every `/app` screen to inherit the landing page’s decorative density.

Shared system ≠ identical composition.

---

# 27. Anti-Slop Rules

This section is mandatory for coding agents.

## 27.1 Do not invent design

Do not randomly add:

- gradients,
- blobs,
- glass cards,
- noise textures,
- random emoji,
- arbitrary colors,
- unapproved fonts,
- unapproved shadows,
- decorative icons everywhere.

If a visual treatment is not supported by this context, keep it simple.

---

## 27.2 Do not make it “AI SaaS”

Reject patterns such as:

```text
gradient hero background
AI sparkle icon
chatbot mockup
purple-blue glow
feature card grid
"Powered by AI" hero badge
generic dashboard screenshot
```

Flemme is a cooking brand.

---

## 27.3 Do not over-componentize

Do not create one React component for every text block.

Create components when there is:

- reuse,
- real composition boundary,
- independent responsive behavior,
- meaningful responsibility.

A section component is valid.

A component just to render three lines of static text usually is not.

---

## 27.4 Do not overbuild the design system

Do not create:

- a standalone design-system package,
- dozens of token categories,
- complex variant infrastructure,
- theme abstraction for hypothetical future brands.

Keep tokens inside `apps/web` until reuse actually requires extraction.

---

## 27.5 Do not rewrite working product architecture

Landing implementation must not redesign:

- Auth,
- Better Auth integration,
- onboarding behavior,
- cooking APIs,
- product domain contracts,
- route guards.

Public marketing work is not a backend task.

---

## 27.6 Do not make routes monolithic

Routes should orchestrate.

Preferred:

```tsx
function LandingRoute() {
  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <BrandTicker />
      <DiscoverSection />
      <AboutSection />
      <HowItWorksSection />
      <PersonalizationSection />
      <PricingSection />
      <FinalCTASection />
      <LandingFooter />
    </>
  );
}
```

Do not put the entire landing page into a 1000-line route component.

---

## 27.7 Do not use random Tailwind values everywhere

Avoid repeated arbitrary values such as:

```text
mt-[73px]
rounded-[29px]
shadow-[7px_9px_0_...]
text-[67px]
```

unless they are part of a deliberate shared token.

Prefer:

- CSS variables,
- reusable utility classes,
- shared composition primitives,
- consistent spacing scale.

A small number of deliberate editorial exceptions is acceptable.

---

## 27.8 Do not fake data

Never hardcode fake claims such as:

```text
9,628 recipes
100k users
4.9 rating
10,000 meals cooked
```

unless real data exists.

Use non-numeric copy until real metrics are available.

---

## 27.9 Do not write filler marketing copy

Avoid generic wording such as:

```text
Revolutionize your cooking experience.
Unlock the power of AI.
Transform your culinary journey.
Next-generation intelligent cooking.
```

Copy should sound simple, human, and food-first.

Preferred:

```text
Buka kulkas, bukan kebingungan.

Tell us what you have.
We'll help you figure out what to cook.

Cook what you have.
Make it yours.
```

---

# 28. Component Ownership

Recommended responsibility split:

```text
components/ui
→ reusable visual primitives

components/shared
→ reusable cross-page composition

components/landing
→ public landing composition only

features/*
→ domain/product behavior

routes/*
→ route orchestration
```

Landing-specific components may include:

```text
landing-navbar.tsx
hero-section.tsx
brand-ticker.tsx
discover-section.tsx
about-section.tsx
how-it-works-section.tsx
personalization-section.tsx
pricing-section.tsx
final-cta-section.tsx
landing-footer.tsx
```

Names may adapt to the real repository.

Inspect the current code before moving files.

Do not reorganize working code solely to match this example.

---

# 29. CSS / Token Direction

Define semantic variables before building polished UI.

At minimum:

```css
:root {
  --background: #F6EEDB;
  --foreground: #16352D;

  --primary: #E95B32;
  --primary-foreground: #F6EEDB;

  --accent-tomato: #C93627;
  --accent-mustard: #F4B73F;
  --accent-lime: #A9C958;
  --accent-lavender: #B9A1D6;
  --accent-pink: #E9A6A0;

  /* define shared radius, border, shadow and container tokens */
}
```

Exact naming can adapt to the existing shadcn/Tailwind setup.

Do not duplicate colors as unrelated hardcoded hex values throughout components.

---

# 30. Font Loading

Use:

```text
Calistoga
Shrikhand
Plus Jakarta Sans
```

Before implementation:

- confirm the current font loading strategy,
- use a production-safe source,
- avoid adding unnecessary font packages,
- ensure reasonable fallback stacks,
- avoid blocking rendering unnecessarily.

Do not swap the locked font family without explicit design approval.

---

# 31. Accessibility

Retro styling must not compromise usability.

Required:

- sufficient contrast,
- readable body sizes,
- visible focus states,
- keyboard-accessible navigation,
- meaningful labels,
- color not used as the only state signal,
- reduced-motion support,
- large enough tap targets.

Decorative font usage must never reduce critical readability.

---

# 32. Implementation Priority

Do not build the whole landing page in one uncontrolled pass.

Recommended sequence:

```text
W1 — inspect current apps/web structure
W2 — lock tokens + typography + shared primitive styling
W3 — implement landing IA skeleton
W4 — navbar + hero
W5 — discover + supporting sections
W6 — responsive + interaction polish
W7 — final acceptance
```

Each phase should be independently reviewable.

---

# 33. Agent Workflow

Before coding:

1. inspect current `apps/web`,
2. inspect existing components,
3. inspect current Tailwind/shadcn setup,
4. inspect existing route tree,
5. inspect auth/onboarding boundaries,
6. reuse existing primitives where reasonable,
7. identify only necessary changes.

After coding, report:

```text
Files added
Files changed
Existing primitives reused
New tokens introduced
Responsive decisions
Any deviations from this context
Build result
Typecheck result
Lint/Biome result
```

Do not silently make architectural deviations.

---

# 34. Definition of Done

The landing visual foundation is acceptable when:

- Calistoga is the main display typeface,
- Shrikhand is used only as a small accent,
- Plus Jakarta Sans owns UI/body text,
- the locked palette is used consistently,
- no generic AI/SaaS visual language appears,
- the hero communicates cooking immediately,
- navbar follows the consumer-brand structure,
- mobile navigation is not a compressed desktop navbar,
- Discover feels editorial rather than marketplace-like,
- sections use controlled color blocking,
- border/shadow usage is selective,
- spacing feels generous,
- mobile works from 390px,
- no horizontal overflow,
- focus states are visible,
- reduced motion is respected,
- public routes remain separate from `/app`,
- working auth/onboarding behavior is preserved,
- no fake metrics are introduced,
- build passes,
- typecheck passes,
- lint/Biome passes,
- `git diff --check` passes.

---

# 35. Final Design Principle

When choosing between:

```text
more decorative
```

and:

```text
more understandable
```

choose understandable.

When choosing between:

```text
generic polished SaaS
```

and:

```text
distinctive food-oriented Flemme
```

choose Flemme.

When choosing between:

```text
retro for decoration
```

and:

```text
retro as a coherent brand system
```

choose the coherent system.

The target is not “make it look retro”.

The target is:

> **Build a warm, groovy, highly recognizable cooking brand whose personality supports the cooking experience instead of distracting from it.**
