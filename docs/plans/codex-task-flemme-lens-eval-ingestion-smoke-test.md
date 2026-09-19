# Codex Task — Flemme Lens Eval Ingestion Smoke Test

## Objective

Prove that one bounded, synthetic Flemme evaluation result can be sent to the existing local Anvia Lens instance and inspected in its UI.

This task establishes only the **eval-ingestion boundary**. Do not enable general runtime observability yet.

## Current verified state

- Flemme uses Bun for its main workspace and application runtime.
- `@anvia/core` is locked at `1.5.0`.
- The OpenAI adapter is locked at `1.1.5`.
- Zod is locked at `4.6.5`.
- Evaluation baseline is green:
  - 24/24 deterministic cases.
  - 102/102 deterministic metric evaluations.
  - 4/4 qualitative cases and 5/5 qualitative metrics.
- Full repository verification is green:
  - 488/488 tests.
  - 7/7 workspaces typecheck.
  - production build passes.
- Anvia Lens `v0.13.0` is already running locally through:
  - `infra/lens-local/compose.yml`
  - Compose project `flemme-lens-local`.
  - UI endpoint `http://127.0.0.1:18080`.
- Lens backend is isolated on Node 24.
- `infra/lens-local/.env` contains Lens infrastructure secrets.
- `infra/lens-local/.env.flemme-agent` is reserved for ingestion credentials.
- The two secret files are ignored and have mode `0600`.

## Manual prerequisite

Before implementation, confirm without printing values that `infra/lens-local/.env.flemme-agent` contains non-empty values for:

```text
ANVIA_LENS_BASE_URL
ANVIA_LENS_PUBLIC_KEY
ANVIA_LENS_SECRET_KEY
ANVIA_LENS_SERVICE_NAME
ANVIA_LENS_ENVIRONMENT
```

If the public or secret key is empty, stop and report exactly:

```text
BLOCKED_MANUAL_CHECKPOINT: Create the Flemme Local project and ingestion key in Lens, then populate infra/lens-local/.env.flemme-agent.
```

Never print, log, copy into documentation, or expose any secret value.

## Required execution order

### Stage 1 — Read repository instructions and audit the existing boundary

1. Read all applicable `AGENTS.md` files.
2. Read:
   - `infra/lens-local/README.md`
   - `infra/lens-local/compose.yml`
   - `infra/lens-local/.env.example`
   - `packages/agent/evals/README.md`
   - `docs/evals/flemme-evals-observability-implementation-report.md`
   - `docs/evals/flemme-eval-post-upgrade-comparison.md`
   - `docs/progress-tracker.md`
3. Locate all existing Lens-related code, scripts, documentation, dependencies, ignored paths, and unfinished scaffolding.
4. Record the current Bun and Node execution boundaries before making changes.

Do not assume an API from previous Anvia versions.

### Stage 2 — Verify the supported Lens SDK integration shape

Determine the exact integration API compatible with:

- Lens server `v0.13.0`.
- current locked `@anvia/core` version.
- the current Lens adapter/SDK stable version supported by official package documentation and installed type declarations.
- Node.js 24.

Use authoritative sources in this order:

1. Locally installed package exports, type declarations, README, and package metadata.
2. Official Anvia documentation.
3. The official `anvia-hq/lens` `v0.13.0` source/tag.

The Devscale `anvia-rag-evals` repository may be consulted only as a conceptual reference. Do not copy its old `0.x` API or `AgentBuilder` usage.

Document the verified API shape briefly. Do not write speculative code.

### Stage 3 — Preserve runtime isolation

Lens explicitly requires Node.js 24. The main Flemme application must remain Bun-based.

Implement the smallest maintainable Node 24 boundary for the smoke test. Prefer the repository's already documented isolation design if one exists.

Requirements:

- Do not change the package manager for the Flemme monorepo.
- Do not change the root runtime or engine to Node.
- Do not make normal Bun tests depend on a running Lens instance.
- Do not make application startup depend on Lens availability.
- Add only the minimum dependency and lockfile changes required by the verified SDK approach.
- Keep the integration replaceable behind a narrow boundary.
- If the official SDK cannot be installed without changing or breaking the Bun workspace, stop and document the exact incompatibility. Do not build a custom unofficial ingestion protocol.

### Stage 4 — Define a privacy-safe ingestion contract

Create an explicit allowlist for smoke-test telemetry. It may include only non-sensitive fields such as:

- trace/evaluation name;
- phase or intent name;
- prompt version;
- schema version;
- eval suite version;
- case ID using a synthetic identifier;
- metric name;
- pass/fail or numeric score;
- duration;
- token counts if naturally provided by the SDK;
- runtime/environment name;
- model identifier;
- error category without raw payload.

The smoke test must not send:

- real user IDs, emails, or account identifiers;
- raw user messages;
- inventory contents;
- household or family data;
- preferences;
- cooking-plan text;
- model prompt text;
- generated response text;
- API keys, headers, cookies, connection strings, or environment dumps;
- full exception objects that may contain request payloads.

Use an obviously synthetic case. Do not reuse a fixture containing realistic personal data.

### Stage 5 — Implement one-case smoke test

Implement one explicit command that:

1. Loads only `infra/lens-local/.env.flemme-agent` through an explicit path.
2. Validates required configuration without revealing values.
3. Checks Lens readiness.
4. Creates one trace/evaluation using a synthetic Flemme recommendation case.
5. Attaches at least one deterministic metric result.
6. Flushes and closes the SDK cleanly.
7. Exits non-zero on configuration, ingestion, flush, or SDK failure.
8. Prints only safe identifiers and status information.

Name the smoke data clearly so it can be found in Lens, for example:

```text
flemme.eval.smoke.recommendation
```

Do not run the complete 24-case suite for this checkpoint.

If the SDK requires input/output values, provide minimal synthetic constants such as `synthetic-input-redacted` and `synthetic-output-redacted`, or use omission/redaction capabilities supported by the verified SDK.

### Stage 6 — Add automated safety checks

Add focused tests that can run without Lens credentials or a live Lens server for:

- configuration validation;
- telemetry allowlisting/redaction;
- secret-bearing fields being rejected or removed;
- no raw input/output being included by default;
- deterministic serialization of safe metadata.

Do not weaken the tests to match accidental SDK output. Wrap the SDK boundary if needed so the privacy contract remains controlled by Flemme.

### Stage 7 — Execute and verify

Run, at minimum:

1. Lens Compose health/status checks.
2. The new isolated tests.
3. The one-case Lens smoke command.
4. Relevant package typecheck.
5. Root typecheck.
6. Relevant tests.
7. Production build.
8. Scoped Biome checks.
9. `git diff --check`.
10. A secret-leak scan over tracked and unignored candidate files.

After successful ingestion, report the safe trace/eval name and timestamp so the user can locate it manually in the Lens UI.

The task cannot claim UI verification. Mark the result as:

```text
AWAITING_MANUAL_LENS_UI_CONFIRMATION
```

until the user confirms the record appears correctly.

### Stage 8 — Documentation and progress state

Update the relevant documentation with:

- exact local smoke-test command;
- Node 24 boundary;
- required env variable names, never values;
- safe telemetry allowlist;
- fields intentionally excluded;
- failure and shutdown behavior;
- how to find the synthetic smoke record in Lens;
- how to remove only the synthetic smoke record if the Lens UI supports it;
- next step after manual confirmation.

Update `docs/progress-tracker.md` accurately:

- Eval foundation: complete.
- Lens infrastructure: complete locally.
- Lens eval ingestion: `awaiting_manual_ui_confirmation` after successful emission.
- Runtime observability: not started.
- Production deployment: not started.

## Scope constraints

### Allowed

- Add the minimum isolated Lens SDK dependency/configuration supported by verified docs.
- Add a narrow Lens eval reporter/client boundary.
- Add one synthetic smoke runner.
- Add privacy-focused unit tests.
- Update Lens/eval documentation and progress tracking.
- Modify lockfiles only when required by the chosen official integration.

### Forbidden

- Do not enable runtime tracing across recommendation, pre-cooking, active cooking, completion, API, or web requests.
- Do not send the full eval dataset.
- Do not capture raw prompts, outputs, inventory, household context, cooking plans, or user messages.
- Do not add Lens credentials to the root `.env`.
- Do not copy secret values into examples, tests, fixtures, snapshots, logs, or docs.
- Do not expose Lens beyond `127.0.0.1`.
- Do not alter the existing application PostgreSQL service or its volumes.
- Do not deploy Lens or Flemme.
- Do not commit or push.
- Do not bypass TLS or authentication checks for a future remote deployment.
- Do not use `any`, `@ts-ignore`, `@ts-expect-error`, blanket lint suppression, or `skipLibCheck` to force compatibility.
- Do not create a custom HTTP ingestion implementation when the official SDK is incompatible.

## Stop conditions

Stop safely and document the exact blocker if:

- ingestion credentials are absent;
- Lens is unhealthy;
- the official SDK and Lens server versions are incompatible;
- SDK installation would break the Bun workspace/runtime boundary;
- the only available integration requires sending raw prompt/output content;
- the SDK cannot flush reliably under Node 24;
- any secret appears in tracked files, logs, test snapshots, or diff output.

Do not broaden scope to work around a stop condition.

## Required final report

Return:

1. Verified Lens SDK/server compatibility and exact versions.
2. Files changed.
3. Dependency and lockfile changes, if any.
4. Exact safe command used for the smoke test.
5. The safe trace/eval name and timestamp.
6. Confirmation that no raw prompt/output or personal context was sent.
7. Test, typecheck, build, formatting, and diff-check results.
8. Secret-leak scan result.
9. Manual UI confirmation status.
10. Remaining blockers.
11. Explicit confirmation that runtime observability and deployment were not started.

## Acceptance criteria

This task is complete only when:

- one synthetic evaluation record is successfully ingested by local Lens;
- the Node 24 boundary remains isolated from the Bun application runtime;
- the telemetry privacy allowlist is enforced by tests;
- all required repository verification remains green;
- no secret is exposed;
- the result is marked `AWAITING_MANUAL_LENS_UI_CONFIRMATION` for the user to verify in Lens.
