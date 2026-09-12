# Active Cooking Runtime + Local Runner v0.1

## Scope

Connect the existing Active Cooking input and output contracts through one
task-specific prompt and Anvia structured generation, then expose deterministic
development scenarios through a local runner.

## Implementation

1. Allow an empty proposed-action list for guidance-only responses.
2. Add the Active Cooking task prompt and focused prompt tests.
3. Add `runActiveCooking` with input validation and structured output.
4. Add one reusable Ayam Kecap cooking-plan fixture.
5. Add a local runner with the ten requested scenarios and readable output.
6. Document usage, update progress, and run tests, typecheck, build, and Biome.

## Boundaries

- Do not mutate session progress or the cooking plan.
- Do not resolve next or previous navigation targets.
- Do not add persistence, API, browser, queue, or frontend behavior.
