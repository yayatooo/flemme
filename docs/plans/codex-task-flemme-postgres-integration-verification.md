# Codex Task — Flemme PostgreSQL Integration Verification

## Objective

Close the remaining verification gap by running the PostgreSQL-backed DB and API integration suites against an isolated local test database.

Fix only genuine failures exposed by those integration tests. Keep Lens, observability, eval expansion, feature work, and unrelated refactoring out of scope.

## Current verified state

- Root typecheck passes in all seven workspaces.
- Production build passes.
- Existing verified non-DB test scope passes.
- Flemme evals pass after the Anvia upgrade.
- PostgreSQL-backed API and DB integration tests have not yet run because PostgreSQL was unavailable on `localhost:5432`.
- No known schema or migration change is currently requested.

Reconfirm this state before changing anything.

## Mandatory preparation

1. Read every applicable `AGENTS.md`.
2. Inspect `git status` and preserve all existing user changes.
3. Inspect existing database infrastructure before starting anything:
   - root and package scripts;
   - Docker Compose files;
   - `packages/db` configuration;
   - Drizzle configuration and migrations;
   - test setup/teardown helpers;
   - `.env.example` files and environment variable names;
   - API and DB integration-test discovery patterns.
4. Read the relevant status in `docs/progress-tracker.md` and the latest eval implementation report.
5. Determine the canonical repository-supported way to start the test database and run migrations.

Do not print secret values from any environment file.

## Database safety boundary

Before running migrations, cleanup, truncation, or tests, prove that the target is an isolated local test database.

At minimum verify:

- host resolves to localhost, loopback, or a task-owned local container;
- database name is explicitly test-scoped;
- connection is not production, staging, shared development, Neon, or another remote database;
- the database is not used by a currently running development server;
- cleanup helpers target only the verified test database.

Do not infer safety merely from an environment variable name. Inspect the resolved host and database name without exposing credentials.

Never run destructive schema reset commands against an unverified database. If isolation cannot be proven, stop and report the exact missing configuration.

## Starting PostgreSQL

Use the repository's existing Compose/test-database workflow when one exists.

If PostgreSQL is already listening on `localhost:5432`:

- identify whether it is the intended project test service;
- verify the target database identity;
- do not stop, recreate, or delete a user-managed container/service.

If no repository-supported service is running and Docker is available, a temporary task-owned PostgreSQL container may be created only when necessary. It must have:

- an explicit task-specific container name;
- an explicit local port mapping;
- a dedicated test database;
- task-specific credentials that are not committed;
- a health check/readiness wait;
- no production or staging data;
- no broad Docker cleanup commands.

Track whether the task created the container. At the end, remove only infrastructure created by this task unless repository instructions require preserving it. Never run `docker system prune`, broad volume deletion, or wildcard removal.

If port `5432` is occupied by an unrelated service, do not stop it. Use the repository-supported alternate test port when configurable, or stop and report the conflict.

## Schema preparation

Against the verified test database:

1. Run the canonical migration command.
2. Confirm all migrations apply successfully.
3. Do not generate a new migration unless integration failure proves the committed schema and migration history disagree.
4. Do not modify a previously applied migration.
5. Do not seed production-like or personal data.

If tests require fixtures, use existing test factories and seed helpers.

## Test execution order

Run tests in increasing scope:

1. `packages/db` PostgreSQL-backed tests.
2. API integration tests for the files touched by the five recent type fixes:
   - completion;
   - resumable cooking session;
   - favorites.
3. Remaining PostgreSQL-backed API integration tests.
4. Full DB and API integration suites.
5. Full repository test command if runtime remains reasonable.

Record exact suite, test, pass, fail, and skip counts.

Do not count tests skipped because the database is unreachable as passing verification.

## Failure handling

When an integration test fails:

1. Re-run the narrow failing test once to distinguish deterministic failure from environmental startup timing.
2. Inspect the database state and test setup/teardown boundary.
3. Determine whether the cause is:
   - environment/readiness;
   - migration drift;
   - fixture isolation;
   - test-order dependence;
   - transaction/concurrency behavior;
   - a real application bug;
   - an incorrect test expectation.
4. Fix only the smallest proven root cause.

Do not weaken assertions, add arbitrary sleeps, serialize the entire suite, or increase timeouts without evidence.

Do not use `any`, `@ts-ignore`, unsafe double assertions, or compiler-option weakening.

If a migration or product-contract change is genuinely required, stop and report it before making that broader change.

## Regression protection

The following must remain unchanged unless an integration test proves a direct defect:

- Anvia Core/OpenAI/Zod versions;
- eval case count and metrics;
- Active Cooking heat/pause safety guidance;
- public cooking-phase schemas;
- Lens/observability status;
- unrelated API routes and services.

Do not update dependency or lockfiles in this task.

## Final verification

After DB-backed tests are green, run:

1. API typecheck.
2. Root typecheck.
3. Production build.
4. Relevant non-DB tests.
5. Full PostgreSQL-backed DB/API integration suites.
6. Scoped Biome for touched files.
7. `git diff --check`.
8. Final Git status and diff review.

If this task created temporary infrastructure, stop and remove only that task-owned infrastructure after the final test run. Confirm cleanup without touching user-managed services or volumes.

## Documentation

Update `docs/progress-tracker.md` only to record the actual PostgreSQL integration result.

If a stable repository test command or setup detail was missing and had to be established, update the smallest existing developer/test README. Do not create a large new report unless a blocker requires detailed evidence.

## Acceptance criteria

- Target database isolation is proven before destructive operations.
- All committed migrations apply to a clean test database.
- DB integration suite passes with explicit counts.
- API integration suite passes with explicit counts.
- Recently fixed completion, session, and favorites paths pass against PostgreSQL.
- Root typecheck remains clean across seven workspaces.
- Production build remains green.
- Biome and diff check pass.
- No dependency, lockfile, eval behavior, Lens configuration, or unrelated feature changes occur.
- Task-created database infrastructure is safely cleaned up or intentionally preserved according to repository instructions.

If PostgreSQL or Docker cannot be started safely, do not claim completion. Report the exact blocker and the exact user command/configuration needed.

## Final response format

Lead with whether PostgreSQL-backed verification is fully green.

Include:

1. Database service used and how test isolation was proven, without credentials.
2. Migration result.
3. DB integration test counts.
4. API integration test counts.
5. Full regression/typecheck/build results.
6. Any code or test fixes made and their root causes.
7. Files changed.
8. Infrastructure cleanup status.
9. Confirmation that dependencies, evals, Lens, and unrelated behavior were unchanged.
