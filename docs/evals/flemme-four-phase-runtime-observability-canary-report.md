# Flemme four-phase runtime observability canary report

Execution date: 2026-09-20.

## Result

The local four-phase runtime canary completed successfully through the existing
Bun-to-Node isolation boundary. It used three deterministic fake-model calls
and one deterministic local Active Cooking scope response. It made zero live
target-model calls, zero qualitative-judge calls, and zero eval-ingestion calls.

| Phase | Trace name | Agent observation | Trace ID | Root observation ID |
| --- | --- | --- | --- | --- |
| Recommendation | `flemme.runtime.recommendation` | `agent.flemme-recommendation` | `334e4932368be0cd8dd8d710e248b2b2` | `c919d9ff6313ea0f` |
| Pre-Cooking | `flemme.runtime.pre-cooking` | `agent.flemme-pre-cooking` | `574d9a9d001a4c0e80a74daf6d319fdb` | `49a4744c502665f7` |
| Active Cooking | `flemme.runtime.active-cooking` | `agent.flemme-active-cooking` | `1b90d021adfbf4544445b9e4e431301b` | `977290f59c1740cc` |
| Completion | `flemme.runtime.completion` | `agent.flemme-completion` | `b5b49845952a5532886187516988f8e9` | `2ead4f1db9b83ce6` |

The command was executed exactly once:

```sh
bun run --cwd tools/lens-eval-smoke canary:runtime:four-phase
```

The boundary used Bun 1.2.20 for Flemme execution, Node 24.15.0 for the relay,
`@anvia/lens` 1.2.0, `@anvia/core` 1.5.0, and Lens server v0.13.0.

## Architecture and lifecycle

```text
Bun phase runtime
  -> strict four-phase operational event
  -> bounded non-blocking loopback delivery
  -> isolated Node 24 relay
  -> official @anvia/lens observer
  -> Lens v0.13.0
```

The shared contract accepts only Recommendation, Pre-Cooking, Active Cooking,
and Completion. Each phase is bound to one fixed trace name, agent span name,
operation name, prompt version, and schema versions. Active Cooking additionally
uses the safe `model` or `local` execution-path enum. Unknown fields, phases,
names, mappings, enum values, and unsafe identifier values are rejected before
delivery.

Lens generates the real trace and root observation IDs. Flemme's correlation
ID is used only as the run ID and is never supplied as a remote trace parent.
Each run ends explicitly, its root observation ends before flush, Lens flushes
before close, and no synthetic missing parent is created.

The original single-phase Recommendation canary command and stable names remain
available for backward compatibility. Normal runtime behavior remains disabled
by default with sample rate zero. Delivery remains loopback-only, capped at 16
pending requests, bounded by timeout, non-blocking, fail-open, without retry or
persistent queue, and without global signal handlers.

## Privacy verification

The event contains only fixed phase/operation/version identities, safe service
and environment labels, model identifier, status, sanitized error code or safe
result variant, durations, naturally returned token counts, sampling decision,
optional release, the synthetic-canary marker, and Active Cooking's safe
execution-path enum.

Prompts, messages, inputs, outputs, cooking plans, ingredients, equipment,
household data, preferences, actions, progress, user/session identity, headers,
credentials, connection strings, environment dumps, exception messages, and
stacks are excluded. The Bun child receives no `ANVIA_LENS_*` variables. Lens
safe capture and all four redaction controls remain enabled.

ClickHouse readback for the four exact trace IDs found:

- four terminal `ok` trace summaries;
- four spans total and one root agent observation per trace;
- four absent parent span IDs;
- four null inputs and four null outputs;
- four null user IDs and four null session IDs;
- no payload field in the stored span schema;
- zero credential-candidate attribute hits;
- only official SDK envelope keys and the documented Flemme metadata allowlist.

## Verification

- focused observability tests: 23/23;
- Agent package tests: 94/94;
- isolated Node relay/tool tests: 16/16;
- focused four-phase API integration tests: 46/46;
- full repository tests: 531/531 with 2,422 expectations;
- root typecheck: 7/7 workspaces;
- isolated Node tool typecheck: passed;
- production build: passed;
- scoped Biome, frozen root and isolated installs, and `git diff --check`: passed;
- changed-file credential-candidate scan: zero.

Database-backed tests used an isolated temporary PostgreSQL 16 container on
loopback port 32770 with tmpfs storage. It was removed after verification. The existing
`flemme-postgres` container and its volume remained untouched and healthy.

## Manual verification and remaining work

The four trace IDs in the table above were manually confirmed in the local Lens
UI. Each trace summary and its single agent observation were successful and
contained no input/output content.

Production deployment has not started. A deployed relay/sidecar lifecycle,
production sampling and release policy, authentication and network boundary,
and application-owned shutdown flush remain separate deployment work.
