# Business context

Flemme helps a household decide what to cook, prepare an executable plan, stay
oriented while cooking, and close the session without inventing facts or
silently changing application state.

## Context priority

A request for the current cooking attempt takes precedence over persistent
defaults. Persistent Profile, Household, Kitchen, and Inventory data supplies
context when the request does not override it. Inventory is the source of truth
for confirmed availability; common pantry items must not be assumed. Missing,
unconfirmed, and optional ingredients must be represented honestly.

Preferences and household details guide recommendations but do not override an
explicit request. Equipment and available time constrain feasibility. When the
available context cannot support a responsible recommendation, the Agent asks
for clarification or returns no viable recommendation instead of fabricating
context.

## Four cooking phases

1. **Recommendation** returns one to three feasible choices, a clarification,
   or no viable recommendation. It does not create a session or mutate stored
   context.
2. **Pre-Cooking** turns the selected recipe into one immutable cooking plan.
   The plan separates ingredients, equipment, preparation, stages, steps,
   qualitative timing, and completion cues without silently replacing the
   selected recipe.
3. **Active Cooking** explains the current plan position and proposes typed
   actions for navigation, lifecycle changes, or recorded deviations. The API
   applies no proposed action automatically; persistence is explicit.
4. **Completion** summarizes a completed session using its plan, progress, and
   recorded changes. It does not invent an outcome, mutate inventory, or
   calculate nutrition.

The application owns authentication, authorization, persistence, and business
side effects. The Agent owns reasoning and validated outputs. Deterministic
nutrition is a separate catalog-backed calculation and never relies on model
claims.

## Product boundaries

- Cooking plans and generated outputs are validated before crossing package
  boundaries.
- A Cooking Session stores immutable generated snapshots and mutable progress
  separately.
- Active Cooking actions are proposals until an application-owned endpoint
  persists an accepted change.
- Completion generation and completion persistence are separate operations.
- Unsupported nutrition inputs remain partial or unavailable; they are not
  guessed.
- Favorites are derived from owned completed sessions rather than independent
  recipe records.

See [Architecture](architecture.md) for implementation boundaries and
[Agent](modules/agent.md) for the phase contracts.
