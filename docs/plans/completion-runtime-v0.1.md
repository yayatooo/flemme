# Completion Prompt, Runtime + Local Runner v0.1

## Scope

Connect the existing Completion contracts through a task-specific prompt and
Anvia structured generation, then expose realistic local scenarios.

## Implementation

1. Add Completion-specific prompt instructions and deterministic prompt tests.
2. Add `runCompletion` with input validation and native structured output.
3. Reuse the Ayam Kecap plan and add one reusable completed-session fixture.
4. Add an eight-scenario local runner with readable output.
5. Document usage, update progress, and validate the workspace.

## Boundaries

- Do not mutate the plan, session, inventory, history, favorites, or ratings.
- Do not add application actions, persistence, APIs, queues, or frontend state.
- Do not continue Active Cooking navigation from Completion.
