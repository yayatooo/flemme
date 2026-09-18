# Flemme Web — Phase 10: Profile & Preferences v0.1

## Status

**Completed**

Flemme Core User Flow v0.1 is complete.

Before entering full UI/UX refinement, add one final user-facing account/settings surface:

```text
/app/profile
```

The Profile page is the central place for the user to review and edit persistent personal cooking context.

## Scope

```text
Profile
├── Personal Information
├── Cooking References / Preferences
├── Household
└── Logout
```

This phase must reuse existing persisted profile/onboarding/context data.

Do not create duplicate profile, household, or preference stores.

---

# 1. Product Goal

The Profile page should answer:

```text
Who am I in Flemme?
What food/cooking preferences does Flemme remember?
Who am I cooking for?
How can I update that context?
How do I sign out?
```

This is a settings/profile surface, not a dashboard.

---

# 2. Core Principle

Profile manages persistent context.

The data edited here may affect future:

```text
Recommendation
Pre-Cooking context
Home personalization
```

It must not silently alter an already-created immutable Cooking Session.

Existing Cooking Sessions remain historical truth.

---

# 3. Route

Add:

```text
/app/profile
```

Keep the route thin.

Conceptually:

```tsx
function ProfileRoute() {
	return <ProfilePage />;
}
```

Do not place the entire page markup in the route file.

---

# 4. Entry Point

The existing `AppHeader` profile/avatar control should navigate to:

```text
/app/profile
```

Do not create a second global navigation item unless product design later requires it.

Profile is accessible from the header.

---

# 5. Mandatory UI Stack

Continue using:

```text
React
TanStack Router
TanStack Query
Tailwind CSS
shadcn/ui
Lucide
```

Keep the same Flemme visual identity:

```text
neubrutalism
+
groovy retro
+
mobile-first
```

Use a practical settings layout.

---

# 6. Recommended Feature Structure

Preferred:

```text
apps/web/src/features/profile/
├── profile-page.tsx
├── personal-information-section.tsx
├── cooking-preferences-section.tsx
├── household-section.tsx
├── logout-section.tsx
├── profile-query.ts
├── profile-mutations.ts
└── index.ts
```

Reuse existing onboarding/context modules where appropriate.

Do not duplicate forms unnecessarily.

---

# 7. Page Composition

Recommended:

```text
Profile

[ Avatar / name ]

Personal information
[ Name ]
[ Email ]

Cooking preferences
[ cuisine references ]
[ food preferences ]
[ cooking preferences ]

Household
2 adults · 1 child
[ Edit household ]

Account
[ Log out ]
```

Keep the hierarchy simple.

---

# 8. Personal Information

Show at minimum:

```text
profile image/avatar
display name
email
```

Use existing authenticated user/session data.

Display priority remains:

```text
name
↓
email username
↓
User
```

Do not expose raw auth-provider metadata.

---

# 9. Editable Personal Information

Inspect current auth/user persistence before enabling edits.

Preferred v0.1:

```text
display name → editable if existing user model supports it
email → read-only unless current auth architecture safely supports change
avatar → use existing provider image; editing can be deferred
```

Do not implement email-change/account-verification flows in this task unless they already exist.

---

# 10. Google Login Compatibility

Users authenticated through Google may already have:

```text
name
email
image
```

Profile should display these normally.

The UI must not need to special-case Google beyond available normalized user fields.

---

# 11. Cooking References / Preferences

This section represents persistent food/cooking context Flemme uses for recommendation ranking.

Reuse the existing fields/contracts already used by the cooking context.

Conceptually:

```text
foodPreferences[]
cookingPreferences[]
cuisine/reference preferences
```

Do not invent a second preference schema.

---

# 12. Cuisine / Cooking Reference Principle

Cuisine references are signals, not rigid constraints.

Preserve the existing Flemme recommendation principle:

```text
multiple cuisine references
→ ranking/context signals
→ cross-cuisine recommendations remain allowed
```

Do not turn this page into hard recipe filtering unless the current domain explicitly supports it.

---

# 13. Cooking Preferences UI

Use a practical editable presentation.

Possible:

```text
Cooking preferences

[ Spicy ]
[ One pan ]
[ Quick meals ]
[ Indonesian ]
[ Manado ]
```

Use shadcn:

```text
Checkbox
Badge
Button
Dialog / Drawer
```

depending on current component patterns.

Do not create tiny inaccessible chips.

---

# 14. Preference Save Behavior

Preference changes should:

```text
persist server-side
update canonical cooking-context cache
affect future Recommendation requests
```

Do not trigger Recommendation immediately.

Do not mutate existing Cooking Sessions.

---

# 15. Household

Reuse the existing Household onboarding/edit capability.

Current household data conceptually includes:

```text
adults
children
toddlers
```

Do not create another household model.

---

# 16. Household Presentation

Profile may show a compact summary:

```text
Household
2 adults · 1 child

[ Edit household ]
```

Clicking Edit may:

```text
navigate to the existing household edit route
```

or reuse the existing household form in a Dialog/Drawer.

Preferred v0.1:

```text
reuse existing household edit flow
```

rather than duplicating validation/UI.

---

# 17. Household Validation

Preserve existing rules:

```text
counts 0–20
at least one household member
default/previous values preserved on error
```

Do not weaken onboarding validation.

---

# 18. Kitchen Context

Kitchen equipment is already part of persistent cooking context.

Although the minimum requested Profile scope is:

```text
personal info
cooking references
household
logout
```

Profile may expose a simple navigation link:

```text
Kitchen equipment
[ Edit kitchen ]
```

only if this reuses the existing kitchen edit flow cleanly.

Do not duplicate the kitchen form inside Profile unless needed.

This is optional for v0.1.

---

# 19. Inventory

Do not place full Inventory Management inside Profile.

Inventory already has:

```text
/app/inventory
```

A small link is acceptable:

```text
Manage inventory →
```

but not required.

Keep ownership clear.

---

# 20. Section Architecture

Use meaningful sections instead of one large form.

Recommended:

```text
Personal Information
Cooking Preferences
Household
Account
```

Avoid excessive nested Cards.

Use whitespace, heading hierarchy, separators, and selective Cards.

---

# 21. shadcn Usage

Likely primitives:

```text
Avatar
Button
Card
Input
Label
Badge
Checkbox
Dialog / Drawer
Separator
AlertDialog
Skeleton
```

Only add what is needed.

---

# 22. Profile Query

Use TanStack Query for persisted profile/context data.

Prefer canonical query keys already used by:

```text
auth/me
onboarding
cooking context
household
preferences
```

Do not create conflicting duplicate caches.

---

# 23. Cache Synchronization

After profile/context updates:

```text
AppHeader name/avatar state
Home greeting
Recommendation persistent context
Profile summary
```

must remain consistent.

Use canonical cache updates/invalidation.

Do not require logout/login to see changes.

---

# 24. Personal Name Update

If display-name editing is supported:

```text
save name
→ persisted user profile
→ auth/user cache updates
→ AppHeader updates
→ Home greeting updates
```

No full reload required.

---

# 25. Cooking Preference Update

After save:

```text
persistent cooking context updates
```

The next Recommendation must see the new preferences.

Required integration example:

```text
old preference: Mild
→ update to Spicy
→ next Recommendation context uses Spicy
```

No Recommendation generation occurs merely from saving settings.

---

# 26. Household Update

After household edit:

```text
persistent household context updates
```

Future Recommendation/Pre-Cooking receives the updated household.

Existing Cooking Sessions remain unchanged.

---

# 27. Logout

Provide an explicit:

```text
Log out
```

action in the Account section.

Use the existing logout/auth flow.

Do not create a second logout implementation.

---

# 28. Logout UI

Logout is destructive to the current authenticated session but not user data.

Recommended:

```text
Account

Log out of Flemme on this device.

[ Log out ]
```

Use shadcn `Button`.

A confirmation dialog is optional.

Do not use alarming delete-account language.

---

# 29. Logout Behavior

On successful logout:

```text
clear relevant authenticated query state
redirect to public/auth route
```

Use current auth architecture.

Do not delete:

```text
Cooking Sessions
Favorites
History
Inventory
Profile context
```

---

# 30. Profile Loading

Do not show a blank page.

Use shadcn `Skeleton`.

Keep the AppShell/BottomNavigation visible.

---

# 31. Profile Error

If profile/context loading fails:

```text
Couldn't load your profile.
[ Try again ]
```

Use controlled shared error patterns.

Do not show raw server errors.

---

# 32. Mutation Errors

For name/preferences updates:

- preserve user input
- show local controlled error
- allow retry
- do not discard previously persisted state

---

# 33. Duplicate Submission Prevention

While save/logout mutations are pending:

```text
disable conflicting actions
```

Do not allow repeated writes.

---

# 34. Bottom Navigation

Profile is not a primary BottomNavigation destination.

Keep normal app BottomNavigation visible.

The user entered Profile from AppHeader.

Do not add a fifth bottom-nav item.

---

# 35. Mobile-First Layout

Profile must work comfortably at:

```text
320px
390px
```

Prefer:

```text
single-column sections
large touch targets
full-width mobile actions where useful
```

---

# 36. Desktop Behavior

Preserve the existing compact app canvas:

```text
~572px centered
```

Do not turn Profile into a desktop settings dashboard/sidebar.

---

# 37. Accessibility

Required:

```text
semantic headings
proper labels
visible focus
keyboard dialogs
44–48px touch targets
errors not color-only
read-only email clearly communicated
```

Preserve shadcn/Radix/Base UI accessibility.

---

# 38. Security / Privacy

Do not display:

```text
OAuth access tokens
provider IDs
session tokens
internal auth metadata
```

Only show user-facing personal data.

---

# 39. No Agent Call

Profile editing is deterministic CRUD/context management.

Do not invoke cooking agents for:

```text
name
preferences
household
logout
```

---

# 40. No Cooking Lifecycle Mutation

Profile edits must not mutate:

```text
existing Cooking Session plan
progress
Completion snapshot
Nutrition snapshot
Favorite state
History
```

They affect future context only.

---

# 41. Tests — Personal Information

Cover:

```text
name displayed
Google/provider image displayed when available
email displayed read-only
name fallback behavior
name update if supported
header updates after name change
Home greeting updates after name change
```

---

# 42. Tests — Preferences

Cover:

```text
existing preferences load
edit preferences
save preferences
save failure preserves selection
future cooking context sees updated preferences
existing session remains unchanged
```

---

# 43. Tests — Household

Cover:

```text
household summary
Edit household entry
existing household preloads
validation preserved
updated household reaches future cooking context
existing session remains unchanged
```

---

# 44. Tests — Logout

Cover:

```text
logout action visible
pending duplicate logout prevented
successful logout clears authenticated state
redirect occurs
persistent user data remains
```

---

# 45. Browser Verification

Verify at:

```text
320px
390px
768px
1440px
1920px
```

Check:

- no horizontal overflow
- avatar/name layout stable
- long names contained
- preference controls tap-friendly
- household summary readable
- logout reachable
- BottomNavigation visible
- compact desktop canvas preserved
- keyboard focus visible

---

# 46. Network Verification

Profile load should reuse canonical user/context reads.

Name save:

```text
exactly one profile mutation
```

Preference save:

```text
exactly one context/preferences mutation
```

Household editing:

```text
existing household mutation flow
```

Logout:

```text
existing logout request/action
```

Verify zero accidental:

```text
Recommendation
Pre-Cooking
Cooking Session create
Active Cooking progress
Completion
Nutrition
Favorite
Inventory mutation
```

unless the user explicitly edits Inventory elsewhere.

---

# 47. Validation

Run:

```text
web typecheck
shared contracts typecheck if touched
web production build
API build if touched
web tests
API/profile/context tests
Biome
Oxlint
```

Report the known malformed OpenAI declaration parser issue separately if standalone API typecheck remains blocked.

---

# 48. Non-Goals

Do not implement:

```text
delete account
email change verification
password reset
social account linking/unlinking
subscription billing
notification settings
privacy export
profile photo upload
large settings taxonomy
```

Keep Profile v0.1 focused.

---

# 49. Suggested Implementation Order

```text
1. Inspect current auth user/session shape.
2. Inspect profile/user persistence.
3. Inspect preference/cooking-context persistence.
4. Reuse household edit route/form.
5. Create profile feature directory.
6. Add /app/profile route.
7. Wire AppHeader profile entry.
8. Create Personal Information section.
9. Add display-name editing only if supported.
10. Create Cooking Preferences section.
11. Reuse canonical context mutation/query.
12. Create Household summary/edit entry.
13. Optionally expose Kitchen edit link.
14. Add Account / Logout section.
15. Add loading/error states.
16. Synchronize caches.
17. Add tests.
18. Browser/network verify.
19. Run validation.
20. Update architecture/progress docs.
```

---

# 50. Definition of Done

- [x] `/app/profile` exists.
- [x] AppHeader profile entry opens Profile.
- [x] Personal Information section exists.
- [x] Normalized user name is displayed.
- [x] Email is displayed safely.
- [x] Provider avatar is displayed when available.
- [x] Display-name editing works with the current user model.
- [x] Header/Home identity updates after name edits.
- [x] Cooking Preferences section uses existing persistent context.
- [x] No duplicate preference model is created.
- [x] Preference edits affect future Recommendations.
- [x] Household summary uses existing Household state.
- [x] Household edit reuses existing validation/flow.
- [x] Household edits affect future cooking context.
- [x] Existing Cooking Sessions remain immutable.
- [x] Logout uses the existing auth flow.
- [x] Logout does not delete persisted user data.
- [x] No agent call occurs.
- [x] No cooking lifecycle mutation occurs.
- [x] Loading state works.
- [x] Error + retry works.
- [x] Mutation errors preserve input.
- [x] Duplicate submissions are prevented.
- [x] BottomNavigation remains visible.
- [x] No fifth bottom-nav item is introduced.
- [x] Mobile layout works.
- [x] Compact desktop layout works.
- [x] Accessibility checks pass.
- [x] Web typecheck, builds, tests, Biome, and Oxlint pass. Standalone API
  typecheck remains blocked by the separately documented malformed OpenAI
  declaration parser issue.
- [x] Architecture/progress docs are updated.

---

# 51. Agent Rule

Optimize for:

```text
one clear profile hub
+
persistent cooking context editing
+
reuse of onboarding/domain data
+
simple account controls
+
mobile-friendly settings
```

Do not optimize for:

```text
large settings architecture
duplicate forms
account-management complexity
new agent behavior
```

Core rule:

> Profile is the user's control center for personal cooking context, not a second onboarding flow.

---

# 52. Checkpoint After Phase 10

After this Profile phase is complete:

```text
✅ Core cooking flow
✅ Continuity
✅ History
✅ Favorites
✅ Inventory
✅ Profile / Preferences / Household / Logout
```

The next project stage should be:

```text
Global UI/UX Refinement
→ visual consistency
→ interaction polish
→ responsive review
→ copy consistency
→ accessibility
→ loading/error polish
→ component cleanup
```

Do not add another mandatory core-product phase before completing the full UI/UX review.
