# Agent module

`packages/agent` is the reusable AI capability for Flemme. It owns prompts,
input/output schemas, provider invocation, and output validation for the four
cooking phases. It does not own authentication, authorization, persistence, or
application side effects.

## Phase contracts

- **Recommendation** ranks one to three feasible options or returns a bounded
  clarification/no-viable variant. Inventory, equipment, household, preference,
  time, and current-request context remain explicit.
- **Pre-Cooking** generates an immutable plan faithful to the selected recipe,
  with required ingredients and equipment, preparation, stable step IDs,
  cooking stages, qualitative timing, and observable completion cues.
- **Active Cooking** uses the frozen plan and mutable progress to provide calm,
  safety-aware guidance. Its typed actions propose navigation, pause/resume,
  completion/abandonment, or a recorded ingredient, equipment, serving, or
  step change. It cannot persist or silently mutate progress.
- **Completion** produces a grounded summary and useful notes for a completed
  session. It has no action surface and does not mutate inventory or calculate
  nutrition.

Schemas enforce the public data contracts. Prompts express behavioral rules
that cannot be inferred from shape alone. Application code decides whether and
when a validated action or completion snapshot is persisted.

## Evaluation

The current suite covers all four phases with 26 synthetic live target-model
cases, 17 deterministic scoring metrics, and 121 passing metric evaluations.
The separately verified qualitative baseline contains four representative
cases and five judge metrics. Offline `eval:test` verifies metric behavior; it
must not be confused with live target-model execution.

The authoritative inventory and limitations are in the
[four-phase coverage audit](../evals/flemme-four-phase-eval-coverage-audit.md).
Commands and runner semantics are in
[`packages/agent/evals/README.md`](../../packages/agent/evals/README.md).

## Runtime observability

All four phase runtimes use one closed, strict operational event contract:

```text
Bun cooking runtime
  -> allowlisted non-blocking loopback event
  -> isolated Node 24 relay
  -> official @anvia/lens observer
  -> Lens
```

Observability is disabled by default and its default sample rate is zero.
Sampling is deterministic by trace ID. Delivery is loopback-only, bounded,
timed out, fail-open, and has no retry or persistent queue. Bun never imports
the Node-only Lens SDK or receives Lens credentials.

The allowlist contains fixed phase/operation/version identities, safe service
and environment labels, model/runtime identifiers, status, sanitized error
category, duration, naturally returned token counts, sampling decision,
optional release, the synthetic-canary flag, and the Active Cooking execution
path enum. It excludes prompts, inputs, outputs, plans, ingredients, equipment,
household or preference data, actions, progress, identities, headers,
credentials, connection strings, environment dumps, exception messages, and
stacks.

See the [runtime observability report](../evals/flemme-four-phase-runtime-observability-canary-report.md)
and the [component runbook](../../packages/agent/src/observability/README.md).
