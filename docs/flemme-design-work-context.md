# Flemme — Design Work Context

> **Revision:** 2026-09-08 — Consolidated after Information Architecture review.
> **Status:** Product decisions below are confirmed. Low-fidelity wireframes are the next design deliverable.
> **Authority:** This consolidated document supersedes the earlier version of `flemme-design-work-context.md`. Proposed implementation details are explicitly labeled; they are not additional approved product scope.

> **Purpose:** This document is the source context for ChatGPT Work to produce the UX flow, screen inventory, low-fidelity layouts, states, and prototype direction for Flemme.
>
> **Important:** Do not redesign the product concept from scratch. Treat the rules in this document as the current product foundation. Your job is to translate them into a clear product design flow, identify missing states or UX conflicts, and propose improvements only when they preserve the core concept.

---

## 1. Product Overview

**Flemme** is an AI cooking companion that helps users decide what they can cook based on their current kitchen situation, household context, preferences, and available ingredients.

The core product promise is:

> **Open the fridge, not confusion.**

Flemme is not intended to be a generic AI chatbot that happens to know recipes.

The intended experience is:

```text
User Context
    +
Current Fridge / Inventory
    +
Current Cooking Intent
    ↓
Flemme Recommendation
    ↓
Choose Recipe
    ↓
Pre-Cooking Check
    ↓
Step-by-Step Cooking Session
    ↓
Inventory Reconciliation
    ↓
Cooking History
    ↓
Better Personalization
```

The AI is the intelligence layer.

The product UI should remain structured, actionable, and predictable.

---

# 2. Core Product Principles

## 2.1 Know Before Asking

The most important behavioral rule:

> **Flemme should ask the user only for information it cannot reasonably know from existing context.**

Before asking a question, Flemme should check:

```text
1. Current Session Context
2. Profile Context
3. Household Context
4. Kitchen Setup
5. Food / Cooking Preferences
6. Fridge / Inventory
7. Ask the user only if the information is genuinely missing
```

Example:

If the profile already says:

```text
Household:
- 2 adults
- 2 children
```

Flemme should not ask:

> “How many people are you cooking for?”

unless the user explicitly overrides the default for the current session.

Example override:

> “Tonight I’m only cooking for myself.”

Then:

```text
Profile default:
4 servings

Session override:
1 serving

Effective cooking context:
1 serving
```

Session context always has priority over profile defaults.

---

## 2.2 Use What the User Already Has First

When ingredients are missing, Flemme should not immediately tell the user to shop.

Priority:

```text
1. Try to satisfy the cooking intent using current inventory.
2. Suggest alternative recipes if possible.
3. Only suggest buying ingredients if:
   - no suitable alternative exists, or
   - the user explicitly wants the original recipe.
```

---

## 2.3 AI Suggests, UI Structures

LLM output should not be shown mainly as long conversational paragraphs.

The AI may reason internally, but the product should render structured UI such as:

- recipe recommendation cards
- ingredient availability status
- nutrition summary
- household suitability
- equipment requirements
- cooking steps
- timers
- missing ingredient lists
- resume cards
- inventory adjustments

Example:

```text
Ayam Kecap

35 min
~520 kcal
32g protein

✓ All required ingredients available
✓ Suitable for your household

[ View Recipe ]
```

---

## 2.4 Resume Intent, Refresh Context

Flemme should not depend on replaying an entire old conversation when the user returns later.

Instead:

> **Do not resume the conversation. Resume the user intent.**

For example:

```text
Cooking Draft

Recipe:
Carbonara

Servings:
4

Missing:
- Parmesan
- Bacon

Status:
WAITING_FOR_INGREDIENTS
```

When the user returns:

```text
Previous Intent
    +
Fresh Current Inventory
    ↓
Revalidate
    ↓
Continue
```

The intent may persist, while inventory and other context must be refreshed.

---

## 2.5 Flemme Accompanies Cooking

The product should support the user across the full cooking journey:

```text
Discover
→ Decide
→ Prepare
→ Cook
→ Finish
→ Update Fridge
→ Learn
```

Flemme is not only a recipe discovery app.

---

# 3. Primary Product Domains

The product is organized around five primary concepts.

## Profile

> **Who is the user and what is their default cooking situation?**

Contains persistent context such as:

- household
- kitchen equipment
- food preferences
- cooking preferences
- account settings

---

## Fridge

> **What does the user currently have?**

Contains:

- ingredient inventory
- approximate quantities
- ingredient condition
- purchase additions
- cooking consumption
- manual adjustments
- minimum “Need to Buy” list (MVP required for the shopping/resume journey)

---

## Cooking

> **What can the user cook with their current situation?**

Consumes:

```text
Profile Context
+
Fridge
+
Current Session Intent
```

Produces:

- recipe recommendations
- ingredient status
- missing ingredient alternatives
- recipe selection
- pre-cooking validation
- step-by-step cooking
- expected inventory usage

---

## History

> **What has the user cooked before?**

Used for:

- recently cooked meals
- favorites
- ratings
- cook again
- future personalization signals

---

## Budget

> **How are food purchases planned and how much is being spent?**

Budget is **not** a primary constraint for the core cooking recommendation flow.

Budget is more closely related to:

- ingredient purchases
- fridge replenishment
- spending awareness
- purchase planning
- optional future meal planning
- price history

---

# 4. High-Level Product Architecture

```text
                    PROFILE
                       │
                       ▼
                Default Context
                       │
                       │
FRIDGE ────────────────┼──────────────▶ COOKING
Current Ingredients    │               Session
                       │                  │
                       │                  ▼
                       │               HISTORY
                       │                  │
                       └──── Personalization

BUDGET
   │
   └──────────────▶ Purchasing / Fridge
```

Core loop:

```text
BUY
 ↓
FRIDGE
 ↓
COOK
 ↓
CONSUME
 ↓
HISTORY
 ↓
LEARN USER
 ↓
BETTER RECOMMENDATION
 ↓
COOK AGAIN
```

---

# 5. Onboarding

After registration, Flemme should gather enough context to reduce repetitive questions later.

Suggested onboarding flow:

```text
Register
   ↓
Welcome / Intro
   ↓
Who do you usually cook for?
   ↓
Household setup
   ↓
Kitchen equipment
   ↓
Food preferences
   ↓
Initial ingredients / fridge
   ↓
Home
```

Keep onboarding concise.

Do not turn onboarding into a long settings form.

---

## 5.1 Household Setup

Suggested first question:

```text
Who do you usually cook for?

○ Myself
○ Partner
○ Family
○ Other
```

If family:

```text
Adults       [-] 2 [+]
Children     [-] 2 [+]
Toddlers     [-] 0 [+]
```

Detailed profiles for each household member may be optional or future scope.

---

## 5.2 Kitchen Setup

Example equipment:

```text
☑ Gas stove
☐ Induction stove
☑ Rice cooker
☑ Air fryer
☐ Oven
☑ Blender
☐ Microwave
```

For MVP, prioritize information that materially affects recipe feasibility.

---

## 5.3 Food Preferences

Examples:

- preferred cuisine
- spicy level
- disliked foods
- simple dietary preferences
- preferred cooking duration

Do not over-expand into a medical or clinical nutrition profile.

---

## 5.4 Initial Fridge Setup

Avoid forcing the user to enter every ingredient manually.

Use natural language.

Example:

```text
What do you currently have in your kitchen?

┌──────────────────────────────────────┐
│ I have one whole chicken, around     │
│ 10 eggs, onions, chili, soy sauce,   │
│ and rice.                            │
└──────────────────────────────────────┘

[ Skip for now ]              [ Continue ]
```

AI parses the input:

```text
Chicken          1 whole
Eggs             ~10
Onion            available
Chili            available
Soy sauce        available
Rice             available
```

Then confirm:

```text
[ Edit ]
[ Looks Good ]
```

Rule:

> **AI parses → user confirms → database updates.**

Never silently write uncertain AI parsing directly to inventory.

---

# 6. Context Model

There are two important types of context.

## 6.1 Persistent Context

Stored in Profile.

Examples:

```text
Household
Kitchen equipment
Taste preferences
Cooking habits
```

---

## 6.2 Session Context

Applies only to the current cooking session.

Examples:

```text
“Tonight I’m only cooking for myself.”

“I only have 20 minutes.”

“I don’t want anything spicy tonight.”

“I don’t want to fry anything.”
```

Effective context:

```text
Profile Defaults
      +
Current Inventory
      +
Current Session Request
      ↓
Effective Cooking Context
```

Priority:

```text
Session Request > Profile Default
```

A temporary cooking situation should not force the user to edit Profile.

---

# 7. Home

Home should center around one primary question:

> **What do you want to cook today?**

Suggested structure:

```text
Hello Tiara 👋
What do you want to cook today?

┌────────────────────────────────┐
│ Ask Flemme...                  │
│                            ➜   │
└────────────────────────────────┘

[ 🧊 Cook from my fridge ]
[ ⏱ Under 30 minutes ]
[ 👨‍👩‍👧 For my family ]
[ ✨ Surprise me ]
```

Below this, Home may show useful snapshots such as:

- fridge condition
- budget summary only in a later release when Budget is usable
- recent cooking
- expiring ingredients
- pending cooking intent

Do not turn Home into a traditional dashboard full of unrelated metrics.

---

# 8. Quick Start Suggestions

Quick Start is **not a separate menu**.

It should appear as suggestion badges/chips directly under the primary prompt input.

Examples:

```text
[ 🧊 Cook from my fridge ]
[ ⏱ Under 30 minutes ]
[ 👨‍👩‍👧 For my family ]
[ ✨ Surprise me ]
```

These badges should act as shortcuts to cooking intents.

---

## 8.1 Dynamic Suggestions

Quick Start may become contextual.

Example Fridge state:

```text
Spinach      nearly expired
Eggs         plenty available
Chicken      stored for 2 days
```

Possible dynamic suggestions:

```text
[ 🥬 Use the spinach first ]
[ 🍳 Make something with eggs ]
[ 🧊 Cook from my fridge ]
```

Resume intent can also appear as a contextual suggestion:

```text
[ 🍝 Continue Carbonara ]
```

This should make the Home screen feel aware of the user’s actual kitchen situation.

---

# 9. Cooking Discovery Flow

Example user intent:

> “I want to cook using what I already have.”

Flemme reads:

```text
Profile
Household
Kitchen Setup
Food Preferences
Fridge
Session Request
```

Then generates structured recipe recommendations.

Target recommendation count for MVP (show fewer if fewer recipes are viable; never invent feasibility to fill three cards):

```text
3 recipes
```

Example card:

```text
Ayam Kecap

35 min
~520 kcal
32g protein

✓ All ingredients available
✓ Suitable for your household

Why this fits:
Uses ingredients already in your fridge.

[ View Recipe ]
```

Avoid presenting the recommendations only as conversational text.

---

# 10. Missing Ingredient Flow

There are three primary cases.

## Case A — Everything Is Available

```text
✓ All required ingredients are available.

You can start preparing this recipe.
```

---

## Case B — Ingredients Are Missing, But Alternatives Exist

Example:

User wants Carbonara.

Missing:

```text
Parmesan
```

Flemme should say that the requested recipe is incomplete, then prioritize feasible alternatives.

Example:

```text
You’re missing parmesan for Carbonara.

But with what you currently have, you can make:

• Creamy Egg Pasta
• Garlic Butter Pasta
• Aglio e Olio
```

Possible actions:

```text
[ Choose an alternative ]
[ I still want Carbonara ]
```

---

## Case C — User Still Wants the Original Recipe

If the user insists:

```text
You still need:

• Parmesan
• Bacon

Everything else is already available.
```

Possible actions:

```text
[ Add to Need to Buy ]
[ Choose another recipe ]
```

---

# 11. Shopping / Need to Buy

The minimum **Need to Buy** experience is **MVP REQUIRED** because it supports the approved missing-ingredient and resume journey.

It lives inside Fridge:

- Inventory
- Need to Buy

Minimum functionality:

1. Save missing ingredients associated with a cooking intent.
2. Show what is still needed for the selected recipe and servings.
3. Let the user record purchased ingredients and review quantities.
4. Update Fridge only after the user confirms **Add to Fridge**.
5. Offer to resume the saved intent and revalidate against current context.

Adding an item to Need to Buy does not mean it has been purchased. Purchasing only some items must leave the others outstanding. Price entry is optional and belongs to the later Budget integration; it must not block the core purchase-to-Fridge flow.

Adding to Need to Buy also does not mean the user is leaving the kitchen. Show departure safety microcopy when the user explicitly chooses to go shopping.

Store selection, multi-store shopping, delivery integration, route planning, and price comparison remain outside MVP scope.

---

# 12. Safety Microcopy Before Shopping

When the user decides to leave and buy missing ingredients, Flemme should show warm safety-oriented microcopy.

If cooking has already started:

> **“Jangan lupa matikan kompor ya, hati-hati di jalan!”**

English meaning:

> “Don’t forget to turn off the stove, and be careful on the way!”

If cooking has not started yet, use a more contextually accurate version:

> **“Pastikan dapur aman sebelum pergi ya. Hati-hati di jalan!”**

This is part of Flemme’s personality:

- warm
- attentive
- helpful
- not robotic
- not overly verbose

---

# 13. Resume vs Restart

Flemme uses a hybrid approach.

Do not:

```text
Resume the entire old conversation blindly.
```

Do not:

```text
Force the user to start from zero.
```

Instead:

```text
Resume Intent
+
Refresh Current Context
```

Example stored cooking draft:

```text
Recipe:
Carbonara

Servings:
4

Missing ingredients:
- Parmesan
- Bacon

Status:
WAITING_FOR_INGREDIENTS
```

When the user returns:

```text
Welcome back 👋

Still want to continue Carbonara?

Previously needed:
✓ Parmesan
✓ Bacon

[ Continue Carbonara ]
[ Find another recipe ]
```

Before continuing:

```text
Re-read current inventory
        ↓
Revalidate ingredients
        ↓
Continue if valid
```

---

# 14. Planning Session vs Active Cooking Session

## Planning Intent

Includes recommendations, recipe selection, missing ingredients, shopping, and pre-cooking preparation. Preserve the intent across visits and refresh current context before continuing.

## Active Cooking Session

Begins when the user selects **Start Cooking** and executes cooking steps.

**Confirmed rule: only one active cooking session per user at a time.**

Closing the browser, navigating away, losing connectivity, or disappearing for an unknown reason must not automatically complete or discard the session. Save progress whenever a meaningful change occurs; do not depend on a browser-close event.

When the user returns to an unfinished cooking session, show:

> **Masih mau lanjut masak Ayam Kecap?**
> Terakhir kamu berada di langkah 4 dari 8.
>
> **[Lanjutkan memasak] [Mulai baru]**

- **Lanjutkan memasak:** restore the saved recipe and progress, refresh relevant context, and confirm the current condition of the dish when the interruption is substantial or uncertain.
- **Mulai baru:** end the previous active session, offer reconciliation for ingredients already used or wasted, and then create a new intent.
- If the user enters another cooking intent while a session is active, resolve the existing active session before starting another.

Refreshing context must not silently regenerate the recipe, reset progress, or treat already-consumed ingredients as newly missing. Distinguish remaining ingredient needs from usage already recorded in the active session.

The exact threshold for a long interruption remains an implementation/product detail to define. Do not invent a fixed timeout or automatically mark a dish finished.

## Persistence Decision

The earlier browser-only recovery approach has been superseded:

| Component | Confirmed responsibility |
| --- | --- |
| PostgreSQL | Authoritative persistent session, cooking progress, and reconciliation status |
| Redis | Cache for active-session context; recoverable from PostgreSQL |
| BullMQ | Background jobs that require a queue or retries |
| Browser storage | Local progress backup when connectivity is interrupted |

Redis and BullMQ are both part of the selected architecture. Every step transition does not need a BullMQ job. Concrete background job types will be selected when their requirements exist; selecting BullMQ does not add reminders or notifications to MVP scope.

Progress is saved directly through the API to PostgreSQL, followed by Redis cache update/invalidation. Browser data is a backup, not the source of truth. A missing Redis cache must not make a durable session disappear.

Server-synced progress can be restored after login on another device or after browser storage is cleared. Unsynced local changes are recoverable only where that local data remains available. See Section 44 for implementation guidance.

---

# 15. Recipe Detail / Pre-Cooking

Use **one preparation screen** for recipe detail and pre-cooking checks. They are stages of the same flow and do not require separate routes.

Show:

- Recipe name and why it fits.
- Effective household/servings and optional session controls.
- Estimated cooking duration.
- Required ingredients, quantities, and availability or uncertainty.
- Required equipment and availability.
- Estimated nutrition, clearly labeled per serving.
- **Start Cooking** as the primary action.

Expose context as an editable summary, for example:

> Untuk 4 orang · Tidak pedas · Maks. 30 menit — **Ubah**

Changing servings updates ingredient requirements. Session adjustments do not modify Profile defaults.

Validate the latest ingredient and equipment context before active cooking starts. When something changes, explain the difference and resolve it before proceeding.

---

# 16. Active Cooking Experience

This is one of Flemme’s main differentiators.

Do not show the entire recipe as one large static instruction page.

Use one-step-at-a-time cooking.

Example:

```text
Step 2 of 8

Heat the oil.

Add approximately 2 tbsp of oil
to the pan and heat over medium heat.

⏱ About 1 minute

[ Need help? ]

[ Done → ]
```

Then:

```text
Step 3 of 8

Add sliced onions.

Sauté until slightly softened.

[ Start Timer 02:00 ]

[ Done → ]
```

AI should be available as an assistant for unexpected problems.

Examples:

> “My oil is too hot.”

> “I don’t have sweet soy sauce.”

> “My onions are burning.”

But the core cooking UI should remain deterministic and structured.

---

# 17. Cooking Completion

After the final step:

```text
🎉 Done!

Ayam Kecap
35 minutes

How was it?

😕 😐 🙂 😋 🤩

[ ♡ Save Favorite ]
```

Then proceed to inventory reconciliation.

---

# 18. Inventory Reconciliation

Each recipe has an expected ingredient usage.

Example:

```text
Chicken         -500 g
Shallots        -6
Chili           -3
Soy sauce       -40 ml
```

At cooking completion:

```text
Inventory will be updated:

Chicken         -500 g
Shallots        -6
Chili           -3
Soy sauce       -40 ml

Anything unexpected happen?

[ + Ingredient damaged / wasted ]
[ + Usage was different ]
[ Looks Correct ]
```

Do not blindly deduct stock without giving the user an opportunity to reconcile.

---

# 19. Unexpected Inventory Events

Users should be able to record events outside expected recipe usage.

Examples:

```text
Eggs
-2

Reason:
Broken
```

or:

```text
Spinach
Removed

Reason:
Expired
```

Possible reasons:

```text
Broken
Expired
Spoiled
Thrown away
Used outside Flemme
Other
```

Internally, inventory changes may conceptually come from:

```text
Purchase
Cooking
Adjustment
```

The UI should use human language rather than ERP terminology.

---

# 20. Fridge / Inventory

Fridge represents the **current kitchen ingredient state**.

Example:

```text
🥩 Chicken
1 whole
Bought 2 days ago

🌶 Chili
~200 g

🧅 Shallots
~½ kg
```

Inventory does not need accounting-level precision.

Approximate quantities are acceptable.

Examples:

```text
1 whole
~200 g
half a pack
plenty
a little
unknown
```

The experience should feel practical rather than administrative.

---

# 21. Add Ingredient Flow

Natural-language input is encouraged.

Example:

> “I bought one whole chicken, 250 grams of chili, and half a kilo of shallots.”

Flemme parses:

```text
Chicken
1 whole

Chili
250 g

Shallots
500 g
```

Then:

```text
[ Edit ]
[ Add to Fridge ]
```

Rule remains:

> AI parses → user confirms → inventory updates.

---

# 22. Inventory Activity

A lightweight recent changes view may show:

```text
Recent Changes

🍗 Chicken
Used for Ayam Kecap
-500 g

🥚 Eggs
2 broken
-2

🥬 Spinach
Expired
Removed
```

This helps the user understand why inventory changed.

---

# 23. History

History should be more than an archive.

Example:

```text
Ayam Kecap
Yesterday
★★★★★
♡ Favorite

[ Cook Again ]
```

History may later help personalization by learning patterns such as:

- frequently cooked dishes
- repeated ingredients
- ratings
- favorites
- cooking frequency

Example future recommendation:

> “You liked Ayam Kecap last time, so here is a similar Ayam Mentega recipe using what you already have.”

Do not overbuild personalization logic in the first design pass, but design History so it can support this loop later.

---

# 24. Budget

**Scope: complementary later module; excluded from the initial four-tab release.** The examples in Sections 24–26 preserve future design direction and do not add launch requirements.

Budget is a complementary product area.

It is not the primary input for normal cooking recommendations.

Mental model:

> **Budget helps users understand and plan what enters the kitchen.**

Primary relationships:

```text
Budget
   ↓
Food Spending
   ↓
Purchase Planning
   ↓
Fridge
```

Example:

```text
This Week’s Food Budget

Rp500,000

Used
Rp210,000

Remaining
Rp290,000
```

Flemme may inspect current inventory:

```text
Chicken     enough
Rice        running low
Eggs        low
Vegetables  low
```

and suggest:

```text
Purchase priorities:

• Rice
• Eggs
• Vegetables

Estimated:
Rp90k – Rp130k
```

---

# 25. Budget + Purchase Input

One user action may update multiple areas.

Example user input:

> “I bought one chicken for 48k, chili for 20k, and eggs for 30k.”

Flemme parses:

```text
Chicken
+1 whole
Rp48,000

Chili
+
Rp20,000

Eggs
+
Rp30,000

Total
Rp98,000
```

After confirmation:

```text
Update Fridge
+
Update Budget
+
Update Price History
```

This should feel like one natural kitchen action, not three separate bookkeeping tasks.

---

# 26. Regional Price Problem

Flemme should not pretend to know exact local market prices across all regions.

Avoid false precision.

Bad:

```text
Chicken price:
Rp48,237
```

Prefer:

```text
Estimated:
Rp45k – Rp55k
```

Possible future price source hierarchy:

```text
1. User’s own purchase history
2. User manually supplied prices
3. Regional estimates
4. Future external integrations
```

Over time, Flemme may learn the prices that this specific user commonly pays.

Example:

```text
Chicken purchase history

Aug 20   Rp47k
Aug 29   Rp49k
Sep 8    Rp48k

Typical:
~Rp47k–Rp50k
```

For early product design, price estimates should be presented as approximate ranges rather than guaranteed current market prices.

---

# 27. Bottom Navigation

**Confirmed initial navigation: four tabs.**

| Tab | Purpose |
| --- | --- |
| Home | Cooking intent, suggestions, kitchen snapshot, resume |
| History | Past meals, ratings, favorites, Cook Again |
| Fridge | Inventory, Need to Buy, ingredient additions and adjustments |
| Profile | Household, kitchen, preferences, account settings |

Use labels with icons. Cooking is a flow, not a permanent navigation tab.

**Budget is not a tab in the initial release.** It remains a complementary area connected to purchases and Fridge/Inventory. Do not display an empty Budget tab or nonfunctional Budget summary.

The future entry point for Budget can be designed when that module is implemented; do not assume a fifth permanent tab is already approved.

---

# 28. Suggested Home Information Hierarchy

Home should center on the primary cooking prompt and relevant kitchen context.

Default order:

1. Greeting and primary prompt.
2. Quick Start suggestion badges directly below the prompt.
3. Fridge snapshot and relevant ingredient attention states.
4. Pending planning intent or inventory reconciliation when applicable.
5. Recently cooked meals.

When an unfinished active cooking session exists, prioritize its **Continue / Start New** prompt so the user does not accidentally start a second session. A planning intent may use a lighter resume card or chip.

Example initial Home content:

> Hello Tiara 👋
> What do you want to cook today?
>
> **[Ask Flemme…]**
>
> [Cook from my fridge] [Under 30 min] [Surprise me]
>
> **Your Kitchen** — 12 ingredients · 3 need attention
>
> **Recently Cooked** — Ayam Kecap · Yesterday

Budget content is deferred until that complementary module is usable. Do not turn Home into a general metrics dashboard.

---

# 29. Product Personality

Flemme should feel:

- warm
- practical
- observant
- supportive
- concise
- familiar without being intrusive

Avoid:

- overly robotic language
- long AI monologues
- unnecessary confirmations
- repetitive questions
- excessive motivational copy
- patronizing language

Flemme should feel intelligent primarily because it remembers useful context and reduces friction.

---

# 30. Product Scope Guardrails

For the first design cycle, avoid expanding Flemme into:

- grocery marketplace
- food delivery app
- full accounting / expense tracker
- ERP inventory system
- social network
- generic chatbot
- medical diet platform
- restaurant discovery app
- complex recipe publishing platform

The focus remains:

```text
Context-aware cooking
+
Practical inventory
+
Step-by-step cooking
+
Lightweight planning
```

---

# 31. Existing Sketch Direction

Existing Flemme sketches will be provided separately as visual references.

Preserve the overall direction unless a UX problem requires adjustment:

- mobile-first
- clean
- minimal
- warm
- rounded cards
- prominent main prompt
- suggestion badges below prompt
- clear bottom navigation
- strong whitespace
- AI assistant personality without turning every screen into chat

The sketches are conceptual references, not final layouts.

---

# 32. Required Design Deliverables

Produce the design in multiple passes.

Do not jump directly to polished high-fidelity screens.

---

## Pass 1 — Information Architecture (Initial Review Completed)

Create:

1. product sitemap
2. primary navigation
3. relationship between Profile, Fridge, Cooking, History, and Budget
4. persistent vs session context map
5. major entry points into Cooking

Highlight any conceptual conflicts before continuing.

---

## Pass 2 — Complete User Flows (Initial Mapping Completed; Refine During Wireframing)

Create flows for:

### Onboarding

```text
Register
→ Household
→ Kitchen
→ Preferences
→ Initial Fridge
→ Home
```

### Primary Cooking

```text
Home
→ Cooking Intent
→ Context Retrieval
→ Recipe Recommendations
→ Recipe Detail
→ Pre-Cooking
→ Active Cooking
→ Completion
→ Inventory Reconciliation
→ History
```

### Missing Ingredient

```text
Recipe Intent
→ Missing Ingredients
→ Alternative Recipes
→ User Decision
→ Need to Buy if required
```

### Resume Intent

```text
Waiting for Ingredients
→ User Leaves
→ Fridge Changes
→ User Returns
→ Intent Resumed
→ Context Refreshed
→ Revalidation
→ Continue
```

### Fridge

```text
Fridge
→ Add Ingredient
→ AI Parsing
→ Confirmation
→ Inventory Update
```

### Inventory Adjustment

```text
Fridge / Cooking Completion
→ Unexpected Event
→ Ingredient
→ Quantity
→ Reason
→ Confirm
```

### Budget

Future complementary flow, outside the initial release:

```text
Budget Overview
→ Purchase / Planning
→ Add Purchased Ingredients
→ Fridge + Budget Update
```

### History

```text
History
→ Cooking Detail
→ Rating / Favorite
→ Cook Again
```

---

# 33. Required Screen Inventory

Use the consolidated priority labels in Section 45.4. The candidate list below includes future Budget surfaces and does not make every item a launch requirement.

Identify every screen required for the first usable product.

At minimum evaluate the need for:

- Login
- Register
- Onboarding Welcome
- Household Setup
- Kitchen Setup
- Food Preferences
- Initial Fridge Setup
- AI Ingredient Parse Confirmation
- Home
- Cooking Recommendation
- Missing Ingredient State
- Alternative Recipe State
- Need to Buy
- Recipe Detail
- Pre-Cooking Check
- Active Cooking Step
- Timer State
- Cooking Help / AI Assistance
- Interrupted Cooking
- Cooking Complete
- Inventory Reconciliation
- Unexpected Ingredient Event
- Fridge Inventory
- Add Ingredient
- Ingredient Detail
- Fridge Recent Changes
- History
- History Detail
- Budget Overview
- Purchase Entry
- Profile
- Household Settings
- Kitchen Settings
- Food Preference Settings

Do not assume every item must become a separate route.

Group screens when a sheet, modal, drawer, or in-flow state is more appropriate.

---

# 34. Required State Coverage

For each major flow, identify:

- default
- loading
- empty
- success
- error
- partial data
- interrupted
- offline or failed AI request where relevant
- uncertain AI parsing
- stale context
- changed inventory
- missing ingredient
- unavailable equipment
- no viable recipe

Particularly inspect:

## Recommendation

```text
All ingredients available
One ingredient missing
Several ingredients missing
No suitable recipe
Inventory quantity uncertain
Kitchen equipment mismatch
```

## Resume

```text
All missing ingredients now available
Still missing ingredients
Inventory changed unexpectedly
Recipe no longer viable
User wants another recipe
Intent is old/stale
```

## Active Cooking

```text
Normal step
Timer running
Timer finished
Need AI help
Ingredient substitution
Interrupted session
Abandoned session
```

---

# 35. UX Questions the Design Must Answer

The design should clearly resolve these questions:

1. How does Flemme know who the user is cooking for?
2. How does Flemme know which kitchen equipment is available?
3. How does Flemme know which ingredients are currently available?
4. How are uncertain quantities represented?
5. What happens when ingredients are missing?
6. When does Flemme suggest alternatives instead of shopping?
7. How does a user insist on the original recipe?
8. Where does “Need to Buy” live?
9. What happens when the user leaves to buy ingredients?
10. How does Flemme resume the previous cooking intent?
11. When must inventory be refreshed before continuing?
12. What happens if the cooking session itself is interrupted?
13. How does the user move from recommendation to active cooking?
14. What information is shown before cooking starts?
15. How does step-by-step cooking work?
16. How does AI assistance coexist with structured cooking steps?
17. How is inventory reduced after cooking?
18. How are broken, expired, spoiled, or wasted ingredients recorded?
19. How does cooking history improve the future experience?
20. How does Budget relate to purchases and Fridge without becoming an expense-tracking app?

---

# 36. Critical Interaction Rules

Use these as explicit design constraints.

### Rule A

Do not ask for information that is already available in context.

### Rule B

Session context may override profile defaults without modifying Profile.

### Rule C

Use existing inventory before recommending shopping.

### Rule D

If shopping is required, preserve the cooking intent.

### Rule E

On resume, re-read current context instead of trusting stale inventory.

### Rule F

Cooking instructions should be one step at a time.

### Rule G

Inventory updates after cooking must allow reconciliation.

### Rule H

AI-generated structured data should be confirmed when uncertainty can affect persistent user data.

### Rule I

Budget should remain complementary and inventory-oriented.

### Rule J

Do not expand MVP scope without clearly identifying the tradeoff.

---

# 37. Design Priorities

When tradeoffs are necessary, prioritize in this order:

```text
1. Core Cooking Flow
2. Context Accuracy
3. Fridge / Inventory Flow
4. Missing Ingredient + Resume Flow
5. Cooking Completion / Reconciliation
6. Onboarding / Profile
7. History
8. Budget
9. Shopping convenience enhancements
```

If the design effort must be reduced, preserve the first six areas before expanding secondary features.

---

# 38. MVP vs Optional Design

Clearly label proposed screens or interactions as one of:

```text
MVP REQUIRED
MVP OPTIONAL
POST-MVP
```

Do not silently treat every idea as required for launch.

Potentially optional for the first implementation:

- shopping convenience beyond the required minimum Need to Buy flow
- sophisticated budget planning
- detailed household member profiles
- advanced price prediction
- advanced inventory expiry intelligence
- complex personalization from history

However, design the architecture so these can be added without breaking the primary flows.

---

# 39. Output Style Requested From ChatGPT Work

Produce outputs that are easy for a developer to implement.

Prefer:

- flow diagrams
- screen trees
- clear state transitions
- low-fidelity wireframes
- component descriptions
- explicit actions
- explicit entry and exit points
- clear edge-case notes

Avoid vague design language such as:

> “Create an engaging and delightful experience.”

Instead specify:

```text
Home
Primary action:
Prompt input

Secondary actions:
Dynamic quick-start badges

Resume state:
Show a contextual “Continue Carbonara” chip when an active planning intent exists.
```

---

# 40. Final Expected Work Output

At the end of the design process, provide:

## A. Product Sitemap

One complete map.

## B. Primary User Flow

From onboarding through first completed cooking session.

## C. Cooking Flow

Including recommendations, missing ingredients, recipe selection, pre-cooking, active cooking, and completion.

## D. Resume Flow

Including shopping interruption and fresh-context validation.

## E. Fridge Flow

Inventory, adding ingredients, adjustments, and recent changes.

## F. Budget Flow

Complementary future flow, kept lightweight and connected to purchasing / inventory. Not a blocker for the first four-tab release.

## G. History Flow

Including favorite, rating, and cook-again.

## H. Screen Inventory

Every required screen/state with an MVP priority label.

## I. Edge-Case Matrix

Key edge cases and how the UI responds.

## J. Low-Fidelity Wireframes

Mobile-first.

## K. Prototype Connection Map

Which screen/action leads to which next state.

## L. Design Risks / Open Questions

Only include questions that genuinely require a product decision.

Do not reopen decisions already explicitly defined in this document unless there is a serious contradiction.

---

# 41. Definition of Done for the Design Phase

The design is ready for development when a new developer can answer these questions from the design without guessing:

```text
Where does user context come from?

What is persistent vs temporary context?

How is a cooking intent created?

How does Flemme generate and display recommendations?

What happens when ingredients are missing?

How does shopping interrupt and resume the flow?

What happens before cooking starts?

How does active cooking progress?

What happens when cooking is interrupted?

How does inventory change after cooking?

How are unexpected ingredient losses handled?

How do Fridge, History, Profile, and Budget relate to Cooking?
```

The prototype should allow a complete simulated journey:

```text
Register
→ Onboarding
→ Home
→ Cooking Intent
→ Recommendation
→ Recipe
→ Pre-Cooking
→ Cooking
→ Completion
→ Inventory Update
→ History
```

And a secondary journey:

```text
Cooking Intent
→ Missing Ingredient
→ Need to Buy
→ Leave
→ Return
→ Resume Intent
→ Refresh Context
→ Continue Cooking
```

No major dead-end should exist in either journey.

---

# 42. Final Product Mental Model

Keep these definitions consistent throughout the design:

```text
Profile
= who the user is and their default household / kitchen context

Fridge
= what the user currently has

Cooking
= what the user can do with their current context

History
= what the user has done before

Budget
= how food purchases enter the kitchen and how spending is planned
```

And preserve the core Flemme product loop:

```text
BUY
 ↓
FRIDGE
 ↓
COOK
 ↓
CONSUME
 ↓
HISTORY
 ↓
LEARN
 ↓
BETTER RECOMMENDATION
```

---

# 43. Current Design Checkpoint and Next Instruction

Information Architecture and critical user flows have received an initial review. The user has confirmed:

1. Four initial tabs: Home, History, Fridge, Profile; Budget remains complementary to purchasing and inventory.
2. Minimum Need to Buy is required for the missing-ingredient and resume journey.
3. One active cooking session; returning users choose **Continue Cooking** or **Start New**.
4. PostgreSQL is authoritative for session progress, Redis caches active sessions, BullMQ supports background work, and browser storage is a local backup.

**Next deliverable: mobile-first low-fidelity wireframes.** Start with Home → Recommendations → Preparation → Active Cooking → Completion / Reconciliation, then connect Missing Ingredients → Need to Buy → Resume.

Preserve the architecture and product foundation. Do not restart product discovery, reopen these confirmed decisions, or jump directly to polished high-fidelity UI. Existing sketches remain visual references when provided; do not invent unseen sketch details.

---

# 44. Session Persistence and Recovery — Implementation Guidance

This section translates the confirmed storage responsibilities into implementation guidance. Field names, API routes, cache policy, synchronization strategy, and job types are not finalized schema or contracts.

## 44.1 Suggested Durable Session Data

- Session ID and owning user ID.
- Session lifecycle status.
- Selected recipe snapshot including generated instructions.
- Effective session overrides, such as servings.
- Current step and completed-step progress.
- Accepted ingredient substitutions or instruction changes.
- Last activity timestamp.
- Timer end timestamp and timer state when relevant.
- Expected usage, actual usage when known, and reconciliation status.
- Revision/version for detecting stale updates.

Preserve the recipe snapshot so reopening a session does not require regenerating different instructions from the LLM.

## 44.2 Normal Progress Save

1. User completes a step or makes another meaningful session change.
2. Frontend records a local backup associated with the user and session.
3. Frontend sends the change through the authenticated API.
4. API validates session ownership and current progress/version.
5. API saves the change in PostgreSQL.
6. API updates or invalidates the Redis cache.
7. Frontend records that progress is synced after a successful response.

Do not wait until the browser closes to save. A cache failure must not undo a successful database write or allow stale cached progress to replace the durable record.

## 44.3 Return and Resume

1. After authentication, look up the user's unfinished session.
2. Read current session data through the API, using a valid cache or PostgreSQL fallback.
3. Detect any unsynced local backup without blindly overwriting newer server data.
4. Show **Lanjutkan memasak / Mulai baru**.
5. On continuation, restore progress and review relevant changed context.
6. On starting new, end the prior session and offer reconciliation for partial usage.

Enforce the one-active-session rule on the server as well as in the UI so multiple tabs or devices cannot create conflicting active sessions. Exact conflict resolution remains to be designed; at minimum, stale updates must not silently overwrite newer progress.

## 44.4 Timers and Interruptions

Use a saved end timestamp to reconstruct elapsed time after returning. Do not depend on an in-memory browser countdown surviving closure. A finished timer does not prove that a cooking step or dish is finished.

Offline access can display previously loaded instructions and local progress. Show unsynced state where necessary. AI assistance requires connectivity; retain the current step if the request fails. Browser-background notifications are not promised by this design.

## 44.5 BullMQ Boundary

Use BullMQ when a defined background operation benefits from queueing or retry, for example an AI task if it is later designed as asynchronous work. These are candidate uses, not approved additional features.

Do not enqueue every step save, keep a worker waiting while a person cooks, or model the entire human cooking session as one long-running job. The application resumes sessions by reading persisted state.

## 44.6 Completion and Inventory

Cooking completion and inventory reconciliation are separate states. Preserve the cooking result even if the user has not yet confirmed usage.

- Offer reconciliation after normal completion and after ending a partially executed session.
- If reconciliation is deferred, keep it visibly pending and resumable.
- Apply a confirmed inventory change once even if the request is retried.
- Do not let AI help, a timer, or a background retry silently deduct ingredients.
- A stale local backup must not reopen a completed session or repeat a stock deduction.

---

# 45. Consolidated Pass 1 — Sitemap, Flows, and State Coverage

## 45.1 Product Sitemap

| Area | Children / in-flow surfaces | Cooking relationship |
| --- | --- | --- |
| Authentication | Login, Register, access recovery as appropriate to auth method | Leads to onboarding or Home |
| Onboarding | Welcome, Household, Kitchen, Preferences, Initial Fridge, Parse Review | Establishes reusable context |
| Home | Prompt, Quick Start, kitchen snapshot, resume, recent cooking | Create or resume intent |
| History | List, Detail, Rating, Favorite, Cook Again | New intent using a past recipe and fresh context |
| Fridge | Inventory, Ingredient Detail, Add / Parse Review, Adjustment, Need to Buy, optional Recent Changes | Ingredient source and replenishment |
| Profile | Household, Kitchen, Preferences, Account | Persistent defaults |
| Cooking flow | Recommendations, Missing Ingredients, Preparation, Active Step, Help, Interruption, Completion, Reconciliation | Runs across the core journey |
| Budget — future complementary area | Overview, purchase prices, lightweight planning | Purchases / Fridge only; absent from initial navigation |

## 45.2 Context Priority

| Context | Source | Lifetime / behavior |
| --- | --- | --- |
| Household, equipment, preferences | Profile | Persistent defaults |
| Current ingredients | Fridge | Refresh at relevant validation points |
| Servings, time limit, preferences for this meal | Current intent | Session override; does not edit Profile |
| Recipe choice and missing requirements | Planning intent | Persist across visits |
| Recipe snapshot, current step, timer, substitutions | Active session | Persist for recovery |
| Cooking result, rating, favorite | History | Durable record and future personalization signals |

Priority remains **Session Request > Profile Default**. Ask only for genuinely missing or consequentially uncertain information.

## 45.3 Critical Flow Map

| Flow | Entry → actions → exit |
| --- | --- |
| First use | Register → Onboarding → Initial Fridge input and review, or skip → Home |
| Primary cooking | Home intent → Read context → Recommendations → Preparation → Validate → Start → Step-by-step cooking → Completion → Reconciliation → History |
| Missing ingredient | Recipe intent → Explain missing ingredients → Offer feasible alternatives → Choose alternative or retain original → Need to Buy if needed |
| Shopping and resume | Save intent → Need to Buy → Purchase review → Confirm Add to Fridge → Offer resume → Refresh context → Revalidate → Preparation |
| Interrupted active cooking | Saved progress → User leaves → User returns → Continue / Start New → Restore and review conditions, or end previous session and offer usage reconciliation |
| Ingredient addition | Fridge → Natural-language input → Parse → Review / Edit → Confirm → Inventory update |
| Adjustment | Fridge or reconciliation → Ingredient → Quantity / removal → Reason → Confirm |
| History | List → Detail → Rating / Favorite or Cook Again → New intent → Fresh validation |
| Future Budget | Overview / purchase entry → Review ingredients and optional prices → Confirm → Fridge and Budget update |

## 45.4 Screen Inventory and Priority

| Screen / state group | Recommended surface | Priority |
| --- | --- | --- |
| Login / Register | Pages | MVP REQUIRED |
| Access recovery | Auth-provider-appropriate flow | MVP REQUIRED when applicable |
| Welcome / Household / Kitchen / Preferences | Short onboarding steps | MVP REQUIRED |
| Initial Fridge / Parse Review | Skippable onboarding input and confirmation | MVP REQUIRED |
| Home / resume prompt | Page with contextual state | MVP REQUIRED |
| Recommendations | Cooking flow page | MVP REQUIRED |
| Missing ingredients / alternatives / no viable recipe | Recommendation or preparation states | MVP REQUIRED |
| Recipe Detail + Pre-Cooking | One preparation page | MVP REQUIRED |
| Active Cooking Step | Focused cooking page | MVP REQUIRED |
| Timer running / finished | In-session component | MVP REQUIRED |
| Cooking Help / substitution review | Sheet or panel | MVP REQUIRED |
| Interrupted Cooking / Start New | Recovery state and action dialog | MVP REQUIRED |
| Completion / Reconciliation | Closing flow with separately persisted states | MVP REQUIRED |
| Unexpected Ingredient Event | Reusable sheet | MVP REQUIRED |
| Fridge Inventory | Page | MVP REQUIRED |
| Add Ingredient / Parse Review | Shared input flow | MVP REQUIRED |
| Ingredient Detail / Adjustment | Sheet or detail page | MVP REQUIRED |
| Minimum Need to Buy / purchase-to-Fridge | Fridge tab and confirmation flow | MVP REQUIRED |
| History / History Detail | Pages | MVP REQUIRED |
| Rating / Favorite | Completion and history components | MVP REQUIRED |
| Profile / context settings | Page and subpages | MVP REQUIRED |
| Fridge Recent Changes | Section or sheet | MVP OPTIONAL |
| Cook using a selected ingredient from Fridge | Contextual action | MVP OPTIONAL |
| Budget overview / price-aware purchase entry | Complementary later design; excluded from initial release | POST-MVP |
| Advanced shopping / household members / price prediction / personalization | Later feature areas | POST-MVP |

## 45.5 Edge-Case Matrix

| State | Expected behavior |
| --- | --- |
| Fridge empty after onboarding skip | Offer ingredient input from the cooking flow; do not fabricate inventory |
| Unknown ingredient quantity | Label uncertainty; ask only if it determines feasibility |
| Ambiguous AI parsing | Highlight uncertain fields and allow correction before persistent writes |
| Recommendation loading | Preserve prompt and effective context; show a clear in-progress state |
| AI timeout / failure | Keep intent and input; offer retry without restarting the whole flow |
| Fewer than three viable recipes | Show only viable options and explain the limitation |
| No viable recipe | Explain the limiting constraints and offer relevant adjustments or shopping |
| Missing equipment | Offer a feasible method or recipe alternative |
| Inventory changes after recommendation | Revalidate before starting and explain changed requirements |
| Some purchases remain missing | Keep remaining Need to Buy items and offer alternatives or further shopping |
| Old planning intent | Restore intent with fresh context; never trust the old availability indicators |
| Unfinished active session on return | Show Continue / Start New before another session starts |
| Long or uncertain interruption | Confirm whether the user is still continuing and review dish conditions |
| Timer finished while absent | Display elapsed status; do not advance cooking automatically |
| Offline during active cooking | Show loaded steps and local progress; expose unsynced state and unavailable AI help |
| Redis cache missing | Recover authoritative progress from PostgreSQL |
| Local and server progress differ | Prevent silent stale overwrite; resolve before syncing conflicting changes |
| Another device starts a session | Enforce one active session through the API; show the current session |
| Session ended after partial cooking | Offer partial usage / waste reconciliation |
| Completion saved, usage not confirmed | Keep history result and pending reconciliation separately |
| Reconciliation save fails or retries | Retain user edits; retry without duplicate inventory deduction |

## 45.6 Remaining Details to Resolve During Design / Implementation

These are refinements, not reasons to reopen confirmed architecture:

- The threshold and exact condition check for a long active-cooking interruption.
- The UI for conflicting unsynced local and server progress.
- Retention and dismissal behavior for older planning intents.
- The concrete background jobs that justify BullMQ workers.
- The future Budget entry point when that module is ready.

Proceed with low-fidelity wireframes for the approved initial four-tab experience.
