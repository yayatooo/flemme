# Completion Contract v0.1

## Scope

Define validated Completion input and output contracts only.

## Implementation

1. Expose the completed variant of the existing Active Cooking session schema.
2. Derive Completion input from the refined Active Cooking input contract while
   requiring a completed session and allowing an optional final message.
3. Define the minimal Completion output with reply, summary, and notes.
4. Add focused schema tests and export the new contracts.
5. Update progress and run tests, typecheck, build, and Biome.

## Boundaries

- Do not add a Completion prompt, runtime, runner, or model call.
- Do not mutate the cooking plan, session, inventory, favorites, or history.
- Do not add persistence or application integration.
