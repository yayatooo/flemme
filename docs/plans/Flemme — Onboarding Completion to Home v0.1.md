# Flemme — Onboarding Completion → Home v0.1

## Status

```text
ONBOARDING
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
Initial Inventory       ✅
Completion → Home       ← current
```

This is the final step of Flemme onboarding v0.1.

---

# 1. Purpose

The Completion step finalizes onboarding and transitions the user into the main Flemme application.

Its responsibility is simple:

```text
Confirm onboarding is complete
        ↓
Persist completion state
        ↓
Prevent future onboarding redirects
        ↓
Send user to Home
```

This step must not introduce another profile or cooking domain.

It exists to close the onboarding lifecycle cleanly.

---

# 2. Core Principle

Completion is a:

```text
STATE TRANSITION
```

not a new onboarding form.

Do not ask the user for additional information here.

Do not introduce:

```text
extra preferences
extra profile questions
newsletter opt-in
notification setup
tutorial carousel
account upsell
inventory confirmation
```

The user has already completed onboarding.

The final step should feel fast.

---

# 3. Final Onboarding Flow

```text
Profile Preferences
        ↓
Household
        ↓
Kitchen Equipment
        ↓
Initial Inventory
        ↓
Completion
        ↓
Home
```

After Completion:

```text
onboardingCompleted = true
```

The user should no longer be treated as an onboarding user.

---

# 4. Completion Preconditions

Before marking onboarding complete, the application should confirm all required steps are complete.

Required:

```text
Profile Preferences     ✅
Household               ✅
Kitchen Equipment       ✅
```

Initial Inventory is optional.

Therefore both states are valid:

```text
Initial Inventory
→ items added
```

and:

```text
Initial Inventory
→ Add later
```

Both satisfy onboarding completion.

---

# 5. Completion Rule

Conceptually:

```ts
const canCompleteOnboarding =
  profilePreferencesCompleted &&
  householdCompleted &&
  kitchenEquipmentCompleted &&
  initialInventoryDecisionCompleted;
```

Important:

```text
initialInventoryDecisionCompleted
```

does not mean:

```text
inventory.items.length > 0
```

It means the user either:

```text
added ingredients
```

or:

```text
chose Add later
```

---

# 6. Persistent Completion State

The backend should own the canonical onboarding completion state.

Conceptually:

```ts
type OnboardingState = {
  profilePreferences: boolean;
  household: boolean;
  kitchenEquipment: boolean;
  initialInventory: boolean;
  completed: boolean;
};
```

Exact shape should follow the existing onboarding implementation.

The important rule:

```text
completed = true
```

must be persisted.

Do not derive final completion purely from browser state.

---

# 7. Why Completion Must Be Persisted

Browser-only completion would break when the user:

```text
changes device
clears browser storage
uses incognito
logs in elsewhere
```

Therefore:

```text
Backend state
= onboarding source of truth
```

Frontend state may cache it, but must not own it.

---

# 8. Completion Endpoint

Follow the existing onboarding API convention.

Conceptually:

```http
POST /onboarding/complete
```

or:

```http
PUT /me/onboarding
```

Example request:

```json
{
  "completed": true
}
```

Better implementation may require no payload at all:

```http
POST /onboarding/complete
```

because the server can determine whether completion is valid.

Recommended principle:

```text
Server verifies required onboarding steps.
```

Do not trust the client to decide eligibility.

---

# 9. Server Validation

The completion endpoint should check:

```text
Profile Preferences completed?
Household completed?
Kitchen Equipment completed?
Initial Inventory decision completed?
```

If yes:

```text
mark onboarding completed
```

If no:

```text
reject completion
```

Example:

```http
409 ONBOARDING_INCOMPLETE
```

or whatever error convention the API already uses.

---

# 10. Idempotency

Completion must be idempotent.

If the user is already completed:

```text
POST /onboarding/complete
```

should not create an error or duplicate state.

Conceptually:

```text
completed → completed
```

is valid.

This protects against:

```text
double click
retry
network replay
browser refresh
duplicate request
```

---

# 11. Completion Screen

Recommended completion UI:

```text
You're all set 🎉

Flemme now knows enough to help you cook
with your preferences, household, and kitchen setup.

You can always update these later.

[ Start Cooking ]
```

Keep it short.

---

# 12. Alternative Indonesian Copy

```text
Semua siap 🎉

Flemme sekarang sudah punya cukup konteks
untuk bantu kamu masak berdasarkan preferensi,
anggota rumah, dan peralatan dapurmu.

Semua pengaturan ini bisa kamu ubah kapan saja.

[ Mulai Masak ]
```

---

# 13. Inventory-Safe Copy

Do not say:

```text
Flemme knows what's in your kitchen.
```

because the user may have selected:

```text
Add later
```

Instead use:

```text
your preferences
your household
your kitchen setup
```

or:

```text
the cooking context you've shared
```

This keeps the completion message honest.

---

# 14. Optional Completion Summary

If desired:

```text
Your setup

✓ Food preferences
✓ Household
✓ Kitchen equipment
✓ Inventory setup
```

But avoid wording:

```text
✓ Inventory
```

when the user skipped inventory.

Better:

```text
✓ Inventory setup
```

because both:

```text
added items
```

and:

```text
Add later
```

count as completed onboarding decisions.

---

# 15. Completion CTA

Primary CTA:

```text
Start Cooking
```

Recommended destination:

```text
/app
```

or the canonical Home route used by Flemme.

Do not send the user into another setup flow.

---

# 16. Auto Redirect vs CTA

Recommended behavior:

```text
Completion screen
→ user sees success state
→ Start Cooking
→ /app
```

Do not auto-redirect immediately.

Reason:

The success state gives the user a clear mental transition:

```text
setup finished
→ app begins
```

However, the screen should remain minimal.

---

# 17. Returning to Completion Screen

If onboarding is already complete and the user manually navigates to:

```text
/onboarding/complete
```

recommended behavior:

```text
redirect → /app
```

Do not show the completion screen repeatedly.

The completion screen is a transition state, not a normal app page.

---

# 18. Root Onboarding Guard

When accessing:

```text
/onboarding
```

the application should evaluate onboarding state.

Conceptually:

```text
if onboarding.completed
  → /app

else
  → next incomplete onboarding step
```

This should remain the single high-level behavior.

---

# 19. Next Incomplete Step Resolution

For incomplete users:

```text
Profile Preferences incomplete
→ /onboarding/preferences
```

else:

```text
Household incomplete
→ /onboarding/household
```

else:

```text
Kitchen Equipment incomplete
→ /onboarding/kitchen
```

else:

```text
Initial Inventory decision incomplete
→ /onboarding/inventory
```

else:

```text
Completion
```

This keeps onboarding resumable.

---

# 20. Completed User Guard

Any onboarding route should respect:

```text
onboarding.completed === true
```

Example:

```text
/onboarding/preferences
/onboarding/household
/onboarding/kitchen
/onboarding/inventory
/onboarding/complete
```

If already completed:

```text
redirect → /app
```

unless the route is explicitly being used as an edit surface.

---

# 21. Editing After Onboarding

Post-onboarding editing must remain separate from onboarding lifecycle.

Examples:

```text
/app/preferences
/app/household
/app/kitchen
/app/inventory
```

or current equivalent edit routes.

Editing:

```text
Household
Kitchen Equipment
Preferences
Inventory
```

must not set:

```text
onboarding.completed = false
```

---

# 22. Important Boundary

Once onboarding is completed:

```text
profile edit
≠
onboarding restart
```

Example:

```text
User changes Household from:
1 adult

to:
2 adults
```

Result:

```text
Household updated
Onboarding remains completed
```

---

# 23. Home Guard

Home should require:

```text
authenticated
AND
onboarding completed
```

Conceptually:

```text
Unauthenticated
→ Login

Authenticated + onboarding incomplete
→ Onboarding

Authenticated + onboarding completed
→ Home
```

---

# 24. Canonical Routing Logic

```text
User opens Flemme
        ↓
Authenticated?
   ├── No
   │    ↓
   │  Login
   │
   └── Yes
        ↓
Onboarding completed?
   ├── No
   │    ↓
   │  Next incomplete step
   │
   └── Yes
        ↓
       /app
```

This should become the canonical top-level routing behavior.

---

# 25. First Home Experience

After clicking:

```text
Start Cooking
```

the user lands on Home.

Home should immediately be usable.

Do not introduce another forced modal such as:

```text
Complete your profile
Add your inventory
Configure your kitchen
```

Onboarding is already finished.

---

# 26. Home Context

At this point Flemme may have:

```text
Profile Preferences
Household
Kitchen Equipment
Inventory
```

Inventory may be empty.

Home should work in both cases.

---

# 27. Home With Inventory

Example:

```text
Known inventory:
egg
rice
garlic
chicken
```

Home may offer:

```text
What do you want to cook today?
```

and use persistent inventory when Recommendation begins.

Optional UI:

```text
4 ingredients in your inventory
```

but this is not required for Completion v0.1.

---

# 28. Home Without Inventory

If:

```text
inventory.items.length === 0
```

Home should still work normally.

Example prompt:

```text
What ingredients do you have today?
```

The user can provide ingredients through the normal Recommendation flow.

Do not redirect them back to inventory onboarding.

---

# 29. Recommendation Readiness

After onboarding completion, Flemme has enough context to begin Recommendation.

Conceptually:

```text
Profile Preferences
        +
Household
        +
Kitchen Equipment
        +
Inventory / Session Ingredients
        ↓
Cooking Recommendation
```

If Inventory is empty:

```text
Session Ingredients
```

can provide the missing context.

---

# 30. No Automatic Recommendation

Do not generate a recipe immediately after onboarding completion.

Flow should remain:

```text
Completion
→ Home
→ User expresses cooking intent
→ Recommendation
```

Do not:

```text
Completion
→ automatically call AI
```

This avoids unnecessary model usage and preserves user intent.

---

# 31. Completion Failure

If the final completion request fails:

```text
Couldn't finish setup.
Your information has already been saved.
Please try again.
```

Actions:

```text
Try Again
```

Do not force the user to repeat earlier onboarding steps.

---

# 32. Completion State Failure

If the server reports:

```text
ONBOARDING_INCOMPLETE
```

the client should:

```text
refresh onboarding state
        ↓
resolve actual next incomplete step
        ↓
navigate there
```

Example:

```text
Kitchen Equipment was never persisted
→ /onboarding/kitchen
```

This protects against stale client state.

---

# 33. Race Conditions

Prevent competing actions during completion.

While:

```text
completeOnboarding()
```

is running:

```text
disable Start Cooking
```

Prevent:

```text
double submit
multiple completion requests
multiple redirects
```

---

# 34. Refresh During Completion

If the user refreshes after backend completion but before navigation:

```text
GET onboarding state
→ completed = true
→ redirect /app
```

The user should not become stuck on the completion page.

---

# 35. Back Button Behaviour

After Completion → Home:

browser Back may technically return toward onboarding history.

Route guards should immediately detect:

```text
completed === true
```

and redirect back to:

```text
/app
```

This prevents users from accidentally re-entering onboarding.

---

# 36. Logout and Login Again

User completes onboarding:

```text
completed = true
```

then logs out.

Later logs in again:

```text
Login
→ onboarding state loaded
→ completed = true
→ /app
```

Do not show onboarding again.

---

# 37. Cross-Device Behaviour

Because completion is persisted:

```text
Device A
→ completes onboarding
```

then:

```text
Device B
→ login
→ onboarding completed
→ /app
```

No onboarding repetition.

---

# 38. Browser Storage

Browser storage may cache:

```text
onboarding progress
```

for UX/performance.

However:

```text
browser state != source of truth
```

Backend completion state wins.

---

# 39. Progress Indicator

On Completion page:

```text
Step 5 of 5
```

or:

```text
Setup complete
```

No need for an active form progress indicator anymore.

Preferred:

```text
Setup complete
```

because there is no remaining input.

---

# 40. Completion Page Layout

Mobile:

```text
        🎉

    You're all set

Flemme is ready to help you cook
with the context you've shared.

You can update your setup anytime.

[ Start Cooking ]
```

Keep the CTA near the bottom but visible without excessive scrolling.

---

# 41. Desktop Layout

Keep completion centered.

Suggested:

```text
max-width: 480–600px
```

No dashboard-like layout.

The visual focus should be:

```text
success
+
one CTA
```

---

# 42. Visual Design

Recommended:

```text
simple success icon
Flemme brand visual
short copy
single strong CTA
```

Avoid:

```text
large confetti animation
multi-step tutorial
feature carousel
complex metrics
```

A subtle animation is fine but not required.

---

# 43. Accessibility

Completion success should have a clear heading:

```text
You're all set
```

Primary CTA:

```text
Start Cooking
```

must be keyboard accessible.

If animation exists:

```text
respect prefers-reduced-motion
```

---

# 44. Analytics — Optional

If analytics already exist, potential events:

```text
onboarding_completed
onboarding_start_cooking_clicked
```

Useful dimensions:

```text
inventory_added: true | false
```

Do not introduce analytics infrastructure solely for this task.

---

# 45. Completion Timestamp

Recommended persistence:

```text
completedAt
```

Example:

```ts
{
  completed: true,
  completedAt: Date
}
```

Useful for:

```text
debugging
analytics
migration
future onboarding versions
```

But if current architecture already has a sufficient completion timestamp, reuse it.

---

# 46. Onboarding Versioning

Potential future concern:

```text
onboarding v0.1
onboarding v0.2
```

Do not implement a complex migration/version engine now.

Optional future-friendly field:

```text
onboardingVersion
```

Example:

```text
"v0.1"
```

But:

```text
not required for current task
```

unless onboarding architecture already supports it.

---

# 47. Do Not Reopen Onboarding Automatically

Future features may add:

```text
new preferences
new household fields
new equipment
```

Do not automatically reset:

```text
completed = false
```

for existing users.

New profile fields should normally be introduced through:

```text
optional prompts
profile editing
feature-specific setup
```

not forced onboarding replay.

---

# 48. Completion vs Profile Completeness

Important distinction:

```text
Onboarding complete
```

does not mean:

```text
Every possible profile field is populated forever.
```

It means:

```text
The user has provided enough initial context
to use Flemme.
```

This prevents future features from breaking existing user access.

---

# 49. Final State Model

Conceptually:

```ts
type OnboardingStatus =
  | {
      completed: false;
      nextStep:
        | "profile-preferences"
        | "household"
        | "kitchen-equipment"
        | "initial-inventory"
        | "completion";
    }
  | {
      completed: true;
      nextStep: null;
    };
```

This is conceptual only.

Reuse existing implementation where possible.

---

# 50. Recommended Completion Resolution

Server-side conceptual logic:

```ts
function resolveOnboardingStatus(context) {
  if (!context.profilePreferencesCompleted) {
    return "profile-preferences";
  }

  if (!context.householdCompleted) {
    return "household";
  }

  if (!context.kitchenEquipmentCompleted) {
    return "kitchen-equipment";
  }

  if (!context.initialInventoryDecisionCompleted) {
    return "initial-inventory";
  }

  if (!context.completed) {
    return "completion";
  }

  return null;
}
```

Keep the actual implementation aligned with the existing project architecture.

---

# 51. Completion Is Not Required for Editing

An important distinction:

```text
Onboarding
→ creates initial cooking context

App Settings
→ modifies persistent cooking context
```

After completion, all future profile changes happen through app functionality.

---

# 52. Cooking Context After Completion

Final persistent cooking context may look conceptually like:

```ts
{
  foodPreferences: [...],
  cookingPreferences: [...],

  household: {
    adults: 2,
    children: 1,
    toddlers: 0
  },

  kitchen: {
    equipment: [
      "stove",
      "frying-pan",
      "rice-cooker"
    ]
  },

  inventory: [
    { name: "egg" },
    { name: "rice" }
  ]
}
```

If inventory was skipped:

```ts
inventory: []
```

This is still valid.

---

# 53. Agent Boundary

Completion itself must not call the Agent.

No:

```text
Recommendation Agent
Pre-Cooking Agent
Active Cooking Agent
Completion Agent
```

should run during onboarding completion.

Important:

```text
Onboarding Completion
≠
Cooking Completion
```

These are different concepts.

---

# 54. Naming Collision

Flemme already has a cooking lifecycle phase named:

```text
Completion
```

Therefore implementation names should avoid ambiguity.

Recommended internal naming:

```text
OnboardingCompletion
completeOnboarding
onboardingCompleted
```

Avoid generic:

```text
CompletionService
complete()
```

that could be confused with Cooking Completion.

---

# 55. Initial Home CTA

Completion CTA:

```text
Start Cooking
```

does not have to immediately create a Cooking Session.

It simply enters:

```text
Home
```

From Home:

```text
Cooking intent
→ Recommendation
→ Select Recipe
→ Pre-Cooking
→ Create Cooking Session
```

Keep lifecycle boundaries intact.

---

# 56. Out of Scope — v0.1

Do not implement:

```text
interactive product tour
guided Home walkthrough
AI-generated welcome message
automatic recipe recommendation
notification permission
camera permission
premium upsell
referral prompt
rating prompt
email confirmation
profile completion score
achievement system
complex onboarding version migrations
```

Completion should remain lightweight.

---

# 57. Acceptance Criteria

Onboarding Completion → Home v0.1 is complete when:

- Required onboarding steps are verified before completion.
- Initial Inventory may be empty.
- Inventory Add later counts as a valid onboarding decision.
- Completion state is persisted server-side.
- Completion is idempotent.
- Duplicate completion submissions are prevented.
- A successful completion state is shown.
- User can select Start Cooking.
- Start Cooking navigates to `/app`.
- Completed users navigating to onboarding are redirected to `/app`.
- Incomplete users navigating to Home are redirected to their next incomplete onboarding step.
- Returning incomplete users resume at the correct step.
- Returning completed users go directly to Home.
- Logout/login does not restart onboarding.
- Cross-device login respects completed onboarding.
- Refreshing during/after completion does not break navigation.
- Browser Back cannot meaningfully re-enter onboarding after completion.
- Editing Preferences after onboarding does not restart onboarding.
- Editing Household after onboarding does not restart onboarding.
- Editing Kitchen Equipment after onboarding does not restart onboarding.
- Editing Inventory after onboarding does not restart onboarding.
- Empty Inventory does not block Home.
- Home does not automatically invoke Recommendation.
- Onboarding Completion does not invoke any cooking Agent.
- Cooking Completion and Onboarding Completion remain separate domain concepts.

---

# 58. Verification Checklist

## API

```text
□ incomplete onboarding cannot be completed
□ valid onboarding can be completed
□ inventory with items accepted
□ inventory Add later accepted
□ repeated completion remains safe
□ completion persists across requests
□ authenticated ownership enforced
```

## Web

```text
□ success screen renders
□ Start Cooking navigates to /app
□ duplicate click prevented
□ request error preserves success page state
□ completed route guard works
□ incomplete route guard works
□ refresh works
□ browser Back cannot reopen onboarding
```

## Full Flow

```text
Register / Login
        ↓
Profile Preferences
        ↓
Household
        ↓
Kitchen Equipment
        ↓
Inventory
        ├── add ingredients
        └── Add later
        ↓
Completion
        ↓
Start Cooking
        ↓
/app
```

Then:

```text
Logout
→ Login
→ /app
```

without onboarding replay.

---

# 59. Final Onboarding Contract

```text
Profile Preferences
→ required

Household
→ required

Kitchen Equipment
→ required

Initial Inventory
→ optional content
→ required decision

Completion
→ persisted lifecycle transition
```

Final rule:

```text
Onboarding is complete once Flemme has enough
persistent context for the user to enter the product.

It does not mean every possible piece of user
context must already exist.
```

---

# 60. Final User Lifecycle

```text
NEW USER
   ↓
Authentication
   ↓
Onboarding
   ↓
Completion
   ↓
ACTIVE USER
   ↓
Home
   ↓
Recommendation
   ↓
Select Recipe
   ↓
Pre-Cooking
   ↓
Cooking Session
   ↓
Active Cooking
   ↓
Cooking Completion
```

This formally separates:

```text
Account Setup Lifecycle
```

from:

```text
Cooking Lifecycle
```

---

# 61. Final v0.1 Status

After successful implementation:

```text
FLEMME ONBOARDING v0.1

01 Profile Preferences    ✅ LOCKED
02 Household              ✅ LOCKED
03 Kitchen Equipment      ✅ LOCKED
04 Initial Inventory      ✅ LOCKED
05 Completion → Home      ✅ LOCKED
```

Result:

```text
ONBOARDING v0.1 COMPLETE
```

Next product entry point:

```text
HOME
→ Recommendation
```