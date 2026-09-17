# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Flemme Web — Phase 9D: Inventory Management v0.1

## Current Goal

Phase 9D now exposes the persisted Inventory aggregate as the normal
post-onboarding management surface. Users can add, edit, resolve, and remove
ingredients while future Recommendations read the latest server context and
existing Cooking Session plans remain immutable.

## Completed

### Flemme Web — Phase 9D: Inventory Management v0.1

- Reused the existing `inventories` and `inventory_items` persistence,
  onboarding replacement, ownership boundary, and cooking-context loader. No
  second Inventory store, table, or migration was introduced.
- Added a shared browser-safe Inventory contract for user-facing names, optional
  quantity/unit pairs, condition, canonical identity, and list responses.
  Quantity remains positive when known and stays `null` rather than becoming
  zero when unknown.
- Changed regular create and update inputs from internal canonical keys to
  user-facing names. The API trims display text, resolves names and bilingual
  aliases through `@flemme/ingredients`, preserves unresolved items with a
  `null` key, and reruns deterministic resolution after every rename.
- Preserved the normalized per-inventory identity constraint. Canonical aliases
  and conservatively normalized unresolved duplicates return a controlled 409;
  cross-user update/delete remains 403 and missing rows remain 404.
- Replaced `/app/inventory` with a thin route and dedicated feature page using
  the canonical Inventory query, compact list rows, mobile Dialog forms,
  card-shaped loading, shared empty/error states, and active global navigation.
- Added name-only and optional quantity/unit creation, edit with re-resolution,
  explicit unresolved status, secondary edit/remove actions, duplicate request
  suppression, stable pending rows, controlled mutation errors, and retries
  that preserve form input and cached items.
- Inventory mutations synchronize the canonical cache and refetch the server
  aggregate. The Home shortcut continues to open `/app/inventory`; no separate
  Home count query was added because the count is optional and would add an
  otherwise unnecessary request.
- Integration coverage proves that the next Recommendation observes additions
  and removals directly from persisted cooking context. Separate coverage proves
  Inventory edit/delete cannot rewrite an already-created Cooking Session plan.
  No automatic stock deduction or generation side effect was added.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and
  1920px with no horizontal overflow, a 524px compact desktop canvas, contained
  long names, readable quantity/unit rows, clear unresolved status, 16px mobile
  form inputs, visible BottomNavigation, and active Inventory state.
- The real page restored onboarding's saved Egg through one Inventory GET. A
  failed add preserved name, quantity, and unit; one real retry created Rice.
  A separate unresolved add issued one POST, rename/re-resolution issued one
  PUT, removal issued one DELETE, and each successful mutation performed only
  the expected Inventory refetch. Refresh restored canonical state with one GET,
  and the Home shortcut still reached the page. No Recommendation, Pre-Cooking,
  Cooking Session, progress, Completion, Nutrition, Favorite, History, or Agent
  request occurred during Inventory editing.
- Validation: 19 Ingredient tests / 28 expectations, 167 web tests / 570
  expectations, and 160 API tests / 1,400 expectations pass. Focused Phase 9D
  coverage passes 14 web tests / 58 expectations and 22 API tests / 120
  expectations. Shared-contract and web typechecks, web production build, API
  build, scoped Biome, and Oxlint pass. Oxlint reports only 21 established Fast
  Refresh warnings. Standalone API typecheck remains blocked separately by the
  unchanged malformed OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 9C: Favorites UI v0.1

- Extended the canonical authenticated Favorites list instead of adding a new
  store or table. The owner-filtered query orders by Favorite `createdAt` and ID
  descending, defaults to 10 items, caps pages at 20, fetches one lookahead row,
  and returns `nextOffset`.
- Added an optional `cookingSessionId` list filter so Nutrition restores one
  saved-state relation without downloading every Favorites page.
- Enriched the historical Favorite projection with
  `customName ?? selectedRecipe.name`, source-session `completedAt`, persisted
  Completion summary, and compact complete, partial, or unavailable Nutrition.
  The original recipe name and snapshot fields remain unchanged.
- Replaced the `/app/favorites` placeholder with a thin route and dedicated
  feature page, infinite query, single-column cards, card-shaped loading,
  controlled retry, empty state, and explicit Load more action.
- Cards use shadcn Card, local-locale completion dates, bounded long titles and
  summaries, explicit unavailable Nutrition, a filled saved indicator, the
  existing Completion route, and a secondary overflow removal action.
- Added one canonical delete mutation with synchronous per-Favorite in-flight
  request sharing. Pending removal keeps the card stable and disables
  duplicates; real failures keep the card with controlled retry copy; a 404
  converges to already removed.
- Successful removal clears the session-scoped Favorite cache, removes the card
  from loaded pages, refetches the bounded list, and invalidates History.
  Cooking Session, Completion, Nutrition, Inventory, and progress state remain
  untouched. Nutrition returns to Save to favorites and History retains the
  completed meal with `isFavorite: false`.
- API coverage proves ownership, completed-session eligibility, deterministic
  ordering and pagination, rich historical projection, all Nutrition variants,
  optional session filtering, delete authorization, missing behavior, and
  preservation of Cooking Session and History. Web coverage proves canonical
  requests and cache synchronization, display-name variants, page states,
  Nutrition variants, canonical links, navigation state, and removal
  pending/success/error behavior.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and
  1920px with no horizontal overflow, contained long titles, a 524px compact
  desktop card canvas, visible BottomNavigation, and active Favorites state.
  An unavailable Nutrition card rendered intentional explicit copy.
- Initial refresh issued one 10-item Favorites GET after auth/onboarding. Load
  more issued one offset-10 GET and appended the unique eleventh item. View meal
  issued only the canonical Cooking Session GET. Removal issued exactly one
  DELETE, removed the card, survived refresh, preserved History, and restored
  Nutrition's Save action. Forced list failure hid backend detail and a real
  retry restored the list.
- Validation: 159 web tests / 531 expectations and 157 API tests / 1,384
  expectations pass. Focused Phase 9C coverage passes 17 web tests / 69
  expectations and 7 API tests / 58 expectations. Shared-contract and web
  typechecks, web production build, API build, scoped Biome, and Oxlint pass.
  Oxlint reports only 22 established Fast Refresh warnings. Standalone API
  typecheck remains blocked separately by the unchanged malformed OpenAI
  declaration parser issue in `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 9B: Cooking History v0.1

- Added authenticated `GET /cooking-sessions/history` as a read projection over
  persisted Cooking Sessions. No History table, duplicate snapshot, lifecycle
  record, or migration was introduced.
- Enforced ownership and `status = completed` in the database query. Active,
  paused, abandoned, and cross-user sessions are excluded server-side.
- Added deterministic ordering by `completedAt`, `createdAt`, and session ID
  descending. Offset pages default to 10 items, are capped at 20, fetch one
  lookahead row, and return an explicit `nextOffset`.
- Added a browser-safe shared History contract containing only session ID,
  resolved display name, completed timestamp, persisted Completion summary,
  compact per-serving Nutrition summary, and canonical Favorite presence. Full
  cooking plans, progress, changes, and coverage detail stay out of list
  payloads.
- Projected `customName ?? selectedRecipe.name`, complete and partial
  per-serving calories/protein, intentional unavailable/absent Nutrition, and
  read-only Favorite state. No zero-value Nutrition fallback or History-local
  Favorite state exists.
- Replaced the `/app/history` placeholder with a thin route and dedicated
  `features/history` page, infinite query, single-column list, cards, and
  explicit card-shaped loading, retryable error, empty, and Load more states.
- Cards use local-locale `completedAt` formatting, clamp long names and
  Completion descriptions, retain a 48px mobile View meal target, and route
  only the session ID to the canonical Completion review. History performs no
  Completion, Nutrition, Recommendation, Pre-Cooking, Inventory, Favorite, or
  progress mutation.
- Completion status changes, rename, persisted Completion generation,
  Nutrition generation, and Favorite creation now invalidate the canonical
  History query so subsequent reads converge without restarting the app.
- API coverage proves empty, ownership/status filtering, original and custom
  naming, Completion projection, complete/partial/unavailable/absent
  Nutrition, Favorite projection, deterministic tie-breaking, page boundaries,
  and invalid limits. Web coverage proves bounded requests, cache invalidation,
  card variants, canonical links, loading/error/empty states, and active global
  History navigation.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and
  1920px. The page had no horizontal overflow, preserved the 572px desktop
  canvas, readable dates and compact summaries, a contained long custom name,
  an uncrowded Favorite indicator, full-width mobile CTAs, visible
  BottomNavigation, and active History state. Initial refresh issued only auth,
  onboarding, and one 10-item History GET. Load more issued one offset-10 GET,
  appended the unique eleventh item, and disappeared.
- Opening View meal navigated to the exact existing Completion route and issued
  only the canonical Cooking Session GET. A forced History failure kept
  BottomNavigation usable, hid raw backend detail, exposed Try again, and one
  real retry restored the list.
- Validation: 151 web tests / 492 expectations and 157 API tests / 1,373
  expectations pass. Focused Phase 9B coverage passes 6 web tests / 25
  expectations and 4 API integration tests / 27 expectations. Shared-contract
  and web typechecks, web production build, API build, scoped Biome, and
  Oxlint pass. Oxlint reports only 23 established Fast Refresh warnings.
  Standalone API typecheck remains blocked separately by the unchanged
  malformed OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 9A: Resume Active Session v0.1

- Added authenticated `GET /cooking-sessions/resumable` with a browser-safe
  shared response contract. It returns only the current user's active or paused
  Cooking Session, or `null`; completed, abandoned, and cross-user rows are
  excluded.
- Confirmed the current schema does not enforce one resumable row per user.
  The API therefore owns deterministic current-session selection using
  `updatedAt`, `createdAt`, and ID descending instead of letting the browser
  silently choose.
- Added a stable resumable-session TanStack Query that refetches when Home
  mounts, validates server data, and seeds the existing session-ID cache.
  Refresh requires no Recommendation or Pre-Cooking memory.
- Connected the existing Home `ActiveSessionCard` to persisted data. The card
  omits itself for `null`, renders a nonblocking Skeleton while loading, and
  keeps Home's prompt, Quick Start, Inventory shortcut, and Recent Cooking
  usable when the query fails.
- Added explicit active and paused presentation, shared `customName` fallback,
  stable-ID stage and step resolution, compact long-title clamping, and a
  full-width mobile Continue action. Corrupt progress produces no misleading
  card or fallback to the first plan step.
- Continue uses TanStack Router with only the session ID. Paused navigation
  remains paused and restores the exact persisted Stage 2 / current step until
  the existing Active Cooking Resume action is explicitly used.
- Active Cooking pause, resume, advance, rename, completion, and abandonment
  now synchronize the resumable cache. Terminal transitions clear the current
  Home card immediately and invalidate server state for the next Home mount.
- API coverage proves null, active, paused, ownership, custom naming,
  terminal-state exclusion, exact display/progress data, and deterministic
  multiple-row selection. Web coverage proves omission, loading, controlled
  failure, active/paused content, name fallback, custom name, stable positions,
  route identity, corrupt-state suppression, refresh restoration, and terminal
  cache removal.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and
  1920px. Home had zero horizontal overflow, retained BottomNavigation, and
  preserved the 572px desktop canvas. Refresh restored the paused long-name
  card through only auth, onboarding, and one resumable GET. Continue issued
  only the canonical Cooking Session GET after its cache became stale, hid
  BottomNavigation, and restored the exact paused Stage 2 step with no implicit
  Resume.
- Validation: 144 web tests / 462 expectations and 153 API tests / 1,332
  expectations pass. Focused Phase 9A coverage passes 9 web tests / 29
  expectations and 5 new API tests / 24 expectations; combined Cooking Session
  integration passes 18 tests / 102 expectations. Shared-contract and web
  typechecks, web production build, API build, scoped Biome, and Oxlint pass.
  Oxlint reports only the 24 established Fast Refresh warnings. Standalone API
  typecheck remains blocked separately by the unchanged malformed OpenAI
  declaration parser issue in `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 8: Favorite Persistence & Review v0.1

- Added a browser-safe shared Favorite contract and reused it from the existing
  API schema and the web boundary. The canonical create payload remains only the
  completed Cooking Session ID; the persisted response retains the historical
  recipe projection.
- Added `features/favorites` with stable list and session-scoped query keys.
  Direct Nutrition visits query persisted Favorites, seed canonical cache state,
  and restore an already-saved action after a full refresh.
- Added one dedicated create mutation with a synchronous per-session in-flight
  request share. Successful creation seeds the session Favorite cache and
  updates an existing list cache or invalidates its canonical key.
- Treated only `409 FAVORITE_ALREADY_EXISTS` as recoverable saved state. The
  mutation reloads persisted Favorites and converges only when the matching
  canonical resource exists; other eligibility, ownership, missing-resource,
  network, and server errors stay controlled and retryable.
- Replaced the Phase 7 placeholder with a mobile-first Favorite action while
  keeping Nutrition visible. Checking and saving states disable the CTA, saved
  state uses a filled Heart plus compact badge, and failures show safe copy with
  an accessible retry rather than backend detail.
- Preserved Favorite eligibility independence from Nutrition coverage.
  Integration coverage proves an unavailable Nutrition snapshot and a custom
  session name do not block persistence or rewrite the historical recipe name.
- Verified first save produced exactly one Favorite create request. It produced
  no Recommendation, Pre-Cooking, Cooking Session creation, progress,
  Completion, Nutrition, or Inventory mutation. Full refresh restored saved
  state with one Cooking Session read and one Favorites read, with no create or
  generation request.
- Browser acceptance passed at 320px, 390px, 768px, 1440px, and 1920px: no
  horizontal overflow, clear pending/saved/retry states, long custom-name
  wrapping, hidden BottomNavigation, and the existing 572px compact desktop
  canvas. A forced network failure preserved Nutrition, hid raw detail, exposed
  retry, and the next real request saved successfully.
- Validation: 135 web tests / 433 expectations, 148 API tests / 1,294
  expectations, and focused Favorites coverage of 9 web tests / 29 expectations
  plus 6 API integration tests / 40 expectations pass. Shared-contract and web
  typechecks, web production build, API build, scoped Biome, and Oxlint pass.
  Oxlint reports only the 24 established Fast Refresh warnings. Standalone API
  typecheck remains blocked separately by the unchanged malformed OpenAI
  declaration parser issue in `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 7: Nutrition & Nutrition Review v0.1

- Extended the browser-safe Nutrition result contract with the exact normalized
  ingredients that contributed to calculation while keeping that field optional
  for pre-Phase 7 snapshots. Added an explicit `unquantified-change` coverage
  issue without weakening the existing complete, partial, and unavailable
  variants.
- Reused the production canonical ingredient resolver, reviewed unit-to-gram
  conversions, committed Nutrition references, and deterministic calculator.
  The projection derives from persisted `cookingPlan.ingredients`, selected
  servings, and recorded changes. Ingredient and serving changes remain
  unapplied when their current free-text contract lacks quantitative structure;
  the snapshot discloses that limitation instead of parsing or guessing it.
- Added canonical `POST /cooking-sessions/:id/nutrition` generation. The API
  requires an owned completed session with Completion output, calculates
  without an Agent or runtime network reference, stores `nutrition_snapshot`,
  and returns the complete restored Cooking Session.
- Added transaction-scoped row locking and snapshot reuse. Concurrent requests
  serialize, the first persisted result wins, retries preserve the same
  `updatedAt`, and refresh restores the historical snapshot without recalculating
  against later reference changes.
- Kept the existing read-only Nutrition preview available while separating it
  from canonical Phase 7 persistence. Active, paused, abandoned, missing,
  cross-user, missing-Completion, and corrupt-snapshot paths retain controlled
  API behavior.
- Wired Completion's Continue to Nutrition action to the persisted
  `/app/cooking/$sessionId/nutrition` route. The dedicated TanStack Query sends
  one generation POST only when the restored completed session lacks a snapshot,
  then seeds the canonical Cooking Session cache.
- Added mobile-first Nutrition loading, retryable error, lifecycle guard,
  complete, partial, and unavailable surfaces. The review preserves display-name
  priority, emphasizes per-serving calories plus protein/carbs/fat, states the
  serving basis, uses approximate markers for partial totals, and never renders
  unavailable ingredients as zero nutrition.
- Added an accessible Collapsible with exact included gram amounts, excluded
  ingredient reasons, and unquantified recorded-change disclosures. The visible
  Save to favorites action is disabled as the Phase 8 boundary; Nutrition makes
  no Inventory or Favorite mutation.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and 1920px:
  zero horizontal overflow, long-title wrapping, reachable actions, a visible
  3px keyboard focus outline, hidden BottomNavigation, and the 572px desktop
  canvas. First visit made one Cooking Session GET and one canonical Nutrition
  request. Direct refresh made only auth/onboarding reads plus the Cooking
  Session GET and restored the same snapshot with zero Nutrition regeneration.
  The active-session guard made no Nutrition request. Coverage expansion showed
  exact included grams and the recorded change limitation. Browser fixtures
  were removed afterward.
- Verified generation preserves Completion output, the immutable cooking plan,
  progress, `customName`, Inventory, and Favorites. Integration coverage also
  proves ownership, missing resources, lifecycle guards, complete/partial/
  unavailable calculation, no fake unavailable totals, corrupt persistence,
  idempotent retry, and concurrent serialization.
- Validation: 60 Nutrition tests / 131 expectations, 19 Ingredient tests / 28
  expectations, 4 shared-contract tests / 5 expectations, 126 web tests / 404
  expectations, and 147 API tests / 1,290 expectations pass. Focused Nutrition
  API coverage passes 22 tests / 125 expectations. Nutrition, Ingredient,
  shared-contract, and web typechecks; web production build; API build; scoped
  Biome; and Oxlint pass. Oxlint reports only the 24 established/new route Fast
  Refresh warnings. Standalone API typecheck remains blocked separately by the
  unchanged malformed OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme — Active Cooking Guardrails v0.1

- Added the Agent-owned `ActiveCookingScopeSchema` with `in_scope`,
  `out_of_phase`, `off_topic`, and `ambiguous` outcomes. The deterministic
  resolver uses explicit phase/off-topic rules, cooking and lifecycle signals,
  and persisted plan/session terms rather than an isolated keyword check.
- Added the resolver at both earliest runtime boundaries:
  `runActiveCooking` branches before `generateCompletion`, and the Active
  Cooking API service branches before model-availability checks or its injected
  runner. Clear non-cooking requests therefore add no model call, latency, or
  provider cost.
- Added deterministic off-topic, Nutrition/Favorites/History and other
  out-of-phase redirects, plus a current-step-specific clarification for
  scope-ambiguous input. Every controlled response keeps the existing
  `reply`/`actions` output contract and returns `actions: []`.
- Added a post-output scope invariant that strips every structured lifecycle
  action from non-`in_scope` output. Existing in-scope action validation,
  one-primary-action rules, explicit abandonment confirmation, and prose/action
  separation remain unchanged.
- Strengthened shared cooking instructions and the Active Cooking prompt with
  explicit cooking-only scope, phase ownership, zero-action redirects, and
  cooking-safety preservation. These prompt rules are defense in depth; runtime
  enforcement does not depend on model compliance.
- Added the required HTML regression: the response contains no HTML or markup
  explanation, returns the short cooking redirect, never invokes the runner,
  and preserves the complete persisted Cooking Session. Added React hooks,
  World Cup, email, unknown-topic, Nutrition, Favorites, History, contextual
  ambiguity, quantities, substitutions, lifecycle, and cooking-safety coverage.
- Added web coverage proving the controlled redirect renders in Ask Flemme,
  sends only the Active Cooking assistant request, does not send a progress or
  downstream product mutation, and leaves the canonical session cache
  unchanged.
- Browser/network acceptance passed in the current 390px Active Cooking UI:
  asking `What is HTML?` rendered only the concise cooking-scope redirect. The
  stage, current step, completed-step IDs, status, changes, and controls stayed
  unchanged. Network activity was limited to the expected Active Cooking POST
  and browser CORS preflight; there were zero progress, Completion, Nutrition,
  Inventory, Favorite, profile, or history requests.
- Validation: 62 Agent tests / 107 expectations, 120 web tests / 375
  expectations, and 139 API tests / 1,235 expectations pass. Focused scope
  coverage passes 16 tests / 57 expectations; focused Active Cooking web passes
  20 tests / 44 expectations; focused Active Cooking API integration passes 16
  tests / 81 expectations. Web typecheck and production build, API build,
  scoped Biome, and Oxlint pass. Oxlint reports only the 23 established Fast
  Refresh warnings. Agent and standalone API typecheck remain blocked
  separately by the unchanged malformed OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 6: Completion Output & Review v0.1

- Final Active Cooking progress now persists the final completed step together
  with `phase = completion`, `status = completed`, and `completedAt` before
  navigation. Completion and Nutrition snapshots remain absent at that
  boundary, and only the confirmed server response navigates to Completion.
- Changed `POST /cooking-sessions/:id/completion` from a transient projection
  into the canonical owner-only persistence boundary. The API loads the
  persisted completed session, uses its exact immutable plan and recorded
  changes to construct the existing `CompletionInput`, validates
  `CompletionOutput`, stores `completion_snapshot`, and returns the restored
  Cooking Session.
- Added transaction-scoped row locking around Completion generation. Concurrent
  calls serialize by session; the first valid result wins and every retry
  returns the same persisted snapshot without invoking the Agent again. Failed
  generation leaves the completed session untouched and retryable.
- Completed sessions may now be restored before their Completion snapshot
  exists. Active, paused, and abandoned sessions cannot generate normal
  Completion; missing, cross-user, and corrupt persisted sessions retain
  controlled API behavior.
- Added the refresh-safe, session-ID route
  `/app/cooking/$sessionId/completion` and `features/completion`. Its TanStack
  Query state is separate from the canonical Cooking Session query; an existing
  snapshot renders without a generation POST, while a missing snapshot uses the
  single idempotent Completion endpoint and updates the canonical cache.
- Added controlled loading, generation error/retry, and lifecycle guard
  surfaces. The focused review renders the persisted display-name priority,
  Completion reply, generated summary, exact recorded changes, lightweight
  no-change state, optional notes, Home exit, and visible Phase 7 Continue to
  Nutrition boundary. It does not render chat, Nutrition, Inventory, Favorite,
  or history behavior.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and 1920px:
  zero horizontal overflow, natural long-title wrapping, readable vertical
  sections, reachable CTA, visible 3px keyboard focus, hidden BottomNavigation,
  and a 572px desktop canvas. Direct access and full refresh restored the same
  custom name and Completion output using only auth/onboarding reads plus one
  Cooking Session GET; no Recommendation, Pre-Cooking, session-create, progress,
  Completion-generation, Inventory, Nutrition, or Favorite request occurred
  when a canonical snapshot already existed. An active-session direct route
  rendered its guard without a Completion request.
- Added Completion API coverage for completed-session authority, exact input,
  custom-name exclusion from the Agent contract, persistence, concurrent
  idempotency, canonical retry, failure recovery, lifecycle guards, final-step
  validation, ownership, missing and corrupt sessions, invalid Agent output,
  and missing provider configuration. Added web coverage for canonical cache
  seeding, refresh without generation, summary/changes/notes rendering, empty
  states, and loading.
- Validation: 4 shared-contract tests / 5 expectations, 119 web tests / 370
  expectations, 135 API tests / 1,194 expectations, focused Completion API
  10 tests / 51 expectations, focused Completion web 5 tests / 20 expectations,
  and 41 Agent tests / 60 expectations pass. Shared-contract and web typecheck,
  web production build, API build, scoped Biome, and Oxlint pass. Oxlint reports
  only the 23 established Fast Refresh warnings, including the new route.
  Standalone API typecheck remains blocked separately by the known malformed
  OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Cooking Session customName / Rename Dish v0.1

- Added optional nullable `customName` to the canonical shared Cooking Session
  response plus a trimmed, non-empty, 100-character rename request contract.
  Whitespace strings and overlong names are rejected; `null` restores the
  original recipe name.
- Added nullable `cooking_sessions.custom_name` persistence through generated
  migration `0004_tiresome_wallflower.sql`. Restore and every successful
  metadata update return the complete schema-validated latest session snapshot.
- Added authenticated `PATCH /cooking-sessions/:id`. The route preserves the
  established owner-only 403 and missing-session 404 behavior, permits rename
  in active, paused, completed, and abandoned states, and changes only
  `custom_name` plus `updated_at`.
- Kept `selectedRecipeSnapshot`, the approved cooking plan, lifecycle state,
  progress IDs, completed steps, `changes`, Completion, Inventory, and all Agent
  boundaries unchanged.
- Added a dedicated TanStack Query rename mutation under the canonical
  `cookingSessionQueryKey(sessionId)`. It shares the existing synchronous
  per-session mutation lock with progress writes and replaces the cache only
  with the validated server response.
- Added a shadcn/Base UI overflow menu action and mobile-first rename dialog.
  The form preloads the current display name, trims saves, prevents duplicate
  submission, keeps typed input and a controlled message on failure, and sends
  `null` when cleared or reset to the original recipe name.
- The focused header now resolves `customName` before the immutable selected
  recipe name and intentionally clamps long names to two lines without moving
  the back or overflow controls.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and 1920px:
  zero horizontal overflow, a fitting mobile dialog, visible keyboard focus,
  reachable save/cancel actions, intentional long-title truncation, and the
  unchanged 572px desktop canvas. Rename, duplicate-click locking, controlled
  failure/retry state, clear-to-original, and full-refresh restoration passed.
  Each successful rename or clear produced exactly one Cooking Session metadata
  request and no Recommendation, Pre-Cooking, Active Cooking, progress,
  Inventory, Completion, or Favorite request.
- Validation: all 4 shared-contract tests / 5 expectations, 114 web tests / 350
  expectations, 137 API tests / 1,186 expectations, and the focused 13-test / 78
  expectation Cooking Session integration pass. Shared-contract and web
  typecheck, production web build, API build, Drizzle migration check, scoped
  Biome, and Oxlint pass. Oxlint reports only the 22 established Fast Refresh
  warnings. Standalone API typecheck remains blocked separately by the known
  malformed OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 5B: Active Cooking v0.1

- Added `features/active-cooking` with a focused cooking header, structural
  stage and overall-step progress, a dominant current instruction, qualitative
  timing and completion cue, large Previous/Next controls, and no global
  AppHeader or BottomNavigation.
- `/app/cooking/$sessionId` restores only the canonical persisted session.
  Current stage and step resolve by stable IDs; invalid positions, missing
  sessions, ownership failures, corrupt snapshots, and network failures remain
  controlled states with no fake fallback plan.
- Previous and Next derive accepted progress from immutable plan order and send
  exactly one explicit `PATCH /progress`. The validated server response replaces
  the canonical query cache; a synchronous per-session lock prevents duplicate
  or conflicting lifecycle writes.
- Stage boundaries persist correctly. `Finish cooking` records the final step
  and stops at the refresh-safe completion-ready boundary without invoking
  Completion AI, `POST /complete`, Nutrition, Inventory, Favorites, or another
  cooking flow.
- Pause persists one shared-contract reason and disables normal step controls;
  Resume restores the same position. Record Change supports every shared kind
  and an optional stable current-step reference without modifying the cooking
  plan or Inventory.
- Enabled terminal abandonment through the existing progress boundary. The UI
  requires explicit destructive confirmation, and abandoned sessions cannot
  reactivate or expose Active Cooking controls.
- Added the compact contextual Cooking Assistant against the existing
  message-only Active Cooking API. Reply-only and clarification results do not
  mutate progress; accepted structured actions produce at most one explicit
  progress write; duplicate submission is locked; Agent-proposed abandonment
  still requires confirmation.
- Active, paused, completion-ready, completed, and abandoned presentations are
  intentional. Loading restores persisted state before showing instructions,
  and assistant/progress failures preserve the last server-authoritative
  session.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and 1920px:
  zero horizontal overflow, readable current-step hierarchy, 56px primary
  controls, visible 3px keyboard focus, usable mobile dialogs, a 572px desktop
  canvas, and hidden BottomNavigation. Advance, Previous, Pause, Resume, Record
  Change, assistant guidance/action, final boundary, and confirmed abandonment
  each produced only their intended request; refresh restored every exercised
  persisted state.
- Validation: web typecheck and production build pass; all 111 web tests / 339
  expectations pass; all 133 API tests / 1,156 expectations pass; all 41 Agent
  tests / 60 expectations pass; shared-contract typecheck, API build, scoped
  Biome, and Oxlint pass. Oxlint reports only the 22 established Fast Refresh
  warnings. The standalone API typecheck remains blocked separately by the
  known malformed OpenAI declaration parser issue in
  `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 5A: Create Cooking Session v0.1

- Added `features/cooking-session` with a dedicated TanStack Query creation
  mutation, synchronous duplicate-submission lock, stable per-session query key,
  schema-validated create/read requests, controlled errors, and retry.
- Start Cooking now uses the exact Phase 4 handoff and retained Recommendation
  snapshot. The create payload preserves the selected recipe and immutable plan,
  uses the first existing cooking-stage and step IDs, and starts active with
  empty completed-step and change arrays.
- Added browser-safe shared Cooking Session create/response contracts under
  `@flemme/contracts/cooking-session`, backed by schema-only Agent and Nutrition
  package exports. The API now re-exports the same shared schemas instead of
  maintaining a parallel transport contract.
- Pending creation keeps the complete Pre-Cooking review visible, disables the
  action, and uses concise Starting cooking copy. Failure preserves the handoff
  and plan, hides raw server detail, and exposes keyboard-accessible retry.
- Successful creation seeds the validated response under its stable session
  query key before navigating to `/app/cooking/$sessionId`. The minimal route
  boundary reads persisted server data only and deliberately includes no Active
  Cooking progress controls.
- Refresh restores the route through `GET /cooking-sessions/:id` without
  Recommendation or Pre-Cooking memory. Invalid IDs, missing sessions,
  ownership failures, and invalid persisted snapshots map to controlled UI
  messages while existing API authorization remains unchanged.
- Browser/network acceptance passed at 320px, 390px, 768px, 1440px, and 1920px:
  zero overflow, the 576px desktop canvas, hidden BottomNavigation, visible 3px
  keyboard focus, plan-visible pending/error states, one request per click or
  retry despite double clicks, no immediate GET after cache seeding, and one GET
  after refresh. The transition made zero Recommendation, Pre-Cooking,
  Inventory, Completion, or Favorite requests.
- Validation: web typecheck and production build pass; all 90 web tests / 263
  expectations pass; the focused Cooking Session API integration passes all 8
  tests / 42 expectations; shared-contract typecheck, API build, scoped Biome,
  and Oxlint pass. Oxlint reports only the 22 established Fast Refresh warnings,
  including the new generated-style session route. The standalone API typecheck
  remains blocked separately by the known malformed OpenAI declaration parser
  issue in `node_modules/openai/internal/types.d.mts`.

### Flemme Web — Phase 4: Pre-Cooking & Plan Review v0.1

- Connected recipe selection to `POST /cooking/pre-cooking` through a TanStack
  Query mutation. The request preserves the exact Recommendation object and
  trimmed `session.request`; persistent cooking context remains API-owned.
- Added the guarded `/app/pre-cooking` focused-flow route. Missing or mismatched
  selection state returns to current Recommendations when available and Home
  otherwise. BottomNavigation remains hidden.
- Added the dedicated `features/pre-cooking` review composition with a
  plan-specific loading state, retryable controlled errors, back behavior,
  preparation summary, optional recipe-level times, compact ingredient and
  equipment requirements, ordered preparation steps, qualitative timing and
  cues, and collapsed cooking-stage disclosure.
- Added the browser-safe `@flemme/agent/pre-cooking-output` package subpath and
  reused its runtime schema. No local cooking-plan contract was introduced.
- Cached successful generation per current exact selection to prevent incidental
  duplicate calls. A new Recommendation clears downstream plan and handoff
  state; stale concurrent results cannot replace a newer selection.
- Start Cooking preserves the exact request, selected recipe object, and
  validated plan object in the Phase 5 handoff cache. It performs no
  Cooking Session request, progress mutation, or Inventory mutation.
- Browser acceptance passed at 320px, 390px, 768px, 1440px, and 1920px with no
  horizontal overflow, readable vertical requirements and preparation steps,
  usable stage expand/collapse, reachable Start Cooking, a visible 3px keyboard
  focus outline, hidden BottomNavigation, and the existing 576px desktop canvas.
- Validation: web typecheck and production build pass; all 79 web tests / 217
  expectations pass; scoped Biome checks pass. Oxlint passes with only the 21
  established Fast Refresh warnings in route and shared primitive modules.

### Flemme Web — Recommendation Card Refactor v0.2

- Refactored each Recommendation Card into one layered decision surface:
  feasibility, title, concise rationale, metadata, readiness summaries,
  confirmations, warnings, matches, optional detail, then selection.
- Replaced the always-visible ingredient and equipment columns with compact
  two-block counts for available, quick-check, missing, and all-ready states.
- Kept required confirmations and safety warnings visible while collapsed.
  Preference matches remain compact and conditional.
- Added the shared shadcn/Base UI Collapsible primitive. Ingredient and
  equipment names, quantities, notes, and optional ingredients now render in
  full-width vertical sections only when explicitly expanded.
- Removed repeated available pills from detail rows. Available requirements use
  a quiet check treatment; unconfirmed and missing states retain textual badges
  and distinct icons.
- Kept the full-width Select recipe action at the card bottom and available
  without expansion. Recommendation requests, Query cache state, clarification,
  no-viable handling, exact-object selection, and the non-executing Pre-Cooking
  boundary are unchanged.
- Browser acceptance passed at 320px, 390px, 768px, 1440px, and 1920px with no
  overflow, natural two-to-three-line title wrapping, readable two-column
  summaries, obvious confirmations, balanced vertical expanded details,
  keyboard-operable disclosure, reachable CTAs, and the unchanged 572px desktop
  canvas.
- Validation: web typecheck, production build, all 66 web tests / 162
  expectations, scoped Biome checks, and oxlint pass. Oxlint reports only the
  established Fast Refresh warning category for route and primitive modules.

### Flemme Web — Phase 3: Recommendation & Selection v0.1

- Connected the Home cooking prompt to `POST /cooking/recommendations` through
  TanStack Query. The browser submits only the trimmed `session.request`;
  persistent Profile, Household, Kitchen, Inventory, and preference context
  remains API-owned.
- Kept Quick Start as the Phase 2 populate-then-confirm interaction. Every
  option fills the same prompt and therefore reaches the same submission path
  without a duplicate API integration.
- Added the guarded `/app/recommendation` route and dedicated
  `features/recommendation` composition. Request, validated output, and selected
  recipe state survive route transitions in the Query cache.
- Reused the Agent-owned Recommendation output schema through a schema-only
  package subpath, so malformed output is rejected without pulling Agent runtime
  or model-provider modules into the browser build.
- Added accessible loading and controlled retryable API-error states, plus
  distinct `recommendations`, `clarification`, and
  `no_viable_recommendation` domain presentations.
- Added one-to-three vertical shadcn Card results with visible reason, duration,
  servings, named ingredient and equipment readiness, preference matches,
  required confirmations, optional ingredients, warnings, and one full-width
  Select recipe action per result.
- Selecting a recipe preserves the exact response object and request at the
  Pre-Cooking handoff boundary. It does not regenerate Recommendation, create a
  Cooking Session, invoke Pre-Cooking, or mutate Inventory.
- Recommendation intentionally hides BottomNavigation while retaining the
  compact authenticated AppShell. Its Home/back actions restore the cached
  request and result.
- Browser acceptance passed at 320px, 390px, 768px, 1440px, and 1920px with
  zero horizontal overflow, readable wrapping, reachable selection actions,
  hidden Recommendation navigation, a 572px rendered desktop canvas, working
  recipe selection/back behavior, and a visible 3px keyboard-focus outline.
- Validation: web typecheck, production build, all 65 web tests / 155
  expectations, scoped Biome checks, and oxlint pass. Oxlint reports only the
  established Fast Refresh warning category for route and primitive modules.

### Flemme Web — Phase 2: Home Composition v0.1

- Replaced the `/app` placeholder with a thin route that renders the dedicated
  `features/home` composition through the existing PageContainer and AppShell.
- Added a shared identity presenter. The canonical Auth response still exposes
  only ID and email, so Home uses the email username rather than the complete
  address and falls back to `User`; the header derives its initial identically.
- Added the controlled shadcn Textarea cooking prompt with accessible idle,
  focus, value, submitting, and recoverable-error presentation boundaries.
  Recommendation submission remains deliberately unbound until Phase 3.
- Added four touch-friendly Quick Start actions that populate a valid
  `session.request` string without inventing inventory or persistent context.
- Added reusable shadcn Card compositions for persisted active-session
  continuity, the Inventory shortcut, and a three-item Recent Cooking preview.
  With no active-session/history listing integration in this phase, Home omits
  the active section and renders the compact recent empty hint instead of fake
  session data.
- Browser acceptance passed at 320px, 390px, 768px, 1440px, and 1920px with no
  horizontal overflow, navigation-safe content, a centered 576px desktop
  canvas, working Quick Start selection, Inventory/Home routing, and visible
  keyboard focus.
- Validation: web typecheck, production build, all 49 web tests / 116
  expectations, oxlint, and scoped Biome checks pass. Oxlint reports only the
  established Fast Refresh warning category for route and primitive modules.

### Flemme Web — Phase 1: App Foundation v0.1

- Added a compact `max-w-xl` authenticated AppShell with a semantic AppHeader,
  consistent PageContainer spacing, and fixed safe-area-aware BottomNavigation.
- Added Home, Inventory, History, and Favorites routes. TanStack Router provides
  route-aware active states with visible labels, borders, and `aria-current`.
- Added generic shadcn-backed LoadingState, EmptyState, and ErrorState
  components and exposed the shared app component API through one barrel.
- Preserved the existing `/app` authentication and onboarding guards plus the
  post-onboarding Household and Kitchen edit entry points. The compact header
  presents only the user's rounded initial; it does not expose their email or a
  logout icon. No Product Domain request, persistence, or cooking behavior
  changed.
- Browser acceptance passed at 320px, 390px, 768px, 1440px, and 1920px with no
  horizontal overflow, a 576px centered tablet/desktop canvas, visible global
  navigation, navigation-safe content, no sidebar, and keyboard-visible focus.
- Validation: web typecheck, production build, all 46 existing web tests,
  oxlint, and scoped Biome checks pass. Oxlint retains only its established Fast
  Refresh warnings for route and shared primitive files.


### Landing Page Component Refactor v0.1

- Corrected the landing banner barrel export and page import so the refactored
  landing composition resolves the existing `banner.tsx` module successfully.
- Restored the typed ticker, journey, and recipe presentation data required by
  the extracted landing components without changing their styling or markup.
- Aligned the redesigned recipe card call site and shared RecipeArt props so
  its responsive art sizing typechecks without changing any Tailwind classes.
- Replaced the Nasi goreng landing-card illustration with the provided local
  food photograph, including descriptive alternative text and the existing
  responsive bordered presentation; other recipe artwork remains unchanged.
- Corrected the recipe image rendering to read its typed `src` and `alt`
  fields; no CSS classes, layout behavior, or visual styling changed.
- Connected the provided Ayam kecap and creamy sambal pasta photographs to
  their landing recipe records with descriptive alternative text.
- Replaced the About section's desktop yellow text badge with the transparent
  Flemme fish mascot, removing the old frame/background spacing and retaining
  a playful rotated placement.
- Enlarged the mobile Personalization section's supporting copy, context-label
  pills, central badge, visual canvas, spacing, and lavender section area while
  preserving the established desktop grid. Increased the central orange badge
  further across breakpoints to tighten its spacing within the dashed orbit.
- Replaced the Personalization orbit's orange Flemme badge with the provided
  transparent brain mascot while retaining the centered responsive footprint.
- Restored the original brain mascot unchanged and replaced the Personalization
  section's lavender background with Flemme mustard for stronger harmony with
  the mascot's cream, forest-green, and orange artwork.
- Made the brand ticker loop seamless at wide viewports by rendering two equal,
  viewport-filling statement groups; copy, separators, styling, and speed are
  unchanged.
- Cleared landing-component formatting and Tailwind utility warnings by using
  valid Tailwind v4 canonical forms for equivalent aspect, size, radius,
  rotation, and custom-property utilities; rendered values remain unchanged.
- Reduced `src/landing/landing-page.tsx` to 29 lines of ordered section
  composition; the TanStack route and shared UI primitives remain unchanged.
- Extracted navbar, banner, ticker, discover, about, journey, personalization,
  pricing, final CTA, and footer into `src/components/landing`.
- Kept hero artwork and context stickers local to their owning sections.
  Extracted shared BrandMark, SectionHeading, decorative RecipeArt, and the
  shadcn-backed LandingRecipeCard wrapper.
- Moved static recipe, ticker, and journey arrays to `data.ts`, with an inferred
  recipe type. A small landing-only styles module retains shared class strings.
  The barrel exports sections only; internal modules use direct imports.
- Preserved existing copy, Tailwind classes, semantic markup, route links,
  anchors, menu state, reduced motion, and groovy-retro neubrutalist styling.
- Browser verification found exact before/after rendered DOM parity at 390px
  and 1440px, with no horizontal overflow. Menu open/close, About anchor,
  Login/Register navigation, and reduced-motion ticker behavior passed.
- Web typecheck, production build, Biome, and all 46 existing tests passed.

### Landing Page Tailwind + shadcn Migration

- Replaced all landing-specific vanilla CSS selectors with Tailwind utilities
  colocated in `landing-page.tsx`; global CSS retains only the shared semantic
  tokens and marquee keyframes that cannot reasonably live in JSX.
- Composed landing CTAs, mobile navigation control, recipe actions, recipe
  surfaces, and the early-access surface from the shared shadcn Button, Card,
  and Badge primitives.
- Preserved the existing Flemme structure, copy, cream/ink/orange/lime/lavender
  palette, expressive typography, ingredient illustration, rotated ticker,
  hard shadows, bold borders, rounded forms, and groovy-retro neubrutalist
  hierarchy.
- Preserved all public anchors and Login/Register routes. No authentication,
  onboarding, API, or Product Domain behavior changed.
- Mobile browser acceptance at 390px confirmed the complete page, accessible
  expandable navigation, all CTAs, and zero horizontal overflow. Desktop
  acceptance at 1440px confirmed desktop navigation, the two-column hero,
  responsive section layouts, and zero horizontal overflow.

### Web UI Foundation v0.1

- Confirmed Tailwind CSS v4, the Vite plugin, the `@/*` source alias, the global
  stylesheet entry, and shadcn generation paths without replacing the installed
  setup.
- Replaced default neutral shadcn tokens with semantic Flemme cream, ink,
  orange, lime, lavender, muted, success, danger, radius, typography, border,
  and hard-shadow tokens while preserving existing legacy visual tokens.
- Customized Button, Card, Input, Textarea, Badge, Avatar, Dialog, Drawer,
  Skeleton, and Sonner primitives with Flemme's tactile neubrutalist interaction
  language, readable focus states, and mobile-sized controls.
- Kept all primitives reusable and free of authentication, routing, API,
  onboarding, inventory, or cooking behavior. Existing pages remain an
  incremental migration unit rather than being rewritten in this foundation.
- Added scoped Biome Tailwind-directive parsing for the web package.
- Browser smoke verification at 390px confirmed readable controls, dialog and
  drawer behavior, 44–48px primary targets, and zero horizontal overflow.
  Desktop verification at 1440px retained a centered 576px application surface.

### User Platform O6 — Completion → Home

- Added canonical `GET /onboarding` status resolution and idempotent
  `POST /onboarding/complete`. The server verifies Profile, Household, Kitchen,
  and the Initial Inventory decision before persisting
  `users.onboarding_completed_at`.
- Kept Initial Inventory content optional: both saved items and Add later create
  the Inventory decision, then advance to `/onboarding/complete`.
- Added the mobile-first Setup complete screen with honest inventory-safe copy,
  a single Start Cooking action, submission locking, saved-state retry messaging,
  and stale-state recovery to the actual incomplete step.
- Route guards now send incomplete Home access to the backend-resolved next step,
  completed onboarding access to `/app`, and preserve explicit Household and
  Kitchen editing through `?edit=true` without changing completion state.
- Completion navigation replaces the transition entry. Canonical guards prevent
  refresh and browser Back from reopening onboarding; logout, login, and another
  device restore completion from backend state.
- Completion remains separate from Cooking Completion and invokes neither a
  cooking Agent nor Recommendation. Home remains usable with an empty Inventory.
- Mobile browser acceptance at 390px confirmed Add later, the completion screen,
  zero horizontal overflow, Start Cooking, Home entry, and guarded Back behavior.
- Validation: 46 web tests / 110 expectations, 132 API tests / 1,150
  expectations, focused Onboarding API integration, seven-package typecheck,
  API/web builds, and Drizzle migration check pass.

### User Platform O5 — Initial Inventory

- Replaced `/onboarding/inventory` placeholder content with a mobile-first
  free-form ingredient entry flow, safe canonical suggestions, removable chips,
  duplicate feedback, a dynamic ingredient count, Finish Setup, and Add later.
- Natural English and Indonesian catalog names and aliases resolve through
  `@flemme/ingredients`; unknown names remain valid. Canonical and normalized
  free-text duplicates collapse to one persisted item.
- Added atomic `PUT /inventory/items` full replacement for onboarding while
  retaining the existing Inventory Management create/update/delete API. No
  onboarding-only persistence model was introduced.
- Inventory rows now preserve a normalized identity key, optional canonical key,
  and submitted display name. Migration `0002_eager_norman_osborn.sql` backfills
  existing rows before applying non-null and uniqueness constraints.
- Cooking context projects canonical keys for resolved entries and stored names
  for unresolved entries. Request-level inventory remains authoritative and no
  recommendation or cooking path mutates persistence.
- Finish Setup persists all chips and advances to Completion. Add later
  idempotently initializes the same empty Inventory parent and also advances to
  Completion. Both paths prevent submission races; failed saves preserve chips
  and leave Add later available.
- Mobile browser acceptance at 390px confirmed the empty Add later state,
  free-form resolved/unresolved entry, canonical duplicate prevention, no
  horizontal overflow, persistence, and navigation to Completion. A separate
  user confirmed Add later creates an empty inventory.
- Validation: 45 web tests / 103 expectations, 128 API tests / 1,136
  expectations, focused Inventory integration, seven-package typecheck,
  API/web builds, Drizzle migration check, migration preservation, cooking
  lifecycle validation, and scoped Biome checks pass.

### User Platform O4 — Kitchen Equipment

- Added the shared v0.1 equipment catalog with 19 canonical keys, display labels,
  and five presentation categories in `@flemme/contracts`.
- Replaced `/onboarding/kitchen` placeholder content with grouped, mobile-first,
  keyboard-operable multi-select cards. Missing kitchens start with no selection
  and no equipment is silently assumed.
- Enforced at least one unique, supported canonical equipment key at the API
  boundary. Empty, duplicate, label-form, and unsupported values are rejected
  without replacing existing persistence.
- Continue persists the full selection, synchronizes the Kitchen query cache,
  recomputes onboarding state, and advances to Initial Inventory, another actual
  missing step, or `/app`. Failed saves retain the selection and duplicate
  submission is prevented; no Skip exists.
- Completed users can reopen the prepopulated Kitchen editor from `/app`; saving
  returns to `/app` without restarting onboarding.
- Existing Kitchen persistence transactions, cooking-context projection,
  recommendation use, request-level whole-object overrides, Inventory
  separation, and historical Cooking Session behavior remain unchanged.
- Mobile browser acceptance at 390px confirmed the empty-invalid state, all 19
  grouped items, selection/deselection semantics, accessible pressed states,
  save to Initial Inventory, zero horizontal overflow, completed-user editing,
  prepopulation, and return to `/app`.
- Validation: 39 web tests / 84 expectations, 126 API tests / 1,122
  expectations, seven-package workspace typecheck, API/web production builds,
  focused Kitchen integration, and scoped Biome checks pass.

### User Platform O3 — Household

- Replaced `/onboarding/household` placeholder content with a mobile-first
  adults, children, and toddlers stepper form.
- Missing households start locally at one adult; existing households prepopulate
  all counts for onboarding resume and post-onboarding editing.
- Enforced the v0.1 contract at both UI and API boundaries: integer counts from
  0 through 20 per category and at least one household member overall.
- Added accessible increase/decrease labels, 48px touch controls, readable count
  outputs, singular/plural household summaries, disabled invalid/limit controls,
  duplicate-submit prevention, retained selections on failure, and no Skip.
- Continue persists the complete household aggregate, synchronizes its query
  cache, recomputes onboarding state, and advances to Kitchen Equipment, the
  actual next missing step, or `/app`.
- Completed users can reopen the household editor from `/app`; changes affect
  the persistent cooking context through the existing Household API without
  modifying inventory or historical Cooking Sessions.
- Existing API cooking-context integration and whole-object request overrides
  remain unchanged.
- Mobile browser acceptance at 390px confirmed default, empty-invalid, saved
  navigation, zero horizontal overflow, completed-user reopening, prepopulation,
  editing, and return to `/app`.
- Validation: 32 web tests / 67 expectations, 127 API tests / 1,123
  expectations, focused Household API integration, API/web typechecks and
  builds, and scoped Biome checks pass.

### Web Landing Visual Foundation

- Replaced the minimal public home screen with a complete editorial landing:
  consumer-brand navigation, food-first hero, statement ticker, Discover,
  About, cooking journey, personalization, early-access pricing, final CTA, and
  footer.
- Added the locked Calistoga, Shrikhand, and Plus Jakarta Sans fonts as local
  build dependencies and established the cream, ink, orange, tomato, mustard,
  lime, lavender, and soft-pink semantic palette with shared radius, border,
  shadow, and container tokens.
- Built the hero and recipe imagery from intentional CSS illustration rather
  than a generic dashboard, AI graphic, stock photo, fake metric, or new image
  dependency.
- Added a distinct mobile navigation menu, single-column 390px composition,
  desktop editorial asymmetry, tactile controls, visible focus treatment, and
  reduced-motion fallbacks.
- Preserved all login, registration, onboarding, and authenticated application
  routes and behavior.
- Browser acceptance at 390px and 1440px confirmed the intended fonts,
  responsive navigation, all landing sections, working mobile menu, and zero
  horizontal overflow.
- Web typecheck and production build pass. Web lint reports only the existing
  Fast Refresh warnings.

### API Module Structure Cleanup

- Moved all API feature directories, including Auth and Cooking Engine features,
  under `apps/api/src/modules` to match the documented colocated module shape.
- Kept API-wide composition, environment/error helpers, and shared test utilities
  directly under `apps/api/src`; no routes, contracts, services, or runtime
  behavior changed.
- Updated source imports and the API flow learning guide to the new canonical
  paths.
- API typecheck, production build, and the full 127-test API suite with 1,122
  expectations pass.

### Auth v1 A8

- Retired the temporary authentication selector and header adapter. The common
  middleware calls official `auth.api.getSession({ headers })`, validates the
  canonical UUID, and sets `currentUserId: string`. No fallback or service
  signature change remains.
- All 23 protected operations use the same boundary, including `/auth/me`,
  Profile, Household, Kitchen, Inventory, Favorites, Recommendation, Pre-Cooking,
  Cooking Sessions, Active Cooking, Completion, and Nutrition. Health, OpenAPI,
  Swagger, and framework-owned Auth endpoints retain their public boundaries.
- Migrated 11 HTTP integration suites to shared real Better Auth session
  fixtures. Setup uses the official server signup API to avoid cross-suite HTTP
  limiter interference; all protected domain requests still send real cookies
  through the actual middleware. Pure service/database boundaries are unchanged.
- Security regressions reject missing, invalid, expired, logged-out, and
  retired-header-only authentication across every protected operation. A valid
  session remains authoritative over a conflicting legacy identity header.
- Current OpenAPI, environment, README, architecture, and Swagger instructions
  describe only session-cookie authentication. Remaining legacy source strings
  are adversarial security tests; older plan/checkpoint references are explicitly
  archival. No active runtime or frontend development-auth implementation remains.
- Removed only the obsolete production mode restriction. Production HTTPS API
  and web origins, HttpOnly host-only SameSite=Lax cookies, Secure cookies on
  HTTPS/production, explicit credentialed CORS, and CSRF/origin checks remain.
- Canonical runtime acceptance started normally without a mode variable.
  Mobile browser registration/password login, `/auth/me` 200, Profile 404/200,
  refresh restoration, guest/protected navigation, onboarding, logout 200,
  stale-cookie/header-only 401, and two-user cache isolation passed.
  Google initiation reached Google with the unchanged localhost callback.
  Callback/session acceptance combines passing controlled Google regressions
  with the accepted A7 user-reported manual browser flow; no account was
  destructively re-provisioned.
- Validation: focused Auth 14 tests / 648 expectations; Product Domain HTTP
  96 tests / 408 expectations; full API 126 tests / 1,108 expectations; web
  11 tests / 19 expectations; migration 1 test / 20 expectations. Database
  lifecycle validation, Drizzle check, seven-package typecheck, API/web builds,
  scoped Biome (31 source files), and whitespace checks pass. Web lint passes
  with six existing Fast Refresh warnings.
- No schema or migration changes. Temporary browser users and OAuth state were
  removed and acceptance servers stopped. Deferred verification, recovery,
  linking, distributed rate limiting, and Admin authorization were not added.

### User Platform O1 — Onboarding Flow Foundation

- Implemented onboarding route orchestration: `/app` and `/onboarding` now route directly to the first missing product domain step by server-state inspection.
- Added onboarding step route shells for `/onboarding/profile`, `/onboarding/household`, `/onboarding/kitchen`, `/onboarding/inventory`.
- Applied deterministic first-incomplete derivation for resume/re-entry semantics and preserved 404 `*_NOT_FOUND` as onboarding-incomplete semantics only.
- Kept query/data handling on TanStack Query + Better Auth session ownership boundary; no form workflows or backend changes were added in O1.

### User Platform F1 — Redirect Loop Fix

- Added route-level redirect normalization to prevent parent/step self-redirect
  loops when all Product Domain resources are missing and onboarding is incomplete.
- Centralized route redirection decisions through `resolveOnboardingRedirect` and
  applied explicit no-op behavior when current route already matches
  `/onboarding/{nextStep}`.
- Preserved existing O1 onboarding state semantics:
  `*_NOT_FOUND` marks missing required resources; non-404/API errors stay errors.
- Added focused route-redirection behavior tests for:
  fresh-missing, self-route, mismatched-step reconciliation, and complete-user
  reconciliation.

### User Platform F2 — Empty Inventory Initialization

- Added backend `PUT /inventory` to ensure a current-user inventory parent exists
  without requiring item payloads; returns the current inventory representation.
- `ensure` operation is idempotent and concurrency-safe through user-unique
  upsert behavior.
- Existing item create/update/delete flows still initialize inventory when needed
  and continue validating canonical ingredients, ownership, and item-level errors.
- Added integration coverage for:
  - missing inventory transitions (404 -> init -> 200 with `items: []`)
  - repeated initialization idempotency and duplicate parent prevention
  - preservation of populated inventory on re-initialize
  - `PUT /inventory` presence in OpenAPI
  - unauthenticated initialization blocked by `CurrentUser`

### User Platform O2 — Profile Preferences

- Replaced `/onboarding/profile` placeholder content with a mobile-first,
  keyboard-accessible multi-select preference form.
- Fixed the concrete O1 integration issue where the parent onboarding route
  rendered `null`; it now renders its child step through TanStack Router `Outlet`.
- Added stable v0.1 stored values: food `indonesian`, `asian`, `western`,
  `savory`, `spicy`, `sweet`; cooking `quick`, `simple`, `one-pan`,
  `low-effort`, `fried`, `grilled`. Labels remain presentation-only.
- Missing `PROFILE_NOT_FOUND` loads empty local selections without persistence.
  Existing profiles prepopulate both arrays, including persisted values outside
  the v0.1 vocabulary so revisiting cannot silently discard them.
- Continue sends full replacement arrays. Skip explicitly persists empty arrays;
  both actions disable during the shared mutation.
- Successful saves update the Profile query, invalidate and refetch the actual
  onboarding decision dependencies, then navigate to Household, another actual
  missing step, or `/app`. Failed saves remain on the form.
- Added focused frontend coverage for missing/existing profiles, selection
  toggles, complete Continue/Skip payloads, legacy value preservation, Profile
  cache synchronization, fresh/partial/complete routing, and failed mutations.

### Historical checkpoints

The completed milestones below are historical records, not current setup
instructions. Earlier authentication adapters and mode-selection instructions
are superseded by A8; consult `apps/api/README.md` for the current workflow.

### Auth v1 A7

- Added the official Better Auth React client at the centralized `/auth`
  browser boundary. All API requests use `VITE_API_URL`, credentialed cookies,
  and the shared Flemme error envelope; no browser auth secret or development
  identity header exists.
- Added password registration and login, official Google sign-in initiation,
  canonical `/auth/me` session state, protected and guest route guards, refresh
  restoration, server logout, user-scoped cache clearing, and safe error
  messages.
- Added mobile-first Flemme routes for landing, login, registration, the
  authenticated platform entry, and onboarding status. Onboarding derives only
  from existing Profile, Household, Kitchen, and Inventory APIs; it adds no
  Product Domain behavior or form.
- Real browser acceptance passed for password registration, automatic session
  establishment, canonical identity, protected navigation, refresh restoration,
  logout and stale-session rejection, existing-user login, generic invalid-
  password handling, and two-user cache isolation.
- Google browser acceptance was completed manually by the user in the canonical
  localhost environment. The user confirmed all was working after changing
  `.env` to `AUTH_MODE=better-auth`. This closes the remaining A7 blocker;
  final manual browser evidence is user-reported, not agent-observed.
- A7 validation: 11 web tests / 19 expectations, workspace typecheck, web and
  API builds, full API 129 tests / 813 expectations, web lint, scoped Biome, and
  git diff checks. A8, Admin/RBAC, backend development-auth removal, and Product
  Domain redesign were not started.
- The canonical acceptance attempt found `.env` selecting
  `AUTH_MODE=development`. Vite `envDir` was configured to load the documented
  root environment, and a normal web build passed without an inline environment
  override. The user subsequently corrected Auth mode and confirmed successful
  manual acceptance. No alternate OAuth origins, callback changes, or migrations
  were introduced.

### Auth v1 A6

- Final architecture invariant accepted: password and Google identities resolve
  through Better Auth database sessions to the canonical users.id UUID and the
  common currentUserId HTTP boundary. Product Domain services remain auth-
  transport and provider agnostic.
- Password acceptance covers registration, migrated/new login, rejection paths,
  restore, independent sessions, logout and stale-cookie rejection. Accepted A4
  evidence plus controlled callback regression covers Google provisioning,
  returning identity, no duplication, restoration, logout and collision policy.
- Better Auth session coverage reaches `/auth/me`, Profile, Household, Kitchen,
  Inventory, Favorites, Recommendation, Pre-Cooking, Cooking Sessions and
  Nutrition. Two authenticated users preserve Inventory and Cooking Session
  ownership; the full domain suite preserves Favorites ownership semantics.
- Cookie/session, CORS/origin/CSRF, explicit mode isolation, production fail-
  closed configuration, account isolation, linking, password policy, rate limits,
  OpenAPI and database integrity gates pass without an A6 feature or migration.
- Live isolated API acceptance in `AUTH_MODE=better-auth` passed: password signup,
  logout, sign-in, `/auth/me` 200 with canonical UUID/email, Profile reached its
  valid 404 domain state, sign-out 200 and stale-cookie Profile 401. No
  development header was sent. The temporary user was deleted and server stopped.
  Real Google runtime evidence was reused from accepted A4 as permitted.
- Final validation: A3/A4 focused 13 passed / 234 expectations; A5 focused
  2 passed / 54 expectations; full API 129 passed / 813 expectations; isolated
  auth migration 1 passed / 20 expectations. Database lifecycle, workspace
  typecheck, API/web builds, Drizzle, 35-file scoped Biome and git diff checks
  pass. No apps/web, Admin, RBAC, recovery, verification, linking, credits,
  billing or Redis work.

### Auth v1 A5

- Added an explicit `AUTH_MODE` with exactly `better-auth` and `development`;
  missing/invalid modes fail configuration. Production rejects development mode
  while permitting Better Auth only with the existing HTTPS origin guard.
- Centralized Product Domain authentication at a generic current-user middleware
  boundary. Better Auth mode uses the official server `getSession` API and maps
  only the validated canonical `session.user.id` UUID to `currentUserId`.
- Better Auth mode ignores `x-flemme-user-id`; development mode ignores session
  cookies. Neither adapter falls back to the other. Development IDs retain their
  existing PostgreSQL users.id existence check.
- Missing, invalid, expired and logged-out sessions return the Flemme
  `UNAUTHENTICATED` 401 payload without exposing Better Auth details. Auth,
  health, OpenAPI and Swagger routes remain public.
- Application-owned GET `/auth/me` uses the same boundary and returns only the
  canonical users.id UUID and email. Password, controlled Google and
  unauthenticated behavior are accepted.
- Password-session acceptance covers Profile, Household, Kitchen, Inventory and
  Favorites without a development header. Session-backed Recommendation proves
  persistent context loading and complete request-level replacement semantics.
  Owned Cooking Session access and cross-user Inventory 403 behavior pass.
- Protected OpenAPI operations use CurrentUser. Better Auth mode documents the
  session cookie; development mode documents the explicitly temporary header.
- Product Domain route/service signatures and ownership-aware queries are
  unchanged. No apps/web, Admin authorization, ownership redesign, migration or
  development-auth removal.
- Final validation: A3/A4 regressions 13 passed / 234 expectations; focused A5
  2 passed / 51 expectations; full API 129 passed / 810 expectations. Real
  PostgreSQL migration and lifecycle checks, workspace typecheck, API/web build,
  Drizzle, scoped Biome and git diff checks pass.

### Auth v1 A4

- Google configured on pinned Better Auth 1.7.4, required server-only Google
  client ID/secret; callback /auth/callback/google. Real .env not modified.
- Identity-only scopes, online access, no incremental authorization, no
  direct ID-token login, provider-token HTTP access or provider management.
- Native state/PKCE/origin/callback guards retained. Small HTTP policy rejects
  scope escalation/extra authorization parameters, not a custom OAuth protocol.
- Real PostgreSQL controlled token-exchange tests cover new/returning Google
  identity, UUID/account/session mapping, no Product Domain provisioning,
  password collision rejection, reverse collision and session restoration.
- No implicit/explicit linking; no Product Domain auth changes, frontend,
  migration, /auth/me or Google API usage. A3 Argon2/password behavior retained.
- Social initiation gets the same built-in 20/minute rule as password endpoints;
  callback uses general 100/minute rule, no exception or Redis.
- A4 validation: full API 128 passed, focused Auth 16 passed; workspace
  typecheck, API/web build, Drizzle, Auth-file Biome, real PostgreSQL lifecycle
  and preservation-migration checks passed.
- Real Google credentials and Cloud configuration are accepted. Real new and
  returning Google login, callback, restoration and logout completed with the
  same canonical UUID and no duplicate identity or Product Domain rows.
  Browser session JSON omitted the raw token, and logged-out cookie replay was
  rejected. Actual provider tokens remain private.
  See `docs/plans/flemme-auth-v1-a4-google.md`.

### Auth v1 A3

- Email/password active under Better Auth native routes; explicit registration,
  auto-sign-in, no verification requirement, 8–128 character password policy.
  Bun Argon2id hashes retained. No Google/linking/recovery/verification delivery.
- JSON email input trimmed/lowercased before framework validation. Auth name
  stays separate from Profile. Registration creates no Product Domain rows.
  Success JSON omits raw session tokens while retaining HttpOnly cookie transport.
- Real PostgreSQL and live API cookie-jar flows pass for signup, restoration,
  sign-out/replay rejection and original migrated seed login. Hash unchanged.
  Multiple sessions remain independent; no session→currentUserId bridge yet.
- Built-in memory limiter: 20 password requests/60 seconds per bucket; no Redis.
  Current runtime uses shared per-path fallback without trusted IP integration;
  deployment IP trust and distributed limiting remain production requirements.
- Full API, workspace typecheck/build, Drizzle, scoped Biome, diff and database
  lifecycle checks pass. Live acceptance process stopped and test data cleaned.
- See `docs/plans/flemme-auth-v1-a3-email-password.md`. Auth v1 remains incomplete.

### Auth v1 A2

- Better Auth instance uses the existing Drizzle connection and A1 tables,
  UUID generation and Bun Argon2id hooks. Mounted raw at `/auth/*`; no migration.
- Explicit secret/base URL/web origin validation; no fallback secrets. Seven-day
  database sessions, daily renewal, no cookie cache; HttpOnly host-only Lax cookies,
  Secure for HTTPS/production. Centralized exact-origin credentialed CORS handles
  preflight before protected routes. Implicit and explicit linking disabled.
- Email/password disabled and Google absent. Framework disabled errors and
  unauthenticated null session are tested; no valid sessions fabricated.
- Existing development-header routes/OpenAPI and production guard unchanged.
  No frontend, Google secrets, domain hooks, /auth/me or auth aliases added.
- Focused PostgreSQL tests exercise adapter reads for all four models, generated
  UUIDs, resolved cookies/options, CORS, disabled flows and legacy seed hash.
  Nine focused tests / 119 expectations and full API 121 tests / 581 expectations
  pass. Explicit origin/CSRF checks remain enabled even under tests. Workspace
  typecheck/build, Drizzle, scoped Biome, whitespace and lifecycle checks pass.

### Auth v1 A1

- Pinned Better Auth 1.7.4 in API. Inspected installed framework schema metadata
  using a non-mounted configuration with UUID IDs, Bun Argon2id password hooks,
  database sessions and disableImplicitLinking. No Google credentials or handlers.
- Migration 0001 renames credentials/password columns in place, adds provider
  account identity and OAuth fields, adapts sessions and adds verifications.
  Users receive neutral auth name, false emailVerified and nullable image.
  Profile displayName remains independent. Legacy sessions are invalidated.
- Real database preservation: users 1→1, credentials 1→1; original UUID/email,
  exact hash, timestamps and all Product Domain rows unchanged. Known seed
  password verifies. No legacy sessions existed. No incompatible emails found.
- Isolated PostgreSQL migration test passes; API 114 tests / 525 expectations
  pass; typecheck/build/Drizzle/scoped Biome/lifecycle and whitespace checks pass.
- Five-credit registration provisioning is explicitly deferred, not an Auth
  blocker. No role/admin fields or Product Domain changes.
- See `docs/plans/flemme-auth-v1-a1-schema-integration.md` for mapping and risks.

### Favorites API v0.1

- Final acceptance passed through live localhost HTTP using isolated real
  development users and create/progress/complete session endpoints. Verified
  historical projection, duplicate/ineligible/ownership guards, corrupt and
  missing sessions, favorite deletion with identical preserved history,
  newest-first/tie ordering, and session FK cascade through isolated database
  deletion. `/docs` and live OpenAPI passed. Temporary data was cleaned up.
  Six focused tests and all 112 API tests passed again, alongside all quality
  gates. No API fixes required; only temporary command quoting was corrected.
  Auth v1 Architecture & Existing Schema Audit is next, not started.

- Validation: six focused tests (44 expectations) and full API suite of 112
  tests (462 expectations) pass against real PostgreSQL. Workspace typecheck,
  API/web builds, Drizzle check, scoped Biome, diff whitespace and database
  lifecycle validation pass. OpenAPI security/operations are tested. Manual
  browser/runtime acceptance is not claimed. The only test correction was a
  nonempty ingredient list required by existing completion nutrition validation.

- GET/POST `/favorites` and DELETE `/favorites/{id}` reference owned completed
  Cooking Sessions using the existing composite ownership FK and uniqueness.
- Session restoration is exported for reuse without behavior changes. Recipes
  are validated historical projections; no AI or current cooking context used.
- Duplicate creation returns 409; incomplete valid sessions 409; corrupt
  persisted snapshots 500; cross-user access 403; missing resources 404.
- Deleting a favorite preserves session/completion/nutrition history. Listing
  sorts createdAt descending then UUID descending, without pagination.
- No migration, new recipe table, or Auth v1 work. Swagger flow documented in
  `docs/testing/swagger-favorites-flow.md`.

### Inventory API v0.1

- Final acceptance: live localhost HTTP flow passed against healthy PostgreSQL
  with existing migrations applied. Two temporary development users verified
  missing/create/read/update/delete/empty states, canonical key and alias
  rejection, duplicate prevention, quantity/unit pairing, immutable identity,
  cross-user 403 and missing-item 404 behavior. Cooking-context visibility and
  whole-list request replacement passed after live mutations. `/docs` served
  successfully and live OpenAPI exposed all four operations. Browser control
  was unavailable; direct HTTP verification was used as permitted. Temporary
  users were cleaned up. All 106 API tests and quality gates passed again;
  no implementation fixes were required. Favorites remains unstarted.

- GET `/inventory`, POST `/inventory/items`, PUT and DELETE
  `/inventory/items/{id}` manage existing parent/item persistence. No migration.
- Canonical production keys only on create; unknown keys return 422. Existing
  legacy keys remain readable without automatic remapping. Duplicate keys
  return 409 through the existing database uniqueness constraint.
- PUT replaces quantity, unit, approximation and condition, not identity.
  Quantity/unit must both be null or both present; positive numeric(14,3)
  quantities and the existing condition enum are retained. Zero is rejected.
- Missing parent returns 404; existing empty inventory returns an empty list.
  Create uses a transaction; rollback and ownership predicates are tested.
- Seven focused tests pass, including six real PostgreSQL integration tests.
  Full API suite: 106 passing tests, 418 expectations. Workspace typecheck,
  builds, Drizzle check, scoped Biome, lifecycle validation and diff checks pass.
- OpenAPI registration is tested; manual Swagger flow is documented in
  `docs/testing/swagger-inventory-flow.md`. No browser verification is claimed.

### Kitchen / Equipment API v0.1

- GET and PUT `/kitchen` expose only `{ equipment: string[] }` using the existing
  kitchen parent and free-form equipment child rows. Missing kitchens return
  `KITCHEN_NOT_FOUND`; GET performs no initialization. Empty equipment is valid.
- PUT trims surrounding whitespace, preserves case, rejects blank names and
  duplicates ignoring case, and replaces the complete list. No equipment master
  model or migration was introduced. Responses sort names deterministically;
  input order is not persisted.
- Parent upsert, child deletion, and insertion use one PostgreSQL transaction.
  A real unique-constraint failure test proves previous equipment survives a
  failed insert. Ownership comes exclusively from authenticated currentUserId.
- Cooking-context orchestration reads the same rows without behavior changes;
  request-level Kitchen overrides continue to replace persistent equipment.
- Four contract and nine PostgreSQL integration tests pass (13 focused tests,
  45 expectations). Full API: 99 passing tests, 364 expectations. Workspace
  typecheck, API/web builds, Drizzle schema check, scoped Biome, database
  lifecycle validation, and diff whitespace checks pass.
- Swagger operations and `docs/testing/swagger-kitchen-flow.md` document the
  create/read/replace/empty sequence. No manual browser validation is claimed.

### Repository Foundation

- Bun monorepo initialized.
- Turborepo configured.
- Workspace discovery validated.
- Shared TypeScript configuration established.
- Workspace typecheck orchestration passes.

### Web Foundation

- Vite + React configured.
- TanStack Router configured.
- TanStack Query configured.
- Tailwind CSS configured.
- shadcn/ui initialized.

### Architecture

- `agent` moved from `apps/agent` to `packages/agent`.
- Agent is treated as a reusable capability rather than an independent
  application.

### Agent Foundation

- Base folders and implementation-light module boundaries created for intents,
  prompts, context, policies, providers, runtime, vision tools, and evals.
- All agent source modules are included in package typechecking.
- OpenAI-compatible model creation is isolated in `packages/agent/src/providers`
  and receives provider credentials from the invoking application.
- A local one-off completion runner loads development provider values from the
  repository environment file, validates a documented structured cooking
  context with Zod, and passes it through the recommendation flow.
- The shared cooking instruction defines Flemme's context priority,
  inventory-first recommendations, uncertainty handling, cooking-session
  behavior, side-effect boundary, safety guidance, and communication style.
- The cooking recommendation prompt defines recommendation priorities,
  personalization rules, discovery-level response guidance, and when a
  follow-up question is warranted.
- Recommendation personalization treats multiple cuisine and food references
  as flexible ranking signals. Current-session intent, inventory, equipment,
  time, and practicality remain stronger contextual constraints, and practical
  alternatives outside preferred cuisines may be offered honestly.
- Structured recommendation prompt semantics distinguish required ingredients
  and equipment from optional additions, define availability independently from
  quantity sufficiency, and require material quantity uncertainty to surface as
  a confirmation instead of being mislabeled as missing. Any ingredient framed
  as optional or nonessential is excluded from required ingredients.
- The cooking recommendation intent composes the shared cooking instruction
  with the recommendation-specific prompt and invokes Anvia through a model
  supplied by the calling application.
- The cooking agent runtime delegates recommendation requests to the cooking
  recommendation intent without taking ownership of application concerns.
- The first cooking recommendation input contract validates inventory,
  kitchen equipment, household counts, food and cooking preferences, and
  optional session constraints with Zod. Its inferred TypeScript type is
  exported from the agent package alongside the schema.
- The cooking agent runtime, recommendation intent, and recommendation prompt
  builder now accept the structured cooking recommendation input. The prompt
  builder serializes that context for the model while preserving the existing
  recommendation instructions.
- The first cooking recommendation output contract is a Zod discriminated union
  with recommendation, clarification, and no-viable-recommendation results.
  Recommendation results contain one to three structured options with duration,
  servings, feasibility, requirements, preference matches, confirmations,
  optional ingredients, and warnings.
- The cooking recommendation execution passes the output contract to Anvia's
  native `generateCompletion` `outputSchema` option and returns only the typed,
  schema-validated `CookingRecommendationOutput`. The runner only prints this
  result and does not own output parsing or validation.
- The development runner explicitly uses `gpt-5.6-luna` because the compatibility
  probe confirmed native structured-output support through the configured
  gateway. The provider factory default remains unchanged.
- A development-only structured-output compatibility probe tests subsidized
  models individually against the same minimal Zod schema through Anvia's
  native `outputSchema` mechanism.
- The initial pre-cooking intent accepts a previously validated selected recipe
  and the existing cooking recommendation context, validates both with their
  existing Zod schemas, combines shared cooking instructions with a minimal
  pre-cooking task prompt, and invokes the supplied model without changing the
  selected recipe or owning application state.
- The minimal pre-cooking prompt establishes the phase boundary: prepare the
  selected recipe before active cooking without recommending a replacement,
  starting cooking, or claiming preparation is already complete.
- The Pre-Cooking Input Contract v0.1 owns the `{ selectedRecipe, context }`
  boundary. It reuses the validated cooking recommendation shape and current
  recommendation context shape without making the pre-cooking intent depend on
  those two schemas separately.
- The pre-cooking intent keeps the model outside its data contract, validates
  its complete input once with `PreCookingInputSchema`, and passes the validated
  fields to the prompt builder.
- The Pre-Cooking Output Contract v0.1 defines one reusable cooking plan with a
  preparation summary, ingredient facts, equipment expectations, preparation
  actions, and cooking steps grouped into meaningful stages. It contains no
  active-cooking navigation state or contextual chat state.
- Pre-cooking ingredient quantities and units are optional, and preparation
  actions remain in plan steps rather than being embedded in ingredient facts.
- The pre-cooking prompt now defines how to generate the complete executable
  plan in one response while preserving the selected recipe, separating
  preparation from active cooking, respecting kitchen context, and excluding
  progress or chat state.
- The pre-cooking intent passes `PreCookingOutputSchema` to Anvia's native
  structured-output mechanism and returns only the typed, validated
  `PreCookingOutput`. Malformed output remains an explicit generation error.
- An isolated local Pre-Cooking runner validates a deterministic Ayam Kecap
  fixture, invokes `runPreCooking` with `gpt-5.6-luna`, and prints the complete
  structured plan without adding intent routing or cooking intelligence to the
  runner.
- Pre-cooking plan steps use optional qualitative timing guidance with
  `very-short`, `short`, `medium`, or `long` levels and an optional observable
  completion cue. Step-level minute estimates have been removed while summary
  timing remains a high-level estimate.
- The pre-cooking prompt prioritizes observable cooking state over elapsed time,
  avoids strict timing ranges, and omits timing from steps where it does not help
  execution.
- The Active Cooking Input Contract v0.1 composes the immutable
  `PreCookingOutput` with mutable session progress and the latest user message.
  Session progress records status, semantic current-stage and current-step IDs,
  completed step IDs, a minimal pause reason, and relevant in-session changes.
- Active Cooking input validation requires progress references to resolve to the
  supplied cooking plan and rejects duplicate plan IDs, duplicate completion
  references, and invalid change-to-step references. The contract adds no
  persistence, navigation, prompt, runtime, or mutation behavior.
- The Active Cooking Output Contract v0.1 returns a non-empty user-facing reply
  and zero or more proposed actions without returning or mutating a session.
  Its discriminated action union supports advance, previous-step, pause, resume,
  record-change, complete-cooking, abandon-cooking, and clarify.
- Active Cooking output validation keeps clarification exclusive, rejects
  conflicting lifecycle or navigation actions, and rejects duplicate actions
  except for multiple independent record-change actions.
- Active Cooking guidance outputs may contain an empty action list when the user
  needs only the current instruction and no session change is justified.
- The Active Cooking task prompt preserves the immutable plan, resolves guidance
  from the recorded current stage and step, distinguishes all supported proposed
  actions, and treats ambiguous progress conservatively.
- `runActiveCooking` validates the complete input, composes shared and
  Active-Cooking-specific instructions, invokes Anvia with
  `ActiveCookingOutputSchema`, and returns only validated proposed output.
- A reusable Ayam Kecap plan and development-only Active Cooking runner cover
  guidance, advance, manual pause, missing ingredients, resume, equipment
  interruption, previous step, clarification, completion, and abandonment. The
  runner prints proposals without resolving navigation or mutating the session.
- The repository README is the primary entry point for agent setup and usage. It
  documents the actual provider environment variables, all phase runners,
  Active Cooking scenarios, programmatic invocation, and validation commands.
- The Completion Input Contract v0.1 reuses the immutable pre-cooking plan and
  Active Cooking's refined plan/session composite while narrowing the session to
  the exported completed variant. Its optional final message remains contextual
  input rather than application state.
- Completed sessions retain `currentStageId` and `currentStepId` as the final
  recorded cooking position for compatibility with Active Cooking v0.1.
- The Completion Output Contract v0.1 contains only a non-empty conversational
  reply, a concise title and description, and zero or more non-empty final
  notes. It contains no persistence, rating, favorite, history, inventory,
  nutrition-calculation, or application-action fields.
- The Completion task prompt treats completed status as authoritative, closes
  the cooking experience without returning to navigation, grounds feedback in
  recorded evidence, uses session changes selectively, and permits an empty
  notes list when no useful final guidance exists.
- `runCompletion` validates the completed input, composes shared and
  Completion-specific instructions, invokes Anvia with
  `CompletionOutputSchema`, and returns only the validated closing result.
- The Completion runner reuses the Ayam Kecap plan and completed-session fixture
  across eight development scenarios without mutating or persisting session
  state.
- All four cooking-phase development runners live under
  `packages/agent/runners/`; package scripts preserve the existing runner command
  names while targeting the organized source files.

### Nutrition Foundation

- `packages/nutrition` owns deterministic nutrition contracts and calculation,
  independently from `packages/agent` and without model or database access.
- Nutrition inputs require positive normalized gram amounts, positive integer
  servings, stable ingredient keys, and finite non-negative reference values on
  a fixed 100-gram basis.
- `calculateRecipeNutrition` scales and sums all known ingredient occurrences,
  calculates totals before per-serving division, and performs no presentation
  rounding.
- Complete results expose `total` and `perServing`; partial results expose only
  `knownNutrition` plus unique missing ingredient keys so incomplete estimates
  cannot be mistaken for full-recipe values.
- Synthetic offline fixtures cover scaling, totals, serving division,
  fractional amounts, duplicate ingredients, missing references, validation,
  and decimal precision.

### Ingredient + Unit Normalization

- Structured ingredient identity remains caller-supplied as stable
  `ingredientKey` and display `name`; no fuzzy or natural-language identity
  resolution is performed.
- `g` and `kg` normalize directly, while `ml`, `l`, `tsp`, `tbsp`, `clove`, and
  `piece` require an explicit ingredient-and-unit-specific `gramsPerUnit`
  reference.
- Supported units without a matching conversion remain unresolved with a
  `missing-conversion` reason. Units outside the v0.1 enum are rejected rather
  than represented as guessed quantities.
- Batch normalization returns separate `normalized` and `unresolved` arrays,
  preserves repeated ingredient rows, rejects ambiguous duplicate conversion
  pairs, and performs no rounding.
- Normalized results reuse `NutritionIngredientAmountSchema` and feed directly
  into `calculateRecipeNutrition` when callers have accounted for every
  unresolved original ingredient.

### Ingredient Catalog + Nutrition Reference

- `packages/ingredients` owns language-independent kebab-case keys, required
  Indonesian and English primary names, bilingual aliases, deterministic
  resolution, and catalog validation.
- Resolution trims surrounding whitespace, collapses repeated whitespace, and
  lowercases before exact matching. Unknown names remain unresolved; no fuzzy,
  typo, embedding, or AI matching is performed.
- Catalog creation rejects duplicate canonical keys and normalized name or alias
  collisions across every primary-name and alias language group.
- `packages/nutrition` depends one-way on `packages/ingredients` and reports
  unknown nutrition-reference and unit-conversion keys through a deterministic
  integrity result.
- A six-ingredient bilingual identity fixture supports catalog tests without
  claiming to be a production dataset. All integration nutrition and conversion
  values remain explicitly synthetic.
- The offline integration path resolves “Kecap manis” to `sweet-soy-sauce`,
  converts two synthetic tablespoons to grams, and calculates estimated
  nutrition through the existing calculator using the same key.

### Ingredient + Nutrition Production Data Foundation v0.1

- `@flemme/ingredients` exports a production catalog with ten reviewed
  bilingual canonical identities, separately from the six-ingredient test
  fixture. Exact resolution remains deterministic and does not approximate
  sweet soy sauce, generic cooking oil, or cooked rice.
- `@flemme/nutrition` owns ten curated USDA FoodData Central mappings: three
  Foundation records and seven SR Legacy records. Every mapping preserves its
  FDC ID, exact USDA description, data type, publication date, dataset release,
  verification date, source URL, and selected nutrient IDs.
- The committed references contain only the existing v0.1 energy, protein,
  carbohydrate, and fat values on a 100 g basis. Normal runtime remains fully
  offline and no bulk USDA dataset is committed.
- Five unit conversions are derived from exact USDA portion records: chopped
  shallot tablespoon, canola-oil teaspoon and tablespoon, and table-salt
  teaspoon and tablespoon. FDC portion IDs and descriptions remain attached to
  the source mapping.
- Indonesian and English unit aliases are normalized independently from mass
  conversion. Recognizing `sdm`, `sdt`, `siung`, or `butir` does not guarantee
  that an ingredient has a verified portion conversion.
- `RecipeNutritionResultSchema` now distinguishes `complete`, `partial`, and
  `unavailable`. Partial results require at least one trusted contribution;
  unavailable results omit totals and per-serving values instead of emitting
  fake zeros.
- Stable coverage reasons represent unresolved identity, missing references,
  missing quantities, unsupported units, and unavailable portions.
- The documented Telur Kecap Bawang audit is honestly `unavailable`: its
  historical free-form units, ambiguous egg size, unspecified cooking oil,
  unsupported sweet soy sauce, and missing salt quantity leave no trusted
  normalized mass.
- The source review and record-by-record limitations are documented in
  `docs/data/nutrition-sources.md`. TKPI remains deferred pending provenance and
  licensing review.

### PostgreSQL + Drizzle Schema Foundation

- `packages/db` owns the modular PostgreSQL schema, Drizzle relations,
  migration, development seed, and lifecycle validation tooling.
- Relational columns preserve ownership, lifecycle status, resume position,
  timestamps, and queryable constraints; generated cooking plans and results
  remain JSONB snapshots.
- Inventory records use canonical ingredient keys rather than introducing a
  second database-owned ingredient identity.
- Completed cooking sessions are the history source, while favorites reference
  preserved recipe snapshots without requiring a global recipe catalog.
- The idempotent development seed creates one user, credential, profile,
  household, kitchen with basic equipment, inventory, and one canonical-key
  inventory item without introducing a large fixture dataset.
- The real PostgreSQL lifecycle validation creates temporary user context,
  inventory, a cooking session, immutable plan snapshots, mutable progress,
  completion state, a history lookup, and a favorite before cleaning up its
  temporary user.
- Lifecycle inventory keys are resolved through a small
  `@flemme/ingredients` validation catalog. PostgreSQL stores the canonical key
  and does not own an ingredient catalog.
- Restored recommendation, selected-recipe, pre-cooking, completion, nutrition,
  and completed-session data are parsed through their owning runtime schemas.
  This verifies that persisted snapshots can resume without AI regeneration.
- The initial migration, Drizzle schema check, seed, lifecycle validation,
  package-local Biome check, workspace tests, typecheck, and build all pass.
- `db:studio` loads the root `.env`, supplies `DATABASE_URL` through the shared
  Drizzle configuration, and starts Drizzle Studio for local inspection.

### Local PostgreSQL Infrastructure

- The root `docker-compose.yml` runs only `postgres:16-alpine`, binds it to
  localhost, checks readiness, and persists data in the named
  `flemme-postgres-data` volume.
- PostgreSQL credentials and connection configuration come from the ignored
  root `.env`; `.env.example` contains variable names and empty placeholders
  only.
- The manually created development container was replaced by a Compose-managed
  container while its existing named volume was preserved.
- The Compose configuration is valid, PostgreSQL reports healthy, and the
  existing Drizzle migration applies successfully through the Compose service.

### API Foundation + Cooking Session Vertical Slice

- `apps/api` now exposes an import-safe Hono app factory and a Bun entry point
  that requires `DATABASE_URL`, validates `PORT`, and refuses to run the
  development authentication adapter in production.
- `GET /health` provides a minimal process health response.
- Hono OpenAPI definitions generate `/openapi.json`, and `/docs` serves an
  interactive Swagger UI backed by that specification.
- Cooking-session modules follow the colocated route → Zod validation → service
  → `@flemme/db` flow without a speculative repository or dependency-injection
  layer.
- `POST /cooking-sessions` persists an existing validated recommendation,
  selected recipe, immutable Pre-Cooking plan, and initial Active Cooking
  progress without invoking AI.
- `GET /cooking-sessions/:id` restores relational progress and parses every
  present recommendation, selected-recipe, plan, completion, and nutrition
  snapshot through its owning package schema.
- `PATCH /cooking-sessions/:id/progress` changes only relational progress after
  validating current and completed step IDs against the persisted immutable
  plan.
- `POST /cooking-sessions/:id/complete` requires an active session positioned
  at a recorded-complete final step, then stores completion state and snapshots
  on the existing cooking-session history row.
- Development auth is isolated middleware using `x-flemme-user-id`; the value
  must be a valid UUID for a real PostgreSQL user. All cooking reads and writes
  enforce ownership.
- API errors use a stable `{ error: { code, message } }` shape and do not expose
  database or validation internals. Invalid persisted snapshots return a
  controlled error.
- Eight real-PostgreSQL integration tests cover health, authentication, create,
  restore, progress, completion, completed restore, missing sessions,
  ownership denial, invalid progress, and corrupted JSONB handling.

### Cooking Context + Recommendation API v0.1

- `POST /cooking/recommendations` authenticates through the existing
  development user adapter, loads Profile, Household, Kitchen/Equipment, and
  Inventory context from PostgreSQL, and invokes the existing
  `@flemme/agent` Recommendation runtime.
- The request requires only current-attempt `session` context and optionally
  overrides complete inventory, kitchen, household, food-preference, or
  cooking-preference fields. Supplied fields deterministically replace their
  persisted counterparts; omitted fields use persisted context.
- Missing household, kitchen, or inventory state is reported as controlled
  incomplete-context errors rather than fabricated. An absent profile means no
  known stored preferences.
- Persisted inventory remains canonical-key based and each key is validated
  through `@flemme/ingredients` before entering the name-based Agent contract.
  Explicit request inventory remains raw because no production ingredient
  catalog exists yet.
- Agent invocation is injected at one narrow service boundary for offline
  tests. The Bun entry point builds the existing `@flemme/agent` provider from
  `MUX_API_KEY` and `BASE_URL`; missing configuration and provider/output
  failures return controlled API errors without exposing secrets.
- Recommendation output is parsed through
  `CookingRecommendationOutputSchema`, published in `/openapi.json`, and
  executable from Swagger at `/docs`. Recommendation reads do not mutate
  inventory, persist a recommendation, or create a cooking session.
- The Swagger cooking-flow guide documents real provider prerequisites and the
  currently implemented Recommendation and persistence endpoints without
  presenting future Pre-Cooking endpoints as available.
- The API flow learning guide traces startup, authentication, context
  aggregation, Recommendation invocation, session persistence, JSONB
  restoration, Swagger generation, and tests from the current source files.
- Nine real-PostgreSQL Recommendation API integration tests cover persistent
  aggregation, deterministic overrides, canonical-key inventory handoff,
  response validation, invalid requests, authentication, missing context,
  provider failure mapping, invalid Agent output, missing configuration, and
  OpenAPI registration.

### Pre-Cooking API v0.1

- `POST /cooking/pre-cooking` authenticates through the existing development
  user adapter, validates the selected recipe with the Agent-owned
  `CookingRecommendationSchema`, and requires only current-attempt session
  context plus optional context overrides.
- Omitted profile preferences, household counts, kitchen equipment, and
  inventory are loaded through the existing cooking-context service. Supplied
  fields deterministically replace their persistent counterparts for this
  request.
- The API builds the existing `PreCookingInputSchema`, invokes the exported
  `runPreCooking` capability with the application-configured model, and parses
  the result through `PreCookingOutputSchema` before returning it.
- Provider configuration, generation failures, and invalid structured output
  map to controlled API errors without exposing provider or database details.
- The endpoint is registered in OpenAPI and documented in the incremental
  Swagger cooking-flow guide. It does not create a cooking session, persist a
  plan, mutate inventory, or invoke Active Cooking or Completion.
- Ten real-PostgreSQL integration tests cover persistent context loading,
  deterministic overrides, request and selected-recipe validation,
  authentication, missing context, Agent failure mapping, invalid Agent output,
  missing configuration, absence of session persistence, and OpenAPI
  registration.

### Swagger Full Cooking Flow v0.1

- The Swagger cooking-flow guide now provides one stable Telur Kecap Bawang
  scenario from development authorization and Recommendation through explicit
  recipe selection, Pre-Cooking, Cooking Session creation, restore, progress,
  final-step guard validation, completion persistence, and completed restore.
- The guide maps the complete Recommendation response, exact selected recipe,
  Pre-Cooking plan, and initial active progress into the existing Cooking
  Session request without inventing nutrition data.
- AI generation and persistence responsibilities are identified at every step.
  Active Cooking and Completion AI are separate read-only orchestration calls;
  Nutrition integration remains explicitly deferred.
- Swagger operation summaries and concise descriptions now state each cooking
  endpoint's phase, responsibility, and relevant no-AI or no-persistence
  boundary.
- The existing cooking-session integration flow now asserts that completion at
  the final position fails with `SESSION_NOT_READY_FOR_COMPLETION` until the
  final step ID is recorded complete, then verifies successful completion and
  restoration.
- The OpenAPI integration check covers every route required by the documented
  cooking flow.

### Active Cooking AI API v0.1

- `POST /cooking-sessions/:id/active-cooking` accepts only one trimmed,
  non-empty user message up to 2,000 characters. Client-supplied plan or session
  state fields are rejected.
- The service reuses Cooking Session restoration for authorization, ownership,
  validated snapshots, and persisted progress, then constructs the existing
  `ActiveCookingInputSchema` entirely server-side.
- Active and paused sessions may invoke the existing `runActiveCooking`
  capability. Completed and abandoned sessions return a controlled lifecycle
  conflict without invoking the Agent.
- The Agent-owned `ActiveCookingOutputSchema` is returned unchanged after an
  additional API-boundary parse. Provider failures, invalid Agent output, and
  missing configuration map to controlled errors.
- Active Cooking interaction performs no database writes. Guidance and actions
  remain proposals until a caller explicitly uses the existing progress or
  completion persistence endpoints.
- Swagger documents the message-only request and no-silent-persistence
  boundary. The manual cooking guide includes an optional interaction followed
  by a restore comparison and explicit action-application step.
- Twelve real-PostgreSQL integration tests cover guidance, advance, pause,
  paused resume, completed and abandoned guards, clarification, strict request
  validation, authentication, ownership, missing sessions, failure mapping,
  missing configuration, OpenAPI registration, and unchanged session data.

### Completion AI API v0.1

- `POST /cooking-sessions/:id/completion` accepts a strict object containing
  only an optional trimmed final message of up to 2,000 characters.
- The endpoint restores the owned historical plan and final session progress
  from PostgreSQL, applies the same shared completion-readiness guard as the
  existing persistence endpoint, and never reloads or regenerates prior cooking
  context.
- Completion readiness requires an active Active-Cooking-phase session at the
  final stage and final step with that step recorded complete. Paused,
  completed, abandoned, earlier-position, and incomplete-final-step sessions
  fail before Agent invocation.
- The service projects `status: "completed"` only in the in-memory
  `CompletionInputSchema`, preserving current position, completed step IDs, and
  recorded Active Cooking changes. Persisted state remains active.
- The existing `runCompletion` capability is invoked through the shared
  application-configured model. Output is parsed again through
  `CompletionOutputSchema` at the API boundary.
- Completion AI performs no database writes. Its `{ reply, summary, notes }`
  output may be accepted explicitly as `completionSnapshot` by the separate
  `/complete` persistence endpoint.
- Swagger and the manual cooking guide distinguish `/completion` generation
  from `/complete` persistence.
- Twelve real-PostgreSQL integration tests cover completion-ready projection,
  optional messages, zero persistence mutation, lifecycle guards, historical
  changes, request validation, authentication, ownership, missing sessions,
  failure mapping, missing configuration, and OpenAPI registration.

### Nutrition Integration v0.1

- `GET /cooking-sessions/:id/nutrition` restores an owned Cooking Session and
  calculates from its persisted Pre-Cooking plan plus persisted selected-recipe
  serving count. The client supplies no ingredient data.
- Preview is available for active, paused, completed, and abandoned sessions.
  It performs no database mutation, inventory access, Agent invocation, or USDA
  runtime request.
- One shared API orchestration function resolves exact names through the
  production ingredient catalog, normalizes only package-supported unit aliases
  and verified portions, and delegates arithmetic/result semantics to
  `@flemme/nutrition` using committed production references.
- Coverage gaps remain domain results: trusted full coverage is `complete`, a
  trusted subset plus issues is `partial`, and no trusted contribution is
  `unavailable` without total or per-serving values.
- `POST /cooking-sessions/:id/complete` calculates nutrition before its existing
  single-row persistence mutation. Completion lifecycle fields,
  `completionSnapshot`, and the server-generated `nutritionSnapshot` are stored
  together; partial or unavailable coverage does not block completion.
- Create and completion request objects are strict and reject client-provided
  `nutritionSnapshot`. Historical nullable snapshots and all three current
  nutrition variants remain valid on restoration through the owning schema.
- OpenAPI documents the nutrition preview and trusted completion behavior. The
  Swagger flow now includes optional preview, server-side completion
  recalculation, truthful Telur Kecap unavailability, and completed restoration.
- Offline API tests cover production-backed complete, partial, and unavailable
  mapping, the Telur Kecap acceptance shape, no fake totals, strict request
  ownership, and OpenAPI registration. Real-PostgreSQL integration coverage is
  implemented for preview determinism/immutability, lifecycle access,
  ownership, every persisted result variant, completed restoration, and forged
  nutrition rejection.
- User-confirmed final manual results closed the Cooking Engine acceptance gate.
  Recommendation, Pre-Cooking, Cooking Session lifecycle, Active Cooking,
  Completion, production ingredient/nutrition data, Nutrition Integration, and
  the Swagger end-to-end cooking flow now constitute Flemme Cooking Engine v0.1
  complete.

### Profile API v0.1 — Accepted

- `GET /profile` reads the authenticated user's optional one-to-one profile and
  returns `PROFILE_NOT_FOUND` when no row exists.
- `PUT /profile` idempotently creates or updates the row and replaces both
  `foodPreferences` and `cookingPreferences` arrays. Empty arrays are valid;
  submitted values are trimmed and blank entries are rejected.
- Request and response contracts expose only the cooking-context preference
  arrays. They do not expose `userId`, the schema's optional `displayName`, or
  persistence timestamps. Existing display names remain untouched on update.
- All service queries use authenticated `currentUserId`; the HTTP development
  header does not enter the domain service.
- Writes target the existing `user_profiles` columns already consumed by the
  cooking-context service, preserving whole-array request override semantics.
- GET and PUT are registered in OpenAPI, and a Swagger manual profile flow is
  documented. No database migration or dependency was introduced.
- Seven real-PostgreSQL integration tests cover missing/create/read/update,
  empty arrays, non-API field preservation, ownership isolation, validation,
  authentication, cooking-context visibility/override behavior, and OpenAPI.
  All pass against the local PostgreSQL database.
- Live local HTTP acceptance confirmed Swagger availability, development auth,
  missing-profile 404 behavior, PUT creation, persisted GET restoration,
  whole-array replacement, and empty-array persistence. The isolated temporary
  acceptance user was removed afterward.

### Household API v0.1

- `GET /household` reads the authenticated user's optional one-to-one household
  and returns `HOUSEHOLD_NOT_FOUND` without creating defaults when no row exists.
- `PUT /household` idempotently creates or updates the row and replaces the
  complete adults, children, and toddlers aggregate counts. The existing
  household ID is preserved on update and the unique user constraint prevents
  duplicates.
- Counts must be non-negative integers within PostgreSQL `integer` range. Zero
  is valid for every field, including an all-zero household; no arbitrary
  product maximum was introduced.
- Request and response contracts expose only aggregate counts. They reject
  missing and unknown fields, including any client-supplied user ID.
- All service queries derive ownership from authenticated `currentUserId` and
  write the same `households` row already read by cooking-context orchestration.
  Request-level household input remains a whole-object override for one cooking
  request.
- GET and PUT are registered in OpenAPI and documented in a dedicated Swagger
  flow. No schema migration, household-member model, dependency, or Cooking
  Engine change was introduced.
- Three contract tests and eight real-PostgreSQL integration tests cover schema
  boundaries, missing/create/read/update behavior, duplicate prevention, each
  count, all-zero values, ownership, auth, request validation, cooking-context
  visibility and override compatibility, and OpenAPI.

## In Progress

### Agent Foundation

Completed sequence:

1. Agent responsibility
2. Agent instruction
3. Provider
4. Agent runtime
5. Local development runner
6. Input contracts
7. Recommendation output contracts
8. Cooking-session contracts

Remaining sequence:

9. Tools
10. Evaluation scenarios
11. Observability

### Pre-Cooking Foundation

- Pre-cooking responsibility and initial execution flow are established.
- The dedicated v0.1 input contract is defined and exported.
- The dedicated v0.1 output contract is defined and exported.
- Complete-plan prompt semantics and structured model generation are
  implemented.
- The intent has an isolated development runner and is exported for direct
  application orchestration. The general Recommendation runtime remains
  intentionally separate.
- The Pre-Cooking v0.1 runner output is stable enough to proceed to Active
  Cooking contract design.

### Active Cooking Foundation

- The v0.1 input and session contracts are defined and exported.
- The v0.1 proposed-action output contract is defined, exported, and tested.
- The task-specific prompt, structured execution function, reusable cooking-plan
  fixture, and ten-scenario local runner are implemented.
- HTTP orchestration is implemented against restored Cooking Session state.
  Automatic action application and message-history persistence remain
  intentionally deferred.

### Completion Foundation

- The v0.1 input and output contracts are defined, exported, and tested.
- The task-specific prompt, structured execution function, reusable completed
  session fixture, and eight-scenario local runner are implemented.
- HTTP orchestration is implemented against a completion-ready restored Cooking
  Session using an in-memory completed-status projection. Automatic persistence,
  history listing, favorites, ratings, and inventory reconciliation remain
  intentionally deferred.

## Next Up

The current v0.1 Core User Flow is complete end to end through Inventory
Management. No additional mandatory core-flow stage is selected. Next work
should be chosen explicitly from refinement, hardening, UX polish, data coverage
improvements, or additional product features.

The dedicated A4 real Google runtime acceptance gate remains pending external
credentials. Natural-language quantity parsing and TKPI evaluation remain
deferred.

## Open Questions

- Which agent tools are actually required for MVP recommendation.
- What provenance and licensing requirements must be satisfied before TKPI can
  be evaluated as a later Indonesia-specific source?

## Architecture Decisions

### Agent lives in `packages/agent`

Reason:

The agent is currently a reusable AI capability invoked by the application.
It does not own an independent deployment lifecycle or HTTP boundary.

### API remains the application boundary

The API will own application orchestration, persistence coordination,
authentication, authorization, and invocation of AI capabilities.

### Nutrition arithmetic lives outside the agent

Reason:

Nutrition totals are deterministic domain data derived from normalized masses
and explicit references. Keeping calculation in `packages/nutrition` prevents
the model from owning arithmetic and keeps future API, history, and agent usage
dependent on the same validated result.

### Production nutrition data is curated from USDA FoodData Central

Reason:

Nutrition Integration requires traceable production references rather than
test fixtures or arbitrary values. USDA FoodData Central is the primary v0.1
source. The curated dataset will preserve source metadata and FDC IDs instead
of importing the entire upstream catalog. Unit-to-gram conversions will be
included only when verified portion data supports them. TKPI may be evaluated
later after provenance and licensing review.

### Fully unresolved nutrition is unavailable, not zero

Reason:

The current partial result assumes at least one normalized ingredient can enter
calculation. The data-foundation unit will extend the nutrition result contract
with an explicit unavailable variant so unresolved names, missing quantities,
and unsupported units cannot be misrepresented as zero nutrition.

### Canonical ingredient identity is independent from nutrition

Reason:

Recommendations, recipes, inventory, nutrition, and history will share the same
ingredient identity. `packages/ingredients` therefore owns keys and bilingual
resolution, while `packages/nutrition` owns arithmetic and depends on the
catalog in one direction only. This avoids an ingredients ↔ nutrition cycle.

### Documentation is the project source of truth

Product behavior and architecture decisions must be documented before they
become implementation assumptions.

### Agent providers receive credentials from the application

Reason:

The agent package owns provider and model configuration, while secret loading
remains with the invoking application boundary.

## Session Notes

The OpenAI-compatible provider factory is available from the `@flemme/agent`
package entry point. A separate local runner can exercise the provider without
adding environment loading or completion side effects to package imports. The
shared cooking instruction now reflects the confirmed design context without
adding application-owned persistence or authorization behavior to the agent.
The first recommendation execution path is now connected from the cooking
agent runtime through the cooking recommendation intent to the shared and
task-specific prompts. The A6 input schema is wired through the local runner,
cooking agent runtime, recommendation intent, and prompt builder. The A7 output
schema is defined, exported, and passed to Anvia during generation; successful
calls return the validated output object instead of Anvia's full completion
result. A7 is complete, and the development runner uses the verified
`gpt-5.6-luna` model without changing the provider factory default. The initial
pre-cooking intent now establishes the post-selection boundary while reusing
the validated recommendation and cooking-context structures. Its v0.1 input and
output contracts, complete-plan prompt, and native structured generation are now
connected. An isolated Ayam Kecap runner confirms the flow with a real plan.
The Active Cooking v0.1 input boundary now accepts that immutable plan alongside
validated mutable progress and the latest message. Application routing and
progress mutation remain intentionally deferred. The output boundary now
separates the conversational reply from constrained proposed actions and never
returns a replacement session. The Active Cooking execution path and local
runner now exercise those boundaries through native structured generation while
leaving every proposed action unapplied.
Completion now has a contract-only boundary for a previously validated completed
session and a minimal closing result. Its prompt, structured model execution,
and local runner are now connected without adding post-cooking side effects.

## Validation

- The production ingredient catalog passes 19 `@flemme/ingredients` tests,
  including deterministic bilingual resolution and explicit non-approximation.
- Production nutrition references, USDA provenance, portion integrity, unit
  aliases, complete/partial/unavailable semantics, direct calculation, and
  unsupported egg-piece behavior pass all 60 `@flemme/nutrition` tests.
- The full workspace suite passes with 171 tests and 391 expectations after the
  production data foundation changes.
- Workspace typecheck and builds, scoped Biome, and `git diff --check` pass.
- Official FDC search verified the selected candidate identities. After the
  documented `DEMO_KEY` rate limit was reached, exact nutrients and portions
  were verified offline from USDA's official April 2026 Foundation Foods and
  April 2018 SR Legacy JSON archives. No downloaded archive or API response was
  committed.
- The production-data-foundation unit intentionally added no Cooking Session
  nutrition route or completion behavior. That integration pause has now been
  lifted by the implementation above.
- Four offline API nutrition orchestration/OpenAPI tests pass with 15
  expectations. They verify production-backed complete, partial, and
  unavailable behavior, including the truthful Telur Kecap result and absence
  of fake unavailable totals.
- All 19 ingredient tests and all 60 nutrition tests pass offline. Workspace
  typecheck, API and web/workspace builds, scoped Biome, and `git diff --check`
  pass after Nutrition Integration implementation.
- The user subsequently confirmed the overall manual result was good. Flemme
  Cooking Engine v0.1 is therefore accepted as complete before the Product
  Domain API phase begins.
- Profile contract and PostgreSQL integration coverage passes as part of the
  complete API suite: 75 tests and 279 expectations, with zero failures.
- Local PostgreSQL is healthy, existing migrations apply successfully, and the
  database lifecycle validator passes.
- Live Profile HTTP acceptance passes for `/docs`, authenticated GET, missing
  profile, PUT creation, persisted read, second-PUT replacement, empty arrays,
  and missing-auth rejection. The in-app browser-control surface was unavailable,
  so the same Swagger-documented operations were exercised directly against the
  running local API rather than through UI clicks.
- Workspace typecheck, API/web builds, Drizzle schema check, scoped Biome, and
  `git diff --check` all pass after final Profile acceptance.
- Household focused coverage passes with 11 tests and 40 expectations against
  real PostgreSQL. The complete API suite passes with 86 tests and 319
  expectations.
- Household validation confirms 404 missing behavior, idempotent create/update,
  no duplicate row, adults/children/toddlers persistence, all-zero counts,
  ownership isolation, invalid identity and payload rejection, direct cooking
  context visibility, request override replacement, and OpenAPI registration.

- Twelve focused Completion AI API integration tests pass against real
  PostgreSQL with only the external Agent invocation replaced by deterministic
  output.
- Completion-ready input preserves the stored plan, final progress, and changes
  while projecting completed status only in memory. A successful generation
  leaves the complete restored Cooking Session unchanged.
- Final-step-incomplete and earlier-position sessions return
  `SESSION_NOT_READY_FOR_COMPLETION`; paused, completed, and abandoned sessions
  return `INVALID_SESSION_STATE`. Failed lifecycle guards do not invoke the
  Agent.
- The complete API suite passes with 51 tests and the full workspace suite
  passes with 140 tests after Completion AI integration.
- One real provider-backed Completion HTTP request returned status 200 with a
  validated Telur Kecap Bawang closing summary. The isolated session remained
  in Active Cooking with active status, no completion snapshot, no completion
  timestamp, and an otherwise byte-equivalent restored database row; the
  temporary fixture was removed afterward.
- Workspace typecheck and builds, scoped Biome, database cooking-lifecycle
  validation, and `git diff --check` pass after the Completion AI changes.

- Twelve focused Active Cooking API integration tests pass against real
  PostgreSQL with only the external Agent invocation replaced by deterministic
  outputs.
- Guidance-only, advance, and pause responses leave the restored Cooking
  Session unchanged. A paused resume proposal leaves persisted status paused
  until an explicit progress PATCH.
- Completed and abandoned sessions return `ACTIVE_COOKING_NOT_ALLOWED` without
  invoking the Agent, while ownership and missing-session behavior continue to
  use the established Cooking Session errors.
- The complete API suite passes with 39 tests and the full workspace suite
  passes with 128 tests after Active Cooking integration.
- One real provider-backed Active Cooking HTTP request restored an existing
  active session at its persisted oil-heating step and returned status 200 with
  context-aware smoking-oil safety guidance and no proposed mutation. The
  persisted phase, status, position, completed steps, and completion state
  remained unchanged.
- Workspace typecheck and builds, scoped Biome, database cooking-lifecycle
  validation, and `git diff --check` pass after the Active Cooking changes.

- The Swagger full-flow milestone reuses the previously confirmed manual
  Recommendation → Pre-Cooking → Cooking Session → progress → guarded
  completion → restore flow. The guide now records that flow as a repeatable
  acceptance procedure without committing a real development UUID.
- The API integration lifecycle explicitly verifies HTTP 409 with
  `SESSION_NOT_READY_FOR_COMPLETION` at the incomplete final step, then records
  the final step, persists completion, and restores the completed session.
- OpenAPI validation confirms health plus all six protected cooking operation
  paths remain registered, and Swagger continues to expose persistent
  `DevelopmentUser` authorization.

- Ten Pre-Cooking API integration tests pass against real PostgreSQL with the
  external Agent boundary replaced by deterministic behavior. They cover
  persistent context, overrides, request and selected-recipe validation,
  development auth, missing context, controlled Agent failures, invalid Agent
  output, missing provider configuration, no cooking-session persistence, and
  OpenAPI registration.
- The complete API suite passes with 27 tests, and the full workspace suite
  passes with 116 tests.
- One real provider-backed `POST /cooking/pre-cooking` HTTP smoke request
  returned status 200 and a schema-valid Telur Kecap plan with qualitative
  timing guidance. It was run independently rather than as a full chained
  Swagger flow, which remains the next milestone.
- Workspace typecheck and build, scoped Biome, database cooking-lifecycle
  validation, and `git diff --check` pass after the Pre-Cooking API changes.

- Nutrition package tests pass completely offline without model credentials or
  database access.
- Nutrition calculator checks cover single and multiple ingredients,
  per-serving division, fractional and duplicate amounts, partial coverage,
  unique missing keys, invalid servings and weights, invalid reference values,
  empty recipes, duplicate references, and unrounded decimal arithmetic.
- Ingredient normalization checks cover direct grams and kilograms, every
  reference-backed v0.1 unit, missing and mismatched conversions, unsupported
  units, invalid quantities and factors, decimal precision, duplicate rows and
  conversion pairs, batch partitioning, and calculator integration.
- Ingredient catalog checks cover bilingual primary names, aliases,
  case-insensitive and collapsed-whitespace matching, unknown queries, key
  lookup, duplicate keys, same-language and cross-language collisions, and
  kebab-case key validation.
- Reference-integrity checks accept known canonical keys and report unknown
  nutrition and unit-conversion keys separately. The offline pipeline test
  resolves a bilingual name, normalizes its unit, and calculates nutrition with
  the same canonical key.

- `bun run typecheck` passes for `@flemme/agent` after structured output wiring.
- Runtime schema checks confirm a valid recommendation input is accepted and
  invalid negative household counts and zero servings are rejected.
- A structured prompt check confirms validated context is serialized into the
  recommendation prompt.
- A personalization prompt check confirms multiple food and cuisine references
  remain separate ranking signals and that practical fallback options are
  allowed.
- A structured-field semantics check confirms required and optional items stay
  separate and that present ingredients with uncertain quantities remain
  available while surfacing material confirmations.
- Output schema checks confirm all three result variants are accepted, while
  more than three recommendations and non-positive durations are rejected.
- The live runner reached the configured provider, but Anvia rejected the model
  response during JSON parsing because the gateway returned conversational text
  instead of the requested schema JSON. No unvalidated output was returned.
- The minimal compatibility probe made one request per model through the same
  gateway: `glm-5.3-flash` failed during JSON parsing with evidence of plain
  conversational text; `deepseek-v4-flash-0731` returned JSON with the wrong
  top-level shape and failed schema validation; `gpt-5.6-luna` returned the
  requested object and passed structured parsing and validation.
- One live cooking recommendation smoke test with `gpt-5.6-luna` returned a
  schema-validated `recommendations` result containing two recommendations and
  surfaced the conflicting serving context as required confirmations.
- Pre-cooking foundation checks confirm the selected recipe and context schemas
  accept valid input, reject an invalid serving count, and produce a prompt that
  preserves the selected-recipe and pre-active-cooking boundaries.
- Pre-cooking input checks confirm the composed contract accepts valid input,
  rejects invalid selected-recipe servings and invalid household counts, and is
  exported from the agent package.
- Pre-cooking output schema checks confirm a complete plan shape is accepted,
  omitted ingredient quantities remain valid, and negative quantities or steps
  without instructions are rejected.
- Structured pre-cooking checks confirm valid input and plan parsing, reject
  missing required fields, empty cooking stages, and stages without steps, and
  verify that the prompt preserves the selected recipe without claiming active
  cooking progress.
- Step timing checks confirm timed and untimed steps are valid, unknown timing
  levels and blank cues are rejected, and legacy `estimatedMinutes` is no longer
  retained in parsed step output.
- The unchanged Ayam Kecap runner fixture produced a validated complete plan with
  qualitative timing only on useful cooking periods, observable cues for every
  timed step, and no step-level minute estimates. Immediate actions and all
  preparation steps correctly omitted timing.
- One live Pre-Cooking run with `gpt-5.6-luna` returned a schema-valid Ayam Kecap
  plan with preserved ingredient quantities, supplied equipment, four ordered
  preparation steps, and three meaningful cooking stages.
- Active Cooking input schema checks cover newly started, in-progress, paused,
  resumed, and interrupted states while preserving the same cooking plan and
  semantic progress references. Invalid current-stage, current-step, completed-
  step, related-step, and duplicate plan references are rejected.
- Active Cooking output schema checks cover all eight proposed actions,
  multi-change outputs, lifecycle and navigation conflicts, clarification
  exclusivity, duplicate actions, empty replies, and empty action lists.
- Active Cooking prompt checks confirm the validated current stage, current
  step, and latest message are included without mutating input state.
- Live `gpt-5.6-luna` runs returned schema-valid output for all ten runner
  scenarios. Guidance proposed no state change; advance, pause, missing-item,
  resume, equipment, previous-step, clarification, completion, and abandonment
  scenarios produced their intended actions after prompt distinctions were
  tightened for terse completion, manual pause, and standalone negation.
- Completion input checks accept completed sessions with or without a final
  message, reject active, paused, and abandoned sessions, reject blank messages,
  and preserve Active Cooking plan-position validation.
- Completion output checks accept an empty notes list and useful notes while
  rejecting blank replies, summary titles, summary descriptions, and note
  entries.
- Completion prompt checks cover the completed-session assumption, prohibition
  of cooking navigation and plan regeneration, application-owned persistence
  boundaries, grounded user feedback, selective changes, and optional notes.
- Live `gpt-5.6-luna` runs returned schema-valid Completion output for normal
  completion, no final message, positive feedback, salty-result feedback,
  ingredient adjustment, serving adjustment, a recovered equipment
  interruption, and a final chili modification. Prompt tuning converted the
  extra-salt case into a practical taste check and made serving changes factual
  rather than an internal-history narration.
- The live quality review found three prompt-level issues: unsafe raw-chicken
  washing guidance, summary times that do not match summed step estimates, and
  a conditional wok cover not present in the supplied equipment context. No
  schema or prompt change was made automatically from these observations.
- No package-specific build script is currently defined. The agent package now
  has a Bun test script for its Active Cooking contract schemas.

The implemented Agent cooking phases now provide the stable structured
contracts used by the bounded API integration milestones.
