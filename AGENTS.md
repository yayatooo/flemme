# Flemme — Agent Instructions

## Project

Flemme is a personal AI cooking companion.

The repository is a Bun + Turborepo monorepo.

Before making changes, understand the relevant project context in `docs/`.

## Source of Truth

Read documentation based on the task:

- `docs/project-overview.md`
  Product overview, goals, primary flow, scope, and success criteria.

- `docs/business-context.md`
  Detailed product behavior and business rules.

- `docs/architecture.md`
  System architecture, package boundaries, technology decisions, and invariants.

- `docs/code-standards.md`
  Coding conventions, TypeScript rules, naming, and implementation standards.

- `docs/ui-context.md`
  Frontend design system and UI conventions.

- `docs/ai-workflow-rules.md`
  Rules for AI-assisted development and implementation workflow.

- `docs/progress-tracker.md`
  Current implementation phase, completed work, open questions, and next unit.

## Core Rules

1. Do not invent product behavior.

2. Product behavior must be supported by `docs/project-overview.md`
   or `docs/business-context.md`.

3. Respect architecture boundaries defined in `docs/architecture.md`.

4. Follow `docs/code-standards.md` for implementation.

5. Work on one bounded unit at a time.

6. Prefer simple implementations over speculative abstractions.

7. Do not introduce infrastructure or dependencies without a concrete
   requirement.

8. If requirements are ambiguous, stop implementation and document the
   question in `docs/progress-tracker.md`.

9. Do not silently change established architecture or business rules.

10. Update documentation when a completed implementation changes a
    documented behavior or technical decision.

## Validation

Before considering a unit complete:

- run the relevant typecheck,
- run the relevant build,
- run relevant tests when available,
- verify no architecture invariant was violated,
- update `docs/progress-tracker.md`.

## Package Boundaries

- `apps/web`
  Browser application and UI.

- `apps/api`
  Application boundary, HTTP API, business orchestration, authentication,
  authorization, and persistence coordination.

- `packages/agent`
  Reusable Flemme AI capability built with Anvia.

- `packages/db`
  Database schema and database access.

- `packages/contracts`
  Shared runtime validation and cross-package contracts.

## Agent Boundary

`packages/agent` must not become a second backend.

The agent may reason and use capabilities exposed to it, but application-owned
concerns such as authentication, authorization, persistence, credentials,
and business side effects remain outside the agent package.

## React Rule

Do not introduce `useEffect` unless no reasonable declarative alternative
exists.

If `useEffect` is considered necessary, explain the reason and request
approval before implementation.

## Frontend Invariant

Flemme is mobile-first.

Primary cooking flows must be designed and validated for smartphone browsers
before desktop enhancement.

Do not implement desktop-first UI and treat mobile as a shrinking exercise.
