# Flemme agent evals

These evals call the four real public Flemme intent paths with the production
input/output schemas. Core deterministic evals have no Lens dependency and no
judge cost.

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

Live commands require `MUX_API_KEY` and `BASE_URL`. `FLEMME_EVAL_MODEL_ID` is
optional and defaults to the same `gpt-5.6-luna` model used by the existing
development runners. Judge evals optionally use `FLEMME_EVAL_JUDGE_MODEL_ID`,
falling back to the normal eval model. Never place values in this document.

Each live case is limited to 90 seconds and suites use concurrency 1. The public
intent APIs do not currently accept an abort signal, so the Core suite can time
out the case but cannot forward cancellation into an in-flight provider call.

## Case matrix

| Phase | Cases | Categories |
| --- | ---: | --- |
| Recommendation | 10 | inventory fit, unknown staples, missing ingredient, equipment, household, time, insufficient context, no viable result, cuisine signals, cross-cuisine fallback |
| Pre-Cooking | 3 | standard plan, unknown quantities, equipment adaptation |
| Active Cooking | 8 | advance, previous, pause, resume, record change, complete, abandon, clarify |
| Completion | 3 | standard, taste feedback, recorded change |

## Deterministic metric matrix

| Phase | Metrics |
| --- | --- |
| Recommendation | schema, allowed variant/cardinality, servings, inventory honesty, equipment honesty, optional/required separation |
| Pre-Cooking | schema, globally unique IDs/executable stages/qualitative timing, explicit required equipment |
| Active Cooking | schema/action-union cardinality, intent-compatible actions, clarification/change-reference safety |
| Completion | schema/no action surface, grounding anchor, cooking-vs-medical boundary |

Hard contract rules are deterministic. Judge metrics are limited to practical
usefulness, clarity, calm language, and synthesis quality.

The judge command runs four representative live cases and five metrics at a
0.8 threshold with no judge retry. The final verified run used 6,106 evaluation
tokens; target usage was not exposed, and cost is not estimated without a
configured pricing table. Judge scores are stochastic and are not a required
deterministic CI gate.

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

Lens, when credentials become available, belongs in an isolated Node 24 runner;
it is not imported by these Bun evals or production entry points.
