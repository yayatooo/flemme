# Flemme — Initial Inventory Onboarding v0.1

## Status

```text
ONBOARDING
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
Initial Inventory       ← current
Completion → Home
```

Related core flow:

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

---

# 1. Purpose

Initial Inventory onboarding gives users an optional opportunity to tell Flemme about ingredients they currently have.

Its purpose is:

```text
Give Flemme a useful starting inventory.
```

It is **not** intended to require users to fully catalog their kitchen before they can use the application.

Examples:

```text
rice
eggs
chicken
garlic
soy sauce
spring onion
```

This context can immediately improve recipe recommendations after onboarding.

However:

```text
Initial Inventory is optional.
```

Users must be allowed to continue without adding anything.

---

# 2. Core Principle

Unlike previous onboarding steps:

```text
Profile Preferences
Household
Kitchen Equipment
```

Initial Inventory is inherently more temporary and difficult to answer accurately.

Users may:

- not remember everything they have,
- not want to inspect their refrigerator during onboarding,
- have ingredients that change daily,
- prefer adding ingredients when they actually want to cook,
- want to explore Flemme first.

Therefore:

```text
Inventory onboarding must reduce friction,
not become an onboarding gate.
```

---

# 3. Onboarding Requirement

Initial Inventory is:

```text
OPTIONAL
```

Valid completion states:

```text
User added ingredients
→ Complete onboarding
```

or:

```text
User added nothing
→ Add later
→ Complete onboarding
```

Both are valid.

---

# 4. Recommended UX Language

Header:

```text
What's in your kitchen?
```

Supporting text:

```text
Add a few ingredients you already have and Flemme
can start with better recommendations.
```

Secondary copy:

```text
You can always update this later.
```

Alternative Indonesian:

```text
Ada bahan apa di rumah?
```

```text
Tambahkan beberapa bahan yang kamu punya supaya
Flemme bisa memberikan rekomendasi yang lebih relevan.

Tenang, ini bisa diisi atau diubah kapan saja.
```

---

# 5. Primary Interaction

Recommended layout:

```text
What's in your kitchen?

Add ingredients you currently have.

┌───────────────────────────────────┐
│ Search or add an ingredient...    │
└───────────────────────────────────┘

Added

[ Eggs × ]
[ Rice × ]
[ Garlic × ]
[ Chicken × ]


[ Finish Setup ]

        Add later
```

Do not require users to navigate through a large ingredient catalog.

The primary interaction should be:

```text
Type
→ Select / Add
→ Done
```

---

# 6. Free-Form Entry

Users should be able to type natural ingredient names.

Examples:

```text
telur
beras
nasi
ayam
bawang putih
cabai
kecap manis
```

or:

```text
egg
rice
chicken
garlic
chili
soy sauce
```

The onboarding UI should not force users to know Flemme's canonical ingredient terminology.

---

# 7. Existing Ingredient Catalog

Initial Inventory should reuse the existing Flemme ingredient identity and resolver layer.

Conceptually:

```text
User Input
    ↓
Ingredient Resolver
    ↓
Resolved canonical ingredient
OR
Unresolved ingredient
```

Do not create another independent ingredient catalog specifically for onboarding.

---

# 8. Canonical Ingredient Resolution

Example input:

```text
Telur
```

Resolver:

```text
telur
→ egg
```

Persisted identity can reference the canonical ingredient:

```text
egg
```

while the UI can still display:

```text
Telur
```

depending on localization.

---

# 9. Do Not Block Unknown Ingredients

Ingredient resolution must not become onboarding friction.

Example:

```text
"daun gedi"
```

If Flemme cannot resolve it:

```text
status: unresolved
```

The user should still be able to add it.

Do not show:

```text
Ingredient not supported.
```

and block the user.

Instead:

```text
Add "daun gedi"
```

should remain possible.

---

# 10. Why Unknown Ingredients Are Allowed

The real world contains:

- local ingredients,
- regional names,
- spelling variations,
- brand-like ingredient terms,
- ingredients not yet present in Flemme's catalog.

Blocking those inputs would make onboarding unnecessarily rigid.

Therefore:

```text
Resolver helps normalization.

Resolver does not control whether
the user is allowed to have an ingredient.
```

---

# 11. Suggested Inventory Item Concept

Keep v0.1 minimal.

Conceptually:

```ts
type InventoryItem = {
  name: string;
  ingredientKey?: string;
};
```

Example resolved:

```ts
{
  name: "Telur",
  ingredientKey: "egg"
}
```

Example unresolved:

```ts
{
  name: "Daun Gedi"
}
```

Exact persistence shape can follow the existing inventory architecture.

---

# 12. Quantity

Do **not** require quantity during Initial Inventory v0.1.

Bad onboarding:

```text
Eggs

Quantity: ___
Unit: ___
Expiration: ___
Purchase date: ___
```

Too much friction.

Preferred:

```text
Eggs ✓
```

The main question is:

```text
Do you have this ingredient?
```

not:

```text
Exactly how much do you have?
```

---

# 13. Why Quantity Is Optional

Flemme's current recommendation context primarily needs to understand ingredient availability.

Examples:

```text
eggs
rice
garlic
chicken
```

are already useful signals.

Exact quantity can be introduced through Inventory Management later if the product genuinely needs it.

---

# 14. Inventory Onboarding Contract

Recommended minimal conceptual request:

```ts
{
  items: [
    {
      name: "Egg"
    },
    {
      name: "Rice"
    },
    {
      name: "Garlic"
    }
  ]
}
```

If canonical identity is persisted:

```ts
{
  items: [
    {
      ingredientKey: "egg",
      name: "Egg"
    },
    {
      ingredientKey: "rice",
      name: "Rice"
    }
  ]
}
```

---

# 15. Agent Projection

The existing Recommendation context remains simple.

Example persisted inventory:

```text
egg
rice
garlic
chicken
```

Projected agent context:

```ts
inventory: [
  { name: "egg" },
  { name: "rice" },
  { name: "garlic" },
  { name: "chicken" }
]
```

Do not make the Recommendation Agent dependent on persistence-specific fields.

---

# 16. Add Later

Secondary action:

```text
Add later
```

Recommended instead of:

```text
Skip
```

Reason:

`Add later` communicates that inventory remains available as a feature rather than implying that the user permanently opted out.

Interaction:

```text
Add later
    ↓
Mark onboarding inventory step complete
    ↓
Completion
    ↓
Home
```

No inventory items are required.

---

# 17. Empty Inventory Is Valid

Unlike Household and Kitchen Equipment:

```text
inventory.length === 0
```

is valid.

Do not disable onboarding completion.

Example:

```text
0 ingredients added

[ Finish Setup ]

Add later
```

Both paths can finish onboarding.

---

# 18. Empty Inventory Semantics

An empty inventory means:

```text
Flemme currently knows no ingredients
that are available.
```

It does **not** mean:

```text
The user definitely has no food.
```

This distinction is important.

Flemme must still follow:

```text
Do not invent ingredient availability.
```

If persistent inventory is empty, session input can provide current ingredients.

---

# 19. Persistent Inventory vs Session Ingredients

Persistent Inventory:

```text
Ingredients Flemme knows the user currently has.
```

Session Ingredients:

```text
Ingredients explicitly provided for this cooking request.
```

Example persistent inventory:

```text
rice
egg
garlic
```

User says:

```text
Aku juga ada ayam dan daun bawang sekarang.
```

Cooking session context may become:

```text
rice
egg
garlic
chicken
spring onion
```

without necessarily mutating persistent inventory automatically.

---

# 20. Session Context Priority

Recommended principle:

```text
Session input
    ↓
Persistent inventory
```

Explicit session information wins.

However:

```text
session override ≠ silent inventory mutation
```

If the user says:

```text
Aku ada salmon sekarang.
```

Flemme may use salmon during the current recommendation.

It should not automatically persist salmon into the user's inventory unless the product explicitly performs that action.

---

# 21. Inventory Is the Availability Source of Truth

Known inventory:

```text
rice
egg
garlic
```

Flemme may treat these as available.

Unknown:

```text
butter
oil
salt
pepper
```

must not automatically be assumed.

This remains consistent with Flemme's agent principle:

```text
Never assume pantry staples.
```

---

# 22. Recommendation Example

Inventory:

```text
egg
cooked rice
garlic
spring onion
```

Equipment:

```text
stove
frying pan
```

Household:

```text
1 adult
```

Flemme may rank:

```text
Egg Fried Rice
```

high because it matches:

```text
known ingredients
available equipment
household
preferences
```

---

# 23. Missing Ingredients

Inventory does not have to fully satisfy every recipe.

Example:

```text
Available:
egg
rice
garlic

Recipe needs:
egg
rice
garlic
soy sauce
```

Recommendation can still return the recipe while correctly exposing:

```text
Available
- egg
- rice
- garlic

Missing / Unconfirmed
- soy sauce
```

Do not invent soy sauce availability.

---

# 24. Quick Suggestions

The UI may provide common ingredient suggestions.

Example:

```text
Common ingredients

[ Eggs ]
[ Rice ]
[ Chicken ]
[ Garlic ]
[ Onion ]
[ Chili ]
```

These are shortcuts only.

They should use the same canonical resolution path as manual entry.

---

# 25. Suggested Search Behaviour

As the user types:

```text
"tel"
```

UI may show:

```text
Telur
```

or:

```text
Egg
```

depending on application language.

Interaction:

```text
Type
→ local/search results
→ select
→ chip added
```

---

# 26. Enter Behaviour

If the user types:

```text
daun gedi
```

and no catalog match exists:

```text
Add "daun gedi"
```

Pressing Enter should add the ingredient rather than blocking the flow.

---

# 27. Duplicate Handling

Duplicates should not create multiple inventory entries.

Example:

```text
Egg
egg
TELUR
```

If they resolve to the same canonical ingredient:

```text
egg
```

only one item should exist.

Preferred UX:

```text
Egg is already in your inventory.
```

or silently focus the existing chip.

Do not create duplicate records.

---

# 28. Unresolved Duplicate Handling

For unresolved ingredients, use conservative normalization:

```text
trim whitespace
collapse repeated whitespace
case-insensitive comparison
```

Example:

```text
Daun Gedi
daun gedi
 DAUN   GEDI
```

should not become three separate items.

---

# 29. Removing Items

Every added ingredient should be removable before submission.

Example:

```text
[ Egg × ]
[ Rice × ]
[ Garlic × ]
```

Removing:

```text
Rice ×
```

results in:

```text
[ Egg × ]
[ Garlic × ]
```

---

# 30. No Confirmation Dialog

Removing an ingredient during onboarding should be immediate.

Do not ask:

```text
Are you sure?
```

because nothing has been committed yet.

---

# 31. Save Behaviour

If the user has added ingredients:

```text
Finish Setup
```

Flow:

```text
Initial Inventory
    ↓
Resolve / validate items
    ↓
Persist
    ↓
Mark onboarding step complete
    ↓
Completion
    ↓
Home
```

---

# 32. Add Later Behaviour

If user selects:

```text
Add later
```

Flow:

```text
Initial Inventory
    ↓
No inventory persistence required
    ↓
Mark onboarding step complete
    ↓
Completion
    ↓
Home
```

The user must not remain stuck in onboarding.

---

# 33. Completion State

After either path:

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
Initial Inventory       ✅
Completion → Home       ← next
```

`Initial Inventory ✅` means:

```text
Onboarding decision completed.
```

It does not necessarily mean:

```text
Inventory contains items.
```

---

# 34. Saving State

While saving:

```text
Saving...
```

Requirements:

- prevent duplicate submission,
- preserve current chips,
- disable Finish Setup,
- prevent Add Later from racing with save,
- preserve current input if the API fails.

---

# 35. Error State

Example:

```text
Couldn't save your ingredients.
Your selections are still here.
```

Actions:

```text
Try Again
Add later
```

Important:

Even if persistence fails, `Add later` can remain available.

Do not trap the user in onboarding because inventory could not be saved.

---

# 36. API Failure Philosophy

Inventory is optional onboarding enrichment.

Therefore:

```text
Inventory persistence failure
should not make Flemme unusable.
```

The application should still provide a path to complete onboarding.

---

# 37. Suggested API Contract

Follow existing application conventions.

Conceptually:

```http
PUT /me/inventory
```

Request:

```json
{
  "items": [
    {
      "name": "Egg"
    },
    {
      "name": "Rice"
    },
    {
      "name": "Garlic"
    }
  ]
}
```

Response:

```json
{
  "items": [
    {
      "name": "Egg",
      "ingredientKey": "egg"
    },
    {
      "name": "Rice",
      "ingredientKey": "rice"
    },
    {
      "name": "Garlic",
      "ingredientKey": "garlic"
    }
  ]
}
```

Exact endpoint should follow existing Inventory architecture.

---

# 38. Do Not Build a Separate Onboarding Inventory

Important boundary:

```text
Initial Inventory
```

should populate the same inventory used by:

```text
Inventory Management
Recommendation
Cooking Context
```

Do not create:

```text
onboarding_inventory
```

and later migrate it into:

```text
real_inventory
```

There should be one inventory domain.

Onboarding is simply one entry point.

---

# 39. Persistence Flow

Recommended:

```text
Initial Inventory UI
        ↓
Inventory API
        ↓
Persistent User Inventory
        ↓
Cooking Context Loader
        ↓
Recommendation
```

Later:

```text
Inventory Management
        ↓
same Inventory API/domain
```

---

# 40. Editing After Onboarding

Inventory differs from Household and Kitchen Equipment.

It should not primarily be edited through:

```text
Profile
```

Instead:

```text
App
→ Inventory
```

because inventory is operational data that changes frequently.

---

# 41. Inventory Management Boundary

Initial Inventory handles:

```text
Add some ingredients
Remove before save
Complete onboarding
```

Inventory Management later handles:

```text
Add ingredient
Remove ingredient
Update ingredient
Search inventory
Possibly quantity
Possibly freshness
Possibly consumption
```

Do not bring all future Inventory Management functionality into onboarding.

---

# 42. Quantity — Future

Possible future:

```ts
{
  ingredientKey: "egg",
  quantity: 6,
  unit: "piece"
}
```

or:

```ts
{
  ingredientKey: "chicken-breast",
  quantity: 500,
  unit: "g"
}
```

This is outside Initial Inventory v0.1 unless already required by the existing Inventory domain.

---

# 43. Expiration — Out of Scope

Do not ask for:

```text
expiration date
purchase date
opened date
storage location
freshness
```

during onboarding.

This creates excessive friction.

---

# 44. Refrigerator / Pantry Location

Do not require distinction between:

```text
fridge
freezer
pantry
counter
```

during onboarding v0.1.

All ingredients belong to:

```text
User Inventory
```

Storage location can be introduced later if the product needs it.

---

# 45. Image Input

Image-based ingredient detection is valuable to Flemme's broader product experience.

However:

```text
Initial Inventory v0.1
```

does not require camera/image recognition.

Reason:

The purpose of this onboarding step is to remain lightweight.

Potential future:

```text
Take photo
→ detect ingredients
→ user confirms
→ add to inventory
```

This can be introduced without changing the core inventory contract.

---

# 46. Why Image Input Is Not Required Here

Onboarding should not create a dependency on:

```text
camera permission
vision model
image upload
image processing
ingredient detection confidence
```

before users can reach Home.

Manual quick-add is sufficient for v0.1.

---

# 47. Mobile Layout

Recommended:

```text
←

What's in your kitchen?

Add a few ingredients you already have.
You can always update this later.

┌──────────────────────────────┐
│ Search or add ingredient...  │
└──────────────────────────────┘

Suggestions

[ Eggs ] [ Rice ] [ Chicken ]
[ Garlic ] [ Onion ] [ Chili ]

Your ingredients

[ Egg × ]
[ Rice × ]
[ Garlic × ]

3 ingredients added


[ Finish Setup ]

      Add later
```

---

# 48. Empty Mobile State

```text
What's in your kitchen?

Add a few ingredients to help Flemme
give better recommendations.

┌──────────────────────────────┐
│ Search or add ingredient...  │
└──────────────────────────────┘

No ingredients added yet.

That's okay — you can add them later.


[ Finish Setup ]

      Add later
```

Potentially simplify to one action when empty:

```text
[ Add later ]
```

and show `Finish Setup` only after an ingredient exists.

Both approaches are valid.

Prefer whichever matches the existing onboarding visual pattern.

---

# 49. Recommended Empty-State UX

My recommended behaviour:

When:

```text
items.length === 0
```

Primary:

```text
Add later
```

When:

```text
items.length > 0
```

Primary:

```text
Finish Setup
```

Secondary:

```text
Add later
```

This makes the user's decision explicit.

---

# 50. Desktop Layout

Keep the onboarding container focused.

Suggested:

```text
max-width: 600–720px
```

Do not turn Initial Inventory onboarding into the full inventory dashboard.

---

# 51. Accessibility

Input must have a proper label:

```text
Search or add ingredient
```

Ingredient chips need accessible remove actions:

```text
Remove Egg
Remove Rice
Remove Garlic
```

Suggestion cards/buttons must be keyboard accessible.

Do not rely solely on color for:

```text
selected
added
duplicate
```

states.

---

# 52. Localization

Canonical ingredient identity should remain language independent.

Example:

```text
key:
egg
```

Possible aliases:

```text
English:
egg

Indonesian:
telur
```

UI language and canonical identity must remain separate concerns.

---

# 53. Home Behaviour After Skipping

If onboarding inventory is empty:

```text
Home
```

should still be fully usable.

Recommendation entry should naturally allow the user to provide ingredients.

Example:

```text
What ingredients do you have?
```

or existing Flemme Quick Start interaction.

The user must never see:

```text
You must complete inventory setup first.
```

---

# 54. Home Behaviour With Inventory

If inventory exists:

```text
egg
rice
garlic
chicken
```

Home can surface context such as:

```text
You currently have 4 known ingredients.
```

or use those ingredients directly as recommendation context.

Do not automatically start generating recommendations without user intent.

---

# 55. Inventory Does Not Mean Consume Automatically

Recommendation:

```text
uses inventory context
```

but must not mutate inventory.

Pre-Cooking:

```text
uses inventory context
```

but must not mutate inventory.

Active Cooking may eventually record ingredient usage, but that is a separate lifecycle decision.

Rule:

```text
Reading inventory
≠
Consuming inventory.
```

---

# 56. Historical Session Preservation

Changing inventory today must not rewrite historical session context.

Example:

Monday:

```text
Inventory:
egg
rice
garlic
```

Cooking session created.

Tuesday:

```text
egg removed
chicken added
```

Monday's historical cooking session should remain unchanged.

---

# 57. Duplicate Domain Ownership

Avoid implementing ingredient identity in multiple places.

Preferred:

```text
@flemme/ingredients
    ↓
canonical identity / resolver

Inventory domain
    ↓
ownership / persistence

Agent
    ↓
cooking reasoning
```

Responsibilities should remain separate.

---

# 58. Out of Scope — v0.1

Do not require:

```text
ingredient quantity
units
expiration date
purchase date
storage location
price
brand
barcode
nutrition editing
image recognition
receipt scanning
automatic inventory deduction
shopping list
inventory alerts
minimum stock
batch tracking
```

These can evolve through Inventory Management separately.

---

# 59. Acceptance Criteria

Initial Inventory onboarding v0.1 is complete when:

- Initial Inventory is optional.
- User may complete onboarding with zero ingredients.
- `Add later` is available.
- Skipping inventory does not block Home.
- User can manually search/type ingredients.
- Known ingredients can resolve to canonical identity.
- Unknown ingredients do not block onboarding.
- User can add multiple ingredients.
- User can remove ingredients before saving.
- Canonical duplicates are prevented.
- Reasonable free-text duplicates are prevented.
- Quantity is not required.
- Ingredient suggestions may be shown.
- No ingredient is silently assumed.
- Saved ingredients enter the real persistent Inventory domain.
- No separate onboarding-only inventory is created.
- Inventory becomes available through cooking context.
- Recommendation can use known inventory.
- Session ingredients can extend/override recommendation context without silently changing persistent inventory.
- Saving failure preserves selections.
- User can still choose Add later after an inventory save failure.
- Duplicate submission is prevented.
- Successful save completes onboarding.
- Add later completes onboarding.
- Inventory remains manageable after onboarding.
- Updating inventory does not rewrite historical cooking sessions.

---

# 60. Final v0.1 Contract

Agent-facing contract remains simple:

```ts
type CookingInventoryContext = Array<{
  name: string;
}>;
```

Persistence may contain richer identity:

```ts
type InventoryItem = {
  name: string;
  ingredientKey?: string;
};
```

Core rule:

```text
Persistent Inventory
= ingredients Flemme currently knows are available.

Session Ingredients
= ingredients explicitly available right now.

Session context may extend persistent context.

Unknown ingredients must never be silently invented.
```

---

# 61. Final Onboarding Philosophy

```text
Profile Preferences
→ useful persistent preference
→ required

Household
→ important serving context
→ required

Kitchen Equipment
→ important cooking capability
→ required

Initial Inventory
→ useful but temporary context
→ optional
```

Therefore:

```text
Don't make users catalog their kitchen
before Flemme proves its value.
```

---

# 62. Completion Flow

With inventory:

```text
Initial Inventory
→ Add ingredients
→ Finish Setup
→ Completion
→ Home
```

Without inventory:

```text
Initial Inventory
→ Add later
→ Completion
→ Home
```

Both are first-class flows.

---

# 63. Final Onboarding State

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
Initial Inventory       ✅ / Add later
Completion              ← next
Home
```

Important semantic:

```text
Initial Inventory ✅
```

means:

```text
The user has made the onboarding decision.
```

not:

```text
The user's inventory must contain data.
```