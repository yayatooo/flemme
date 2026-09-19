# Flemme Anvia Version & Compatibility Audit

Audit date: 2026-09-19

## Executive Decision

Proceed with **Option C — incremental migration**. Step 2 can implement evals now around the existing async intent functions on locked `@anvia/core` `1.1.2`; a Core upgrade and an Anvia `Agent` refactor are not prerequisites for the evaluation harness. Keep production observability and Studio out of Step 2. After the first deterministic evaluation baseline exists, upgrade Core, the OpenAI adapter, and Zod together in a separate bounded task, then migrate one intent behind its existing public function before selecting an observer backend.

This decision is based on verified installed exports from `node_modules/@anvia/core/package.json` and `node_modules/@anvia/core/dist/evals/index.d.ts`, plus a successful Bun evaluation smoke test. The latest registry releases are `@anvia/core` `1.5.0` and `@anvia/openai` `1.1.5`, but the installed `1.1.2` Core already contains the eval contracts required by Step 2. Current release metadata was queried with `bun pm view`; the official [Core documentation](https://docs.anvia.dev/packages/core) confirms that evaluations live at `@anvia/core/evals` and observability contracts at `@anvia/core/observability`.

## Repository State

- The worktree initially contained one pre-existing untracked file: `docs/fix/codex-task-flemme-anvia-version-compatibility-audit.md`. It was preserved.
- Root `package.json` defines Bun `1.2.20`, workspaces `apps/*` and `packages/*`, and Turborepo scripts. The executing Bun version is also `1.2.20`.
- `packages/agent/package.json` is the only workspace manifest that declares Anvia packages. It declares `@anvia/core` and `@anvia/openai` as `^1.1.2`.
- `bun.lock` pins one copy each of `@anvia/core@1.1.2` and `@anvia/openai@1.1.2`. `bun pm ls --all` confirms those are the installed workspace resolutions; no second Anvia version is present.
- `@anvia/openai@1.1.2` peers exactly with `@anvia/core@1.1.2`, so the current pair is internally aligned (`bun.lock`; `node_modules/@anvia/openai/package.json`).
- Root Zod resolves to `4.5.4`, satisfying installed Core's `^4.4.0` peer. The repository also contains a transitive Zod 3 copy outside the Agent's Anvia path; this is not a duplicate Anvia installation (`bun pm ls --all`; `bun.lock`).
- `packages/agent/tsconfig.json` includes `index.ts`, all runners, the structured-output probe, and all `src/**/*.ts`. The package has no build script; it has `test` and `typecheck` scripts.
- The four local runner scripts use `bun --env-file=../../.env`. Only the provider variable names `MUX_API_KEY` and `BASE_URL` are relevant to Agent execution (`packages/agent/package.json`, `.env.example`, and the runner sources). No secret values were inspected or recorded.
- `docs/business-context.md`, referenced by `AGENTS.md`, is absent. This audit did not infer product behavior from that missing document.

## Dependency Matrix

| Package | Declared in Flemme | Exact locked / installed | Stable on 2026-09-19 | Compatibility finding |
| --- | --- | --- | --- | --- |
| `@anvia/core` | `^1.1.2` | `1.1.2` | `1.5.0` | Current install already exports eval and observability subpaths. Stable raises the Zod peer floor and contains additive runtime changes. [Registry metadata](https://registry.npmjs.org/@anvia%2fcore/latest) |
| `@anvia/openai` | `^1.1.2` | `1.1.2` | `1.1.5` | Installed adapter peers exactly with Core `1.1.2`. Stable adapter peers with Core `^1.5.0`, so it must not be upgraded alone. [Registry metadata](https://registry.npmjs.org/@anvia%2fopenai/latest) |
| `zod` | `^4.5.4` | `4.5.4` on the Agent path | `4.6.5` is the minimum peer required by stable Core | Current version is compatible with Core `1.1.2`; a Core `1.5.0` migration must also move Zod to `^4.6.5` or newer (`@anvia/core@1.5.0` package metadata). |
| `@anvia/logger` | Not declared | Not installed | `1.1.4` | `1.1.2` is available and peers exactly with Core `1.1.2`; latest peers with Core `^1.3.1`. [Package guide](https://docs.anvia.dev/packages/logger) |
| `@anvia/otel` | Not declared | Not installed | `1.2.0` | `1.1.2` is available and peers exactly with Core `1.1.2`; latest peers with Core `^1.4.0`. [Package guide](https://docs.anvia.dev/packages/otel) |
| `@anvia/langfuse` | Not declared | Not installed | `1.2.0` | `1.1.2` is available and peers exactly with Core `1.1.2`; latest peers with Core `^1.4.0`. [Package guide](https://docs.anvia.dev/packages/langfuse) |
| `@anvia/lens` | Not declared | Not installed | `1.2.0` | `1.1.2` is Core-compatible, but both compatible and latest metadata require Node `>=24`. [Package guide](https://docs.anvia.dev/packages/lens) |
| `@anvia/studio` | Not declared | Not installed | `1.2.4` | `1.1.2` is available and peers exactly with Core `1.1.2`; latest peers with Core `^1.3.2`. Both declare Node `>=20.12.0`. [Studio guide](https://docs.anvia.dev/packages/studio) |

The stable versions and peer ranges above are verified registry facts from `bun pm view`, not inferred from matching version numbers. Anvia explicitly states that packages release independently and should be checked for dependency compatibility ([Anvia package changelog index](https://docs.anvia.dev/packages/changelog)).

## Current Anvia Usage Map

| File | Imported symbol / usage | Purpose | Criticality | Migration sensitivity |
| --- | --- | --- | --- | --- |
| `packages/agent/src/providers/openai.ts` | `OpenAIClient`; `completionModel({ modelId, api: "chat" })` | Builds the application-injected OpenAI-compatible completion model. | Runtime-critical public provider factory | Low for Core `1.5.0` + OpenAI `1.1.5`; inspected stable declarations retain these signatures. Must upgrade the pair together. |
| `packages/agent/src/intents/cooking-recommendation.ts` | `generateCompletion`; `outputSchema` | Generates and returns validated Recommendation output. | Runtime-critical | Low for direct-completion migration; retain the Zod schema and `result.output` contract. |
| `packages/agent/src/intents/pre-cooking.ts` | `generateCompletion`; `outputSchema` | Generates the validated Pre-Cooking plan. | Runtime-critical | Low; same direct-completion pattern. |
| `packages/agent/src/intents/active-cooking.ts` | `generateCompletion`; `outputSchema` | Generates validated in-scope Active Cooking proposals after deterministic scope handling. | Runtime-critical | Medium because deterministic pre/post-processing must survive any later Agent wrapper. |
| `packages/agent/src/intents/completion.ts` | `generateCompletion`; `outputSchema` | Generates the validated Completion result. | Runtime-critical | Low; same direct-completion pattern. |
| `packages/agent/structured-output-probe.ts` | `generateCompletion`; `CompletionStructuredOutputError`; `outputSchema` | Development-only model compatibility probe. | Local development only | Low; re-run after any synchronized dependency upgrade. |
| `packages/agent/runners/*.ts` | Indirect `createOpenAIModel` and intent calls | Local fixtures/runners for all four cooking phases. | Local development only | Low; useful acceptance probes after migration. |
| `packages/agent/src/evals/run-evals.ts` | No Anvia imports; empty export | Placeholder only. | Not implemented | Step 2 target. |

Repository-wide search found no use of Anvia `Agent`, `Pipeline`, tool primitives, `streamCompletion`, observer configuration, Studio, trace adapters, eval metrics/reporters, or explicit completion retry/provider options. `packages/agent/src/runtime/cooking-agent.ts` is a Flemme function wrapper, not an instance of Anvia's `Agent` class. This distinction matters because Studio registers actual Agent/Pipeline objects, and Agent observers emit from Agent runs ([Studio registration documentation](https://anvia.dev/studio)).

## Required Capability Matrix

| Required capability | Status on locked Core `1.1.2` | Verified import/path | Evidence / constraint |
| --- | --- | --- | --- |
| `runEvalSuite` | available now | `@anvia/core/evals` | Present in installed declarations and passed a real one-case Bun smoke run. |
| Typed suite / metric factory | available now | `defineEvalSuite`, `createEvalTypes`, `defineMetric` from `@anvia/core/evals` | Installed declarations mark factory-only `defineEvalSuite()` deprecated in favor of `createEvalTypes()`; suite-definition overload remains available. |
| Deterministic metrics | available now | `exactMatch`, `contains`, `containsAll`, `containsAny`, `matches`, `requiredFields`, `jsonCorrectness`, and others from `@anvia/core/evals` | Installed `dist/evals/index.d.ts`; no model required. |
| LLM judge / score metrics | available now | `llmJudge`, `llmScore`, `gEval`, `faithfulness`, `hallucination`, and others from `@anvia/core/evals` | Installed declarations. These require a completion model and incur provider use. |
| Core reporters and CLI output | available now | `EvalReporter`, `runEvalCli`, `printEvalResult` from `@anvia/core/evals` | Sufficient for local/CI output; hosted backends need an adapter. |
| Backend eval reporters | available with an additional compatible package | `@anvia/otel@1.1.2`, `@anvia/langfuse@1.1.2`, or `@anvia/lens@1.1.2` | Each peers exactly with Core `1.1.2`; Bun/runtime constraints still apply. |
| Agent observability configuration | available now | `Agent` plus `AgentObservabilityOptions`; types also at `@anvia/core/observability` | Core contract exists, but Flemme currently makes direct completion calls, not Agent runs. |
| Named observers and `primaryTrace` | available now | `observability: { observers, primaryTrace }` on `Agent` | Installed Agent declarations and Bun construction smoke test. |
| Trace metadata on an Agent run | available now | `AgentRunOptions.trace`, including `name`, `userId`, `sessionId`, `metadata`, `tags`, `version`, and trace linkage fields | Installed `AgentTraceOptions` declarations. |
| `outputSchema` on `Agent` | available now | `new Agent({ outputSchema })` | Installed declarations and Bun construction smoke test. Agent output schemas remain Zod-specific in inspected Core `1.5.0`; direct completion becomes Standard-Schema-capable. |
| Studio registration | available with an additional compatible package | `@anvia/studio@1.1.2` with Core `1.1.2` | Package exists and peers exactly with Core, but useful registration also requires Flemme to construct an Anvia Agent/Pipeline. Studio declares Node `>=20.12.0`. |
| Local logger adapter | available with an additional compatible package | `@anvia/logger@1.1.2` | Exact Core peer; Bun smoke test still required. |
| OpenTelemetry adapter | available with an additional compatible package | `@anvia/otel@1.1.2` | Exact Core peer; emits through caller-owned OTel SDK/exporters ([OTel guide](https://docs.anvia.dev/packages/otel)). |
| Langfuse adapter | available with an additional compatible package | `@anvia/langfuse@1.1.2` | Exact Core peer; Node-oriented transitive tracing stack needs a Bun smoke test. |
| Lens adapter | available with an additional compatible package, but runtime-blocked for Flemme's Bun process | `@anvia/lens@1.1.2` | Exact Core peer, explicit Node `>=24` engine. Do not assume Bun satisfies that contract. |

No required eval primitive requires a Core migration. Agent-specific observability is technically available but requires a deliberate conversion of at least one direct-completion intent into an Anvia Agent run.

## Stable Release Compatibility Delta

Current stable was verified through Bun registry metadata as Core `1.5.0` and OpenAI `1.1.5`. The official source changelogs are the comparison authority: [Core changelog](https://github.com/anvia-hq/anvia/blob/main/packages/core/CHANGELOG.md) and [OpenAI adapter changelog](https://github.com/anvia-hq/anvia/blob/main/packages/provider-openai/CHANGELOG.md).

Changes relevant to Flemme:

- Core `1.3.0` broadens direct `generateCompletion` and `streamCompletion` structured outputs from Zod-only to Standard Schema, while retaining Zod behavior. This is additive for all four Flemme intents.
- Core `1.3.1` raises the Zod peer floor to `^4.6.5`. Flemme's declared/locked `4.5.4` does not satisfy the stable peer, so a Core upgrade requires a Zod upgrade in the same dependency task.
- Core `1.4.0` centralizes PII redaction at `@anvia/core/redaction`, relevant when a production observer is later selected. It does not affect current direct calls.
- Core `1.5.0` changes omitted memory-compaction retention to `recentTurns`. Flemme does not currently use Agent memory, so this has no present source impact but must be considered if memory is added later.
- Core `1.2.0` adds Agent teams and Studio registration for them. Flemme does not use teams, so this is outside the migration scope.
- OpenAI `1.1.3` changes peer ranges to allow compatible Core minors; `1.1.4` aligns runtime/schema dependencies; `1.1.5` fixes Azure AI Foundry Responses streaming tool events. None changes Flemme's inspected `OpenAIClient` constructor or `completionModel({ modelId, api })` call shape.
- Stable Core still exposes direct completions, `Agent` construction/outcomes, evals, observability, `Agent.outputSchema`, and the same named-observer model. Inspected declarations show no mandatory source rewrite for Flemme's current `generateCompletion({ model, prompt, outputSchema })` calls.

Expected synchronized upgrade surface:

1. `packages/agent/package.json`: Core, OpenAI adapter, and Zod ranges.
2. `bun.lock`: new exact resolutions.
3. `packages/agent/src/providers/openai.ts`: expected to need verification, not an edit, because the stable signature is unchanged.
4. The four intent files and `structured-output-probe.ts`: expected to need regression verification, not edits, for their current Zod schemas and `result.output` behavior.
5. Agent tests, package typecheck, the structured-output probe, and one live call per production-critical phase should be rerun.

The main upgrade risk is dependency alignment and runtime validation, not a large source migration. The current caret ranges would permit a future fresh resolution to Core `1.5.0` and OpenAI `1.1.5`, while the lock currently protects `1.1.2`; therefore reproducibility depends on preserving `bun.lock` until an intentional synchronized upgrade.

## Bun Runtime Assessment

| Package / candidate | Documented runtime stance | Bun evidence in this audit | Assessment |
| --- | --- | --- | --- |
| `@anvia/core@1.1.2` | No `engines`; official docs describe Core as ESM for modern JavaScript runtimes, with entry-point-specific needs. They do not name Bun. | Import, eval execution, Agent construction, Zod `outputSchema`, and named-observer construction passed under Bun `1.2.20`. | Compatible for Step 2's deterministic eval harness. Provider-backed evals still require a controlled live smoke. |
| `@anvia/core@1.5.0` | No `engines`; same broad runtime stance. | Tarball declarations inspected only; not installed or executed. | Likely portable, but requires a post-upgrade Bun smoke and Zod `^4.6.5`. |
| `@anvia/openai@1.1.2` | No `engines`; depends on `openai@^7.10.0`. | `OpenAIClient` and a chat model handle were constructed under Bun. Existing Flemme progress records successful provider calls from the local runners (`docs/progress-tracker.md`). | Current adapter is usable on Bun for Flemme's path. Keep a live structured-output smoke in the upgrade gate. |
| `@anvia/openai@1.1.5` | No `engines`; peers with Core `^1.5.0`. | Declarations inspected only. | Likely compatible through the same API, but must be smoke-tested as part of the synchronized upgrade. |
| `@anvia/logger@1.1.2` | No `engines`; depends on Pino. | Not installed or run. | Likely Node-API-compatible under Bun, but unverified. A create/log/flush/close smoke is required before selection. |
| `@anvia/otel@1.1.2` | No `engines`; depends on OTel API packages, while SDK/exporter ownership remains with the host. | Not installed or run. | Plausible on Bun, but the chosen SDK/exporter combination needs an end-to-end span and flush smoke. |
| `@anvia/langfuse@1.1.2` | No package engine, but dependencies include `@opentelemetry/sdk-trace-node`. | Not installed or run. | Node-oriented and unverified on Bun. Do not select based on TypeScript success alone. |
| `@anvia/studio@1.1.2` | Explicit `node >=20.12.0`; includes `@hono/node-server`. | Not installed or run. | Official contract is Node, not Bun. A Bun start/fetch/shutdown smoke is mandatory; otherwise run Studio in an explicitly Node-owned local process or defer it. |
| `@anvia/lens@1.1.2` | Explicit `node >=24`; official docs repeat Node 24+. | Not installed or run. | Not a supported in-process choice for Flemme's declared Bun runtime. Treat as blocked unless Anvia documents Bun support or architecture explicitly introduces a Node 24 process. |

The assessment deliberately does not convert “no Node engine” or “TypeScript compiles” into official Bun support. The [Core runtime compatibility section](https://docs.anvia.dev/packages/core#runtime-compatibility) is broad, while the [Lens compatibility section](https://docs.anvia.dev/packages/lens#compatibility) is explicitly Node 24+.

## Migration Options

### Option A — Stay on the current version

Flemme can immediately implement deterministic and model-scored eval suites around `runCookingRecommendation`, `runPreCooking`, `runActiveCooking`, and `runCompletion`. Core reporters/CLI output are also available. It can also construct an Agent with structured output and named observers, but current intent execution will not emit Agent observer events until an intent is migrated from direct `generateCompletion` to `Agent.generate`.

Remaining limitations are adapter drift, Studio's absence, unverified Bun behavior for companion packages, and reliance on the lockfile because the manifest carets admit newer minors. Staying indefinitely would accumulate dependency and validation debt, but staying pinned for Step 2 is acceptable for Flemme v0.1 because the required evaluation API is already present.

### Option B — Upgrade before implementation

Upgrade Core to `1.5.0`, OpenAI to `1.1.5`, and Zod to at least `4.6.5` together. The expected source migration is small because the used provider/direct-completion signatures remain intact; the main work is lockfile change, peer alignment, TypeScript validation, all Agent tests, structured-output probes, and live provider verification. Companion adapters could then use their latest peer-compatible releases.

This should not block eval implementation. It expands scope and introduces a Zod/toolchain change before Flemme has an evaluation baseline, while Core `1.1.2` already supplies the needed eval APIs.

### Option C — Incremental migration

This path is viable because each intent is already an async function with validated input/output boundaries, and Core eval targets accept ordinary sync or async functions (`packages/agent/src/intents/*.ts`; installed `@anvia/core/evals` declarations).

1. Preserve the existing intent functions and exported runtime APIs.
2. Implement Step 2 eval suites around those functions using locked Core `1.1.2`, starting with deterministic metrics and explicit fixtures.
3. Record the baseline, then perform a separate synchronized Core/OpenAI/Zod upgrade and rerun the same suites plus live structured-output probes.
4. Migrate one intent—Recommendation is the simplest first candidate—internally to a single-turn Anvia `Agent` while preserving its current function signature and application-owned credentials.
5. Attach one local observer and verify Bun behavior before selecting Logger, OTel, Langfuse, or another production backend.
6. Add Studio only after a real Agent object exists and only after its explicit Node runtime boundary is resolved.

## Recommended Path

Choose Option C. Begin Step 2 on the locked dependency graph, use `@anvia/core/evals` directly, and keep the target functions unchanged. This produces a regression baseline before dependency or runtime behavior changes.

Create a separate follow-up dependency task after the first eval baseline to migrate `@anvia/core`, `@anvia/openai`, and Zod together. Do not mix that task with Agent conversion or observer selection. After the synchronized upgrade passes, convert one intent behind the same public API, attach a minimal local observer, and run a Bun smoke before choosing any production adapter. Exclude Lens from the in-process shortlist while it requires Node 24.

## Step 2 Entry Criteria

- [x] Exact Core version known: declared `^1.1.2`, locked/resolved `1.1.2`.
- [x] Exact provider adapter version known: declared `^1.1.2`, locked/resolved `1.1.2`.
- [x] Eval import path verified: `@anvia/core/evals` imports and executes under Bun `1.2.20`.
- [x] Current intent entry points identified: `runCookingRecommendation`, `runPreCooking`, `runActiveCooking`, and `runCompletion`.
- [x] Output schema compatibility verified for the locked graph: Core peer `^4.4.0`, Agent-path Zod `4.5.4`, existing schema tests pass, and runtime construction accepts the schemas.
- [x] Dependency migration decision recorded: defer synchronized Core/OpenAI/Zod upgrade until after the baseline eval harness.
- [x] Bun blockers recorded: companion adapters are unverified; Studio is Node `>=20.12.0`; Lens is Node `>=24`.
- [x] No dependency files were mutated during the audit.

**Step 2 status: READY.** The existing unrelated Agent typecheck failure in OpenAI declaration files must be resolved before Step 2 can be declared complete, but it does not prevent writing or running the initial Bun eval harness.

## Evidence and Verification

Repository evidence:

- `package.json`, `turbo.json`, `bun.lock`
- `packages/agent/package.json`, `packages/agent/tsconfig.json`, `packages/agent/README.md`
- `packages/agent/src/providers/openai.ts`
- `packages/agent/src/intents/{cooking-recommendation,pre-cooking,active-cooking,completion}.ts`
- `packages/agent/src/runtime/cooking-agent.ts`
- `packages/agent/src/evals/run-evals.ts`
- `packages/agent/structured-output-probe.ts`, `packages/agent/runners/*.ts`
- `node_modules/@anvia/core/package.json`, installed Core declarations and README
- `node_modules/@anvia/openai/package.json`, installed adapter declarations and README
- `docs/architecture.md`, `docs/code-standards.md`, `docs/ai-workflow-rules.md`, `docs/progress-tracker.md`

Official external evidence:

- [Anvia Core package guide](https://docs.anvia.dev/packages/core)
- [Anvia Studio guide](https://docs.anvia.dev/packages/studio)
- [Anvia OTel guide](https://docs.anvia.dev/packages/otel)
- [Anvia Langfuse guide](https://docs.anvia.dev/packages/langfuse)
- [Anvia Lens guide](https://docs.anvia.dev/packages/lens)
- [Anvia Core source changelog](https://github.com/anvia-hq/anvia/blob/main/packages/core/CHANGELOG.md)
- [Anvia OpenAI source changelog](https://github.com/anvia-hq/anvia/blob/main/packages/provider-openai/CHANGELOG.md)
- Official npm registry metadata queried through Bun for all versions, peers, engines, and dependencies in the matrices.

Verification results:

| Command / check | Result |
| --- | --- |
| `git status --short` and `git diff --stat` before audit | Passed; only the pre-existing untracked task brief was present. |
| `bun pm ls --all` | Passed; Core and OpenAI resolve once at `1.1.2`. |
| Bun registry metadata queries (`bun pm view ...`) | Passed after network access was allowed; no install/update command was run. |
| Current capability import/construction smoke | Passed under Bun `1.2.20` for eval exports, OpenAI model creation, Agent `outputSchema`, named observers, and `primaryTrace`. |
| One-case deterministic `runEvalSuite` smoke | Passed: 1 case passed and 1 metric passed. |
| `bun run --filter @flemme/agent test` | Passed: 62 tests, 107 expectations, 0 failures. |
| `bun run --filter @flemme/agent typecheck` | Failed in `node_modules/openai/internal/types.d.mts` with unterminated-string/parser errors before project source validation. This is an existing dependency/toolchain issue, not an audit change. |
| Agent package build | Not run: `packages/agent/package.json` defines no build script. |

## Unknowns and Required Smoke Tests

1. Resolve or reproduce the current `openai/internal/types.d.mts` parse failure so Step 2 can satisfy the repository typecheck completion gate.
2. For Step 2 model-scored metrics, run one controlled Bun provider call using the existing OpenAI-compatible model and record rate/cost behavior; deterministic metrics do not need this.
3. In the later synchronized upgrade task, install only explicitly selected versions of Core, OpenAI, and Zod, then run Agent tests, typecheck, direct structured-output probes, and one live call for each critical intent.
4. Before adopting `@anvia/logger`, run a Bun create/log/flush/shutdown smoke with payload redaction checked.
5. Before adopting `@anvia/otel`, verify one Agent run produces a trace and that the selected processor/exporter flushes cleanly under Bun.
6. Before adopting `@anvia/langfuse`, verify its Node-oriented OTel dependencies, redaction, flush, and close lifecycle under Bun.
7. Before adding Studio, start it on loopback under Bun, register one real Agent, exercise one request, fetch the UI/API, and shut it down cleanly. If this fails, use an explicitly Node `>=20.12.0` local process or defer Studio.
8. Do not attempt an in-process Lens integration until its Node `>=24` requirement is reconciled with Flemme's Bun architecture or Anvia publishes explicit Bun support.

Final Step 2 checklist:

- [x] Locked Core and provider versions are exact and mutually compatible.
- [x] `@anvia/core/evals` is present and executable under the declared Bun version.
- [x] Existing async intent targets and output schemas are identified.
- [x] Deterministic evals can start without an Agent refactor, Studio, observer backend, or dependency upgrade.
- [x] Dependency files remain untouched.
- [ ] Existing Agent typecheck parser failure is resolved before Step 2 completion.
- [ ] Provider-backed judge metrics receive a controlled live Bun smoke before being made a required CI gate.
