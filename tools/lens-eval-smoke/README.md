# Flemme Lens eval ingestion smoke

This Node 24-only package emits synthetic, deterministic eval and runtime
canaries to the local Lens instance. It is outside Flemme's Bun workspaces. The
runtime canary imports only Flemme's strict metadata contract; the Node-only
Lens SDK is never imported by Flemme application or Agent runtime code.

The verified pair is `@anvia/lens` 1.2.0 with `@anvia/core` 1.5.0 against Lens
server v0.13.0. Lens SDK 1.2.0 peers with Core `^1.4.0`, requires Node `>=24`,
and sends eval records to the server's authenticated OTLP logs endpoint. The
reporter is configured with `includePayloads: false`, `includeMetadata: true`,
safe redaction, and `onMissingTrace: "emit"`. This creates an eval run without
enabling Agent or application runtime tracing.

Install dependencies with Bun from the repository root:

```sh
bun install --cwd tools/lens-eval-smoke --frozen-lockfile
```

Run the offline privacy and configuration tests:

```sh
bun run --cwd tools/lens-eval-smoke test
```

Run the one-case smoke test:

```sh
bun run --cwd tools/lens-eval-smoke smoke
```

Run the four-phase ingestion smoke:

```sh
bun run --cwd tools/lens-eval-smoke smoke:four-phase
```

The smoke command executes with Node 24 and loads only
`infra/lens-local/.env.flemme-agent` through Node's explicit `--env-file`
option. It validates all required variable names without printing values,
checks `http://127.0.0.1:18080/health/ready`, emits one run named
`flemme.eval.smoke.recommendation`, flushes, and closes the official Lens SDK.
Configuration, readiness, reporting, flush, or shutdown failure produces a
non-zero exit and a safe error category without printing the exception payload.
The four-phase command preserves that Recommendation identity and adds one
separate one-case run for Pre-Cooking, Active Cooking, and Completion. It emits
exactly four static synthetic cases and four passing deterministic metrics,
then performs one flush and closes the SDK. It does not call a target model,
qualitative judge, Lens runtime observer, or Flemme production runtime.

The four stable run identities are:

| Phase | Suite | Case | Metric |
| --- | --- | --- | --- |
| Recommendation | `flemme.eval.smoke.recommendation` | `flemme-synthetic-recommendation-001` | `flemme-synthetic-contract` |
| Pre-Cooking | `flemme.eval.smoke.pre-cooking` | `flemme-synthetic-pre-cooking-001` | `flemme-synthetic-contract` |
| Active Cooking | `flemme.eval.smoke.active-cooking` | `flemme-synthetic-active-cooking-001` | `flemme-synthetic-contract` |
| Completion | `flemme.eval.smoke.completion` | `flemme-synthetic-completion-001` | `flemme-synthetic-contract` |

## Privacy contract

Allowed metadata is limited to phase, intent, prompt/schema/eval-suite versions,
synthetic case ID, metric name, runtime, environment, and model identifier.
The reporter sets `includePayloads: false`, so eval input, expected value, and
output are not emitted. Raw prompts, responses, user/account identifiers,
inventory, household context, preferences, cooking plans, credentials, headers,
cookies, connection strings, environment dumps, and exception objects are not
allowed.

Every case uses the synthetic input/output markers
`synthetic-input-redacted` and `synthetic-output-redacted` and the deterministic
metric `flemme-synthetic-contract`. No provider or production Flemme code runs.

## Find or remove the smoke record

Open `http://127.0.0.1:18080`, select `Flemme Local`, then open **Evaluations** →
**Runs**. Search for `flemme.eval.smoke.recommendation` or the safe run ID printed
by the command. After manual verification, an owner can open that run, choose
**Delete**, and confirm deletion. Delete only the matching synthetic run.

For a four-phase smoke, search separately for each suite listed above or for
each run ID printed by `smoke:four-phase`. The SDK creates four independent
one-case runs, one per stable phase identity.

## Runtime trace canaries

The runtime canary keeps Flemme execution on Bun and starts an ephemeral HTTP
relay bound to `127.0.0.1` on an operating-system-selected port. The Bun child
process receives only `FLEMME_OBSERVABILITY_*` values; every
`ANVIA_LENS_*` variable is removed from its environment. The relay strictly
validates the Flemme-owned metadata contract, uses the official
`@anvia/lens@1.2.0` observer outbound, then flushes and closes the SDK.

Start Lens first, then run exactly one deterministic fake-model Recommendation
through the real prompt creation, completion, schema-validation, and runtime
return boundary:

```sh
bun install --cwd tools/lens-eval-smoke --frozen-lockfile
bun run --cwd tools/lens-eval-smoke canary:runtime
```

The Recommendation command and its stable identifiers remain unchanged. To run
one deterministic trace for every cooking phase through one relay lifecycle:

```sh
bun run --cwd tools/lens-eval-smoke canary:runtime:four-phase
```

The four-phase command uses deterministic fake models for Recommendation,
Pre-Cooking, and Completion plus the deterministic local Active Cooking scope
path. It makes no provider, judge, or eval-ingestion call. It emits exactly one
trace named `flemme.runtime.recommendation`, `flemme.runtime.pre-cooking`,
`flemme.runtime.active-cooking`, and `flemme.runtime.completion`, then flushes
and closes the shared Node 24 Lens client.

The command checks Lens readiness, enables tracing and 100% sampling for its
child process only, sends one trace named `flemme.runtime.recommendation`, and
prints only its safe trace ID, emission timestamp, and model mode. Delivery or
flush failure exits non-zero. Open `http://127.0.0.1:18080`, select
`Flemme Local`, open **Traces**, and search for the printed trace ID or trace
name. Do not look under Evaluations for this record.

The relay deliberately does not pass Flemme's contract/correlation trace ID as
`trace.traceId` to the Lens observer. In Lens SDK 1.2.0 that property means
“continue this remote trace”; without a real parent observation ID, the SDK
creates a synthetic remote parent that Lens cannot receive. The relay instead
uses the observer-created trace ID printed by the command, calls `run.end()` (or
`run.error()`) explicitly, then flushes, closes, and exits in that order.

Normal repository defaults remain:

```text
FLEMME_OBSERVABILITY_ENABLED=false
FLEMME_OBSERVABILITY_SAMPLE_RATE=0
```

To disable observability immediately, unset all `FLEMME_OBSERVABILITY_*`
variables or restore those two defaults. Lens credentials remain only in the
ignored `infra/lens-local/.env.flemme-agent` file.

The runtime allowlist contains only a random trace ID, fixed phase/trace/span
and operation identities, service/environment, prompt/input/output schema
versions, model identifier, safe execution path, output variant or sanitized
error code, durations, provider-returned token counts, sampling decision,
synthetic-canary marker, and an explicitly configured release. Unknown keys and
mismatched phase identities are rejected. Prompts, instructions, input/output,
inventory, equipment, household data, preferences, request constraints,
recipes, plans, actions, progress, user/session/database identifiers,
credentials, headers, environment dumps, stack traces, and arbitrary metadata
are excluded.

Normal API delivery is fail-open, bounded to 16 in-flight loopback requests,
and has no retry or persistent queue. A sanitized diagnostic code may be
written locally. The dedicated canary explicitly flushes and fails closed so it
can prove delivery. Production rollout remains blocked on manual Lens UI
confirmation and a deliberate API shutdown/flush design.
