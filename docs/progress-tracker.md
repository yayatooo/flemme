# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Agent Foundation — In Progress

## Current Goal

Build and validate `packages/agent` as a reusable Flemme AI capability before
implementing the API application layer.

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

Remaining sequence:

8. Cooking-session contracts
9. Tools
10. Evaluation scenarios
11. Observability

## Next Up

Define the first cooking-session contracts (A8) as the next bounded Agent
Foundation unit.

The general intent router remains implementation-light until another supported
intent or a concrete routing requirement is defined.

## Open Questions

- Which agent tools are actually required for MVP recommendation.
- Nutrition estimation implementation boundary.

## Architecture Decisions

### Agent lives in `packages/agent`

Reason:

The agent is currently a reusable AI capability invoked by the application.
It does not own an independent deployment lifecycle or HTTP boundary.

### API remains the application boundary

The API will own application orchestration, persistence coordination,
authentication, authorization, and invocation of AI capabilities.

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
`gpt-5.6-luna` model without changing the provider factory default.

## Validation

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
- No package-specific build or automated test script is currently defined.

Do not begin API feature implementation until the Agent Foundation reaches a
stable baseline.
