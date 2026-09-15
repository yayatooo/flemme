# Flemme — Household Onboarding v0.1

## Status

```text
ONBOARDING
Profile Preferences     ✅
Household               ← current
Kitchen Equipment
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

Household onboarding collects basic information about **who the user normally cooks for**.

The purpose is not to build a detailed family profile.

The household context exists so Flemme can make better decisions around:

- recipe suitability,
- serving suggestions,
- portion expectations,
- cooking practicality,
- family-friendly recommendations,
- toddler / child considerations.

Household information becomes part of the persistent cooking context.

Flemme should use this context automatically instead of repeatedly asking:

> "Masak untuk berapa orang?"

when the answer can already be reasonably derived from the user's household profile.

Session-specific requests may still override household defaults.

Example:

```text
Household profile:

Adults: 2
Children: 1
Toddlers: 0
```

Normal recommendation:

```text
Default target:
3 people
```

But if the user requests:

> "Masak makan malam untuk saya sendiri."

then:

```text
Session request overrides household default.
```

---

# 2. Design Principle

Household onboarding should remain:

```text
Simple
→ useful
→ editable
→ reusable by AI
```

Avoid turning household onboarding into a detailed family-management system.

For v0.1, Flemme only needs to understand household composition.

The canonical household contract is:

```ts
type Household = {
  adults: number;
  children: number;
  toddlers: number;
};
```

This keeps onboarding directly compatible with the existing cooking recommendation context.

---

# 3. Household Categories

Flemme recognizes three household groups.

## Adult

```text
Adult
```

General adult household member.

Example:

```text
2 Adults
```

---

## Child

```text
Child
```

A child who may eat regular meals but may require adjustments such as:

- less spicy food,
- simpler flavors,
- smaller portions,
- family-friendly preparation.

Exact age is intentionally not collected in v0.1.

---

## Toddler

```text
Toddler
```

A younger household member where Flemme may need to be more conservative when recommending meals.

Examples of possible considerations:

- texture,
- spice level,
- portion,
- preparation style.

Toddler presence should act as a **context signal**, not as a medical or nutritional diagnosis.

Flemme must not automatically claim a recipe is medically or developmentally appropriate.

---

# 4. Recommended Screen

## Header

```text
Who's eating with you?
```

Supporting copy:

```text
Tell Flemme who you usually cook for.
We'll use this to make recipes and portions more relevant.
```

Alternative Indonesian copy:

```text
Biasanya kamu masak untuk siapa?
```

```text
Flemme akan menggunakan informasi ini untuk menyesuaikan
resep, porsi, dan rekomendasi makanan.
```

---

# 5. Household Selector

Recommended UI:

```text
┌────────────────────────────────────┐
│ Adults                             │
│ Usually eats a regular portion     │
│                         −   2   +  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Children                           │
│ Smaller / family-friendly meals    │
│                         −   1   +  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Toddlers                           │
│ Younger household members          │
│                         −   0   +  │
└────────────────────────────────────┘
```

Each category uses a simple numeric stepper:

```text
[ − ]   count   [ + ]
```

---

# 6. Recommended Default

Initial state:

```ts
{
  adults: 1,
  children: 0,
  toddlers: 0,
}
```

Reason:

A logged-in user can reasonably be treated as one adult unless they explicitly change the household composition.

This also avoids the invalid state:

```text
0 adults
0 children
0 toddlers
```

during the initial onboarding experience.

---

# 7. Quick Household Presets

Optional UX improvement:

```text
Just me
Couple
Family
Custom
```

These are shortcuts only.

They must still map into the same canonical household contract.

Example:

### Just me

```ts
{
  adults: 1,
  children: 0,
  toddlers: 0,
}
```

### Couple

```ts
{
  adults: 2,
  children: 0,
  toddlers: 0,
}
```

### Family

Selecting `Family` should **not** guess the composition.

Instead it can simply focus the user on the household steppers.

Example:

```text
Adults      2
Children    1
Toddlers    0
```

`Custom` behaves the same way.

Presets are convenience UI and should not create additional database concepts.

---

# 8. Validation

Minimum rules:

```ts
adults >= 0
children >= 0
toddlers >= 0
```

At least one household member must exist:

```ts
adults + children + toddlers >= 1
```

Recommended upper limit:

```ts
adults <= 20
children <= 20
toddlers <= 20
```

The exact upper bound is primarily defensive validation and not a product limitation.

---

# 9. Continue Behaviour

Primary action:

```text
Continue
```

or:

```text
Next
```

The button should be disabled only when:

```text
adults + children + toddlers === 0
```

Flow:

```text
Household
    ↓
Save Household
    ↓
Kitchen Equipment
```

Household information should be persisted before advancing.

---

# 10. Skip Behaviour

Recommended:

```text
Do not provide Skip.
```

Household composition is small enough to complete quickly and provides meaningful context for the core Flemme recommendation flow.

Because the default is already:

```ts
{
  adults: 1,
  children: 0,
  toddlers: 0,
}
```

a user who lives alone can simply continue immediately.

---

# 11. Persistent Context

Household information belongs to the user profile / cooking context.

Conceptually:

```text
User
 ├── Profile Preferences
 ├── Household
 ├── Kitchen Equipment
 └── Inventory
```

Household should not belong to a Cooking Session.

Instead:

```text
Persistent Household
        ↓
Cooking Recommendation Context
        ↓
Session-specific override
```

---

# 12. Recommendation Integration

Current cooking recommendation context expects:

```ts
household: {
  adults: number;
  children: number;
  toddlers: number;
}
```

Example:

```json
{
  "household": {
    "adults": 2,
    "children": 1,
    "toddlers": 0
  }
}
```

Recommendation runtime can use this context for:

```text
serving estimation
recipe suitability
preference weighting
family-friendly alternatives
spice considerations
portion suggestions
```

Example:

```text
Inventory:
- chicken
- rice
- chili
- garlic

Household:
2 adults
1 child
```

Instead of blindly recommending:

```text
Extra Spicy Chicken Rice
```

Flemme may prefer:

```text
Chicken Rice
```

with an optional adult variation:

```text
Add sambal separately for adults.
```

The household context influences ranking.

It does not automatically forbid recipes.

---

# 13. Toddler Behaviour

If:

```ts
toddlers > 0
```

Flemme should treat toddler presence as an additional suitability signal.

Potential recommendation behaviour:

```text
Prefer:
- simple preparation
- adjustable seasoning
- separate spicy condiment
- easily separable portions
```

Avoid assumptions such as:

```text
"This is guaranteed safe for toddlers."
```

Instead Flemme can communicate:

```text
You may want to set aside an unseasoned portion before
adding stronger seasoning.
```

Exact child-development nutrition rules are outside the responsibility of Household v0.1.

---

# 14. Household vs Servings

Household size is **not automatically equal to servings requested for every cooking session**.

Example household:

```ts
{
  adults: 2,
  children: 1,
  toddlers: 0
}
```

Total:

```text
3 household members
```

But a session may request:

```text
"Masak buat aku sendiri."
```

Session:

```ts
servings: 1
```

Priority:

```text
Session request
    ↓
Explicit servings
    ↓
Household defaults
```

Therefore:

```text
session.servings overrides household-derived serving assumptions.
```

Household is a default context, not a hard constraint.

---

# 15. Household vs Food Preferences

Household should not duplicate food preference data.

Example:

```text
Household:
2 Adults
1 Child
```

Food Preferences:

```text
Asian
Spicy
No Beef
```

The two contexts remain separate.

Household describes:

```text
WHO
```

Food preferences describe:

```text
WHAT THEY GENERALLY LIKE / AVOID
```

Recommendation combines both signals.

---

# 16. Household vs Inventory

Household context must not modify inventory.

Changing:

```text
Adults: 1 → 2
```

must not:

```text
increase inventory
decrease inventory
create shopping items
```

It only affects recommendation and cooking context.

---

# 17. Edit After Onboarding

Household information must remain editable after onboarding.

Suggested location:

```text
Profile
→ Household
```

Potential future UI:

```text
Cooking Preferences
Household
Kitchen Equipment
```

Updating Household changes future recommendation context.

It must not rewrite historical cooking sessions.

Example:

```text
September 2026:
2 adults

October 2026:
2 adults + 1 child
```

A cooking session created in September should preserve its historical session context.

---

# 18. Data Ownership

Household belongs to:

```text
User
```

Not:

```text
Cooking Session
Recipe
Inventory Item
Favorite
```

Conceptual relationship:

```text
User
 │
 └── Household Profile
        │
        └── loaded into Cooking Context
                │
                └── Recommendation
```

---

# 19. Suggested API Contract

Exact endpoint naming can follow the final onboarding API convention.

Example concept:

```http
PUT /me/household
```

Request:

```json
{
  "adults": 2,
  "children": 1,
  "toddlers": 0
}
```

Response:

```json
{
  "adults": 2,
  "children": 1,
  "toddlers": 0
}
```

Possible alternative:

```http
PUT /profile/household
```

Endpoint naming should remain consistent with the existing Profile Preferences implementation.

---

# 20. Suggested Database Shape

Keep the persistence model minimal.

Example:

```ts
userHousehold {
  userId
  adults
  children
  toddlers
  createdAt
  updatedAt
}
```

Possible alternative:

Store these fields as part of a broader user cooking profile.

The implementation choice should follow the existing profile/preferences persistence pattern.

The important contract is:

```ts
{
  adults: number;
  children: number;
  toddlers: number;
}
```

---

# 21. Onboarding Progress

After successful Household save:

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ← next
Initial Inventory
Completion → Home
```

The onboarding system should know that Household has been completed independently from the other onboarding stages.

Conceptually:

```ts
{
  profilePreferences: true,
  household: true,
  kitchenEquipment: false,
  initialInventory: false
}
```

Exact persistence structure depends on the existing onboarding architecture.

---

# 22. UX States

## Default

```text
Adults      1
Children    0
Toddlers    0

[ Continue ]
```

---

## Family Example

```text
Adults      2
Children    2
Toddlers    1

5 people in your household

[ Continue ]
```

Optional summary:

```text
Cooking for a household of 5
```

---

## Invalid State

```text
Adults      0
Children    0
Toddlers    0
```

Show:

```text
Add at least one household member.
```

Disable:

```text
Continue
```

---

## Saving

```text
Saving...
```

Prevent duplicate submission.

---

## Error

Example:

```text
Couldn't save your household.
Please try again.
```

Do not discard the selected counts.

---

# 23. Responsive Behaviour

Mobile:

```text
Header

Adult Card
Child Card
Toddler Card

Household summary

Continue
```

Desktop:

The onboarding content should remain focused and relatively narrow.

Suggested:

```text
max-width: 520–640px
```

Avoid turning the onboarding page into a dashboard.

---

# 24. Accessibility

Stepper controls should include accessible labels.

Example:

```text
Decrease adults
Increase adults

Decrease children
Increase children

Decrease toddlers
Increase toddlers
```

The numeric count should remain readable independently of color.

Clickable areas should be large enough for touch interaction.

---

# 25. Out of Scope — v0.1

Do not implement:

```text
household member names
individual profiles
birth dates
exact ages
gender
per-person food preferences
per-person allergies
per-person nutrition targets
relationship labels
family account sharing
multiple households
household invitations
parent / child accounts
```

These concepts can be evaluated later if Flemme genuinely requires individual-level personalization.

For now:

```text
Household = cooking context.
```

Not:

```text
Household = family management system.
```

---

# 26. Future Possibilities

Potential later evolution:

```text
Household
 ├── Member A
 │    ├── age group
 │    ├── preferences
 │    └── restrictions
 │
 ├── Member B
 │    ├── age group
 │    └── preferences
 │
 └── Member C
```

This should only be introduced when the product requires recommendation personalization at an individual level.

It is intentionally excluded from v0.1.

---

# 27. Acceptance Criteria

Household onboarding v0.1 is complete when:

- User can set adult count.
- User can set child count.
- User can set toddler count.
- At least one household member is required.
- Default household starts with one adult.
- Household can be persisted.
- Household can be retrieved as part of user cooking context.
- Recommendation receives household context.
- Explicit session servings can override household assumptions.
- Household changes do not mutate inventory.
- Household changes do not mutate historical cooking sessions.
- Household can be edited after onboarding.
- Successful completion advances onboarding to Kitchen Equipment.
- AI does not unnecessarily ask household size when persistent context already provides it.

---

# 28. Final v0.1 Contract

```ts
type Household = {
  adults: number;
  children: number;
  toddlers: number;
};
```

Example:

```ts
const household = {
  adults: 2,
  children: 1,
  toddlers: 0,
};
```

Design philosophy:

```text
Household tells Flemme WHO the user normally cooks for.

Session tells Flemme WHO they are cooking for right now.

Explicit session context always wins.
```

---

# Next Onboarding Stage

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ← next
Initial Inventory
Completion → Home
```