# Flemme — Kitchen Equipment Onboarding v0.1

## Status

```text
ONBOARDING
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ← current
Initial Inventory
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

Kitchen Equipment onboarding collects the cooking tools that are normally available to the user.

Its purpose is to help Flemme understand:

```text
WHAT cooking methods are realistically available?
```

Equipment context can influence:

- recipe ranking,
- recipe feasibility,
- cooking method selection,
- alternative cooking techniques,
- Pre-Cooking equipment requirements,
- required confirmations,
- recommendation explanations.

Example:

```text
Available:

✅ Stove
✅ Frying Pan
✅ Pot
✅ Rice Cooker

Unavailable / Unknown:

❌ Oven
❌ Air Fryer
❌ Blender
```

Flemme should prefer recipes that can realistically be completed using the available equipment.

---

# 2. Core Principle

Kitchen Equipment represents:

```text
AVAILABLE COOKING CAPABILITY
```

It does not represent:

```text
kitchen inventory
ingredient inventory
brand / model ownership
equipment maintenance
smart appliance integration
```

For v0.1:

```text
Kitchen Equipment = simple persistent list of available tools.
```

---

# 3. Existing Agent Contract

The current cooking recommendation context already supports:

```ts
kitchen: {
  equipment: string[];
}
```

Example:

```ts
{
  kitchen: {
    equipment: [
      "stove",
      "frying-pan",
      "pot",
      "rice-cooker"
    ]
  }
}
```

Kitchen Equipment onboarding should persist data in a form that can be directly projected into this contract.

Avoid introducing a second incompatible representation unless necessary.

---

# 4. Equipment Source of Truth

Persistent Kitchen Equipment is the source of truth for what Flemme normally knows the user can use.

Rule:

```text
Known available equipment
→ may be used by recommendation

Not stored
→ must not automatically be assumed available
```

Example:

```text
User equipment:

- stove
- frying pan
- pot
```

Flemme must not silently assume:

```text
oven
air fryer
blender
microwave
```

unless that information exists elsewhere in the current session context.

---

# 5. Recommended Screen

## Header

```text
What do you cook with?
```

Supporting text:

```text
Select the kitchen equipment you normally have available.
Flemme will use this to recommend recipes you can actually make.
```

Alternative Indonesian copy:

```text
Kamu biasanya masak pakai apa?
```

```text
Pilih peralatan dapur yang tersedia di rumah.
Flemme akan menggunakannya untuk menyesuaikan resep dan cara memasak.
```

---

# 6. Equipment Selection UX

Recommended interaction:

```text
[ Stove ✓ ]       [ Rice Cooker ✓ ]

[ Frying Pan ✓ ]  [ Pot ✓ ]

[ Oven ]          [ Air Fryer ]

[ Microwave ]     [ Blender ]

[ Steamer ]       [ Grill ]
```

Use selectable cards / chips rather than dropdowns.

Why:

```text
Fast to scan
Easy on mobile
Easy to edit
Supports multi-select naturally
```

---

# 7. Recommended Equipment Catalog

Kitchen equipment should come from a controlled application catalog.

Do not store arbitrary UI labels as the canonical identifier.

Recommended v0.1 catalog:

```text
Cooking Heat
────────────
stove
induction-cooker
oven
air-fryer
microwave
rice-cooker

Cookware
────────
frying-pan
wok
pot
saucepan

Preparation
───────────
blender
food-processor
mixer

Cooking Methods
───────────────
steamer
grill
toaster

Useful Tools
────────────
kettle
pressure-cooker
slow-cooker
```

The exact catalog can evolve later.

---

# 8. Canonical Equipment Shape

Recommended domain shape:

```ts
type KitchenEquipmentDefinition = {
  key: string;
  label: string;
  category: EquipmentCategory;
};
```

Example:

```ts
{
  key: "rice-cooker",
  label: "Rice Cooker",
  category: "cooking-heat"
}
```

Possible category:

```ts
type EquipmentCategory =
  | "cooking-heat"
  | "cookware"
  | "preparation"
  | "cooking-method"
  | "utility";
```

The persisted value should primarily reference:

```text
key
```

not the presentation label.

---

# 9. Why Canonical Keys Matter

Bad:

```json
[
  "Rice Cooker",
  "rice cooker",
  "Magic Com",
  "rice-cooker"
]
```

These may represent the same concept.

Preferred:

```json
[
  "rice-cooker"
]
```

UI may display:

```text
Rice Cooker
```

Agent context may receive either:

```text
rice-cooker
```

or a resolved human-readable form.

The identity itself should remain stable.

---

# 10. Recommended Starter Equipment

For onboarding, avoid pre-selecting many tools.

Do not assume every user owns:

```text
stove
pan
pot
rice cooker
```

Instead:

```text
Default selection = []
```

The user explicitly selects what is available.

This preserves the Flemme rule:

```text
Never invent equipment.
```

---

# 11. Minimum Selection

Recommended v0.1 rule:

```text
At least one equipment item required.
```

Reason:

An empty equipment context provides little value for recommendation feasibility.

If the user truly has only one tool, that information is still useful.

Example:

```text
✅ Rice Cooker
```

Flemme can still recommend meals based around that constraint.

---

# 12. No Skip

Recommended:

```text
Do not provide Skip.
```

Kitchen equipment is core context for the cooking workflow.

The interaction is simple enough that users should provide at least one known available tool.

---

# 13. Equipment Groups

Recommended screen organization:

```text
Heat & Cooking

Stove
Induction Cooker
Oven
Air Fryer
Microwave
Rice Cooker


Cookware

Frying Pan
Wok
Pot
Saucepan


Preparation

Blender
Food Processor
Mixer


Others

Steamer
Grill
Pressure Cooker
Slow Cooker
Kettle
Toaster
```

Categories are presentation helpers.

They should not affect cooking logic by themselves.

---

# 14. Search

For v0.1:

```text
Search is optional.
```

The catalog should remain small enough to scan.

If the catalog later grows significantly:

```text
Search equipment...
```

can be introduced without changing the underlying persistence model.

---

# 15. Custom Equipment

Recommended v0.1:

```text
Do not support arbitrary custom equipment yet.
```

Reason:

Free-text equipment creates normalization problems such as:

```text
magic com
rice cooker
magic jar
penanak nasi
```

all representing overlapping concepts.

Start with a controlled catalog.

Custom equipment can be added later when there is real product demand.

---

# 16. Selection State

Example:

```text
What do you cook with?

Heat & Cooking

[x] Stove
[ ] Induction Cooker
[ ] Oven
[x] Air Fryer
[ ] Microwave
[x] Rice Cooker


Cookware

[x] Frying Pan
[x] Pot
[ ] Wok


Preparation

[ ] Blender
[ ] Food Processor


5 equipment selected

[ Continue ]
```

---

# 17. Validation

Request contract conceptually:

```ts
equipment: string[]
```

Rules:

```text
equipment.length >= 1
```

Every item must:

```text
exist in the supported equipment catalog
```

Duplicates should be rejected or normalized.

Example invalid:

```json
{
  "equipment": [
    "stove",
    "stove"
  ]
}
```

Preferred persisted result:

```json
{
  "equipment": [
    "stove"
  ]
}
```

---

# 18. Continue Behaviour

Primary action:

```text
Continue
```

Flow:

```text
Kitchen Equipment
        ↓
Validate Selection
        ↓
Persist Equipment
        ↓
Initial Inventory
```

Or:

```text
actual next incomplete onboarding step
```

to preserve resumable onboarding behavior.

---

# 19. Saving State

During persistence:

```text
Saving...
```

Requirements:

- prevent duplicate submission,
- preserve selected equipment,
- do not reset the selection,
- disable Continue while request is active.

---

# 20. Error State

Example:

```text
Couldn't save your kitchen equipment.
Please try again.
```

Selected equipment must remain visible.

Do not force the user to select everything again.

---

# 21. Persistent Context

Conceptually:

```text
User
 ├── Profile Preferences
 ├── Household
 ├── Kitchen Equipment
 └── Inventory
```

Kitchen Equipment should be persistent user cooking context.

It should not belong directly to:

```text
Recipe
Favorite
Cooking History
Cooking Session
```

---

# 22. Cooking Context Projection

Persistence:

```text
User Kitchen Equipment
        ↓
Cooking Context Loader
        ↓
Agent Input
```

Agent input:

```ts
{
  kitchen: {
    equipment: [
      "stove",
      "frying-pan",
      "pot",
      "rice-cooker"
    ]
  }
}
```

---

# 23. Recommendation Integration

Kitchen equipment should influence recipe ranking.

Example:

```text
Ingredients:
- chicken
- potato
- garlic

Equipment:
- stove
- frying pan
- pot
```

Recipes requiring a pan should rank higher than:

```text
Oven-Roasted Chicken
```

if no oven is available.

---

# 24. Equipment Is Not Always a Hard Filter

Missing equipment does not necessarily make a recipe completely impossible.

Example:

Recipe normally says:

```text
Bake chicken in oven.
```

User has:

```text
stove
frying-pan
```

If Flemme knows a reasonable alternative technique:

```text
Pan-cook the chicken instead.
```

then the recipe may still be viable.

Therefore:

```text
Equipment affects feasibility and ranking.
```

Not necessarily:

```text
missing equipment = automatic rejection
```

---

# 25. Recommendation Priority

Recommended logic:

```text
1. Session request
2. Available ingredients
3. Household suitability
4. Available equipment
5. Preferences
6. Time / practicality
```

Equipment should significantly influence practicality.

But it should not override an explicit user request without explanation.

---

# 26. Explicit Session Request

Example persistent equipment:

```text
stove
frying-pan
pot
```

User says:

```text
Aku mau bikin ayam pakai air fryer.
```

Flemme should not pretend an air fryer exists.

Instead:

```text
Air fryer isn't currently listed in your kitchen equipment.
Do you have one available for this cooking session?
```

This can become a session-specific confirmation.

---

# 27. Session Override

Persistent context:

```ts
equipment: [
  "stove",
  "frying-pan"
]
```

Session context may temporarily become:

```ts
equipment: [
  "stove",
  "frying-pan",
  "air-fryer"
]
```

if the user explicitly confirms access to an air fryer.

This must not automatically modify the persistent profile.

Rule:

```text
Session equipment override
≠
Persistent Kitchen Equipment mutation
```

---

# 28. Recommendation Output Integration

Current recommendation output already contains:

```text
equipmentStatus
requiredConfirmations
```

Kitchen context should help populate those honestly.

Example:

```json
{
  "equipmentStatus": {
    "available": [
      "stove",
      "frying-pan"
    ],
    "missing": [
      "blender"
    ]
  }
}
```

Exact shape follows the existing Recommendation schema.

The onboarding feature should not create a competing equipment-status schema.

---

# 29. Pre-Cooking Integration

Pre-Cooking already produces:

```ts
equipment: [
  {
    name: string;
  }
]
```

Kitchen Equipment context helps the agent ensure the cooking plan is realistic.

Flow:

```text
Kitchen Equipment
        ↓
Recommendation feasibility
        ↓
Selected Recipe
        ↓
Pre-Cooking
        ↓
Required equipment
```

---

# 30. Equipment Requirement vs User Equipment

These concepts are different.

## User Kitchen Equipment

```text
What the user owns / normally has access to.
```

Example:

```text
stove
pan
pot
rice cooker
```

## Recipe Equipment Requirement

```text
What this specific recipe needs.
```

Example:

```text
frying pan
spatula
knife
cutting board
```

Do not persist recipe requirements as user-owned equipment automatically.

---

# 31. Basic Tools

A design decision is needed around extremely common tools such as:

```text
knife
cutting board
spoon
spatula
bowl
plate
```

Recommended v0.1 approach:

```text
Do NOT ask for basic utensils during onboarding.
```

Kitchen onboarding should focus on equipment that materially changes recipe feasibility.

Examples:

```text
stove
oven
air fryer
rice cooker
blender
grill
steamer
```

Basic utensils may continue appearing in Pre-Cooking requirements.

---

# 32. Why Basic Utensils Are Excluded

Asking:

```text
Do you own a spoon?
Do you own a plate?
Do you own a knife?
```

adds unnecessary onboarding friction.

The distinction:

```text
Kitchen Equipment Onboarding
→ major cooking capabilities

Pre-Cooking Equipment
→ everything needed for this recipe
```

---

# 33. Stove vs Induction

Treat:

```text
stove
induction-cooker
```

as separate canonical equipment if the cooking experience materially differs.

However, recipes requiring generic stovetop heat may accept either.

Conceptually:

```text
stovetop capability
├── gas / conventional stove
└── induction cooker
```

Do not force the Agent to treat them as completely unrelated capabilities.

---

# 34. Capability Mapping

Future-proofing can use capability mapping internally.

Example:

```ts
{
  key: "stove",
  capabilities: ["stovetop"]
}
```

```ts
{
  key: "induction-cooker",
  capabilities: ["stovetop"]
}
```

```ts
{
  key: "oven",
  capabilities: ["bake", "roast"]
}
```

This is optional for v0.1.

Do not over-engineer unless recommendation logic currently needs it.

---

# 35. Suggested API Contract

Exact naming should follow the existing onboarding API convention.

Example:

```http
PUT /me/kitchen-equipment
```

Request:

```json
{
  "equipment": [
    "stove",
    "frying-pan",
    "pot",
    "rice-cooker"
  ]
}
```

Response:

```json
{
  "equipment": [
    "stove",
    "frying-pan",
    "pot",
    "rice-cooker"
  ]
}
```

Alternative:

```http
PUT /profile/kitchen-equipment
```

Consistency with Household and Preferences endpoints is more important than the exact path.

---

# 36. Catalog Endpoint

If the catalog is server-owned, conceptually:

```http
GET /kitchen-equipment/catalog
```

Response:

```json
{
  "items": [
    {
      "key": "stove",
      "label": "Stove",
      "category": "cooking-heat"
    },
    {
      "key": "rice-cooker",
      "label": "Rice Cooker",
      "category": "cooking-heat"
    }
  ]
}
```

However:

```text
Do not add a catalog endpoint purely for abstraction.
```

If the catalog is stable and shared through a package, the web can consume the shared contract directly.

---

# 37. Suggested Shared Package

If Flemme already has a shared contract layer:

```text
packages/contracts
```

or another suitable package, equipment keys can live there.

Example:

```ts
export const KitchenEquipmentKeys = [
  "stove",
  "induction-cooker",
  "oven",
  "air-fryer",
  "microwave",
  "rice-cooker",
  "frying-pan",
  "wok",
  "pot",
  "saucepan",
  "blender",
  "food-processor",
  "mixer",
  "steamer",
  "grill",
  "kettle",
  "pressure-cooker",
  "slow-cooker",
  "toaster",
] as const;
```

Then:

```ts
type KitchenEquipmentKey =
  typeof KitchenEquipmentKeys[number];
```

Use the existing project boundaries instead of adding a new package purely for this feature.

---

# 38. Suggested Database Shape

Option A — relational rows:

```text
user_kitchen_equipment

id
user_id
equipment_key
created_at
```

Unique:

```text
(user_id, equipment_key)
```

This is useful if individual equipment entries may evolve.

---

Option B — JSON / array field:

```text
user_cooking_profile

equipment: string[]
```

This is simpler if equipment is only needed as context.

Choose based on the current profile architecture.

Do not create a complex relational model without a concrete need.

---

# 39. Editing After Onboarding

Kitchen Equipment must remain editable.

Suggested location:

```text
Profile
→ Kitchen Equipment
```

or:

```text
Cooking Preferences
→ Kitchen Equipment
```

Editing should preload existing values.

Example:

```text
Previously selected:

✓ Stove
✓ Pan
✓ Rice Cooker
```

User adds:

```text
✓ Air Fryer
```

Future cooking contexts now include the air fryer.

---

# 40. Historical Session Preservation

Updating Kitchen Equipment should affect:

```text
future recommendations
future cooking sessions
```

It should not rewrite:

```text
historical cooking session snapshots
```

Example:

September session:

```text
Equipment:
stove
pan
```

October profile update:

```text
+ air fryer
```

The September session should still represent the context it was created with.

---

# 41. Inventory Separation

Important boundary:

```text
Kitchen Equipment
≠
Ingredient Inventory
```

Example:

```text
Kitchen Equipment:
- stove
- rice cooker
- blender

Inventory:
- rice
- eggs
- chicken
- garlic
```

Neither system should silently modify the other.

---

# 42. Recommendation Example

Persistent context:

```text
Household:
2 Adults
1 Child

Equipment:
Stove
Frying Pan
Pot
Rice Cooker

Inventory:
Chicken
Rice
Garlic
Egg
Soy Sauce
```

Good recommendation:

```text
Chicken Egg Rice Bowl
```

Reason:

```text
Uses your available ingredients and can be cooked
using your stove and frying pan.
```

Less suitable primary recommendation:

```text
Air-Fried Chicken Bowl
```

because:

```text
Air fryer is not known to be available.
```

---

# 43. Missing Equipment Example

User requests:

```text
Bikin lasagna.
```

Available:

```text
stove
pan
pot
```

No oven.

Flemme can:

```text
1. offer a stovetop lasagna variation,
2. mention the equipment difference,
3. ask for confirmation only if oven access is necessary.
```

Avoid:

```text
"Preheat your oven..."
```

when oven access was never established.

---

# 44. Unknown vs Missing

Important semantic distinction:

```text
Not selected
```

means:

```text
not known to be available
```

It does not necessarily mean:

```text
user definitely does not own it
```

For agent reasoning, prefer language like:

```text
unconfirmed
```

when appropriate.

This matches the broader Flemme principle of not inventing context.

---

# 45. Onboarding Completion State

After save:

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
Initial Inventory       ← next
Completion → Home
```

Conceptually:

```ts
{
  profilePreferences: true,
  household: true,
  kitchenEquipment: true,
  initialInventory: false
}
```

Use the current onboarding progress implementation instead of introducing a second progress system.

---

# 46. Resume Behaviour

If the user closes the browser during Kitchen Equipment onboarding:

```text
Onboarding progress remains incomplete.
```

When returning:

```text
Resume at Kitchen Equipment
```

If equipment selections were already successfully persisted:

```text
Kitchen Equipment = completed
```

and onboarding should continue to:

```text
Initial Inventory
```

---

# 47. Post-Onboarding Edit Behaviour

Editing Kitchen Equipment from `/app` or Profile must not restart onboarding.

Flow:

```text
App
→ Edit Kitchen Equipment
→ Save
→ Return to previous app context
```

Only an incomplete onboarding state should route into the onboarding progression.

---

# 48. Mobile Layout

Recommended mobile layout:

```text
←

What do you cook with?

Select the equipment you normally
have available.

Heat & Cooking

[ Stove        ✓ ]
[ Rice Cooker  ✓ ]
[ Oven           ]
[ Air Fryer      ]

Cookware

[ Frying Pan   ✓ ]
[ Wok            ]
[ Pot          ✓ ]

Preparation

[ Blender        ]
[ Mixer          ]

4 equipment selected

[ Continue ]
```

---

# 49. Desktop Layout

Keep content focused.

Suggested maximum width:

```text
600–720px
```

Equipment cards may use:

```text
2–3 columns
```

depending on available width.

Do not turn the onboarding step into a full equipment-management dashboard.

---

# 50. Mobile Interaction

Recommended minimum touch target:

```text
44–48px
```

Entire equipment card should be clickable.

Not only the checkbox/icon.

Example:

```text
┌───────────────────────┐
│ 🍳 Frying Pan       ✓ │
└───────────────────────┘
```

Tap anywhere on the card to toggle.

---

# 51. Accessibility

Selectable equipment must communicate state semantically.

Examples:

```text
Stove, selected
Oven, not selected
Rice Cooker, selected
```

Keyboard navigation should work on web.

Do not rely only on color to communicate selected state.

Use:

```text
icon
border
checkmark
text state
```

as appropriate.

---

# 52. UX Feedback

Optional summary:

```text
4 equipment selected
```

Singular:

```text
1 equipment selected
```

Better wording may simply be:

```text
1 item selected
4 items selected
```

to avoid awkward English plurality.

---

# 53. Out of Scope — v0.1

Do not implement:

```text
equipment brand
equipment model
equipment purchase date
power / wattage
pan diameter
pot capacity
oven dimensions
smart appliance integration
equipment maintenance
equipment condition
multiple kitchens
per-house equipment ownership
custom free-text equipment
equipment shopping
```

These do not materially improve the current cooking flow.

---

# 54. Future Possibilities

Potential future extension:

```text
Equipment
 ├── Air Fryer
 │    ├── capacity
 │    └── max temperature
 │
 ├── Oven
 │    ├── convection
 │    └── temperature range
 │
 └── Blender
      └── capability
```

Only introduce these properties if recipes genuinely need them.

---

# 55. Acceptance Criteria

Kitchen Equipment onboarding v0.1 is complete when:

- User can view supported equipment.
- Equipment is grouped clearly for usability.
- User can select multiple equipment items.
- User can deselect equipment.
- At least one equipment item is required.
- No equipment is silently preselected.
- No Skip action exists.
- Unsupported equipment keys are rejected by the API.
- Duplicate equipment is not persisted.
- Selected values survive API errors.
- Duplicate submission is prevented.
- Equipment persists successfully.
- Existing equipment preloads when editing.
- Successful onboarding advances to Initial Inventory or next incomplete step.
- Equipment becomes available through persistent cooking context.
- Recommendation uses equipment when evaluating recipe feasibility.
- Agent does not invent unavailable or unknown equipment.
- Session-specific equipment can override persistent context without silently changing the profile.
- Pre-Cooking equipment requirements remain separate from owned equipment.
- Updating equipment does not modify inventory.
- Updating equipment does not rewrite historical cooking sessions.
- Equipment can be edited after onboarding.
- Post-onboarding editing does not restart onboarding.

---

# 56. Final v0.1 Contract

Persistent conceptual contract:

```ts
type KitchenContext = {
  equipment: KitchenEquipmentKey[];
};
```

Example:

```ts
const kitchen = {
  equipment: [
    "stove",
    "frying-pan",
    "pot",
    "rice-cooker",
  ],
};
```

Agent principle:

```text
Persistent Equipment
= what Flemme normally knows is available.

Session Equipment
= what is available for this cooking session.

Explicit session context wins.

Unknown equipment must never be silently invented.
```

---

# 57. Final Scope Boundary

```text
Profile Preferences
→ HOW the user generally likes to eat

Household
→ WHO the user normally cooks for

Kitchen Equipment
→ WHAT the user can normally cook with

Initial Inventory
→ WHAT ingredients the user currently has
```

This separation should remain consistent across:

```text
Onboarding
Persistence
Cooking Context
Recommendation
Pre-Cooking
Active Cooking
```

---

# Next Onboarding Stage

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
Initial Inventory       ← next
Completion → Home
```
