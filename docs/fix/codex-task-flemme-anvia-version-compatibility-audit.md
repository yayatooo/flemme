# Codex Task — Flemme Anvia Version & Compatibility Audit

## Task position

This is **Step 1** of the Flemme evals and observability implementation sequence.

The purpose of this task is to establish the exact current Anvia dependency state and determine the safest compatibility path before any implementation begins.

Do not implement evals, observability, Studio, Agent refactors, or dependency upgrades in this task.

## Project context

Flemme is an AI cooking assistant implemented as a monorepo using Bun.

The relevant package is expected to be `packages/agent`. Its current architecture separates:

- providers;
- prompts;
- intents;
- runtime;
- schemas;
- local runners.

Known Flemme phases currently include:

- cooking recommendation;
- pre-cooking;
- active cooking;
- completion.

The current implementation is believed to use an OpenAI-compatible `OpenAIClient`, `generateCompletion`, and Zod structured output schemas. Treat this only as context: verify the actual repository state and do not assume it is still accurate.

The next planned capabilities are:

- evals through `@anvia/core/evals`;
- runtime observability through Anvia observer contracts and an adapter;
- local inspection through Anvia Studio.

Those capabilities must not be implemented until this audit establishes whether the currently installed packages expose the required contracts and whether a migration is required.

## Primary objective

Produce an evidence-based compatibility audit answering:

1. Which Anvia packages and exact versions are declared and locked in Flemme?
2. Which Anvia APIs are currently imported and used by `packages/agent`?
3. Does the installed `@anvia/core` version provide the eval and observability APIs needed by the next steps?
4. What would change if Flemme moved to the current stable Anvia release?
5. Is the current Bun runtime compatible with the candidate Anvia packages?
6. Should Flemme stay pinned temporarily, upgrade first, or migrate incrementally?

## Mandatory operating rules

- Read and follow the repository's `AGENTS.md` files before inspecting or writing anything.
- Inspect the current Git status before starting.
- Preserve every pre-existing user change in the worktree.
- Do not expose or print secrets from `.env` files.
- Do not run `bun add`, `bun update`, `npm install`, `pnpm install`, or any command that can rewrite dependency state.
- Do not edit any `package.json`, lockfile, source file, test file, or configuration file.
- Do not use `@latest` in an installation command.
- Do not make speculative API claims. If an API cannot be verified, mark it `unverified` and explain why.
- Prefer official Anvia documentation, official package metadata, changelogs, migration guides, and the official Anvia GitHub repository as external evidence.
- This is a read-only audit except for the single Markdown report requested below.
- Do not begin Step 2 or any later implementation step.

## Required inspection

### 1. Repository and dependency state

Inspect at minimum:

- root `package.json`;
- workspace configuration;
- `packages/agent/package.json`;
- the active Bun lockfile (`bun.lock` or `bun.lockb`);
- relevant TypeScript configuration;
- scripts used to run the agent and local runners;
- current Git status and diff summary.

Determine separately:

- declared dependency version/range;
- exact locked version;
- workspace-resolved version, if it can be verified without mutation;
- whether multiple versions of the same Anvia package exist in the dependency graph.

Do not infer an exact installed version from a semver range alone.

### 2. Anvia usage inventory

Search the entire repository for:

- imports from `@anvia/*`;
- `OpenAIClient` construction;
- `completionModel` calls;
- `generateCompletion` and `streamCompletion`;
- `Agent`, `Pipeline`, and tool primitives;
- `outputSchema` usage;
- provider options and retry configuration;
- existing observability, Studio, trace, eval, or logger code;
- environment variables related to the model provider or Anvia.

For every relevant usage, record:

- file path;
- imported symbol;
- purpose;
- whether the usage is public/runtime-critical or only a local runner/fixture;
- likely migration sensitivity.

Never copy environment variable values into the report. Names may be listed when useful.

### 3. Installed capability verification

Using the actual installed or locked version, verify whether the following are available and under which import paths:

- `runEvalSuite`;
- `defineEvalSuite` or the equivalent typed metric factory;
- deterministic eval metrics;
- LLM judge/score metrics;
- eval reporters;
- `Agent` observability configuration;
- named observers and `primaryTrace`;
- trace metadata on an Agent run;
- `outputSchema` on `Agent`;
- Studio registration support;
- any logger, OpenTelemetry, Langfuse, or Lens adapter compatible with that Core version.

Classify each capability as:

- `available now`;
- `available with an additional compatible package`;
- `requires Core migration`;
- `unverified`.

### 4. Current stable release comparison

Verify the current stable Anvia release from official sources at audit time.

Compare the current Flemme version with the current stable release, focusing only on changes relevant to Flemme:

- package/import path changes;
- `OpenAIClient` and `completionModel` signatures;
- direct completion APIs;
- structured output behavior;
- `Agent` construction and outcomes;
- eval primitives;
- observability configuration;
- Studio integration;
- peer/runtime requirements;
- minimum Node.js requirements where documented;
- known Bun compatibility or lack of official confirmation.

Do not create a generic changelog summary. Only report changes that could affect Flemme.

### 5. Bun compatibility assessment

Flemme uses Bun. Assess every proposed package individually rather than treating all `@anvia/*` packages as equally compatible.

At minimum consider:

- `@anvia/core`;
- the current OpenAI-compatible provider adapter;
- `@anvia/logger`;
- `@anvia/studio`;
- `@anvia/langfuse`;
- `@anvia/otel`;
- `@anvia/lens`.

For each, distinguish:

- officially documented support;
- likely compatibility through Node APIs;
- explicit Node-only requirement;
- compatibility that still needs a Flemme smoke test.

Do not claim Bun compatibility merely because TypeScript compiles.

## Required decision analysis

Compare these paths:

### Option A — Stay on the current version

Describe:

- what eval/observability capabilities can be implemented immediately;
- what will remain unavailable;
- technical debt introduced;
- whether this is acceptable for Flemme v0.1.

### Option B — Upgrade before implementation

Describe:

- affected files and APIs;
- expected migration size;
- compatibility risks;
- likely verification effort;
- whether the upgrade should block eval implementation.

### Option C — Incremental migration

Describe a phased path, such as:

1. preserve the existing intent API;
2. add evals around existing async intent functions;
3. migrate one intent to a single-turn `Agent`;
4. add a local observer;
5. verify Bun compatibility before selecting a production backend.

Use repository evidence to determine whether this path is actually viable.

End with one explicit recommendation. Do not leave the decision as “it depends.”

## Deliverable

Create exactly one report:

`docs/audits/anvia-version-compatibility-audit.md`

Create the parent directory only if it does not exist.

The report must contain these sections:

1. `# Flemme Anvia Version & Compatibility Audit`
2. `## Executive Decision`
3. `## Repository State`
4. `## Dependency Matrix`
5. `## Current Anvia Usage Map`
6. `## Required Capability Matrix`
7. `## Stable Release Compatibility Delta`
8. `## Bun Runtime Assessment`
9. `## Migration Options`
10. `## Recommended Path`
11. `## Step 2 Entry Criteria`
12. `## Evidence and Verification`
13. `## Unknowns and Required Smoke Tests`

Use Markdown tables for the dependency, usage, capability, and runtime matrices.

Every important conclusion must reference either:

- a repository file path;
- verified package metadata;
- or an official documentation/source URL.

Clearly separate verified facts from inferences.

## Step 2 entry criteria

The report must end with a checklist that tells us whether it is safe to begin Step 2: evaluation harness implementation.

The checklist must cover at least:

- exact Core version known;
- exact provider adapter version known;
- eval import path verified;
- current intent entry points identified;
- output schema compatibility verified;
- dependency migration decision recorded;
- Bun blockers recorded;
- no dependency files mutated during the audit.

If Step 2 is blocked, name the smallest concrete prerequisite task needed to unblock it.

## Verification before completion

Before reporting completion:

1. Re-run Git status.
2. Confirm no dependency or source file was modified.
3. Confirm the only task-created repository change is the requested audit report.
4. Confirm all commands used for verification exited successfully, or document failures honestly.
5. Review the report for speculative version claims and unsupported Bun assumptions.

## Final response format

Return:

- the recommended migration decision in one sentence;
- the current locked `@anvia/core` version;
- whether Step 2 is ready or blocked;
- the created report path;
- verification commands and their result;
- any blocker or unverified compatibility point.

Do not provide implementation code for evals or observability in the final response.
