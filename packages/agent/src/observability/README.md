# Runtime observability

Flemme runtime observability covers Recommendation, Pre-Cooking, Active
Cooking, and Completion through one strict operational event contract. Bun
never imports the Node-only Lens SDK and never reads Lens credentials.

```text
Bun cooking runtime
  -> strict allowlisted event
  -> bounded loopback HTTP delivery
  -> isolated Node 24 relay
  -> official Lens observer
```

Defaults are safe and inactive:

```text
FLEMME_OBSERVABILITY_ENABLED=false
FLEMME_OBSERVABILITY_SAMPLE_RATE=0
```

The observer uses deterministic trace-ID sampling, accepts only loopback relay
URLs, permits at most 16 pending non-blocking deliveries, applies a bounded
timeout, and has no retry or persistent queue. Recording failures are fail-open
and cannot replace a phase result or its original error. Normal API startup has
no global signal handler or mandatory Lens dependency.

The closed phase mapping is defined in
`recommendation-observability.ts`. Despite the historical filename retained for
compatibility, it is the shared four-phase contract. Every phase has a fixed
trace name, agent span name, operation, prompt version, and input/output schema
version. Active Cooking alone may report the safe `model` or `local` execution
path. Unknown fields and mismatched identities are rejected.

Only operational identifiers, status, sanitized error codes, durations,
naturally returned token counts, sampling state, optional release, and the
dedicated synthetic-canary marker are allowed. Prompts, inputs, outputs,
messages, plans, ingredients, equipment, household/preferences, actions,
progress, identities, headers, credentials, environment dumps, raw exceptions,
and arbitrary metadata are forbidden.

The local four-phase canary command and Lens verification evidence are
documented in the
[four-phase runtime report](../../../../docs/evals/flemme-four-phase-runtime-observability-canary-report.md).
