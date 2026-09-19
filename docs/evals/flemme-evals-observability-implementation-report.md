# Flemme evals and observability implementation report

Execution dates: 2026-09-19 through 2026-09-20. The eval and provider-backed
work is complete. The isolated Lens boundary first ingested one payload-free
Recommendation record, which the owner manually confirmed in the Lens UI, and
later ingested a bounded four-phase payload-free smoke awaiting manual UI
confirmation.

| Stage | Status | Evidence | Remaining blocker |
| --- | --- | --- | --- |
| 0 — baseline | completed | Core capability smoke 1/1; existing Agent tests 62/62; locked versions reconfirmed | None |
| 1 — typecheck isolation | completed | Reinstalling the frozen Bun lock restored a truncated OpenAI declaration; Agent typecheck passes without suppression or version change | Root still has unrelated existing API errors |
| 2 — Recommendation foundation | completed | 10 typed cases, 6 hard metrics, live smoke 1/1 and 6/6 | Provider usage unavailable through public output-only intent |
| 3 — four live target-model phases with deterministic scoring | completed | Final combined result: 26/26 cases and 121/121 metric evaluations across 17 metrics; corrected targeted `active-resume` rerun passed 1/1 and 3/3 | Abort signals cannot enter current public intent APIs |
| 4 — locked baseline | completed | `flemme-eval-baseline-core-1.1.2.md` records versions, totals, latency, commands, and typecheck state | None |
| 5 — coordinated upgrade | completed | Core 1.5.0 / OpenAI 1.1.5 / shared Zod 4.6.5; 67 Agent tests, package typecheck, and root build pass; same live suites pass | Five root API type errors predate and are outside this unit |
| 6 — qualitative eval | completed | Separate 4-case, 5-metric judge command; final 5/5 pass at threshold 0.8, 6,106 evaluation tokens | Cost unavailable without configured pricing |
| 7 — isolated Lens boundary | completed and manually confirmed | Lens SDK 1.2.0 peers with Core `^1.4.0`; Node 24.15.0 satisfies `>=24`; Lens UI confirmed synthetic run `64f5af35-27a7-4bc3-b39f-42c1e9af1c91`, with its metric passed and payload status `not_requested` | None |
| 8 — local/runtime observability | completed with known limitation | Logger 1.1.4 real Agent run and flush passed under Bun; Studio 1.2.4 loopback start/config/shutdown passed under Bun | Logger default run-end event includes generated text; no production integration recommended |
| 9 — four-phase Lens ingestion smoke | locally verified; manual UI confirmation pending | Four static synthetic runs completed with one passing metric each; ClickHouse reports 4/4 null payloads and 4/4 `not_requested` | Owner UI checkpoint |

## Implementation boundaries

The eval targets are the existing `runCookingAgent`, `runPreCooking`,
`runActiveCooking`, and `runCompletion` functions. Cases and metrics live outside
production `src`; Lens and judge code are not reachable from application entry
points. No output schema changed, no RAG metric was introduced, and no Agent
package became a backend or telemetry bridge.

The local execution and scoring matrix is documented in
`packages/agent/evals/README.md`. Offline metric unit tests, live target-model
cases with deterministic scoring, and live qualitative judge evals are distinct
execution modes and must not be described interchangeably.
Hard schema, enum, availability, cardinality, action, and grounding-anchor rules
remain ordinary TypeScript metrics. Judge metrics cover only usefulness,
request alignment, plan clarity, calm active guidance, and grounded synthesis.

Zod was aligned to exact 4.6.5 in every schema-owning or schema-consuming
workspace (API, Agent, Contracts, Ingredients, and Nutrition), plus a root
override, because schema objects cross those package boundaries. This removed
all upgrade-induced nominal-version and OpenAPI type failures.
`@valibot/to-json-schema` 1.8.0 was added to the Agent package because Core
declares it as an optional peer but Bun's API bundler resolves Core's dynamic
import. The build otherwise fails before runtime. The final root build passes;
root typecheck returns only the same five pre-existing API errors captured at
baseline.

Existing offline suites pass: Agent 67/67, Contracts 4/4, Ingredients 19/19,
Nutrition 60/60, and Web 175/175. API and DB integration suites reached their
existing database boundary but could not complete because PostgreSQL was not
listening on localhost:5432; their failures were connection refusals, not
assertion regressions.

## Lens compatibility gate

The available Node runtime is 24.15.0. Stable Lens SDK 1.2.0 requires Node
`>=24` and is compatible with upgraded Core 1.5.0. The required connection
values now live only in the ignored `infra/lens-local/.env.flemme-agent`. The
isolated `tools/lens-eval-smoke` package pins Lens SDK 1.2.0 and Core 1.5.0 in
its own Bun lockfile, but executes with Node 24. It does not import the provider
or any production intent.

The original smoke runner checks Lens readiness, emits one static synthetic
Recommendation case and deterministic metric with `includePayloads: false`,
flushes, and closes the SDK. Its command and identifiers remain unchanged.
Offline tests enforce the metadata allowlist and reject raw input, output,
personal-context, and secret-bearing fields. Run
`64f5af35-27a7-4bc3-b39f-42c1e9af1c91` started at
`2026-09-19T08:31:05.360Z`; ClickHouse confirms the metric passed and its
payload is null with status `not_requested`. The owner manually confirmed the
run in the Lens UI.

The separate `smoke:four-phase` command ran once on 2026-09-20 through the same
Node 24 and payload-disabled boundary. It emitted one independent static run
for each cooking phase, with no target-model, qualitative-judge, or runtime
trace call:

| Phase | Suite | Run ID | Result | Payload |
| --- | --- | --- | --- | --- |
| Recommendation | `flemme.eval.smoke.recommendation` | `d80e4e35-d2b7-45ae-926d-0c1438673044` | pass | null / `not_requested` |
| Pre-Cooking | `flemme.eval.smoke.pre-cooking` | `89fb21cd-173e-47a0-842d-432f895b5f1f` | pass | null / `not_requested` |
| Active Cooking | `flemme.eval.smoke.active-cooking` | `d74e5d9c-f743-4a60-9973-6540451ebf6d` | pass | null / `not_requested` |
| Completion | `flemme.eval.smoke.completion` | `22c3c0d3-62cc-482c-be91-cc786fdcb4f9` | pass | null / `not_requested` |

ClickHouse count/null-only verification found exactly four result records, four
passing `flemme-synthetic-contract` metrics, four null payloads, four
`not_requested` payload statuses, and zero credential-candidate metadata hits.
This proves four-phase Lens ingestion only. Local eval coverage independently
remains 26/26 cases, 17 deterministic metrics, and 121/121 metric evaluations;
runtime tracing remains Recommendation-only.

## Runtime observer decision

- Logger 1.1.4 imported and executed under Bun 1.2.20 with Core 1.5.0. A real
  synthetic Agent call emitted start/generation/end events and `flush()`
  completed. Despite `includeOutput` being unset, the run-end record contained
  the generated `text`. That is too permissive for household/session data, so
  Logger is not integrated until upstream semantics or an explicitly approved
  application redaction policy removes it.
- Studio 1.2.4 imported and ran under Bun despite its official Node
  `>=20.12.0` engine. A temporary Agent was registered, Studio bound only to
  `127.0.0.1`, `/config` returned the registration, and `shutdown()` completed.
  Studio is suitable for an explicitly local, trusted development follow-up,
  not production startup. No repository script was added because Flemme's
  production intents are still direct completions and there is no durable
  Studio requirement.
- Lens was exercised only through the isolated Node 24 synthetic eval package.
  It remains absent from Bun production and the normal 24-case eval commands.
  A later Recommendation-only runtime canary uses the same isolation boundary.
  Four-phase eval ingestion does not expand runtime observability; broader
  runtime tracing remains unimplemented.

OTel and Langfuse were not installed or compared because the assignment did not
select either alternative.

## Four-phase coverage audit checkpoint — 2026-09-20

One owner-authorized `eval:all` execution ran the original 24 synthetic cases
against `gpt-5.6-luna`. Recommendation passed 10/10 cases and 60/60 metrics;
Pre-Cooking passed 3/3 and 9/9; Active Cooking passed 8/8 and 24/24; Completion
passed 3/3 and 9/9. Total duration was 107,568 ms. The output-only intent
contract exposed no target usage, so Core reported zero/unavailable target
tokens. No qualitative judge, Lens reporter, or runtime trace ran.

The audit found narrow deterministic-scoring gaps for Recommendation time
limits, Pre-Cooking selected-recipe ingredient fidelity and exact step-minute
claims, and Active Cooking serving/step change kinds. The authorized
incremental runs passed Recommendation 10/10 and 70/70, Pre-Cooking 3/3 and
12/12, and nine of ten Active Cooking cases. The initial `active-resume` result
failed only because its new expectation required an optional ingredient
`record-change` alongside the contract-required `resume`. Removing that one
over-constrained expectation and adding focused offline assertions changed no
production prompt, schema, intent, runtime, or API behavior. One authorized
targeted rerun then passed `active-resume` 1/1 with all 3/3 deterministic
metrics. Combined with the unchanged Completion baseline, the final result is
26/26 cases and 121/121 metric evaluations across 17 deterministic metrics.
No qualitative judge ran during this continuation; the prior 2026-09-19 result
remains 4/4 cases and 5/5 metrics.

The Lens UI contains only the bounded synthetic Recommendation eval smoke.
Runtime tracing currently covers Recommendation only. Local eval definitions,
however, span all four cooking phases.
