# Flemme four-phase eval coverage audit

Audit date: 2026-09-20

## Scope and terminology

This audit covers local Flemme eval definitions for Recommendation,
Pre-Cooking, Active Cooking, and Completion. Every fixture is synthetic.

- `eval:test` runs offline deterministic metric unit tests and makes no model
  call.
- `eval:smoke`, the phase commands, and `eval:all` run live target-model cases
  whose outputs are scored with deterministic metrics. They are not offline or
  fully deterministic executions.
- `eval:judge` runs live target-model cases plus stochastic qualitative judge
  metrics and is intentionally separate from deterministic contract scoring.
- Lens eval ingestion and runtime observability are separate systems. They are
  not reporters for the local suites.

Local eval coverage, Lens ingestion smoke, and runtime tracing now each span all
four phases. They remain separate execution systems with different purposes and
privacy boundaries.

## Authoritative commands

Run from the repository root:

```sh
# Offline deterministic metric unit tests; no model call
bun run --filter @flemme/agent eval:test

# Live target-model cases with deterministic scoring
bun run --filter @flemme/agent eval:smoke
bun run --filter @flemme/agent eval:recommendation
bun run --filter @flemme/agent eval:pre-cooking
bun run --filter @flemme/agent eval:active-cooking
bun run --filter @flemme/agent eval:completion
bun run --filter @flemme/agent eval:all

# Live target model plus qualitative judge
bun run --filter @flemme/agent eval:judge
```

The package-level verification commands are:

```sh
bun run --filter @flemme/agent test
bun run --filter @flemme/agent typecheck
```

The repository-level verification commands are `bun test`, `bun run
typecheck`, `bun run build`, and `bun install --frozen-lockfile`.

## Verified live baseline

Exactly one `bun run --filter @flemme/agent eval:all` execution ran the
original 24 synthetic cases with the resolved `gpt-5.6-luna` target model.
There were 23 provider generations and one deterministic local
`active-clarification` response. The adapter set request retries to zero. No
judge, Lens reporter, runtime observer, per-phase duplicate, or repeat run was
invoked.

| Phase | Cases | Result | Metric evaluations | Result | Duration |
| --- | ---: | ---: | ---: | ---: | ---: |
| Recommendation | 10 | 10 pass | 60 | 60 pass | 57,787 ms |
| Pre-Cooking | 3 | 3 pass | 9 | 9 pass | 27,031 ms |
| Active Cooking | 8 | 8 pass | 24 | 24 pass | 14,430 ms |
| Completion | 3 | 3 pass | 9 | 9 pass | 8,320 ms |
| **Total** | **24** | **24 pass** | **102** | **102 pass** | **107,568 ms** |

The public output-only intents do not expose provider usage to Core's target
usage selector, so the run reported target and evaluation token counts as zero.
That means usage is unavailable, not that the provider generated no tokens. No
reliable price estimate is available without a configured pricing table.

## Verified baseline matrix

| Phase          | Cases | Deterministic metrics | Metric evaluations | Qualitative cases | Qualitative metrics |
| -------------- | ----: | --------------------: | -----------------: | ----------------: | ------------------: |
| Recommendation |    10 |                     6 |                 60 |                 1 |                   2 |
| Pre-Cooking    |     3 |                     3 |                  9 |                 1 |                   1 |
| Active Cooking |     8 |                     3 |                 24 |                 1 |                   1 |
| Completion     |     3 |                     3 |                  9 |                 1 |                   1 |
| Total          |    24 |                    15 |                102 |                 4 |                   5 |

## Qualitative inventory

The qualitative suite uses the same synthetic fixtures, threshold `0.8`, no
judge retry, the configured OpenAI-compatible provider, and
`FLEMME_EVAL_JUDGE_MODEL_ID` when set or the target model otherwise. Its
responsibilities remain usefulness, request alignment, clarity, calm guidance,
and grounded synthesis—not schema, enum, cardinality, or state validation.

| Phase | Case | Qualitative metrics |
| --- | --- | --- |
| Recommendation | `recommendation-common-inventory-fit` | `recommendation-practical-usefulness`, `recommendation-request-alignment` |
| Pre-Cooking | `pre-cooking-standard-plan` | `pre-cooking-clarity` |
| Active Cooking | `active-pause` | `active-cooking-calm-helpfulness` |
| Completion | `completion-recorded-change` | `completion-grounded-synthesis` |

The verified qualitative baseline remains the 2026-09-19 result: 4/4 cases and
5/5 metrics passed at threshold 0.8, using 6,106 evaluation tokens. Target
usage and cost were unavailable in that run's context.

## Final combined live result

The final result combines unchanged-case results rather than claiming a second
complete-suite execution:

- Recommendation passed 10/10 cases and 70/70 deterministic metric
  evaluations in its incremental validation.
- Pre-Cooking passed 3/3 and 12/12 in its incremental validation.
- The Active Cooking incremental run passed 9/10 and 29/30. Its only failure,
  `active-resume`, came from an over-constrained case expectation that required
  an optional ingredient `record-change` alongside the required `resume`.
- Removing only that extra expectation changed no production behavior. Focused
  offline tests prove standalone `resume` passes, while no action and an
  unrelated lifecycle action fail. One targeted `active-resume`
  generation then passed 1/1 and 3/3. Its safe action evidence was two actions:
  `record-change` and `resume`.
- Completion definitions were unchanged and retain their previously verified
  3/3 and 9/9 baseline.

| Phase | Cases | Deterministic metrics | Metric evaluations | Qualitative cases | Qualitative metrics |
| --- | ---: | ---: | ---: | ---: | ---: |
| Recommendation | 10/10 | 7 | 70/70 | 1 | 2 |
| Pre-Cooking | 3/3 | 4 | 12/12 | 1 | 1 |
| Active Cooking | 10/10 | 3 | 30/30 | 1 | 1 |
| Completion | 3/3 | 3 | 9/9 | 1 | 1 |
| **Total** | **26/26** | **17** | **121/121** | **4** | **5** |

The incremental phase validation used 22 provider generations; the targeted
correction used exactly one more. Provider token usage remained unavailable.
No raw target response is retained. The combined result did not invoke a new
qualitative judge and therefore retains the verified baseline above.

## Metric catalog

| Phase | Metric | Coverage role | State |
| --- | --- | --- | --- |
| Recommendation | `recommendation-schema` | Production output contract | Baseline pass |
| Recommendation | `recommendation-variant-contract` | Allowed variant and 1–3 cardinality | Baseline pass |
| Recommendation | `recommendation-servings` | Explicit serving count | Baseline pass |
| Recommendation | `recommendation-time-practicality` | Explicit available-time ceiling | Live pass |
| Recommendation | `recommendation-inventory-honesty` | No fabricated available ingredient | Baseline pass |
| Recommendation | `recommendation-equipment-honesty` | No fabricated available equipment | Baseline pass |
| Recommendation | `recommendation-optional-separation` | Required/optional separation | Baseline pass |
| Pre-Cooking | `pre-cooking-schema` | Complete production plan contract | Baseline pass |
| Pre-Cooking | `pre-cooking-plan-invariants` | Unique IDs, executable stages, qualitative timing, and no exact step minutes | Live pass |
| Pre-Cooking | `pre-cooking-selected-recipe-fidelity` | Preserve selected required ingredient identities | Live pass |
| Pre-Cooking | `pre-cooking-required-equipment` | Explicit case-required equipment | Baseline pass |
| Active Cooking | `active-cooking-schema` | Output/action contract and action cardinality | Baseline pass |
| Active Cooking | `active-cooking-action-intent` | Intent-compatible action and change kind | Live pass after corrected `active-resume` expectation |
| Active Cooking | `active-cooking-state-safety` | Clarification exclusivity and valid plan references | Baseline pass |
| Completion | `completion-schema` | Stable completion contract with no action surface | Baseline pass |
| Completion | `completion-grounding-anchor` | Plan, change, or final-message grounding | Baseline pass |
| Completion | `completion-boundary` | Cooking-only, non-medical boundary | Baseline pass |

## Case inventory

All deterministic metrics for a phase apply to every case in that phase. The
qualitative column lists only judge metrics actually configured for that case.
No raw target output is persisted here.

### Recommendation

| Case ID | Scenario and synthetic fixture | Expected variant | Qualitative metrics | Invariant | Class | Current result |
| --- | --- | --- | --- | --- | --- | --- |
| `recommendation-common-inventory-fit` | Complete Ayam Kecap inventory, wok kitchen, two-person household, Indonesian/one-pan preferences, 45 minutes | `recommendations` | Practical usefulness; request alignment | Context-grounded feasible recommendation | positive | Live pass |
| `recommendation-unknown-pantry-staples` | Salt and oil omitted from otherwise complete inventory | `recommendations` | — | Inventory is the availability source; no assumed staples | edge | Live pass |
| `recommendation-missing-required-ingredient` | Sweet soy sauce removed and explicitly reported unavailable | `recommendations` or `no_viable_recommendation` | — | Missing item is not marked available; honest fallback | negative/recovery | Live pass |
| `recommendation-equipment-constrained` | Rice cooker and knife only | `recommendations` | — | Feasible method uses only confirmed equipment | edge/recovery | Live pass |
| `recommendation-household-servings` | Two adults, two children, four requested servings | `recommendations` | — | Household and explicit serving context | positive | Live pass |
| `recommendation-time-constrained` | Quickest practical meal with 20-minute ceiling | `recommendations` or `no_viable_recommendation` | — | Available-time practicality | edge | Live pass |
| `recommendation-insufficient-context` | Empty inventory, equipment, household, preferences, and request | `clarification` or `no_viable_recommendation` | — | No fabricated context when feasibility is unknown | negative | Live pass; time metric not applicable |
| `recommendation-no-viable` | Empty inventory/equipment; roast chicken request in 10 minutes | `clarification` or `no_viable_recommendation` | — | Plainly report limiting constraints | negative | Live pass; time metric not applicable |
| `recommendation-cuisine-ranking-signals` | Indonesian, Japanese, and Thai preference signals | `recommendations` | — | Preferences are signals, not rigid identity | positive | Live pass |
| `recommendation-cross-cuisine-fallback` | Italian profile preference but explicit chicken/sweet-soy request | `recommendations` | — | Session request outranks conflicting profile defaults | recovery | Live pass |

### Pre-Cooking

| Case ID | Scenario and synthetic fixture | Expected output | Qualitative metrics | Invariant | Class | Current result |
| --- | --- | --- | --- | --- | --- | --- |
| `pre-cooking-standard-plan` | Selected Ayam Kecap with complete context | Complete executable plan with wok and gas stove | Plan clarity | Selected-recipe fidelity and complete plan structure | positive | Live pass |
| `pre-cooking-unknown-quantities` | Selected ingredients omit known amounts | Complete plan without fabricating unavailable source quantities | — | Unknown quantity handling | edge | Live pass |
| `pre-cooking-limited-equipment` | Selected recipe and context adapt wok to frying pan | Complete faithful plan requiring frying pan and gas stove | — | Explicit, context-supported equipment adaptation | recovery | Live pass |

### Active Cooking

| Case ID | Scenario and synthetic fixture | Expected output | Qualitative metrics | Invariant | Class | Current result |
| --- | --- | --- | --- | --- | --- | --- |
| `active-advance` | Current step explicitly completed | Required `advance` | — | Explicit forward progress only | positive | Baseline pass |
| `active-previous` | In-progress session asks for previous instruction | Required `previous-step` | — | Navigation without undoing physical progress | recovery | Baseline pass |
| `active-pause` | Interruption while heating oil | Required `pause` | Calm helpfulness | Safe pause guidance and preserved position | recovery | Baseline pass |
| `active-resume` | Paused missing-ingredient session now has ingredient | Required `resume`; optional compatible ingredient change | — | Resume same plan and position | recovery | Targeted live pass after removing over-constrained change requirement |
| `active-record-change` | Frying pan replaces wok | Required equipment `record-change` | — | Equipment change without plan mutation | recovery | Live pass |
| `active-record-serving-change` | Serving count changes from two to three | Required servings `record-change` | — | Preserve meaningful serving change | recovery | Live pass |
| `active-record-step-change` | Current physical step completed outside the app without requested navigation | Required step `record-change` | — | Record external step fact without silent advance | recovery | Live pass |
| `active-complete` | Final step explicitly completed | Required `complete-cooking` | — | Completion only at established final position | positive | Baseline pass |
| `active-abandon` | Explicit request to abandon session | Required `abandon-cooking` | — | Abandonment is explicit and terminal | negative | Baseline pass |
| `active-clarification` | Ambiguous “Is this okay?” at current step | No lifecycle mutation; local clarification response | — | Clarify uncertainty without provider or state mutation | edge/recovery | Baseline pass via deterministic scope guard |

### Completion

| Case ID | Scenario and synthetic fixture | Expected output | Qualitative metrics | Invariant | Class | Current result |
| --- | --- | --- | --- | --- | --- | --- |
| `completion-standard` | Completed Ayam Kecap session with final message | Grounded reply, summary, and optional notes | — | Stable grounded completion contract | positive | Baseline pass |
| `completion-taste-feedback` | Completed session reports salty result | Grounded taste acknowledgement | — | No invented outcome; useful supported note | recovery | Baseline pass |
| `completion-recorded-change` | Completed session records two-to-three serving change | Summary reconciles serving change | Grounded synthesis | Material recorded-change reconciliation | recovery | Baseline pass |

## Required-criteria audit

### Recommendation

| Criterion | Classification | Evidence and limits |
| --- | --- | --- |
| Session request priority | `covered` | Cross-cuisine fallback case, shared prompt priority, and request-alignment judge metric |
| Inventory as source of truth | `covered` | Unknown-staples/no-viable cases and inventory-honesty metric |
| Available, unconfirmed, and missing classification | `partially-covered` | Schema supports all three and available/missing honesty is exercised; no contract requires an absent item to be emitted as `unconfirmed` rather than omitted |
| Kitchen-equipment feasibility | `covered` | Equipment-constrained case and equipment-honesty metric |
| Household and preference context | `covered` | Household, cuisine-signal, fallback cases and usefulness judge |
| Available-time practicality | `covered` | Time-constrained case plus live-passing time-practicality metric |
| One-to-three cardinality | `covered` | Schema and variant/cardinality metric |
| Clarification and no-viable variants | `partially-covered` | Both are schema-valid and allowed by insufficient-context cases; the verified run produced no-viable responses, while the contract intentionally leaves the choice context-dependent |
| No invented inventory/equipment/preferences | `covered` | Deterministic inventory/equipment checks plus qualitative personalization checks |
| Honest optional/missing handling | `covered` | Missing-ingredient case and optional-separation metric |

### Pre-Cooking

| Criterion | Classification | Evidence and limits |
| --- | --- | --- |
| Selected-recipe fidelity | `covered` | Live-passing normalized required-ingredient identity metric and clarity judge |
| Immutable cooking-plan generation | `covered` | One complete output contract, prompt immutability rule, and no progress/action fields |
| Required ingredients versus preparation actions | `covered` | Separate schema fields, standard/unknown-quantity fixtures, and fidelity metric |
| Required equipment | `covered` | Required-equipment metric and equipment-adaptation case |
| Preparation summary | `covered` | Required production schema field in every case |
| Preparation steps | `covered` | Ordered plan field exercised by every case |
| Cooking stages and step structure | `covered` | Non-empty stage/step schema plus executable-stage metric |
| Stable and unique IDs | `covered` | Global uniqueness metric and offline defect test |
| Qualitative timing without false minute precision | `covered` | Timing-level schema plus live-passing plan metric rejecting exact step minutes |
| Completion cues | `partially-covered` | Timing cues are structured and live plans include observable cues, but the contract makes cues conditional when useful rather than universally mandatory |
| No silent recipe replacement | `partially-covered` | Ingredient identity is now scored, but the output intentionally does not echo a recipe identifier, so complete semantic identity cannot be proven deterministically |

### Active Cooking

| Criterion | Classification | Evidence and limits |
| --- | --- | --- |
| Frozen plan preservation | `covered` | Input/prompt immutability tests and output schema has no replacement-plan field |
| Current stage/step context | `covered` | Position-validating input schema and exact-position prompt test |
| Completed-step progress | `covered` | Multiple fixtures plus unknown/duplicate completed-ID rejection tests |
| Pause and resume | `covered` | Dedicated live cases |
| Ingredient/equipment/serving/step changes | `covered` | Ingredient/equipment cases and live-passing serving/step cases |
| Advance and previous-step | `covered` | Dedicated live cases |
| Completion and abandonment | `covered` | Dedicated final-step and explicit-abandon cases |
| Clarification only when required | `covered` | Ambiguous local-scope case and clarification exclusivity schema tests |
| At most one lifecycle action | `covered` | Output schema refinement and schema metric |
| No silent application-state mutation | `covered` | Actions are proposals only; output cannot return a session; prompt immutability test |
| Calm, actionable, safety-aware help | `covered` | Pause case, safety prompt assertion, and prior calm-helpfulness judge pass |

### Completion

| Criterion | Classification | Evidence and limits |
| --- | --- | --- |
| Completed-session requirement | `covered` | Completion input schema and active/paused/abandoned rejection tests |
| Summary grounded in plan | `covered` | Grounding-anchor metric plus grounded-synthesis judge |
| Reconciliation of recorded changes | `covered` | Serving-change case and grounded-synthesis judge |
| Useful notes without unsupported claims | `covered` | Taste-feedback case, prompt rules, output tests, and qualitative judge |
| No invented cooking outcomes | `covered` | Taste evidence fixture, prompt regression assertion, and qualitative judge |
| No direct inventory mutation | `covered` | Completion output has no action surface and prompt forbids inventory changes |
| Separation from deterministic nutrition calculation | `covered` | Prompt forbids nutrition calculation and output contract has no nutrition field |
| Stable completion contract | `covered` | Production schema metric and output schema tests |

## Gap decision

Actionable gaps were limited to existing documented invariants:

1. Recommendation available-time limits needed deterministic scoring.
2. Pre-Cooking required-ingredient fidelity and false exact step-minute claims
   needed deterministic scoring.
3. Active Cooking serving and externally performed step changes needed typed
   synthetic cases and explicit change-kind assertions.

No production behavior, schema, prompt, runtime, dependency, lockfile, Lens
integration, or observability path changed. No unresolved product decision was
introduced. The remaining `partially-covered` findings reflect intentionally
flexible variant selection or output-shape limits and do not justify speculative
new behavior.

The completed suite contains 26 cases, 17 deterministic metrics, and 121 metric
applications. Different phase totals reflect their documented contract
complexity; no balancing-only case was added.

The `active-resume` diagnosis confirmed that an explicit paused-session resume
requires `resume`, while an ingredient `record-change` remains optional. The
metric implementation still supports required change kinds for cases that
explicitly ask to record equipment, serving, or step changes. Only the
over-constrained `active-resume` expectation was removed.

## Final verification

- Focused Active Cooking metric test: 1/1 passed with 3 assertions.
- Offline metric unit tests: 9/9 passed with 17 assertions, both before and
  after the targeted live run.
- Agent package tests: 86/86 passed with 164 assertions, both before and after
  the targeted live run.
- Agent typecheck: passed before the targeted run.
- Static inventory: 26 cases, 17 metrics, and 121 metric applications.
- Targeted `active-resume`: 1/1 case and 3/3 metrics passed with exactly one
  `gpt-5.6-luna` provider generation, zero eval/provider retries, and no raw
  output persistence.
- Full repository tests: 515/515 passed with 2,381 assertions against an
  isolated temporary PostgreSQL 16 container on an OS-assigned loopback port.
  The URL was supplied only through process environment. The container used tmpfs,
  was removed after the run, and the existing `flemme-postgres` container and
  volumes were not used or modified.
- Root typecheck, production build, scoped Biome, frozen Bun installs,
  `git diff --check`, and the changed-file credential scan are recorded in the
  final local commit verification.

The verification made no qualitative-judge, Lens-reporter, runtime-trace,
deployment, or push operation.
