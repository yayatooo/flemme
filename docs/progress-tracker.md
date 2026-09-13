# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Nutrition Integration v0.1 — Final PostgreSQL acceptance pending

## Current Goal

Validate the implemented production-backed Cooking Session nutrition preview
and trusted completion persistence against the real local PostgreSQL lifecycle,
then close the Flemme Cooking Engine v0.1 checkpoint.

## Completed

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

### Nutrition Integration v0.1 — Implementation

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

Run the Nutrition API and completion integration suites plus database lifecycle
validation when local PostgreSQL is available. Perform the documented Swagger
acceptance, then mark Nutrition Integration and the Flemme Cooking Engine v0.1
checkpoint complete.

Full context APIs, favorite endpoints, production authentication,
natural-language quantity parsing, TKPI evaluation, and nutrition UI display
remain deferred.

The general intent router remains implementation-light until another supported
intent or a concrete routing requirement is defined.

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
- The new ten-test real-PostgreSQL Nutrition integration suite and existing
  Cooking Session suite are currently unexecuted successfully because local
  PostgreSQL is stopped; the attempted run failed at setup with `ECONNREFUSED`.
  No API or database server was started, respecting manual-run ownership.
- Flemme Cooking Engine v0.1 is not yet marked complete until that database and
  manual Swagger acceptance succeeds.

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
