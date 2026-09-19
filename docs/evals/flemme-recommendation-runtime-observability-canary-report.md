# Flemme Recommendation Runtime Observability Canary

Status: `AWAITING_MANUAL_RUNTIME_TRACE_CONFIRMATION`

## Outcome

One synthetic Recommendation execution crossed the real Flemme Recommendation
runtime boundary under Bun, produced a metadata-only trace, and was delivered
to local Lens through an isolated Node 24 relay.

- Trace name: `flemme.runtime.recommendation`
- Trace ID: `55fdda8f362fe93ac0b3f3460fcad3f2`
- Root observation ID: `ecf26debfe921b0f`
- Emitted at: `2026-09-19T13:20:36.831Z`
- Model mode: deterministic fake model (`synthetic-static-v1`)
- Lens server: `v0.13.0`
- Lens SDK: `@anvia/lens@1.2.0`
- Anvia Core: `@anvia/core@1.5.0`
- Relay runtime: Node `v24.15.0`
- Flemme runtime and package manager: Bun `1.2.20`

The command reported successful ingestion and flush. Lens API returned HTTP 200
for the OTLP batch and the official worker recorded one ingested span. This
report does not claim authenticated trace-read or UI verification; an owner
must inspect the record under **Traces**.

## Lifecycle correction

Manual inspection of the original trace
`0e028dfcac2f4e7caa1b4b7d655745e5` found a Running trace summary above a
successful `agent.flemme-recommendation` span. The relay had passed Flemme's
random contract ID as `trace.traceId`. In official `@anvia/otel` code used by
`@anvia/lens@1.2.0`, that field means “continue a remote trace.” When
`parentObservationId` is absent, the SDK installs the synthetic parent span ID
`0000000000000001`. Lens never receives that remote parent, so v0.13.0
materializes the trace summary as Running even though the Agent span ended.

The corrected relay does not set `trace.traceId` or `parentObservationId`.
Lens/OpenTelemetry creates the trace and its real root span, whose identifiers
are read from `run.trace`. The relay calls `run.end({ status: "completed", ... })`
before `lens.flush()`, then calls `lens.close()` before exiting. The SDK maps
that end call to OpenTelemetry status OK and invokes `root.end()`.

The regression test proves this exact order:

```text
startRun -> run.end(completed) -> lens.flush -> lens.close
```

It also proves that no remote-parent fields are supplied and that input,
output, text, messages, and history contain no captured content.

## Safe 43-field metadata inventory

Lens's span inspector exposes 43 leaf fields for this canary. They divide into
21 Lens/OpenTelemetry envelope fields and 22 allowlisted values supplied by the
Flemme relay through official SDK arguments.

Lens/OpenTelemetry-generated envelope fields (21):

- trace identity/timing: `traceId`, `spanId`, `parentSpanId`, `traceState`,
  `startTimeUnixNano`, `endTimeUnixNano`, `durationNano`;
- instrumentation: `serviceName`, `serviceVersion`, `scopeName`, `scopeVersion`,
  `kind`, `observationKind`, `environment`, `release`, `version`;
- resource: `service.name`, `deployment.environment.name`;
- containers/audit timing: `events`, `links`, `ingestedAt`.

Flemme-supplied allowlisted values mapped to SDK span attributes (22):

- lifecycle: `anvia.agent.name`, `anvia.run.max_turns`, `anvia.trace.name`,
  `anvia.run.id`, `anvia.run.status`;
- contract metadata: `anvia.trace.metadata.phase`,
  `anvia.trace.metadata.promptVersion`,
  `anvia.trace.metadata.inputSchemaVersion`,
  `anvia.trace.metadata.outputSchemaVersion`,
  `anvia.trace.metadata.modelIdentifier`, `anvia.trace.metadata.status`,
  `anvia.trace.metadata.totalDurationMs`,
  `anvia.trace.metadata.modelDurationMs`,
  `anvia.trace.metadata.inputTokens`, `anvia.trace.metadata.outputTokens`,
  `anvia.trace.metadata.samplingDecision`,
  `anvia.trace.metadata.resultVariant`;
- token counters: `anvia.usage.input_tokens`,
  `anvia.usage.output_tokens`, `anvia.usage.total_tokens`,
  `anvia.usage.cached_input_tokens`,
  `anvia.usage.cache_creation_input_tokens`.

The field names in the second group are produced by the official SDK, while
their values come only from Flemme's strict contract. The duplicated token
counts are numeric operational counters, not payloads. Input and output remain
null/uncaptured. No prompt, message, recipe, ingredient, equipment, household,
preference, serving/time constraint, user/session/database identifier, network
or auth data, credential, environment dump, exception object, or stack trace is
present in the supplied inventory.

The authenticated trace-read API is intentionally session-protected and
returned HTTP 401 without an owner session. No session credential or MCP read
token is available to this task, and no database query or record mutation was
used. Consequently the root summary and Agent span are expected to be `ok`
from the ended root exported by the SDK, but their Lens-stored terminal statuses
remain a manual authenticated confirmation checkpoint.

In the corrected topology, `agent.flemme-recommendation` is the sole real root
span (`parentSpanId: null`). Lens's trace summary is the trace-level row the UI
shows above that span; the provisional missing-parent node seen in the original
trace is no longer created.

## Topology decision

The selected topology is an ephemeral loopback Node 24 relay in the existing
`tools/lens-eval-smoke` isolation boundary:

```text
Bun Recommendation runtime
  -> strict Flemme metadata contract
  -> ephemeral 127.0.0.1 relay
  -> official @anvia/lens observer
  -> Lens v0.13.0 official OTLP trace endpoint
```

The relay is necessary because:

1. `@anvia/lens@1.2.0` describes itself as Lens tracing for Node.js
   applications, declares `node >=24`, owns Node OpenTelemetry providers, and
   exposes `observer()`, `flush()`, and `close()`. It is not imported into a Bun
   workspace.
2. `@anvia/otel@1.2.0` delegates SDK setup and shutdown to the application and
   documents `@opentelemetry/sdk-node` for OTLP HTTP. Its metadata and README do
   not explicitly support Bun. Bun documents broad Node compatibility but still
   identifies incomplete `node:async_hooks` behavior. That is insufficient
   evidence for a supported in-process production tracing path.
3. Lens v0.13.0 accepts the official OTLP endpoints used by the pinned Lens SDK.
   The relay does not implement that protocol; all relay-to-Lens communication
   goes through the official SDK.

The direct Lens SDK and in-process OpenTelemetry alternatives were therefore
rejected rather than inferred safe from generic compatibility claims.

## Runtime boundary

The existing path is:

```text
apps/api/index.ts
  -> runCookingAgent
  -> createCookingRecommendationPrompt + COOKING_INSTRUCTIONS
  -> generateCompletion
  -> CookingRecommendationOutputSchema validation
  -> exact CookingRecommendationOutput return
```

Only `runCookingAgent` accepts the observer. Pre-Cooking, Active Cooking, and
Completion retain their existing signatures and contain no new instrumentation.
The direct-completion result already exposes provider-normalized usage, so
successful traces include input/output token counts. Model duration is measured
around `generateCompletion`. Retry count is omitted because the current call
does not surface it. Failure traces omit token and model-duration fields because
the provider did not return them.

Application startup is `apps/api/index.ts`; it reads only
`FLEMME_OBSERVABILITY_*` configuration and constructs a no-op observer by
default. The current Bun server has no application-owned graceful shutdown
boundary. Normal delivery is therefore best-effort and non-blocking. The
dedicated canary owns a complete lifecycle: start relay, run Recommendation,
flush Bun-to-relay delivery, flush and close Lens, and stop the relay. No
process-wide signal handler was added.

## Configuration and privacy

Safe defaults are:

```text
FLEMME_OBSERVABILITY_ENABLED=false
FLEMME_OBSERVABILITY_SAMPLE_RATE=0
```

Optional runtime names are
`FLEMME_OBSERVABILITY_RELAY_URL`,
`FLEMME_OBSERVABILITY_SERVICE_NAME`,
`FLEMME_OBSERVABILITY_ENVIRONMENT`,
`FLEMME_OBSERVABILITY_TIMEOUT_MS`, and
`FLEMME_OBSERVABILITY_RELEASE`. An enabled sampled observer requires an exact
loopback HTTP URL ending in `/v1/recommendation-traces`. Invalid values fail
during observability initialization. The Bun process never reads Lens keys;
the canary removes `ANVIA_LENS_*` variables before spawning Bun.

The strict trace contract allows:

- random 32-hex trace ID and fixed trace name;
- service, environment, and fixed Recommendation phase;
- prompt, input-schema, and output-schema versions;
- model identifier;
- success/failure and output variant or fixed sanitized error code;
- total duration and, on success, measured model duration;
- input/output tokens only when structurally returned by the provider;
- sampling decision and optional explicitly configured release.

It rejects unknown keys and excludes prompt/instructions, raw input/output,
messages, inventory, ingredients, equipment, household data, preferences,
servings/time constraints, cooking content, user/session/database identifiers,
network/auth data, credentials, environment dumps, provider errors, exception
objects, stack traces, and arbitrary metadata bags. The Lens observer also uses
safe capture with input, output, error, and metadata redaction enabled.

## Sampling and failure isolation

Sampling uses the first 32 bits of the random trace ID, so a given ID always
produces the same decision. Zero always excludes and one always includes. The
canary overrides the default to one only in its child environment.

Normal delivery is fail-open. It uses at most 16 concurrent in-memory requests,
a bounded timeout, no retry, no persistent queue, and sanitized local diagnostic
codes. Record, timeout, unavailable-relay, rejected-event, sampling exclusion,
and later flush failures cannot replace the Recommendation result or error.
The explicit canary flush intentionally exits non-zero on delivery failure.

## Commands

Start Lens using the infrastructure command documented in
`infra/lens-local/README.md`, then run:

```sh
bun install --cwd tools/lens-eval-smoke --frozen-lockfile
bun run --cwd tools/lens-eval-smoke test
bun run --cwd tools/lens-eval-smoke typecheck
bun run --cwd tools/lens-eval-smoke canary:runtime
```

The last command loads Lens credentials only from the ignored
`infra/lens-local/.env.flemme-agent` file. To disable immediately, unset the
`FLEMME_OBSERVABILITY_*` variables or restore enabled `false` and sample rate
`0`.

## Verification checkpoint

Automated focused verification covers default-off behavior, zero and
deterministic sampling, contract allowlisting, forbidden-field rejection,
metadata-only success and sanitized failure serialization, unavailable/rejected
and timed-out relay behavior, result equality, unchanged error identity, and
absence of observability parameters on the other phase boundaries.

Final automated results:

- focused observability tests: 15/15;
- complete Agent package tests: 82/82;
- isolated Node-tool tests: 8/8;
- Recommendation API integration tests: 10/10;
- full repository tests: 511/511 with 2,374 expectations;
- root typecheck: 7/7 workspaces;
- isolated Node-tool typecheck: passed;
- production build: passed;
- scoped Biome and frozen Bun installs: passed.

The integration suites used a task-owned PostgreSQL 16 container on
`127.0.0.1:55433` with an explicit test database. All committed migrations and
the canonical development seed prerequisite applied successfully. No database
or application change was required.

Manual remaining step:

1. Open `http://127.0.0.1:18080`.
2. Select `Flemme Local` and open **Traces** (not Evaluations).
3. Search for trace ID `55fdda8f362fe93ac0b3f3460fcad3f2` or trace name
   `flemme.runtime.recommendation`.
4. Confirm the trace summary and `agent.flemme-recommendation` span both show a
   terminal success/OK state.
5. Confirm that only the documented 43 safe operational fields are present and
   prompt/input/output payloads are absent.

## Limitations before deployment

- Authenticated Lens trace-read/manual inspection is pending.
- API shutdown does not yet flush pending best-effort deliveries.
- The relay is a local canary tool, not a deployed sidecar or service.
- No production sampling/release policy has been approved.
- Only Recommendation is instrumented.
- Production deployment has not started.
