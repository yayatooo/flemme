# Codex Task — Flemme Evals & Observability Full Sequential Execution

## Mission

Execute the remaining Flemme evaluation and observability work sequentially, using the completed Anvia compatibility audit as the source of truth.

This is an implementation task, not another planning-only exercise. Implement every stage that can be completed safely in the current repository. Stop only at a genuine external or compatibility blocker, and document that blocker precisely.

## Required starting evidence

Read these before making changes:

1. Every applicable repository `AGENTS.md`.
2. `docs/audits/anvia-version-compatibility-audit.md`.
3. Current `packages/agent` source, tests, runners, schemas, and package scripts.
4. Root package/workspace configuration and active Bun lockfile.
5. Current Git status and diff.

The audit summary currently reports:

- locked `@anvia/core`: `1.1.2`;
- Bun: `1.2.20`;
- existing tests: 62 passed, 0 failed;
- Core eval smoke test: passed under Bun;
- existing typecheck failure inside `openai/internal/types.d.mts` declarations;
- Logger, OTel, Langfuse, and Studio compatibility with Bun is unverified;
- Lens explicitly requires Node.js 24+;
- recommended path: build an eval baseline on the locked dependency set, then upgrade Core/OpenAI/Zod together.

Verify this state rather than assuming it remains unchanged.

## Reference implementation

Use this repository as a **design reference only**:

`https://github.com/Devscale-Indonesia/anvia-rag-evals`

Useful patterns to adapt:

- typed eval cases in a dedicated module;
- case metadata for category and primary metric;
- a CLI eval entry point;
- a separate judge model;
- eval reporters;
- an eval README with category and metric matrices;
- using eval outcomes, latency, and token usage to improve prompts.

Do not copy its Anvia API syntax blindly. That project uses an older Anvia `0.x` stack, `AgentBuilder`, and RAG-specific metrics. Flemme must use APIs verified against its actual installed or upgraded versions.

## Non-negotiable architecture decisions

1. Evals must run independently from Lens.
2. Establish a baseline on locked Core `1.1.2` before upgrading Anvia packages.
3. Hard business rules use deterministic metrics, never an LLM judge.
4. LLM judges are added only after deterministic suites are working.
5. Do not change production output schemas merely to make evaluation easier.
6. Do not make exact recipe wording or exact recipe names a hard requirement unless the product contract explicitly requires it.
7. Do not introduce RAG-specific `faithfulness` or `retrievalContext` metrics when no retrieval system is involved.
8. Lens must not be imported into or executed inside Flemme's Bun production runtime unless official/runtime evidence proves that path supported.
9. A Node.js 24 Lens runner must remain an isolated evaluation/observability boundary, not a second production application runtime.
10. Do not introduce a custom telemetry bridge merely to force Lens integration.
11. Preserve the existing public intent functions and their behavior unless a migration step explicitly requires an internal refactor.
12. Never print credentials, `.env` contents, raw authorization headers, or secret values.

## Worktree safety

- Preserve all pre-existing user changes.
- Never discard, reset, overwrite, or reformat unrelated files.
- Before each stage, inspect the relevant diff and understand which changes belong to this task.
- Do not commit or push unless repository instructions explicitly require it.
- Use the project's existing formatter and lint conventions.
- Do not update unrelated dependencies.

---

# Stage 0 — Reconfirm baseline

## Actions

1. Record current declared and locked versions for:
   - `@anvia/core`;
   - `@anvia/openai`;
   - `zod`;
   - any existing Anvia observability packages.
2. Run the existing test command that previously produced 62 passing tests.
3. Re-run the exact Core eval smoke test identified in the audit.
4. Reproduce the package/root typecheck failure with the repository's canonical command.
5. Capture only safe error excerpts needed to identify the type declaration failure.

## Gate

Do not proceed if existing behavioral tests now fail for a reason unrelated to this task. Diagnose and report the changed baseline first.

---

# Stage 1 — Typecheck blocker isolation and remediation

## Objective

Make the existing typecheck state understandable and, when possible without violating the baseline dependency decision, clean.

## Required investigation

Determine:

- the exact declaration file and error codes;
- which installed package owns the declaration;
- whether the error is caused by a TypeScript version mismatch, module resolution, library target, declaration syntax, duplicate package versions, or an actual Flemme type error;
- whether the failing declaration is reachable from Flemme's public types;
- whether the failure existed before this task;
- whether the later coordinated Core/OpenAI/Zod upgrade is expected to fix it.

## Allowed remediation before the baseline

Apply a change only when it is small, evidence-backed, and does not upgrade the Core/OpenAI/Zod dependency set before the baseline is captured.

Examples of potentially acceptable remediation:

- correcting an invalid local TypeScript configuration when repository evidence shows it is wrong;
- removing an obsolete local workaround;
- aligning an already-declared compiler option with the repository's real runtime target.

## Forbidden shortcuts

- Do not set `skipLibCheck: true` solely to hide the error.
- Do not patch files inside `node_modules`.
- Do not add `@ts-ignore` or `@ts-expect-error` around dependency declarations.
- Do not silently downgrade TypeScript.
- Do not upgrade Core/OpenAI/Zod yet.

## Gate

If the only responsible fix requires the coordinated dependency upgrade, record the typecheck failure as a known pre-upgrade baseline and continue. It must be re-tested and resolved during the upgrade stage before final completion.

---

# Stage 2 — Recommendation eval foundation on locked Core 1.1.2

## Objective

Create the first maintainable Flemme eval suite around the real cooking recommendation runtime while preserving the current public API.

## Placement

Prefer this structure unless existing repository conventions justify a small adjustment:

```text
packages/agent/
├── evals/
│   ├── cases/
│   │   └── recommendation-cases.ts
│   ├── metrics/
│   │   └── recommendation-metrics.ts
│   ├── recommendation.eval.ts
│   └── README.md
```

Do not place eval-only fixtures in production `src` unless the project already has a strong convention for doing so.

## Target

- Invoke the real existing recommendation intent/runtime entry point.
- Inject the existing provider model through the same supported configuration boundary used by current runners.
- Reuse production input and output schemas.
- Do not duplicate prompt construction inside the eval suite.
- Forward the suite abort signal to the target if the current runtime supports it.

## Minimum recommendation case categories

Build representative cases from existing fixtures and documented Flemme decisions:

1. Common inventory fit.
2. Unknown pantry staples or seasoning.
3. Missing required ingredient.
4. Equipment-constrained recommendation.
5. Household and serving context.
6. Time-constrained session.
7. Insufficient context requiring clarification.
8. No viable recommendation without hallucinating inventory.
9. Cuisine references used as ranking signals rather than rigid quotas.
10. Cross-cuisine fallback allowed when it is the more practical result.

Use stable case IDs and typed metadata such as category, phase, and intent. Do not encode one exact recipe name as the only passing answer unless required by the fixture.

## Required deterministic metrics

Derive the exact checks from the current schemas and contracts. At minimum cover:

- output passes the production output schema;
- recommendation variant contains between one and three recommendations;
- returned servings are compatible with the resolved session/household context;
- inventory items are not silently fabricated as available;
- unknown ingredients remain unconfirmed or missing as defined by the actual schema;
- missing ingredients are represented honestly;
- equipment claims do not invent unavailable equipment;
- clarification/no-viable variants are used only when contractually valid;
- optional ingredients remain distinguishable from required ingredients;
- result uses only valid union discriminants and enum values.

Where a rule cannot be evaluated reliably from the current output contract, do not invent a brittle heuristic. Record the observability gap in the eval README.

## Runner and scripts

- Use the eval API verified for locked Core `1.1.2`.
- Prefer the CLI helper when it provides correct non-zero exit behavior; otherwise wrap `runEvalSuite` with an explicit exit policy.
- Add narrowly named scripts following existing package/root conventions, for example recommendation-only and smoke commands.
- Bound concurrency and case timeouts.
- Do not add Lens yet.
- Do not add an LLM judge yet.

## Verification gate

The recommendation smoke suite must run under Bun and produce structured pass/fail output. Ordinary unit tests must remain green.

---

# Stage 3 — Complete deterministic eval coverage for all four phases

## Shared design

Create separate cases and metrics per phase while sharing only genuinely reusable eval helpers. Avoid one giant file and avoid a generic abstraction that hides phase-specific rules.

Recommended shape:

```text
packages/agent/evals/
├── cases/
│   ├── recommendation-cases.ts
│   ├── pre-cooking-cases.ts
│   ├── active-cooking-cases.ts
│   └── completion-cases.ts
├── metrics/
│   ├── recommendation-metrics.ts
│   ├── pre-cooking-metrics.ts
│   ├── active-cooking-metrics.ts
│   └── completion-metrics.ts
├── fixtures/
├── recommendation.eval.ts
├── pre-cooking.eval.ts
├── active-cooking.eval.ts
├── completion.eval.ts
├── run-all.ts
└── README.md
```

Reuse current production fixtures where possible. Add eval-only fixtures only when a production fixture would become misleading.

## Pre-Cooking invariants

Cover at minimum:

- output passes `PreCookingOutputSchema`;
- `ingredients` describe requirements/reference, not preparation actions;
- ingredient actions belong in `preparationSteps`;
- required equipment is explicit;
- preparation and cooking stages have stable unique IDs;
- step timing uses the qualitative timing contract;
- no step-level fake minute/second precision is introduced;
- timing cues remain optional and descriptive;
- cooking stages contain executable steps;
- the produced cooking plan is treated as an immutable plan input by later phases.

## Active Cooking invariants

Cover at minimum:

- output passes `ActiveCookingOutputSchema`;
- action values belong to the current action union;
- at most one lifecycle-changing action appears in an output;
- clarification does not silently mutate state;
- pause preserves plan and progress;
- resume uses the supplied current state;
- previous/advance actions remain consistent with the supplied stage and step IDs;
- record-change uses the documented change kind and relationship fields;
- selected recipe/cooking plan is not replaced during an active session;
- completed step IDs are not silently reset;
- completion/abandonment actions occur only for compatible user intent.

Include representative cases for advance, previous step, pause, resume, record change, completion, abandonment, and clarification.

## Completion invariants

Cover at minimum:

- input satisfies the completed-session contract;
- output passes `CompletionOutputSchema`;
- the summary reflects the cooking plan and recorded changes;
- output does not invent events that are absent from the session;
- notes remain grounded in the supplied session;
- output remains cooking guidance rather than medical advice;
- completion does not emit active-cooking lifecycle actions.

## Commands

Provide:

- one smoke command;
- one command per phase;
- one command for the complete deterministic suite.

Document required environment variable names without values.

## Verification gate

All deterministic phase suites must run with the locked dependency set. If live provider credentials are missing, deterministic metric unit tests must still run, and the live eval command must fail with one clear configuration message rather than a confusing stack trace.

---

# Stage 4 — Capture the pre-upgrade baseline

## Objective

Create a reproducible, safe summary of the locked Core `1.1.2` eval run before dependency migration.

## Deliverable

Create:

`docs/evals/flemme-eval-baseline-core-1.1.2.md`

Include:

- execution date and commit/worktree context;
- Bun version;
- Core/OpenAI/Zod locked versions;
- model identifier, but never API credentials;
- suite and case counts;
- pass/fail/invalid totals per phase and metric;
- latency and token usage when exposed safely by the API;
- failed case IDs with short, non-sensitive reasons;
- known nondeterminism and retry settings;
- typecheck status;
- exact verification commands.

Do not store raw household/user profile data, full prompts, secrets, or unrestricted model responses in the report.

The same cases and metrics must be used after the dependency upgrade.

---

# Stage 5 — Coordinated Core/OpenAI/Zod upgrade

## Objective

Upgrade the compatible Anvia Core, OpenAI adapter, and Zod set together only after the baseline exists.

## Version selection

- Read the audit recommendation and verify current official package metadata/changelogs again.
- Select a mutually compatible stable version set.
- If locked Core `1.1.2` is already the correct stable target and no compatible newer set exists, record this stage as a verified no-op rather than creating lockfile churn.
- Do not upgrade unrelated packages.
- Preserve the configured OpenAI-compatible base URL and model selection behavior.

## Migration requirements

- Update declared versions and the Bun lockfile through the project's canonical Bun workflow.
- Migrate only affected Anvia API calls.
- Preserve every public Flemme intent input/output contract.
- Preserve prompt builders and structured output schemas.
- Do not combine this migration with unrelated refactoring.
- Resolve the pre-existing `openai/internal/types.d.mts` typecheck failure or document why the selected official compatible set still cannot typecheck.

## Regression verification

Run:

- full existing unit tests;
- package and root typecheck;
- formatter/linter for touched files;
- all deterministic metric tests;
- the same live eval cases used for the pre-upgrade baseline.

Create:

`docs/evals/flemme-eval-post-upgrade-comparison.md`

Compare:

- dependency versions;
- test/typecheck state;
- pass/fail/invalid counts;
- per-phase changes;
- latency and token usage when comparable;
- any output behavior regression;
- any change caused by retry or structured-output behavior.

Do not claim a quality improvement from a single stochastic run. Clearly distinguish API compatibility success from model quality variance.

## Gate

Do not continue to observability integration if production contracts regress or typecheck remains broken due to task-created changes.

---

# Stage 6 — Add bounded qualitative evaluation

## Objective

Add a small judge-based layer only after deterministic suites and the coordinated upgrade are stable.

## Judge model

- Configure a separate judge model through the existing provider abstraction.
- Allow a dedicated environment model ID with a safe fallback to the normal configured model.
- Never hardcode credentials.
- Keep judge calls out of the normal application runtime.

## Initial qualitative dimensions

Use judge metrics only for properties that cannot be expressed reliably as deterministic TypeScript checks:

- practical usefulness of a recommendation;
- whether the response directly addresses the session request;
- clarity of a pre-cooking plan;
- helpful and calm active-cooking language;
- whether completion notes accurately synthesize the supplied experience without unsupported claims.

Do not use judge metrics to validate enums, counts, schema conformance, action cardinality, or state transitions.

Start with a small representative subset rather than every case. Document the threshold, judge criteria, model, approximate cost/usage, and expected nondeterminism.

Provide separate commands for deterministic and judge-based suites so CI can run deterministic checks without incurring model-judge cost.

---

# Stage 7 — Lens integration through an isolated Node.js 24 boundary

## Objective

Report eval outcomes to Anvia Lens without adding an unsupported Lens dependency to Flemme's Bun production runtime.

## Compatibility gate

Before implementing:

1. Verify the exact Lens package version compatible with the post-upgrade Core version.
2. Verify its official minimum Node.js version.
3. Check whether Node.js 24+ is available in the environment.
4. Check only for the presence of required Lens environment variable names; never print their values.
5. Determine whether the existing agent package and provider construction can execute under Node without depending on Bun-only globals.

## Preferred implementation

If all gates pass, create the smallest isolated Node 24 eval reporter boundary supported by the repository. It may be a dedicated workspace package or an explicit Node-only runner, but it must:

- declare the Node 24 engine requirement;
- import shared cases, metrics, schemas, and target functions rather than duplicate them;
- keep Lens credentials server-side;
- use safe capture by default;
- bound captured payload size;
- redact or omit user/household/session payloads;
- flush/close the Lens client before process exit;
- leave Bun production entry points free of Lens imports;
- expose one explicit Lens eval command;
- use the post-upgrade Lens reporter API verified from the installed package.

Use trace/session metadata only when it contains non-sensitive identifiers. Do not upload raw profiles or unrestricted model responses merely for convenience.

## Live verification

When Node 24 and Lens credentials are available:

- run a minimal one-case Lens smoke suite;
- verify successful reporter flush;
- record the returned run/trace reference without exposing credentials;
- then run one small recommendation suite;
- confirm evaluator failure still produces a correct non-zero local exit when required.

## Legitimate blockers

If any of these are missing, do not fake success:

- Node.js 24 runtime;
- compatible Lens/Core package pair;
- Lens endpoint or project credentials;
- Node portability of the Flemme target without a broad runtime rewrite.

In that case:

- keep all Core evals working locally;
- write the exact blocker and smallest unblock task;
- do not create a custom HTTP bridge or add Lens to the Bun production dependency graph;
- do not substitute Logger, OTel, or Langfuse without an explicit follow-up decision.

---

# Stage 8 — Local/runtime observability decision

## Objective

Make an evidence-based decision about runtime observability after the eval and Lens work, without installing every adapter.

## Required action

Using the audit and any post-upgrade package documentation, perform minimal non-production smoke checks for only the most relevant options:

1. Anvia logger under Bun.
2. Anvia Studio under Bun for trusted local development.
3. Lens under Node 24 through the isolated boundary from Stage 7.

Do not add OTel or Langfuse merely for comparison unless Lens is blocked and the user has explicitly selected an alternative.

## Decision report

Record:

- which adapters imported and executed successfully;
- which runtimes were used;
- whether a real agent run was observed;
- data capture/privacy defaults;
- shutdown/flush behavior;
- whether the adapter is recommended for local development, CI eval reporting, or production runtime.

If Logger works under Bun, it may be integrated behind a small application-owned observability factory with safe defaults. If Studio works under Bun, expose a local-only script bound to `127.0.0.1`. Do not expose Studio publicly and do not start it from the production API.

Do not refactor every direct completion into `Agent` solely to claim observability completion. If automatic tracing requires an Agent boundary, migrate only one recommendation path as a contained proof, preserve its public contract, and document the pattern for the remaining intents.

---

# Required documentation

Update or create:

1. `packages/agent/evals/README.md`
2. `docs/evals/flemme-eval-baseline-core-1.1.2.md`
3. `docs/evals/flemme-eval-post-upgrade-comparison.md`
4. `docs/evals/flemme-evals-observability-implementation-report.md`

The final implementation report must include a stage table:

| Stage | Status | Evidence | Remaining blocker |
| --- | --- | --- | --- |

Allowed statuses:

- `completed`;
- `completed with known limitation`;
- `blocked`;
- `not applicable`.

Do not label a stage completed merely because code was written; required verification must have run successfully.

---

# Final acceptance criteria

## Evals

- Real Flemme intent functions are used as eval targets.
- Typed cases exist for recommendation, pre-cooking, active cooking, and completion.
- Deterministic business invariants are covered.
- Smoke, per-phase, and full deterministic commands exist.
- Judge suites are separate from deterministic suites.
- Eval cases do not depend on Lens.
- Pre-upgrade and post-upgrade results are documented using the same cases.

## Dependency migration

- Only the intended Core/OpenAI/Zod dependency set changed.
- Lockfile changes are explained.
- Existing tests remain green.
- Typecheck passes, or an external upstream blocker is demonstrated precisely without hiding it.
- Production schemas and public intent contracts remain compatible.

## Lens and observability

- Lens is not imported by Bun production entry points.
- A Node 24 Lens runner exists only if compatibility gates passed.
- Safe capture/redaction is the default.
- Lens live reporting is verified only when credentials and runtime are available.
- Local Logger/Studio decisions are based on actual Bun smoke tests, not assumptions.
- Studio, if enabled, binds only to a trusted local interface.

## Repository quality

- No secrets or private household data are committed.
- No unrelated user changes are modified.
- No unnecessary abstraction or second production service is introduced.
- Documentation matches the commands that actually work.

---

# Final verification

At the end:

1. Run the complete existing test suite.
2. Run package and root typecheck.
3. Run formatter/linter for all touched files.
4. Run deterministic metric unit tests.
5. Run the eval smoke suite.
6. Run all four live phase suites when credentials are available.
7. Run the bounded judge suite when judge credentials/model access are available.
8. Run the Lens smoke suite only under Node 24 when Lens credentials are available.
9. Inspect final Git status and diff for scope compliance.
10. Confirm no environment values or sensitive captured payloads entered the repository.

If a live external step cannot run, provide the exact command the user should run later and the exact success signal to expect.

---

# Final response format

Lead with the result, not the work log. Include:

1. Overall completion status.
2. Stage-by-stage status table.
3. Dependency versions before and after.
4. Eval suite totals by phase.
5. Test, typecheck, lint, and eval verification results.
6. Lens integration status and runtime boundary.
7. Files created or materially changed.
8. Any external blocker with the smallest next action.

Do not claim Lens, judge, or live provider success when the corresponding runtime or credentials were unavailable.
