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

## In Progress

### Agent Foundation

Current sequence:

1. Agent responsibility
2. Agent instruction
3. Provider
4. Agent runtime
5. Local development runner
6. Input contracts
7. Recommendation output contracts
8. Cooking-session contracts
9. Tools
10. Evaluation scenarios
11. Observability

## Next Up

Define the Flemme agent responsibility boundary (A1), then implement the first
cooking agent instruction (A2).

## Open Questions

- Final OpenAI/OpenRouter provider configuration strategy.
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

## Session Notes

Base agent structure checkpoint completed. No new runtime behavior, provider
configuration, tools, or product contracts were implemented in this setup.

Do not begin API feature implementation until the Agent Foundation reaches a
stable baseline.
