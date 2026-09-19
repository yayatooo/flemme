# Codex Task — Flemme Recommendation Runtime Observability Canary

## Objective

Implement and validate a privacy-safe runtime observability canary for the Flemme **Recommendation** phase only.

The canary must prove that one real, synthetic Recommendation execution can produce a trace visible in local Anvia Lens without changing the output, reliability, or Bun runtime of Flemme.

This is not a full observability rollout and not a deployment task.

## Confirmed starting state

- The Lens UI manual confirmation gate has passed.
- Confirmed eval run:
  - suite: `flemme.eval.smoke.recommendation`;
  - run ID: `64f5af35-27a7-4bc3-b39f-42c1e9af1c91`;
  - status: completed;
  - cases: 1;
  - pass rate: 100%;
  - environment: local;
  - stored payload: `null`.
- Lens server is pinned to `v0.13.0`.
- `@anvia/lens` is pinned to `1.2.0` only inside `tools/lens-eval-smoke`.
- Lens SDK requires Node.js 24+.
- Main Flemme runtime and workspace remain Bun-based.
- Current repository verification is green:
  - 494 tests pass;
  - root typecheck passes for 7/7 workspaces;
  - production build passes.
- Runtime tracing is not currently enabled.
- Production deployment has not started.

## Core decision boundary

Do not assume that `@anvia/lens` can be imported into a Bun production workspace merely because the isolated Node 24 eval smoke test succeeded.

Before implementation, determine the smallest officially supported topology for sending runtime traces from the current Bun-based Recommendation execution to Lens.

Evaluate candidates in this order:

1. An official Anvia observer/exporter that is explicitly compatible with the repository's Bun version and Lens `v0.13.0`.
2. An official OpenTelemetry path supported by both the Bun runtime and Lens without importing `@anvia/lens` into the Bun application.
3. A small isolated Node 24 relay using the existing official `@anvia/lens` SDK, only if the first two options are unsupported.

Do not build a custom implementation of Lens's ingestion protocol.

If a Node 24 relay is required, its internal input contract may be Flemme-owned, but all communication from the relay to Lens must use the official Lens SDK. Document why the relay is necessary.

## Required execution order

### Stage 1 — Repository and runtime audit

1. Read all applicable `AGENTS.md` files.
2. Read:
   - `tools/lens-eval-smoke/README.md`;
   - its source, tests, `package.json`, and lockfile;
   - `infra/lens-local/README.md`;
   - `infra/lens-local/compose.yml`;
   - the relevant eval and observability reports under `docs/evals`;
   - `docs/progress-tracker.md`.
3. Locate the complete Recommendation execution path from API/runner entrypoint through prompt creation, model invocation, schema validation, and returned result.
4. Identify existing timing, token usage, model metadata, retry/error information, request IDs, and phase/version constants already available without exposing content.
5. Identify all application startup and shutdown boundaries relevant to clean observer flush behavior.

Do not modify code during this audit stage.

### Stage 2 — Verify the supported integration topology

Use authoritative sources in this order:

1. Installed package exports, type declarations, READMEs, and package metadata.
2. Official Anvia documentation.
3. Official source corresponding to the pinned versions.

Record:

- exact packages and versions;
- Bun and Node support statements;
- trace creation and flush APIs;
- failure behavior;
- payload/redaction controls;
- whether the integration can operate without raw prompt/output capture;
- whether Lens accepts an official OTLP/observer path for this version.

Select the first supported topology from the core decision boundary. Do not select a relay merely because it is easy to prototype.

If no supported topology satisfies the privacy and runtime constraints, stop with a written compatibility decision. Do not force an integration.

### Stage 3 — Define the Flemme runtime trace contract

Create a narrow typed contract for Recommendation observability. Use an explicit allowlist.

Allowed fields:

- generated trace ID with no embedded user or session information;
- trace name, fixed as `flemme.runtime.recommendation`;
- service name;
- environment;
- phase: `recommendation`;
- prompt version;
- input schema version;
- output schema version;
- model identifier;
- result variant such as recommendation, clarification, or no-viable;
- success/failure status;
- safe error category/code;
- total duration;
- model duration when already measurable;
- retry count when already available;
- input/output token counts only when returned structurally by the provider;
- sampling decision;
- release/commit identifier only when explicitly configured.

Forbidden fields:

- raw prompt or system instructions;
- raw input or output;
- user message;
- inventory or ingredient names;
- equipment;
- household composition;
- preferences;
- servings or available time when tied to a request;
- cooking plan or recipe content;
- user ID, email, cookie, IP address, authorization header, or session token;
- database IDs;
- API keys or environment dumps;
- stack traces or exception objects containing request/provider data.

Unknown keys must be rejected or dropped. Do not serialize arbitrary metadata bags.

### Stage 4 — Implement opt-in configuration

Runtime observability must be disabled by default.

Use explicit configuration with equivalent semantics to:

```text
FLEMME_OBSERVABILITY_ENABLED=false
FLEMME_OBSERVABILITY_SAMPLE_RATE=0
```

Requirements:

- disabled or missing configuration produces a no-op observer;
- invalid values fail during observability initialization without exposing secrets;
- normal application operation must not require Lens credentials when disabled;
- the Bun application must not read Lens ingestion credentials if an isolated relay owns them;
- examples contain variable names and safe defaults only;
- do not move Lens credentials into the root `.env` merely for convenience.

For the local canary, enable tracing only through an explicit command or canary-specific environment configuration. Do not change the repository default to enabled.

### Stage 5 — Implement the smallest canary instrumentation

Instrument Recommendation only.

The instrumentation must:

1. Generate a non-identifying trace ID.
2. Start timing immediately around the Recommendation runtime boundary.
3. Record only the typed safe trace contract.
4. Preserve the exact existing Recommendation return value and errors.
5. Never make trace success a prerequisite for cooking success.
6. Use bounded, non-blocking or asynchronously flushed delivery appropriate to the selected official topology.
7. Flush cleanly in the dedicated canary command.
8. Avoid process-wide handlers that interfere with the application.

Do not instrument Pre-Cooking, Active Cooking, Completion, API middleware, database queries, authentication, web, or mobile in this task.

### Stage 6 — Failure isolation

Observability must be fail-open from the cooking application's perspective.

Prove that Recommendation still behaves identically when:

- Lens is unavailable;
- credentials are missing while observability is disabled;
- the exporter/relay times out;
- the exporter rejects an event;
- flush fails during shutdown;
- sampling excludes the trace.

Telemetry failures may emit one sanitized local diagnostic code, but must not include request content, provider payloads, or credentials.

Do not add unbounded retries, persistent queues, or a general event bus for this canary.

### Stage 7 — Automated tests

Add focused deterministic tests for:

- disabled-by-default behavior;
- sample rate zero;
- deterministic sampling behavior if supported by the chosen design;
- trace contract allowlisting;
- rejection/removal of forbidden fields;
- no raw input/output capture;
- success trace serialization;
- sanitized error trace serialization;
- unavailable Lens/exporter fail-open behavior;
- timeout fail-open behavior;
- Recommendation result equality with observability enabled versus disabled;
- Recommendation error semantics remaining unchanged;
- no accidental instrumentation of the other three phases.

Tests must not require live Lens, real provider credentials, or network access unless explicitly marked as a manual/local integration test.

### Stage 8 — Local runtime canary

Add one explicit local command that:

1. Verifies Lens readiness.
2. Enables Recommendation observability for this command only.
3. Runs one clearly synthetic Recommendation fixture through the real runtime boundary.
4. Sends one metadata-only runtime trace.
5. Flushes and closes cleanly.
6. Prints a safe trace ID and timestamp for manual lookup.
7. Exits non-zero if the trace cannot be delivered during this dedicated canary.

The synthetic request may exercise the real prompt/model runtime only if the required provider credentials are already configured for normal Flemme development. Never print them or copy them into Lens configuration.

If a live model call would make the canary flaky or expensive, use the repository's supported deterministic/fake model at the real Recommendation orchestration boundary. Clearly label whether the trace represents a fake-model or live-model canary.

Runtime traces must be inspected under Lens **Traces**, not `Evaluations → Runs`.

### Stage 9 — Verification

Run, at minimum:

1. New focused observability tests.
2. Recommendation tests.
3. Agent tests.
4. API non-DB tests relevant to Recommendation.
5. Full repository tests.
6. Root typecheck.
7. Any isolated package/relay typecheck.
8. Production build.
9. Scoped Biome checks.
10. Frozen installs/lockfile checks for every modified dependency boundary.
11. `git diff --check`.
12. Secret-leak scan over tracked and unignored candidate files.
13. Lens service health and readiness.
14. The one-trace local canary.

After emission, report the safe trace name, trace ID, timestamp, topology, and whether the canary used a fake or live model.

Mark the runtime observability state as:

```text
AWAITING_MANUAL_RUNTIME_TRACE_CONFIRMATION
```

Do not claim UI verification. The user must inspect the trace manually.

### Stage 10 — Documentation

Document:

- the selected topology and rejected alternatives;
- why it preserves the Bun/Node 24 boundary;
- configuration names and safe defaults;
- exact canary command;
- safe telemetry field allowlist;
- excluded fields;
- sampling behavior;
- fail-open behavior;
- flush/shutdown behavior;
- local startup order;
- how to locate the canary trace in Lens;
- how to disable observability immediately;
- known limitations before deployment.

Update `docs/progress-tracker.md` accurately:

- Eval foundation: complete.
- Lens infrastructure: complete locally.
- Lens eval ingestion: complete and manually confirmed.
- Recommendation runtime observability: `awaiting_manual_runtime_trace_confirmation` after successful emission.
- Other phases: not instrumented.
- Production deployment: not started.

## Scope constraints

### Allowed

- Add a narrow typed Recommendation observability boundary.
- Add minimal official observer/exporter dependencies supported by the chosen topology.
- Extend the isolated Node 24 tooling only when the audit proves it is necessary.
- Add focused unit tests and one local canary command.
- Update relevant examples and documentation.
- Make required lockfile changes within the selected dependency boundary.

### Forbidden

- Do not enable observability by default.
- Do not instrument phases other than Recommendation.
- Do not capture or send raw prompt/input/output content.
- Do not capture user/session/database identifiers.
- Do not import a Node-24-only package into the Bun production runtime without verified Bun support.
- Do not migrate the main runtime from Bun to Node.
- Do not build a custom Lens ingestion client/protocol.
- Do not add an unbounded queue, event bus, or generalized telemetry platform.
- Do not expose Lens or any relay outside loopback during local development.
- Do not touch the existing application PostgreSQL service or its data.
- Do not deploy Lens or Flemme.
- Do not commit or push.
- Do not use `any`, TypeScript suppressions, blanket lint suppressions, or `skipLibCheck`.

## Stop conditions

Stop safely and report the exact blocker if:

- the integration requires raw payload capture;
- no official supported path exists for the current Bun/Node/Lens versions;
- the only path would couple Recommendation success to Lens availability;
- SDK/exporter installation breaks the root workspace or lockfile boundary;
- a credential or forbidden field appears in logs, traces, snapshots, tracked files, or diff output;
- existing Recommendation output or error semantics change;
- Lens or its required local services are unhealthy.

Do not broaden scope to bypass a stop condition.

## Required final report

Return:

1. Selected topology and supporting compatibility evidence.
2. Rejected alternatives and why.
3. Files changed.
4. Dependency and lockfile changes.
5. Runtime configuration and default state.
6. Exact canary command.
7. Safe trace name, trace ID, timestamp, and model mode.
8. Confirmed telemetry fields and excluded fields.
9. Failure-isolation test results.
10. Full test, typecheck, build, formatting, and diff-check results.
11. Secret-leak scan result.
12. Manual Lens UI confirmation status.
13. Remaining limitations before deployment.
14. Confirmation that other phases and deployment were not started.

## Acceptance criteria

This task is complete only when:

- one synthetic Recommendation execution produces one metadata-only runtime trace in local Lens;
- the trace is disabled by default and explicitly enabled only for the canary;
- Recommendation results and errors remain identical with observability enabled or disabled;
- Lens/exporter failure cannot fail the cooking operation;
- no raw content or user-identifying data is captured;
- Bun remains the main Flemme runtime;
- the full repository remains green;
- the result is marked `AWAITING_MANUAL_RUNTIME_TRACE_CONFIRMATION` for manual inspection under Lens Traces.
