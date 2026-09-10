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
  repository environment file and exercises the recommendation flow with a
  documented cooking-context example.
- The shared cooking instruction defines Flemme's context priority,
  inventory-first recommendations, uncertainty handling, cooking-session
  behavior, side-effect boundary, safety guidance, and communication style.
- The cooking recommendation prompt defines recommendation priorities,
  personalization rules, discovery-level response guidance, and when a
  follow-up question is warranted.
- The cooking recommendation intent composes the shared cooking instruction
  with the recommendation-specific prompt and invokes Anvia through a model
  supplied by the calling application.
- The cooking agent runtime delegates recommendation requests to the cooking
  recommendation intent without taking ownership of application concerns.

## In Progress

### Agent Foundation

Completed sequence:

1. Agent responsibility
2. Agent instruction
3. Provider
4. Agent runtime
5. Local development runner

Remaining sequence:

6. Input contracts
7. Recommendation output contracts
8. Cooking-session contracts
9. Tools
10. Evaluation scenarios
11. Observability

## Next Up

Define the first validated input contracts for the cooking recommendation
intent (A6), followed by its structured recommendation output contracts (A7).

The general intent router remains implementation-light until another supported
intent or a concrete routing requirement is defined.

## Open Questions

- Initial model choice for development.
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
task-specific prompts. The recommendation response is still unstructured until
the A6 and A7 contracts are defined.

## Validation

- `bun run typecheck` passes for `@flemme/agent` after the intent and prompt
  setup.
- No package-specific build or automated test script is currently defined.

Do not begin API feature implementation until the Agent Foundation reaches a
stable baseline.
