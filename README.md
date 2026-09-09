# Flemme

> **AI Cooking Assistant** — helping people decide what to cook from what they already have.

Flemme is a context-aware cooking companion designed to reduce the everyday friction of deciding what to cook, checking available ingredients, preparing a recipe, and managing what remains in the kitchen afterward.

The core idea is simple:

> **Open the fridge, not confusion.**

Flemme is not intended to be a generic recipe chatbot. The product combines user context, kitchen setup, household information, current ingredients, and cooking intent to provide structured recommendations and guide the user through cooking one step at a time.

---

## Product Vision

```text
Profile Context
      +
Fridge / Inventory
      +
Current Cooking Intent
      ↓
Recipe Recommendation
      ↓
Choose Recipe
      ↓
Pre-Cooking Check
      ↓
Step-by-Step Cooking
      ↓
Inventory Reconciliation
      ↓
Cooking History
      ↓
Better Personalization
```

The AI acts as the intelligence layer, while the product UI remains structured, predictable, and actionable.

---

## Core Product Principles

### Know Before Asking

Flemme should not ask for information that is already available from context.

Before asking a question, Flemme should first inspect:

```text
Session Context
Profile
Household
Kitchen Setup
Food Preferences
Fridge / Inventory
```

Only genuinely missing information should be requested.

### Use What You Have First

When ingredients are missing, Flemme should first try to satisfy the user's cooking intent with the current inventory.

```text
Requested Recipe
      ↓
Check Inventory
      ↓
Ingredients Complete?
   ┌───────┴───────┐
  Yes              No
   │                │
Continue      Suggest Alternatives
                    │
              User still wants it?
                 ┌──┴──┐
                No    Yes
                 │      │
             New Menu  Need to Buy
```

Shopping should be suggested only when needed or explicitly preferred by the user.

### AI Suggests, UI Structures

The LLM should produce structured output that the application can render as product UI.

Examples:

- recipe recommendation cards
- ingredient availability
- nutrition estimates
- household adjustments
- missing ingredient lists
- cooking steps
- timers
- inventory adjustments

The UI should not rely on long AI-generated paragraphs as the primary interaction model.

### Resume Intent, Refresh Context

Flemme uses a hybrid continuation model.

```text
Previous Cooking Intent
        +
Fresh Inventory
        ↓
Revalidate
        ↓
Continue
```

> **Do not resume the conversation. Resume the intent.**

### Cooking Is a Flow, Not a Chat

```text
Discover
→ Decide
→ Prepare
→ Cook
→ Finish
→ Update Fridge
→ Learn
```

---

## Main Product Areas

### Home

The primary entry point into Flemme.

Responsibilities:

- cooking prompt
- contextual Quick Start suggestions
- kitchen snapshot
- pending cooking intent
- recent cooking

Example Quick Start suggestions:

```text
[ Cook from my fridge ]
[ Under 30 minutes ]
[ For my family ]
[ Surprise me ]
```

Suggestions may become dynamic based on inventory state:

```text
[ Use the spinach first ]
[ Make something with eggs ]
[ Continue Carbonara ]
```

### Cooking

Cooking combines:

```text
Profile Context
+
Household
+
Kitchen Setup
+
Food Preferences
+
Fridge
+
Session Intent
```

to produce structured recipe recommendations.

Initial recommendation target:

```text
3 recipes
```

Flow:

```text
Recommendation
→ Recipe Detail
→ Pre-Cooking
→ Step-by-Step Cooking
→ Completion
→ Inventory Reconciliation
```

### Fridge

Fridge represents the user's current kitchen ingredient state.

It supports:

- inventory
- natural-language ingredient input
- approximate quantities
- purchases
- cooking consumption
- manual adjustments
- ingredient condition
- optional `Need to Buy`

Example:

```text
Chicken
1 whole

Chili
~200 g

Shallots
~½ kg
```

Flemme is not intended to behave like an ERP inventory system. Practical approximations are acceptable.

### History

History stores previous cooking activity and provides the foundation for personalization.

Possible signals include:

- recently cooked recipes
- favorites
- ratings
- cooking frequency
- repeated ingredients
- cook-again actions

### Budget

Budget is a complementary feature and is not the primary constraint for normal cooking recommendations.

Its role is closer to:

```text
Food Spending
→ Purchasing
→ Fridge
```

Potential responsibilities:

- food budget
- purchase planning
- remaining budget
- purchase history
- user-specific ingredient price history

Avoid false precision for local market prices.

Prefer:

```text
Rp45k – Rp55k
```

instead of:

```text
Rp48,237
```

---

## Context Model

Flemme distinguishes between persistent context and temporary session context.

### Persistent Context

Stored in the user's profile.

Examples:

- household
- kitchen equipment
- food preferences
- cooking preferences

### Session Context

Applies only to the current cooking session.

Examples:

```text
"I'm cooking only for myself tonight."
"I only have 20 minutes."
"I don't want anything spicy."
"I don't want to fry anything."
```

Priority:

```text
Session Context > Profile Default
```

Temporary situations should not require the user to edit their profile.

---

## Onboarding

After registration, Flemme gathers the minimum context required to avoid repetitive questions later.

```text
Register
   ↓
Household
   ↓
Kitchen Setup
   ↓
Food Preferences
   ↓
Initial Fridge
   ↓
Home
```

Initial fridge setup should support natural-language input.

Example:

```text
I have one chicken, around 10 eggs,
some onions, chili, soy sauce, and rice.
```

The AI parses the text and asks the user to confirm before persistent data is written.

```text
AI Parses
   ↓
User Confirms
   ↓
Inventory Updates
```

---

## Missing Ingredient Flow

Flemme handles missing ingredients in three levels.

### 1. Everything Available

```text
All ingredients are available.
→ Continue to Pre-Cooking
```

### 2. Ingredients Missing, Alternatives Available

```text
Requested Recipe
      ↓
Missing Ingredient
      ↓
Alternative Recipes
```

The user can choose an alternative that already fits the current inventory.

### 3. User Still Wants the Original Recipe

The missing ingredients may be added to a lightweight `Need to Buy` list.

```text
Cooking Intent
→ Missing Ingredients
→ Need to Buy
→ Purchase
→ Fridge Update
→ Resume Intent
```

When the user leaves to buy ingredients, Flemme may display a contextual safety reminder:

> **"Jangan lupa matikan kompor ya, hati-hati di jalan!"**

If cooking has not started yet:

> **"Pastikan dapur aman sebelum pergi ya. Hati-hati di jalan!"**

---

## Step-by-Step Cooking

The core cooking experience is intentionally one step at a time.

Example:

```text
Step 3 of 8

Add sliced onions.

Sauté until slightly softened.

[ Start Timer 02:00 ]

[ Need Help? ]
[ Done ]
```

AI assistance remains available for unexpected situations such as:

- ingredient substitutions
- overheating
- burned ingredients
- missing equipment
- timing questions

The cooking UI itself should remain structured and deterministic.

---

## Inventory Reconciliation

After cooking, Flemme calculates expected ingredient usage.

Example:

```text
Chicken      -500 g
Shallots     -6
Chili        -3
Soy sauce    -40 ml
```

Before updating inventory, the user can confirm or adjust the usage.

Unexpected events may also be recorded.

Examples:

```text
Eggs
-2
Reason: Broken
```

```text
Spinach
Removed
Reason: Expired
```

Possible adjustment reasons:

- broken
- expired
- spoiled
- thrown away
- used outside Flemme
- other

---

## Product Loop

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
 ↓
COOK AGAIN
```

---

# Technical Direction

Flemme is being built as a TypeScript-first monorepo.

## Stack

### Runtime
- Bun

### Monorepo
- Turborepo

### Web
- Vite
- React
- TanStack Router
- Tailwind CSS
- Lucide Icons

### API
- Hono
- BullMQ when asynchronous or background jobs are needed

### AI / Agent
- Anvia agent ecosystem
- OpenAI-compatible providers
- OpenAI / OpenRouter compatible runtime

### Database
- PostgreSQL
- Drizzle ORM

### Infrastructure
- Docker

---

## Repository Direction

```text
flemme/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── agent/
│   ├── db/
│   └── contracts/
│
├── docs/
│
├── package.json
├── turbo.json
└── README.md
```

The exact structure may evolve as implementation progresses.

---

## Agent Responsibility

The cooking agent is responsible for interpreting structured user context and producing cooking-oriented outputs.

Initial input direction:

```text
Ingredients
Kitchen
Taste
Household
        ↓
Cooking Agent
        ↓
3 Recipe Recommendations
```

Each recommendation should be able to include:

- recipe
- ingredient status
- recommendation reason
- nutrition estimate
- household adjustment

After the user selects a recipe, the agent supports the step-by-step cooking session.

The agent should not be responsible for unrelated application concerns such as authentication, persistent inventory writes, or navigation state.

---

## Architecture Principle

```text
Web
= Product UI

API
= Application orchestration

Agent
= Cooking intelligence

Database
= Persistent product state
```

Avoid coupling core application state directly to unstructured LLM conversations.

Prefer structured contracts between the application and the agent.

---

# Development Philosophy

Flemme favors practical implementation over premature complexity.

Principles:

- keep the MVP focused
- avoid over-engineering
- prefer structured contracts
- validate AI output before persistent writes
- make product state explicit
- keep AI reasoning separate from application state
- design flows before implementing them
- add infrastructure only when a real requirement exists

---

## MVP Priorities

```text
1. Core Cooking Flow
2. Context Handling
3. Fridge / Inventory
4. Missing Ingredient + Resume Intent
5. Cooking Completion / Inventory Reconciliation
6. Onboarding / Profile
7. History
8. Budget
9. Shopping Convenience Enhancements
```

Budgeting and advanced shopping behavior should not delay the primary cooking experience.

---

## Scope Guardrails

Flemme is currently **not** intended to become:

- a grocery marketplace
- a food delivery application
- a full expense tracker
- an ERP inventory system
- a social network
- a restaurant discovery platform
- a generic AI chatbot
- a clinical nutrition system

The focus remains:

```text
Context-Aware Cooking
+
Practical Inventory
+
Step-by-Step Guidance
+
Lightweight Planning
```

---

# Current Status

Flemme is currently in the early product design and foundation stage.

Current work includes:

- product concept definition
- UX workflow design
- agent responsibility definition
- agent runtime experimentation
- structured input/output contracts
- monorepo foundation planning

The development process intentionally starts by stabilizing product and agent behavior before expanding the API and application implementation.

---

# Getting Started

> Local development commands may evolve while the repository foundation is being finalized.

Install dependencies:

```bash
bun install
```

Run the workspace development environment:

```bash
bun run dev
```

Individual workspace commands should be executed from the relevant application or package when needed.

Example:

```bash
cd packages/agent
bun run dev
```

Refer to each workspace package for its current scripts and environment requirements.

---

## Environment Variables

Never commit credentials into the repository.

Local provider credentials should be stored in the relevant `.env` file.

Example:

```env
OPENAI_API_KEY=
```

When using an OpenAI-compatible provider, additional configuration such as a base URL or model identifier may also be required.

Keep local secrets out of Git.

---

# Design Documentation

Product design is part of the implementation contract.

Important design topics include:

- information architecture
- onboarding
- context hierarchy
- cooking recommendation flow
- missing ingredient behavior
- resume intent
- Fridge / inventory
- active cooking
- inventory reconciliation
- History
- Budget

Design decisions should be documented before implementation when they affect product behavior or persistent state.

---

# Contributing

Flemme is currently evolving rapidly.

Before implementing a new feature:

1. confirm that it belongs to the current scope,
2. define its user flow,
3. identify the required product state,
4. define the API / agent contract,
5. then implement the UI and persistence layer.

Avoid introducing new product behavior only because it is technically easy to add.

---

# License

License information has not been finalized yet.

---

<p align="center">
  <strong>Flemme</strong><br />
  Open the fridge, not confusion.
</p>
