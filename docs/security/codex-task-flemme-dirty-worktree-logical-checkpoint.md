# Codex Task — Preserve Flemme Dirty Worktree in Logical Commits

## Objective

Safely preserve all intended current Flemme work in reviewed logical commits so the active dirty clone can later be retired after the approved NeedMCP history rewrite.

This task may create local commits. It must not push, fetch, rewrite history, amend existing commits, switch branches, stash, reset, clean, or delete ambiguous work.

## Confirmed starting state

- Current branch: `fix/agent`.
- Security remediation commit:
  - `9f767476409e0c91084d90be1e76c7f22aafbe78`
  - subject: `security: remove unused NeedMCP integration`.
- The remediation commit is local-only and must remain unchanged.
- `.codex/config.toml` is absent from the working tree, index, and `HEAD`.
- The NeedMCP key is revoked.
- The sensitive screenshot is deleted.
- Current-tree scans found no active NeedMCP configuration or credential-shaped static assignment.
- The active worktree contains intended Agent/Lens observability work, web favicon/not-found work, reports/plans, and related assets.
- Three ignored environment files must remain untracked:
  - `.env`;
  - `infra/lens-local/.env`;
  - `infra/lens-local/.env.flemme-agent`.
- Git history rewrite remains blocked and is outside this task.

## Core rules

1. Preserve user work.
2. Inspect before staging.
3. Stage explicit paths or reviewed hunks only.
4. Never use `git add .`, `git add -A`, wildcard staging, or broad directory staging without a verified inventory.
5. Never expose ignored environment values or historical `.codex/config.toml` contents.
6. Do not mix unrelated web and observability changes into one commit merely to make the worktree clean.
7. If ownership or intent of any change is unclear, leave it untouched and report a blocker instead of guessing.

## Expected change families

The prior path-level inventory suggests three likely logical groups. Treat these as hypotheses that must be verified from actual diffs and references.

### Group A — Agent eval and Lens observability foundation

Likely paths:

```text
.env.example
apps/api/index.ts
docs/evals/
docs/progress-tracker.md
infra/lens-local/
packages/agent/evals/README.md
packages/agent/index.ts
packages/agent/package.json
packages/agent/runners/recommendation-observability-canary.ts
packages/agent/src/intents/cooking-recommendation.ts
packages/agent/src/observability/
packages/agent/src/runtime/cooking-agent.ts
packages/agent/src/runtime/cooking-agent-observability.test.ts
tools/lens-eval-smoke/
```

Candidate commit subject:

```text
feat(agent): add Lens eval and runtime observability foundation
```

### Group B — Web favicon and custom not-found experience

Likely paths:

```text
apps/web/index.html
apps/web/public/favicon.ico
apps/web/public/not-found.png
apps/web/public/brain-flemme-recolored.png
apps/web/public/brain-flemme.png
apps/web/public/flemme-mascot.png
apps/web/src/auth/auth-shell.tsx
apps/web/src/components/not-found-page.tsx
apps/web/src/routes/__root.tsx
```

Candidate commit subject:

```text
feat(web): add favicon and custom not-found experience
```

The deleted brain/mascot assets may be committed only after proving no remaining source or build reference requires them and that their removal is intentional replacement, not accidental loss.

### Group C — Execution and security documentation

Likely paths:

```text
docs/plans/
docs/security/needmcp-history-cleanup-preflight.md
```

Candidate commit subject:

```text
docs: record eval observability and security execution plans
```

Do not duplicate the already committed credential audit report or amend the security remediation commit.

## Required execution order

### Stage 1 — Read repository instructions and establish the baseline

1. Read all applicable `AGENTS.md` files.
2. Read:
   - `docs/security/codex-config-credential-audit.md`;
   - `docs/security/needmcp-history-cleanup-preflight.md`;
   - relevant eval/observability reports;
   - relevant plan files;
   - relevant package and application READMEs.
3. Record:
   - current branch;
   - `HEAD`;
   - `git status --short`;
   - staged-path inventory;
   - stash count;
   - ignored-path inventory at path level only.
4. Verify:
   - branch is `fix/agent`;
   - `HEAD` is the security remediation commit or a direct descendant with no unexpected commit;
   - no files are currently staged;
   - no stash exists;
   - `.codex/config.toml` remains absent.

Stop if these facts differ materially from the expected state.

### Stage 2 — Perform a sanitized security check

Before reading or staging feature diffs:

- confirm no current tracked or untracked non-ignored file contains a NeedMCP credential-shaped static value;
- confirm no active NeedMCP MCP configuration exists;
- confirm all three ignored environment files remain ignored and untracked;
- scan candidate new files for generic credential patterns without printing matched values;
- report only counts and paths.

If any credential is detected, stop. Do not stage or commit anything.

### Stage 3 — Audit every current change

Inspect all modified, deleted, and untracked paths.

For each path, determine:

- intended feature/change family;
- whether it is source, test, documentation, generated output, secret/runtime state, or obsolete asset;
- whether another changed path depends on it;
- whether it belongs in Git;
- whether it is complete enough to commit;
- whether it contains sensitive or machine-local data.

Do not inspect ignored secret values. For ignored files, path/status evidence is sufficient.

Produce an internal staging manifest before running any `git add` command. The manifest must list every path assigned to each proposed commit and every path intentionally left uncommitted.

### Stage 4 — Validate the web asset transition

Before staging Group B:

1. Search current source and build configuration for references to the three deleted brain/mascot images.
2. Verify `favicon.ico` is referenced correctly.
3. Verify `not-found.png` and `not-found-page.tsx` are referenced by the intended routing/error boundary.
4. Verify authentication/error routing behavior is not unintentionally changed.
5. Run relevant web tests, typecheck, and production build.

If a deleted asset is still referenced, fix only the direct reference when intent is unambiguous. Otherwise stop and report the ambiguity. Do not restore or delete assets speculatively.

### Stage 5 — Validate Agent and Lens observability work

Before staging Group A, confirm:

- Lens infrastructure configuration contains no real secrets;
- `.env.example` contains names/placeholders only;
- Lens secret files remain ignored;
- Node 24 relay isolation remains intact;
- Bun remains the main application runtime;
- observability remains disabled by default;
- Recommendation-only instrumentation is preserved;
- payload capture remains disabled;
- input/output/user/household/inventory/recipe data is not captured;
- fail-open and bounded-delivery behavior remains intact;
- fake-model canary and eval commands are documented accurately;
- no live-model trace or additional cooking phase instrumentation is introduced.

Run the focused observability, agent, eval, API, typecheck, and build checks documented by the implementation reports.

### Stage 6 — Review documentation accuracy

Confirm that reports, progress tracker, and task plans reflect the actual code and current status:

- Evals complete.
- Lens infrastructure complete locally.
- Eval ingestion manually confirmed.
- Recommendation deterministic runtime trace manually confirmed.
- Live-model trace not started.
- Other cooking phases not instrumented.
- Deployment not started.
- NeedMCP integration removed and key revoked.
- History cleanup preflight complete but execution blocked until the worktree is preserved and live remote gates are reviewed.

Correct only factual inconsistencies directly related to these changes.

### Stage 7 — Run pre-commit verification

Before creating any commit, run at minimum:

1. Focused observability tests.
2. Agent/eval tests.
3. Relevant API tests.
4. Relevant web tests.
5. Full repository tests.
6. Root typecheck.
7. Isolated Node relay/tool typecheck and frozen install checks.
8. Production build.
9. Scoped Biome checks.
10. `git diff --check`.
11. Sanitized current-tree secret scan.

Database-backed tests may use only the repository's established isolated test-database procedure. Do not touch development, staging, or production databases.

If verification fails, fix only failures caused by the current changes and rerun the affected checks. Stop on unrelated or ambiguous failure.

### Stage 8 — Create logical commits

Only after the staging manifest and verification are clean:

1. Stage explicit reviewed paths for one group.
2. Check `git status --short` and `git diff --cached --stat`.
3. Run `git diff --cached --check`.
4. Confirm ignored secret files are not staged.
5. Create the commit using the approved subject or a more accurate concise subject.
6. Repeat for the next group.

Do not display a staged patch if it could contain a secret. Use path and stat summaries plus sanitized scanners.

Expected order:

1. Agent/Lens observability implementation.
2. Web favicon/not-found implementation.
3. Plans/security documentation.

The order may change only when a documented dependency requires it.

Do not amend, squash, rebase, or modify the existing security remediation commit.

### Stage 9 — Post-commit verification

After all intended work is committed:

1. Run the full repository test suite.
2. Run root typecheck.
3. Run production build.
4. Run relevant frozen-install checks.
5. Run scoped Biome.
6. Run `git diff --check`.
7. Run the sanitized current-tree secret scan.
8. Record `git status --short`.
9. Record the new local commit hashes and subjects.
10. Confirm no commit was pushed.

The desired end state is:

- no modified, deleted, staged, or wanted untracked paths;
- only the three known ignored environment files remain locally;
- every intended source, test, asset, report, tool, and plan is preserved in a logical commit;
- security remediation commit remains in ancestry unchanged.

If any path remains, report it and explain why. Do not delete or force-add it merely to make status clean.

## Allowed actions

- Inspect current non-secret diffs and references.
- Make narrow fixes required to complete already-started work.
- Update directly related documentation for factual accuracy.
- Stage explicit reviewed paths.
- Create local logical commits.
- Run tests, builds, typechecks, formatting checks, and sanitized secret scans.
- Use the established isolated PostgreSQL test procedure when required.

## Forbidden actions

- Do not push or fetch.
- Do not rewrite history.
- Do not amend or rebase.
- Do not change branches or create/delete refs.
- Do not stash, reset, restore, checkout, or clean.
- Do not run `git add .`, `git add -A`, or broad wildcard staging.
- Do not force-add ignored files.
- Do not read, print, copy, modify, stage, or commit ignored environment values.
- Do not restore `.codex/config.toml`.
- Do not contact NeedMCP.
- Do not enable live-model tracing, add another cooking phase, or start deployment.
- Do not delete or relocate ambiguous files.
- Do not include unrelated fixes or refactors.

## Stop conditions

Stop without staging or committing if:

- a credential is detected;
- ignored environment files are not ignored;
- the security remediation commit is missing or altered;
- pre-existing staged content exists;
- any current change cannot be confidently assigned to a logical group;
- an asset deletion appears accidental;
- verification exposes unrelated failures;
- repository state changes unexpectedly;
- completing the work requires branch switching, history manipulation, or remote access.

If ambiguity appears after one or more groups are safely committed, preserve those commits and stop before touching the ambiguous group.

## Required final response

Return:

1. Initial branch, `HEAD`, and worktree counts.
2. Sanitized security scan result.
3. Final staging manifest grouped by commit.
4. Verification results before commits.
5. Commit hashes and subjects created.
6. Verification results after commits.
7. Final worktree status.
8. Ignored environment-file confirmation.
9. Remaining blockers or ambiguous paths.
10. Confirmation that nothing was pushed and history was not rewritten.

## Acceptance criteria

This task is complete only when:

- every intended current change is reviewed and preserved;
- commits are logically separated;
- ignored secrets remain outside Git;
- all required verification remains green;
- the active worktree is clean except for known ignored local environment files;
- no push or history rewrite occurs.
