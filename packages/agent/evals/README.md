# Flemme agent evals

These evals exercise the four public Flemme intent paths with production
input/output schemas and synthetic fixtures. The suite has three distinct
execution modes:

- `eval:test` is an offline deterministic metric unit-test command. It makes no
  model call.
- `eval:smoke`, the four phase commands, and `eval:all` are live target-model
  case runs whose outputs are scored by deterministic metrics. They are not
  offline or fully deterministic executions.
- `eval:judge` calls both the live target model and a qualitative judge. It is
  stochastic and intentionally separate from deterministic scoring.

None of these Bun-local commands sends records to Lens. Lens ingestion and
runtime tracing use separate isolated boundaries.

## Commands

Run from the repository root:

```sh
bun run --filter @flemme/agent eval:test
bun run --filter @flemme/agent eval:smoke
bun run --filter @flemme/agent eval:recommendation
bun run --filter @flemme/agent eval:pre-cooking
bun run --filter @flemme/agent eval:active-cooking
bun run --filter @flemme/agent eval:completion
bun run --filter @flemme/agent eval:all
bun run --filter @flemme/agent eval:judge
```

The live target-model and judge commands require `MUX_API_KEY` and `BASE_URL`.
`FLEMME_EVAL_MODEL_ID` is
optional and defaults to the same `gpt-5.6-luna` model used by the existing
development runners. Judge evals optionally use `FLEMME_EVAL_JUDGE_MODEL_ID`,
falling back to the normal eval model. Never place values in this document.

Each live case is limited to 90 seconds and suites use concurrency 1. The public
intent APIs do not currently accept an abort signal, so the Core suite can time
out the case but cannot forward cancellation into an in-flight provider call.

## Case matrix

The four-phase coverage audit established a final combined result of 26/26
cases and 121/121 deterministic metric evaluations across 17 metrics. The
result combines the unchanged-case results from the incremental
phase runs, the corrected one-case `active-resume` rerun, and the previously
verified unchanged Completion baseline. The initial `active-resume` run exposed
an over-constrained expectation that required an optional ingredient
`record-change` in addition to the required `resume`; removing only that extra
expectation changed no production behavior.

| Phase | Cases | Categories |
| --- | ---: | --- |
| Recommendation | 10 | inventory fit, unknown staples, missing ingredient, equipment, household, time, insufficient context, no viable result, cuisine signals, cross-cuisine fallback |
| Pre-Cooking | 3 | standard plan, unknown quantities, equipment adaptation |
| Active Cooking | 10 | advance, previous, pause, resume, ingredient/equipment/serving/step changes, complete, abandon, clarify |
| Completion | 3 | standard, taste feedback, recorded change |

## Deterministic metric matrix

| Phase | Metrics |
| --- | --- |
| Recommendation | schema, allowed variant/cardinality, servings, available-time practicality, inventory honesty, equipment honesty, optional/required separation |
| Pre-Cooking | schema, globally unique IDs/executable stages/qualitative timing without exact step minutes, selected-recipe ingredient fidelity, explicit required equipment |
| Active Cooking | schema/action-union cardinality, intent-compatible actions and change kinds, clarification/change-reference safety |
| Completion | schema/no action surface, grounding anchor, cooking-vs-medical boundary |

Hard contract rules are deterministic. Judge metrics are limited to practical
usefulness, clarity, calm language, and synthesis quality.

The judge command runs four representative live cases and five metrics at a
0.8 threshold with no judge retry. The final verified run used 6,106 evaluation
tokens; target usage was not exposed, and cost is not estimated without a
configured pricing table. Judge scores are stochastic and are not a required
deterministic CI gate.

The most recent qualitative baseline remains the 2026-09-19 run documented in
the [four-phase coverage audit](../../../docs/evals/flemme-four-phase-eval-coverage-audit.md):
4/4 cases and 5/5 metrics passed at threshold 0.8. The coverage audit did not
rerun the qualitative judge.

## Known observability gaps

The output contracts deliberately do not echo the input plan or session state.
Therefore an evaluator cannot directly prove that a model did not internally
replace a plan, reset completed IDs, or invent an unmentioned completion event.
The public functions also return validated output only, not provider usage, so
Core reports target latency but zero/unavailable target-token usage. We do not
change production schemas or add keyword-heavy heuristics to close these gaps.

Ingredient and equipment matching intentionally uses normalized exact names.
It catches false `available` claims without pretending to solve aliases such as
“skillet” versus “frying pan.” Qualitative judge checks cover broader semantic
quality separately and never decide schema, enum, action, or state rules.

Lens ingestion smoke and runtime tracing are implemented for all four phases in
the separate Node 24-only `tools/lens-eval-smoke` package. Payload capture is
disabled, and Lens remains absent from these Bun eval runners. The local eval
suite, ingestion smoke, and runtime traces are separate systems even though all
three cover Recommendation, Pre-Cooking, Active Cooking, and Completion.
