# AI Workflow Rules

## Approach

Build Flemme incrementally using a spec-driven workflow.

Documentation is the source of truth for product behavior, architecture,
implementation standards, and current progress.

Do not infer missing product behavior from code alone.

## Scoping Rules

- Work on one bounded implementation unit at a time.
- Prefer small, verifiable changes.
- Do not combine unrelated system boundaries.
- Do not opportunistically refactor unrelated code.
- Do not implement future features while working on the current unit.

## Planning

For non-trivial work:

1. Read the relevant documentation.
2. Inspect the existing implementation.
3. Identify the smallest implementation unit.
4. Document unresolved decisions before coding.
5. Implement.
6. Validate.
7. Update progress.

Implementation plans belong in:

`docs/plans/`

## Missing Requirements

If product behavior is not defined:

1. Do not invent it.
2. Add the issue to `docs/progress-tracker.md`.
3. Resolve the relevant specification.
4. Continue only after the behavior is clear.

## Dependency Rules

Do not introduce a new dependency unless:

- there is a concrete requirement,
- existing project dependencies cannot reasonably solve it,
- the new dependency does not violate architecture boundaries.

## Protected Files

Do not modify unless explicitly necessary:

- generated route trees,
- generated UI library internals,
- third-party dependency internals,
- generated migrations without understanding the schema change.

## Keeping Documentation in Sync

Update documentation when implementation changes:

- system boundaries,
- architecture decisions,
- product behavior,
- coding conventions,
- UI invariants,
- current implementation status.

## Completion Criteria

Before moving to the next unit:

1. Current work is complete within its scope.
2. Typecheck passes.
3. Build passes where relevant.
4. Relevant tests pass.
5. Architecture invariants remain valid.
6. `progress-tracker.md` is updated.
