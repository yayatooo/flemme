# Codex Task — Flemme NeedMCP History Rewrite and Controlled Push

## Objective

Complete the three remaining security processes in strict order:

1. Inspect the live GitHub remote, open pull requests, branch protection, and repository rulesets.
2. Remove the obsolete `.codex/config.toml` path from affected Git history in a fresh disposable clone.
3. Push only the approved rewritten branch refs with explicit atomic `--force-with-lease`, then verify the remote.

This is a security-sensitive history rewrite. Do not skip the approval gate between inspection and mutation.

## Confirmed starting state

- Active repository branch: `fix/agent`
- Non-ignored working tree: clean
- Nothing has been pushed since the security finding
- No history has been rewritten
- NeedMCP key: revoked
- Sensitive screenshot: deleted
- Active NeedMCP integration: removed
- `.codex/config.toml`: absent from the current tree
- Ignored local environment files must remain untouched:
  - `.env`
  - `infra/lens-local/.env`
  - `infra/lens-local/.env.flemme-agent`

Local commits that must be preserved:

1. `9f767476409e0c91084d90be1e76c7f22aafbe78` — security remediation
2. `87e11acc5149c1451b63125d7e0d6d9855ef9b56` — Lens eval/runtime observability
3. `0719527b6a29008c868e2d693ad20b4978d945a8` — web favicon/not-found work
4. `6d179e1aa66ff3f857d8b733d082fd3e7dfd9205` — documentation checkpoint

Previously identified affected branch names, which must be recalculated against live remote state:

- `fix/agent`
- `fix/landing-page-restyling`
- `fix/needmcp-implementary`
- `main`

Do not assume this list or any cached remote SHA is still current.

## Global safety rules

- Never print, reconstruct, hash, encode, or otherwise expose the revoked credential.
- Never inspect the sensitive historical file using `git show`, `git log -p`, `git diff`, or equivalent content-producing commands.
- Report only safe paths, ref names, commit IDs, counts, and pass/fail results.
- Do not rewrite the active working repository.
- Do not switch branches, reset, clean, stash, amend, rebase, or alter its index.
- Do not read, copy, upload, commit, or delete ignored environment files.
- Do not use `git push --mirror`, wildcard refspecs, unscoped `--force`, or plain `git push --force`.
- Do not delete branches or tags.
- Do not push any ref not explicitly listed and approved.
- Do not weaken branch protection or rulesets automatically.
- Do not proceed through ambiguity, authentication failure, unexpected remote movement, or failed verification.
- Keep the old active clone as temporary local recovery material. Do not delete it during this task.

## Phase 1 — Live remote and governance inspection

### 1. Revalidate the active clone

From the active Flemme repository:

- Confirm the repository root and current branch.
- Confirm `git status --short` is empty for non-ignored files.
- Confirm no staged changes and no stash was created by this task.
- Confirm HEAD is exactly `6d179e1aa66ff3f857d8b733d082fd3e7dfd9205`.
- Confirm the four required local commits form an unbroken ancestry chain.
- Confirm `.codex/config.toml` is absent from HEAD.
- Confirm the three environment files remain ignored without reading their contents.

If any check fails, stop with `BLOCKED_LOCAL_STATE_CHANGED`.

### 2. Refresh live remote refs

- Identify the remote host/repository without printing credentials or a URL containing user info.
- Run a normal `git fetch --prune origin`.
- Obtain live branch and tag refs with `git ls-remote`.
- Record the exact live SHA for every potentially affected branch.
- Confirm whether `origin/HEAD` still resolves to `origin/main`.
- Recalculate every local and live remote branch/tag whose reachable history contains `.codex/config.toml`, using path/history queries that do not display file content.
- Determine whether the live `origin/fix/agent` tip is an ancestor of the local checkpoint tip.
- Detect any new, removed, renamed, or moved affected ref compared with the preflight report.

Do not push during this phase.

### 3. Inspect GitHub coordination and protections

Use authenticated GitHub access with permission to read repository metadata. Prefer an existing authenticated GitHub CLI or GitHub integration. Do not place tokens in commands, config files, output, or reports.

Inspect and report:

- Open pull requests whose head or base uses any affected branch.
- Whether any affected branch is protected.
- Whether force pushes are allowed for each affected branch.
- Repository rulesets applying to the affected refs.
- Required status checks or approval policies that would block rewritten pushes.
- Whether the authenticated actor appears authorized to force-update the required refs.
- Whether any affected tags exist.
- Whether repository forks are visible; note that forks and existing clones cannot be rewritten by this operation.

If authenticated inspection is unavailable or incomplete, stop with `BLOCKED_GITHUB_GOVERNANCE_UNVERIFIED`. Do not infer that a 404/403 means no protection.

### 4. Verify rewrite tooling

- Check that `git-filter-repo` is installed and runnable.
- If absent, install it using the normal trusted package mechanism for the host, then print only its version.
- Do not install unrelated tools.
- Confirm adequate temporary disk space.

If tooling cannot be verified, stop with `BLOCKED_REWRITE_TOOLING`.

### 5. Produce the approval manifest

Create or update:

`docs/security/needmcp-history-rewrite-execution.md`

The report must contain only safe information:

- Inspection timestamp and repository identity.
- Current local checkpoint SHA.
- Exact affected `refs/heads/*` list.
- For each affected ref: live expected-old SHA and projected source tip before rewriting.
- Relevant open PRs.
- Protection/ruleset findings.
- Tool version.
- Proposed disposable-clone location policy.
- Exact path-removal command.
- Exact explicit atomic push shape, but do not execute it.
- Rollback limitations and the fact that the old credential is already revoked.
- Post-push verification plan.

Then stop and return:

`AWAITING_EXACT_HISTORY_REWRITE_APPROVAL`

Also print one exact approval sentence for the owner to copy. It must name every affected ref and bind approval to the recorded expected-old SHAs. Do not treat the current task request as approval for the destructive phases.

## Mandatory approval gate

Do not begin Phase 2 or Phase 3 until the owner returns the exact approval sentence generated in Phase 1.

If any live remote SHA changes after approval, the approval is invalid. Return to Phase 1 and generate a new manifest and approval sentence.

## Phase 2 — Rewrite in a disposable clone

Run this phase only after exact approval.

### 1. Freeze and prepare

- Reconfirm the active clone remains clean and at the approved checkpoint SHA.
- Re-run `git ls-remote` and confirm every approved expected-old SHA is unchanged.
- Create a new uniquely named temporary directory using `mktemp -d` outside the active repository.
- Record the directory path without including credentials.
- Create a fresh mirror clone from `origin` inside that directory.
- Import the local `fix/agent` checkpoint explicitly from the active local repository so the four local commits are preserved in the disposable clone.
- Confirm the imported `fix/agent` tip is exactly `6d179e1aa66ff3f857d8b733d082fd3e7dfd9205` before rewriting.
- Do not import ignored files, working-tree state, or unrelated local refs.

If the local checkpoint cannot be imported exactly, stop with `BLOCKED_CHECKPOINT_IMPORT`.

### 2. Capture safe before-state

Inside the disposable clone, record:

- Exact affected ref names and their approved old SHAs.
- Exact source tips that will be rewritten.
- Commit counts per affected ref.
- Confirmation that no tags are affected, or an explicit affected-tag list requiring a new approval.

Do not create a plaintext bundle or patch that contains the obsolete file. The active clone is the temporary recovery source.

### 3. Rewrite

Run the complete-path removal only inside the disposable clone:

```bash
git filter-repo --path .codex/config.toml --invert-paths --force
```

If `git-filter-repo` removes the `origin` remote as a safety measure, re-add only the previously verified sanitized remote destination through the normal credential mechanism. Never embed credentials in the URL.

### 4. Verify rewritten history before any push

All checks must pass:

- `.codex/config.toml` is absent from every rewritten reachable ref.
- No commit reachable from the rewritten refs contains that path.
- The known NeedMCP credential prefix/pattern has zero matches, using a count-only or filename-only scan that cannot print matching content.
- Active NeedMCP configuration-shaped assignments have zero matches.
- The sanitized audit/report documentation may still mention NeedMCP conceptually; that is allowed.
- The four local checkpoint commits' changes remain present on rewritten `fix/agent`, although their commit SHAs are expected to change.
- Current tree at rewritten `fix/agent` contains the intended observability, web, and documentation checkpoint files.
- The three ignored environment files were never copied into the disposable clone.
- `git fsck --full` reports no unexpected corruption.
- The rewritten ref set contains no unexpected branch/tag additions or deletions.

Run the relevant repository tests from a non-bare validation checkout of rewritten `fix/agent`:

- Full Bun test suite.
- Root typecheck.
- Production build.
- Frozen installs/checks appropriate to the repository.
- Scoped Biome/lint checks.
- `git diff --check` against the rewritten branch relationship where meaningful.

If any verification fails, do not push. Return `BLOCKED_REWRITE_VERIFICATION` with safe diagnostics.

### 5. Produce exact rewrite mapping

Update the execution report with a table containing, for every approved ref:

- Ref name.
- Approved expected-old remote SHA.
- New rewritten SHA.
- Whether the ref changed.
- Verification result.

Before Phase 3, re-run live `git ls-remote` one final time. If any old SHA differs, stop with `BLOCKED_REMOTE_MOVED_AFTER_APPROVAL`.

## Phase 3 — Controlled atomic push and verification

### 1. Push only approved refs

Construct one explicit atomic push from the disposable clone:

- One `--force-with-lease=<full-ref>:<approved-old-sha>` argument per affected branch.
- One explicit `<local-full-ref>:<remote-full-ref>` refspec per affected branch.
- `--atomic` so the operation fails as a unit where supported.
- No tags unless a separately approved affected-tag list exists.
- No mirror or wildcard refspec.
- No branch deletion.

Echo only the safe command shape with SHAs/ref names, then execute it once.

If the atomic push is rejected, stop. Do not fall back to non-atomic pushes, relax leases, disable protection, or retry with plain force.

### 2. Verify live remote

After a successful push:

- Re-read the affected live refs with `git ls-remote`.
- Confirm each ref equals its approved rewritten SHA.
- Create a second fresh validation clone from the live remote.
- Confirm the obsolete path has zero reachable-history occurrences.
- Run the same safe count-only credential/config scans against all reachable live refs.
- Confirm no unintended branch/tag was changed or deleted.
- Recheck affected open PRs and report whether GitHub updated, closed, or marked them conflicted.
- Recheck branch protections/rulesets remain intact.
- Confirm the active working clone itself was not rewritten or modified.

Do not delete the old active clone or the disposable clone automatically. Mark both as containing pre-rewrite objects until the owner performs a separate local recovery/re-clone procedure.

### 3. Final report

Update `docs/security/needmcp-history-rewrite-execution.md` with:

- Final old-to-new ref mapping.
- Push result.
- Fresh-clone verification results.
- PR/protection status after push.
- Remaining limitations: forks, existing clones, GitHub caches, and unreachable/dangling server objects may retain old data.
- Recommendation to contact GitHub Support for cached views or pull-request refs if applicable.
- Required next task: replace the active clone safely while preserving only the three ignored environment files.

Return exactly one terminal status:

- `HISTORY_REWRITE_AND_CONTROLLED_PUSH_COMPLETE`
- `BLOCKED_LOCAL_STATE_CHANGED`
- `BLOCKED_GITHUB_GOVERNANCE_UNVERIFIED`
- `BLOCKED_REWRITE_TOOLING`
- `BLOCKED_CHECKPOINT_IMPORT`
- `BLOCKED_REWRITE_VERIFICATION`
- `BLOCKED_REMOTE_MOVED_AFTER_APPROVAL`
- `BLOCKED_ATOMIC_PUSH`
- `BLOCKED_POST_PUSH_VERIFICATION`

## Explicit prohibitions

- No deployment work.
- No production database changes.
- No Lens configuration or credential changes.
- No new feature work.
- No cleanup of existing clones or temporary directories without a separate owner decision.
- No commit or push from the active working clone during this task.
- No claim that GitHub has physically purged unreachable objects unless GitHub confirms it.
