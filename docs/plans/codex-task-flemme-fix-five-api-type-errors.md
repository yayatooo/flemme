# Codex Task — Fix Five Pre-Existing Flemme API Type Errors

## Objective

Fix exactly the five pre-existing TypeScript errors in the Flemme API and restore a clean root typecheck.

Keep this task narrowly scoped. Do not continue with PostgreSQL integration tests, Lens, observability, eval expansion, or unrelated refactoring.

## Current verified context

The preceding eval and observability implementation completed with these relevant results:

- `@anvia/core` upgraded to `1.5.0`;
- `@anvia/openai` upgraded to `1.1.5`;
- Zod upgraded to `4.6.5`;
- production build passes;
- Agent, Contracts, Ingredients, Nutrition, and Web suites pass;
- 325 tests pass in the verified non-DB scope;
- Anvia/Zod/OpenAPI migration errors are resolved;
- root typecheck still reports exactly five errors already attributed to the API;
- API/DB integration tests remain out of scope because PostgreSQL is not currently available on `localhost:5432`.

Verify this state before changing code.

## Mandatory preparation

1. Read every applicable `AGENTS.md`.
2. Inspect `git status` and the existing diff.
3. Read:
   - `docs/evals/flemme-evals-observability-implementation-report.md`;
   - `docs/evals/flemme-eval-post-upgrade-comparison.md`;
   - relevant API `package.json` and TypeScript configuration.
4. Run the canonical root typecheck and capture the exact five errors.
5. Confirm all five errors are inside the API scope before editing.

Preserve every existing user change from the eval/observability work.

## Diagnosis requirements

For each error, determine:

- error code;
- exact file and line;
- expected type;
- actual type;
- root cause;
- whether several errors share one underlying cause;
- whether the error reflects a real runtime contract mismatch rather than a compiler-only inconvenience.

Inspect the relevant route, handler, service, schema, shared contract, and database type together before selecting a fix.

Do not treat generated error text as sufficient diagnosis. Trace the value from its source to its consumer.

## Implementation rules

- Fix the root cause with the smallest coherent change.
- Preserve API request and response behavior unless the current behavior violates the documented contract.
- Reuse existing shared Zod/contracts types instead of creating duplicate local interfaces.
- Preserve Hono handler and middleware typing.
- Preserve current Anvia, OpenAI adapter, and Zod versions.
- Do not update the lockfile or dependencies unless an unexpected dependency defect is proven. If that occurs, stop and report rather than broadening the task.
- Do not modify database schemas or migrations unless one of the five errors proves that the current database contract is internally inconsistent. If a migration would be required, stop and report it as a blocker.
- Do not change eval cases or weaken eval metrics.
- Do not alter the Active Cooking pause safety fix.
- Keep runtime validation at external boundaries.

## Forbidden shortcuts

Do not use:

- `any`;
- unsafe double assertions such as `value as unknown as Target`;
- `@ts-ignore`;
- unjustified `@ts-expect-error`;
- `skipLibCheck: true` as a workaround;
- broad index signatures to silence property errors;
- non-null assertions without a preceding invariant or guard;
- disabling strict compiler options;
- widening a schema merely to satisfy an incorrect caller;
- editing installed package files;
- generated-file hand edits when a canonical generator owns the file.

An assertion is acceptable only when it represents a proven invariant that TypeScript cannot express and is documented immediately beside the assertion. Prefer parsing, narrowing, discriminated unions, or a typed helper.

## Expected repair patterns

Choose only patterns justified by the actual errors, such as:

- parse or validate external values before passing them into a typed service;
- narrow a union using its discriminant;
- align a handler return with the existing response schema;
- handle an optional or nullable database value explicitly;
- correct an incorrectly inferred empty collection;
- reuse an exported schema input/output type;
- correct an async return type;
- make exhaustive status/action handling explicit;
- fix an API-to-contract mapper that omits or misnames a field.

Do not preselect one of these patterns without repository evidence.

## Verification sequence

After implementing the fixes, run in this order:

1. The narrow API typecheck.
2. The root typecheck.
3. API unit tests that do not require PostgreSQL.
4. Contract tests relevant to the touched boundary.
5. Existing agent/eval deterministic tests only if a shared contract was touched.
6. Production build.
7. Scoped Biome check for touched files.
8. `git diff --check`.
9. Final `git status` and diff review.

Do not start PostgreSQL or run DB integration tests in this task. Clearly identify those tests as not run rather than failed.

## Acceptance criteria

- The canonical root typecheck reports zero errors.
- The narrow API typecheck reports zero errors.
- Exactly the five known API errors are resolved.
- No type-safety suppression was introduced.
- No dependency or lockfile change was made.
- API behavior and shared contracts remain compatible.
- Relevant non-DB tests pass.
- Production build passes.
- Biome and `git diff --check` pass for the touched scope.
- No unrelated files or existing user changes are modified.

If zero-error root typecheck cannot be achieved without PostgreSQL, a migration, or a dependency change, stop at the smallest proven blocker. Do not fake completion.

## Documentation

Update `docs/progress-tracker.md` only if it already records the five API type errors. Change only the corresponding status/evidence line; do not rewrite unrelated progress history.

Do not create a new large report for this small task unless repository instructions require it.

## Final response format

Return:

1. The root cause of the five errors, grouped when they share a cause.
2. The files changed and why.
3. Root and API typecheck results.
4. Tests and build results.
5. Biome and diff-check results.
6. Tests not run because PostgreSQL is unavailable.
7. Confirmation that dependency files and eval behavior were unchanged.

Lead with whether the root typecheck is now clean.
