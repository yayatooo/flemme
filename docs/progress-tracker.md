# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Local PostgreSQL Infrastructure v0.1 — Complete

## Current Goal

Provide a reproducible, localhost-only PostgreSQL 16 development service that
uses the existing Drizzle schema, migration, and named data volume without
committing credentials.

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
- The intent has an isolated development runner but is not yet routed through
  `runCookingAgent`.
- The Pre-Cooking v0.1 runner output is stable enough to proceed to Active
  Cooking contract design.

### Active Cooking Foundation

- The v0.1 input and session contracts are defined and exported.
- The v0.1 proposed-action output contract is defined, exported, and tested.
- The task-specific prompt, structured execution function, reusable cooking-plan
  fixture, and ten-scenario local runner are implemented.
- Progress mutation, persistence, and application integration remain
  intentionally deferred.

### Completion Foundation

- The v0.1 input and output contracts are defined, exported, and tested.
- The task-specific prompt, structured execution function, reusable completed
  session fixture, and eight-scenario local runner are implemented.
- Persistence, history, favorites, ratings, inventory reconciliation, and
  application integration remain intentionally deferred.

## Next Up

Select the next bounded application/API persistence milestone before
implementing production catalog data, natural-language quantity parsing,
reference sourcing, or UI display.

The general intent router remains implementation-light until another supported
intent or a concrete routing requirement is defined.

## Open Questions

- Which agent tools are actually required for MVP recommendation.
- Which verified nutrition-reference source should eventually supply the
  deterministic package.

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

Do not begin API feature implementation until the Agent Foundation reaches a
stable baseline.
