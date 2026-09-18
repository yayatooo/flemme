# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Runtime | Bun | Runtime and package manager |
| Monorepo | Turborepo | Workspace and task orchestration |
| Web | Vite + React | Browser application |
| Routing | TanStack Router | Typed client routing |
| Server State | TanStack Query | Remote/server state |
| UI | Tailwind CSS + shadcn/ui | Design system foundation |
| API | Hono | HTTP application layer |
| API Contract | Zod + Hono OpenAPI | Runtime validation and OpenAPI |
| Agent | Anvia | Agent runtime |
| Models | OpenAI / OpenRouter | Model providers |
| Database | PostgreSQL | Persistent application data |
| ORM | Drizzle | Database schema and access |
| Validation | Zod | Runtime contracts |

## Web UI Foundation

`apps/web` uses Tailwind CSS v4 through the existing Vite pipeline and keeps
shadcn/ui source primitives under `src/components/ui`. The `@/*` TypeScript and
Vite alias resolves from `src`, and shadcn generation targets the same path.

The global theme maps Flemme's cream, ink, orange, lime, lavender, danger,
radius, typography, and hard-shadow decisions to semantic Tailwind/shadcn
tokens. Shared primitives own accessible interaction structure and Flemme's
neubrutalist presentation; Product Domain behavior remains outside
`components/ui`. Existing page migration remains incremental rather than a
single application rewrite.
Authenticated global application pages compose one compact, mobile-first
`max-w-xl` AppShell at the guarded `/app` route. The route layout owns the
shared AppHeader and safe-area-aware BottomNavigation once; child pages consume
PageContainer and reusable loading, empty, and recoverable error states. Global
navigation remains Home, Inventory, History, and Favorites, while the focused
Recommendation route intentionally hides BottomNavigation without introducing
a second shell.

The authenticated Home implementation lives under `src/features/home`; its
`/app` index route only selects HomePage. Home reuses the shared shell and page
container, while section components own the cooking prompt, Quick Start,
active-session summary, Inventory shortcut, and Recent Cooking presentation.
The prompt and Quick Start populate the same `session.request` boundary. Home
then posts only that request to `POST /cooking/recommendations`; persistent
Profile, Household, Kitchen, Inventory, and preference context remains resolved
by the API.

Phase 9A makes Home session continuity server-authoritative.
`GET /cooking-sessions/resumable` returns the most recently updated owned
Cooking Session whose persisted status is `active` or `paused`, or `null` when
none exists. The API owns deterministic selection because the current database
model permits multiple resumable rows; ordering is `updatedAt`, `createdAt`, and
ID descending. Completed and abandoned sessions are excluded before snapshot
restoration, and corrupt persisted snapshots remain controlled server errors.

The browser uses one stable resumable-session TanStack Query key, refetches when
Home mounts, and seeds the existing session-ID cache from the validated shared
response. Home keeps its prompt and other sections interactive while the
resumable query independently loads or fails. The existing ActiveSessionCard
renders only valid active/paused state, resolves stage and step through the
persisted stable IDs, uses the shared Cooking Session display-name helper, and
navigates by session ID without a lifecycle mutation. Active Cooking progress
and rename mutations synchronize resumable cache state; completion and
abandonment clear the current card and invalidate the server query. The focused
Cooking route remains the only owner of explicit paused-to-active Resume.

Phase 9B models Cooking History as a read projection of persisted Cooking
Sessions rather than a second lifecycle or storage system.
`GET /cooking-sessions/history` selects only the authenticated user's
`completed` rows, orders by `completedAt`, `createdAt`, and ID descending, and
uses bounded offset pages with a default size of 10 and maximum size of 20. A
left join to the canonical Favorite relation supplies read-only saved state.
The browser-safe projection contains only session identity, display name,
completion time, persisted Completion summary, compact per-serving Nutrition
summary, and Favorite presence; it never sends full cooking plans or
regenerates persisted outputs.

`src/features/history` owns the `/app/history` page, one canonical TanStack
infinite-query key, card-shaped loading, retryable error, empty, list, card,
and explicit Load more states. Cards format `completedAt` in the user's locale,
keep long names and summaries bounded, distinguish complete, partial,
unavailable, and absent Nutrition, and route by session ID to the existing
Completion review. Completion, rename, Completion-generation,
Nutrition-generation, and Favorite-creation paths invalidate the History key,
so the server projection remains authoritative without requiring an app
restart. History remains inside the global compact AppShell with
BottomNavigation visible.

Phase 9C keeps Favorites as the canonical relation over completed Cooking
Sessions and exposes it as a saved-meal library. `GET /favorites` remains
owner-filtered, orders by Favorite `createdAt` and ID descending, and now uses
bounded offset pages with a default size of 10 and maximum size of 20. An
optional `cookingSessionId` filter supports the Nutrition saved-state lookup
without downloading every page. The historical projection preserves the
original recipe fields while adding `customName ?? selectedRecipe.name`,
source-session `completedAt`, persisted Completion summary, and the same compact
complete, partial, or unavailable Nutrition summary used by History.

`src/features/favorites` owns the `/app/favorites` infinite query, page states,
list, cards, and create/delete mutations. Cards render only persisted
historical data, route by session ID to the existing Completion review, and
keep removal secondary. A successful delete clears the session-scoped Favorite
cache, removes the item from loaded Favorite pages, and invalidates both the
canonical Favorites list and History projection. It never deletes or mutates
the Cooking Session, Completion, Nutrition, Inventory, or cooking progress.
Missing-on-delete converges to the canonical not-saved state; other failures
keep the card stable and retryable.

Phase 9D makes `/app/inventory` the normal post-onboarding editor for the same
persisted Inventory aggregate used by cooking context. `src/features/inventory`
owns one canonical TanStack Query cache and the add, edit, and delete mutations.
The page uses the compact AppShell, single-column item rows, explicit loading,
empty, and retryable error states, and mobile-safe Dialog forms. Quantity and
unit remain an optional pair; unknown quantity stays `null`.

Inventory create and update requests accept a user-facing name. The API trims
and normalizes it, resolves bilingual names and aliases through
`@flemme/ingredients`, stores the canonical key when known, and otherwise
persists the normalized display name with a `null` canonical key. Renaming
always reruns resolution. The existing per-inventory normalized identity
constraint prevents canonical and conservative free-text duplicates; controlled
409 responses preserve the current list and form input.

Mutations update the canonical Inventory cache and refetch the owner-filtered
server aggregate. They do not regenerate Recommendation, Pre-Cooking,
Completion, or Nutrition and do not change Inventory automatically when cooking
finishes. Cooking-context construction continues reading the database for every
new Recommendation, so later requests observe additions, edits, and removals
without altering any already-created Cooking Session plan.

The Recommendation flow lives under `src/features/recommendation` and uses a
TanStack Query mutation plus query-cache state to preserve the current request,
the validated Agent-owned output, and the exact selected recommendation across
route transitions. The browser consumes the dedicated
`@flemme/agent/cooking-recommendation-output` schema export, keeping Agent
runtime and provider modules outside the web build. `/app/recommendation`
renders loading and controlled API
errors separately from the `recommendations`, `clarification`, and
`no_viable_recommendation` domain variants. Selecting a result preserves the
exact response object and current request, starts one Pre-Cooking mutation, and
navigates into the guarded review route. It does not regenerate a recommendation,
create a Cooking Session, or mutate Inventory.

Recommendation cards are decision summaries rather than full recipe-detail
surfaces. The collapsed layer prioritizes one feasibility badge, title, reason,
duration and servings, compact ingredient/equipment counts, required
confirmations, warnings, preference matches, and the Select recipe action.
Named requirements, quantities, notes, and optional ingredients remain
available in one shared shadcn Collapsible, rendered as full-width vertical
sections when expanded. Available rows use a quiet check treatment; only
unconfirmed and missing requirements receive attention badges. Expansion is
never required before selection.

The Pre-Cooking flow lives under `src/features/pre-cooking`.
`/app/pre-cooking` requires the current selected recommendation and matching
generation state, and remains inside the focused compact shell without global
BottomNavigation. Its TanStack Query mutation posts the exact selection plus the
current `session.request` to `POST /cooking/pre-cooking`; persistent Profile,
Household, Kitchen, Inventory, and preference context remains API-owned. The
browser validates output through the dedicated
`@flemme/agent/pre-cooking-output` schema export and preserves that exact plan
snapshot with the request and selected recipe.

The review surface renders the preparation summary, optional recipe-level
times, ingredient and equipment requirements, ordered preparation steps,
qualitative timing and cues, and collapsed cooking-stage details. It contains no
completion or progress controls. Successful generation also preserves the exact
request, selected recipe, and plan object in the transient Pre-Cooking handoff.

The Cooking Session web boundary lives under `src/features/cooking-session`.
Start Cooking validates the current handoff against the retained Recommendation
snapshot, derives the first cooking-stage and step IDs without changing the
plan, and posts the shared `CreateCookingSessionRequest` to
`POST /cooking-sessions`. New progress starts active with no completed steps or
changes. One synchronous query-cache lock plus the disabled pending action
prevents duplicate browser submissions; a failed request leaves the plan and
handoff available for retry. Creation invokes no Agent, Completion, Inventory,
Favorite, or history side effect.

`@flemme/contracts/cooking-session` owns the browser-safe create and response
schemas composed from schema-only Agent and Nutrition exports. A validated,
complete create response seeds the stable session-ID query cache before
navigation. `/app/cooking/$sessionId` reads only the persisted session response;
it does not depend on Recommendation or Pre-Cooking memory. The initial
placeholder intentionally contains no Active Cooking controls. A fresh page
load restores through `GET /cooking-sessions/:id`, preserving API-owned
authentication, ownership, missing-session, and corrupt-snapshot behavior. The
focused session route remains inside the compact app canvas without
BottomNavigation.

The Phase 5B Active Cooking experience lives under
`src/features/active-cooking`. `/app/cooking/$sessionId` owns a focused cooking
header and continues to hide global navigation. It restores only the canonical
Cooking Session query, resolves the current cooking stage and step by their
persisted stable IDs, and treats unresolved positions as corrupt instead of
falling back by array order or completion count.

Manual controls and accepted structured Agent actions derive one next mutable
progress snapshot from the immutable persisted plan, submit it explicitly to
`PATCH /cooking-sessions/:id/progress`, and replace the canonical query cache
only with the validated server response. One shared per-session mutation lock
prevents conflicting progress writes. Pause, resume, recorded changes, and
confirmed abandonment use this same boundary; abandonment is terminal and
cannot reactivate. Recorded changes retain shared contract kinds and optional
stable step references without rewriting the plan or Inventory.

`Finish cooking` records the final cooking step through the progress boundary
and, after server validation of that final persisted position, atomically moves
the Cooking Session to `phase = completion`, `status = completed`, and a
non-null `completedAt`. Completion and Nutrition snapshots remain nullable at
this boundary. Only the confirmed completed response navigates into the
Completion review. Existing completed sessions and abandoned sessions render as
closed states without Active Cooking controls.

The compact Cooking Assistant posts only the latest message to the existing
Active Cooking API. Replies are displayed independently from structured
actions. Reply-only and clarification output perform no write; accepted
advance, previous, pause, resume, record-change, and final-step actions produce
at most one explicit progress mutation. Agent-proposed abandonment always
requires user confirmation before persistence.

Active Cooking scope is enforced before normal reply generation by the
Agent-owned `ActiveCookingScope` resolver. The resolver combines explicit
off-topic and phase-owned request rules with cooking-domain, lifecycle, and
quantity/substitution signals plus terms derived from the persisted cooking
plan and session changes. It classifies `in_scope`, `out_of_phase`,
`off_topic`, and `ambiguous` without another model call. Relevant cooking and
kitchen-safety requests continue to the existing Active Cooking model path.

Off-topic, out-of-phase, and scope-ambiguous messages bypass that path and
receive deterministic cooking-specific responses with `actions: []`. The API
applies the same shared resolver before checking model availability or invoking
its injected runner, so the HTTP boundary cannot be bypassed by a noncompliant
runner. `runActiveCooking` applies the guard independently for direct runtime
use, and a post-output invariant strips lifecycle actions from every
non-`in_scope` result. The public `ActiveCookingOutput` transport remains only
`reply` plus `actions`; scope internals do not enter the web contract.

The shared and task-specific prompts repeat the scope and phase rules only as
defense in depth. The existing Ask Flemme UI renders deterministic redirects as
normal replies. Since their action list is empty, it sends no progress,
Completion, Nutrition, Inventory, Favorite, profile, or history mutation and
leaves the canonical Cooking Session unchanged.

Cooking Session naming is mutable display metadata owned by the application,
not a recipe or Active Cooking mutation. The optional nullable `customName`
lives on the persisted Cooking Session and is updated through authenticated
`PATCH /cooking-sessions/:id` for owned sessions in any lifecycle state. The
boundary trims and validates the name, returns the latest complete validated
session, and never rewrites `selectedRecipeSnapshot`, the approved cooking plan,
progress, `changes`, Inventory, or Agent output. Active Cooking resolves the
header from `customName` before the immutable recipe name and writes the server
response into the existing session-ID query cache under the shared per-session
mutation lock. Clearing stores `null`, restoring the original recipe name.

The Phase 6 Completion experience lives under `src/features/completion`.
`/app/cooking/$sessionId/completion` is a persisted, refresh-safe route that
loads only the owned Cooking Session. Active and paused sessions return to
Active Cooking; abandoned sessions receive a separate closed response. A
completed session renders `customName` before the immutable recipe name and
uses the existing browser-safe Completion output contract. The focused route
retains the compact canvas and hides AppHeader and BottomNavigation.

The Completion TanStack Query has a session-scoped key separate from the
canonical Cooking Session query. A restored `completionSnapshot` renders
directly without an Agent request. When the completed session has no snapshot,
the browser sends only `POST /cooking-sessions/:id/completion`; the API loads the
owned persisted plan and completed session, constructs the existing
`CompletionInput`, and invokes the existing Agent runtime.

Completion generation runs inside a per-session database row lock. The first
successful request validates and stores `completion_snapshot`; concurrent or
later retries return that same canonical snapshot without invoking the Agent
again. The response is the complete restored Cooking Session and replaces the
canonical browser cache. Generation does not change progress, `customName`, the
approved plan, Inventory, Favorites, history, or Nutrition. The review renders
the Agent reply, generated summary, persisted session changes, and optional
notes. Its Continue to Nutrition control navigates to the Phase 7 route;
Completion itself still performs no Nutrition work.

The Phase 7 Nutrition experience lives under `src/features/nutrition`.
`/app/cooking/$sessionId/nutrition` restores only the canonical owned Cooking
Session, requires completed status plus persisted Completion output, and keeps
the focused compact canvas without AppHeader or BottomNavigation. Active and
paused sessions return to Active Cooking, abandoned sessions remain closed, and
a completed session without Completion output returns to that prerequisite.
`customName` retains priority over the immutable selected-recipe name.

The browser restores an existing `nutritionSnapshot` directly. When it is
absent, the session-scoped Nutrition query sends one
`POST /cooking-sessions/:id/nutrition`, validates the complete returned Cooking
Session, and replaces the canonical session cache. Generation runs in a
transaction-scoped row lock. Only an owned completed session with Completion
output is eligible; the first request stores `nutrition_snapshot`, while
concurrent and later requests return the same historical snapshot without
recalculation.

The API projects only the persisted `cookingPlan.ingredients`, selected
servings, and structured `session.changes` into the existing deterministic
Nutrition foundation. Ingredient names resolve through the production canonical
catalog; quantities use only supported units and committed source-backed gram
conversions; macro calculation uses the committed Nutrition references. No
Agent or runtime reference fetch participates. Current change records contain
descriptions rather than structured quantities, so ingredient and serving
changes are not parsed or guessed: they add an `unquantified-change` coverage
limitation and make otherwise calculable output partial.

The browser-safe `RecipeNutritionResult` remains the persisted snapshot
contract. Phase 7 snapshots include the exact normalized ingredients that
contributed to calculation, while that field remains optional when restoring
pre-Phase 7 snapshots. Complete, partial, and unavailable variants preserve
serving basis, known totals, and explicit coverage issues. The review emphasizes
per-serving calories and primary macros, uses approximate markers for partial
totals, discloses included and excluded ingredients in one Collapsible, and
shows no macro zeroes when calculation is unavailable.

Phase 8 extends the focused Nutrition review with the feature-owned Favorite
action under `src/features/favorites`. Stable list and session-scoped TanStack
Query keys restore persisted saved state through the existing authenticated
Favorites list API. The create mutation posts only the completed Cooking
Session ID, validates the canonical Favorite response through the shared
`@flemme/contracts/favorite` contract, synchronously shares concurrent attempts,
and updates the session cache plus any existing list cache.

Successful creation stays on Nutrition and renders a compact saved state.
`FAVORITE_ALREADY_EXISTS` triggers one server-state reconciliation and becomes
saved only when the canonical Favorite is found. Real failures preserve the
completed session and Nutrition review with controlled retry copy. Favorite
creation does not regenerate Completion or Nutrition and does not mutate the
recipe snapshot, cooking progress, Inventory, or history. Direct access and
refresh derive saved state from the server; the focused route continues to hide
AppHeader and BottomNavigation.

Phase 10 adds `/app/profile` as the authenticated control center for persistent
personal cooking context. `src/features/profile` owns the page, personal
information, cooking-preference, Household, loading, recoverable error, and
logout sections; the file route remains thin. AppHeader's single avatar entry
opens Profile, while the four-item BottomNavigation and compact `max-w-xl`
AppShell remain unchanged.

The canonical Auth query now exposes normalized ID, email, name, and optional
provider image. The shared display presenter still applies name, email username,
then `User` fallback priority. A successful display-name update replaces that
same Auth cache, so AppHeader and Home update without a reload. Email and
provider image remain read-only.

Profile editing reuses the existing `["profile"]` and `["household"]` TanStack
Query caches, complete replacement APIs, preference vocabulary, validation, and
shared onboarding forms. Successful writes replace only their canonical cache;
controlled failures preserve dialog input for retry. These writes affect the
database context read by future Recommendation and Pre-Cooking requests, never
an existing Cooking Session snapshot. Logout uses the existing Better Auth
action, clears user-scoped query state, and returns to Login without deleting
persisted data.



The public landing page composes section exports from `src/components/landing`.
That directory owns marketing layouts, static display data, and decorative
helpers; `src/landing/landing-page.tsx` owns section order only. Landing-specific
recipe cards wrap the generic shadcn Card without modifying shared primitives.

## System Boundaries

- `apps/web`
  Owns browser UI, routing, forms, and frontend state.

- `apps/api`
  Owns HTTP boundaries, application orchestration, auth, authorization,
  persistence coordination, and agent invocation.

- `packages/agent`
  Owns AI instructions, model configuration, agent tools, structured AI
  behavior, and agent evaluation.

- `packages/ingredients`
  Owns language-independent canonical ingredient keys, bilingual display names,
  aliases, deterministic exact-name resolution, and catalog validation. It does
  not own nutrition arithmetic, fuzzy matching, persistence, or AI resolution.

- `packages/nutrition`
  Owns deterministic structured-unit normalization, estimated-nutrition
  contracts, and calculation from normalized ingredient masses and explicit
  reference values. It validates nutrition and conversion keys against
  `packages/ingredients` through a one-way dependency. It does not own
  natural-language ingredient parsing, runtime external reference fetching,
  persistence, or AI reasoning.

Production ingredient and nutrition reference data is established through a
separate, curated Ingredient + Nutrition Data Foundation. USDA FoodData Central
is the primary v0.1 source. Stored references preserve provenance and FoodData
Central IDs; Flemme does not bulk-import the complete dataset. Unit-to-gram
conversions are supported only when backed by verified source portion data.
TKPI remains a possible Indonesia-specific source after a separate provenance
and licensing review.

The production data flow is:

```text
@flemme/ingredients production catalog
        ↓ canonical ingredient key
@flemme/nutrition curated USDA FDC mapping
        ↓ 100 g reference + verified source-specific portions
deterministic normalization and calculation
        ↓
complete | partial | unavailable
```

FDC IDs are provenance identifiers, not Flemme ingredient identities. The
curated mappings are committed package data, so normal runtime has no USDA
network dependency.

- `packages/db`
  Owns database schemas, migrations, and database access.

Local PostgreSQL infrastructure is defined in the root `docker-compose.yml`.
It is a development concern only; application containers and production
deployment infrastructure remain outside the current architecture.

- `packages/contracts`
  Owns shared Zod contracts and controlled cross-workspace catalogs used across
  workspace boundaries.

## Request Flow

Web
→ API
→ application logic
→ Agent, Nutrition, and/or Database

The web application must not directly access the database or private AI
provider credentials.

## Web Authentication

Auth A7 connects `apps/web` to the API through the official Better Auth React
client configured only by public `VITE_API_URL`. Password and Google actions use
the API-owned `/auth` routes with credentials; HttpOnly cookies remain the sole
session transport. The User Platform never stores session or provider tokens.

TanStack Query restores the canonical Flemme identity from `/auth/me`. Auth
state owns only user/loading/authenticated status. Product Domain resources stay
separate server state. Public landing, guest-only login/register, protected app
entry and protected onboarding shell use awaited TanStack Router guards to avoid
session-restore flicker.

Onboarding status and completion are application-owned backend state. The
`GET /onboarding` route resolves the first missing Profile, Household, Kitchen or Inventory
decision and then the explicit Completion step. `POST /onboarding/complete`
server-verifies those prerequisites and idempotently persists
`users.onboarding_completed_at`; an existing empty Inventory is a valid decision.
TanStack Query caches this canonical status for route guards. Logout invalidates
the server session and clears the user-scoped query cache before navigation. A
Product Domain 401 clears the same state; domain 404s never invalidate Auth.

## API Foundation

Auth A2 mounts Better Auth 1.7.4 at `/auth/*` with the existing Drizzle database
instance and A1 table mappings. Centralized credentialed CORS allows only
WEB_ORIGIN, before authentication middleware. A3 enables password registration/login
with Bun Argon2id, 8–128 character passwords and automatic session establishment,
without marking email verified. A scoped request plugin normalizes JSON emails
before validation and omits session tokens from successful JSON responses. No
Product Domain creation hooks exist. A4 enables Google authorization-code
login/registration with openid/email/profile only, online access and no
incremental authorization. Google subject maps to auth_accounts.accountId, with
the same users.id UUID and database session model as passwords. Google profile
fields stay Auth-owned; no Profile synchronization occurs. Implicit/explicit
linking remains disabled: same-email password collisions fail with
account_not_linked. Native provider token retrieval/refresh and linking routes
are disabled. Redirect/state/PKCE remain framework-owned at
/auth/callback/google; extra client scopes or authorization parameters are
rejected. Real Google signup, restoration, logout and returning-login acceptance
are complete.

Auth v1 has one HTTP `currentUserId` boundary. The common middleware calls
`auth.api.getSession({ headers })` and sets only the validated canonical
`users.id` UUID. Missing, invalid, expired and logged-out sessions return
Flemme's `UNAUTHENTICATED` 401 without exposing framework internals. There is
no alternative adapter, authentication selector, or fallback.
Application-owned GET `/auth/me` runs through the same boundary and returns
canonical user ID, email, normalized name, and optional provider image.
Authenticated PATCH `/auth/me` accepts only a trimmed non-empty display name and
updates the same Auth-owned `users` row; email and image are not writable
through this boundary. Product Domain services and ownership queries remain
provider/session agnostic and unchanged.
Protected OpenAPI operations use `CurrentUser` with the actual HttpOnly
session cookie. Valid production Auth configuration is allowed; HTTPS API and
web origins remain required in production for transport security.

API features live under `apps/api/src/modules` with colocated Hono route,
transport schema, and service files. API-wide composition, environment, error,
and test utilities remain directly under `apps/api/src`. Routes validate HTTP
input with Zod, services coordinate domain rules and `@flemme/db`, and database
schema definitions remain inside `packages/db`.
Hono OpenAPI route definitions generate the specification served at
`/openapi.json`; Swagger UI is available at `/docs`.

Persisted agent and nutrition JSONB snapshots are untrusted when restored. The
API parses them through the runtime schema exported by the package that owns
the snapshot before returning or using them.

Cooking Session nutrition is orchestrated in `apps/api` from the persisted
Pre-Cooking plan and selected recipe serving count. The read-only preview and
the existing explicit `POST /cooking-sessions/:id/complete` persistence path
share one deterministic mapper that resolves only the production ingredient
catalog, exact supported unit aliases, verified portion conversions, and
committed USDA references. Preview performs no write; the explicit combined
path calculates before one update persists lifecycle state, supplied Completion
output, and the server-owned nutrition snapshot together. Neither path invokes
an Agent or accesses USDA over the network. The Phase 6 web flow does not call
this combined path: its `/completion` Agent boundary stores only
`completion_snapshot` and leaves Nutrition unchanged for Phase 7.

Product-domain APIs use the same authenticated `currentUserId` boundary as the
Cooking Engine. Profile v0.1 exposes the existing optional one-to-one
`user_profiles` row through a read plus idempotent full replacement of its two
cooking-preference arrays. It does not introduce another preference model;
Recommendation and Pre-Cooking continue reading those columns through the
existing cooking-context service, with request-level arrays replacing
persistent arrays for one request.

Household v0.1 follows the same current-user resource boundary over the
existing optional one-to-one `households` row. Its API replaces the complete
aggregate adults, children, and toddlers counts, requiring at least one member
and limiting each category to 20, without introducing household members or a
second representation. The existing cooking-context service reads the saved row
directly, while a request-level household remains a whole-object override for
one cooking request.

During the A5/A7 migration, local cooking routes may explicitly select the
isolated development adapter, which accepts a real user UUID and verifies it
against PostgreSQL. The API refuses production startup with that mode.

## Agent Boundary

Favorites are an overlay on completed Cooking Sessions, not recipe storage.
The API reuses session restoration and projects historical recipe summaries.
Creation uses an ownership/status-filtered insert and the existing composite
session/user FK and unique constraint. Removing a favorite preserves history.
No AI, current cooking context, copied snapshot or new history table is involved.
Inventory API writes the existing inventory parent and item rows. Regular
Inventory Management and initial onboarding use the same domain and
deterministic `@flemme/ingredients` resolver. Known bilingual names and aliases
store canonical keys; unresolved names remain valid user-owned entries. Each
row stores a normalized identity key for duplicate prevention, an optional
canonical ingredient key, and the submitted normalized display name. Create
and rename both resolve names server-side. Existing quantity, ownership, and
deletion rules remain unchanged. Cooking context projects canonical keys when
available and stored names otherwise; request-level inventory overrides remain
authoritative without silently mutating persistence.

Kitchen API uses the existing user-owned kitchen parent and equipment child
rows. Equipment identity is a canonical key from the controlled v0.1 catalog in
`packages/contracts`; API writes require at least one supported, unique key. A
full replacement upserts the parent, deletes previous child rows, and inserts
the requested keys in one PostgreSQL transaction. The parent upsert serializes
concurrent replacements for the same user. Cooking-context orchestration reads
these same child rows; its existing unspecified ordering and whole-request
override behavior remain unchanged. The Kitchen response alone sorts keys
deterministically.

The agent is a reusable capability, not an independent backend.

Agent code does not own:

- HTTP authentication
- user authorization
- application persistence
- secrets management
- direct business side effects

## Invariants

1. Web never connects directly to PostgreSQL.
2. Web never receives private provider API keys.
3. The agent does not become a second application backend.
4. External input is validated before business logic trusts it.
5. Shared cross-workspace contracts belong in `packages/contracts`.
6. Do not add distributed infrastructure without a proven requirement.
7. Core cooking flow must not depend on secondary modules such as budgeting.
8. Ingredient identity, unit conversions, and nutrition references share the
   same language-independent canonical ingredient key.
9. Unknown or fully unresolved nutrition is represented explicitly as
   unavailable and must never be replaced with zero-valued nutrition.
10. Nutrition snapshots are server-calculated historical metadata; clients may
    not supply them when creating or completing a Cooking Session.
