# Codex Task — NeedMCP Git History Cleanup Preflight

## Objective

Produce a precise, non-destructive cleanup plan for removing the deleted `.codex/config.toml` file and its revoked NeedMCP credential from Flemme Git history.

This task is **preflight only**. It must not rewrite history, modify refs, fetch, push, force-push, stage files, create commits, or alter the remote.

## Security context

- `.codex/config.toml` contained an unused static NeedMCP `X-API-Key` credential.
- The project no longer uses NeedMCP.
- The entire project-local `.codex/config.toml` file has been deleted from the current working tree.
- A current-tree scan for the credential prefix returned no matches.
- The only current-tree reference to `needmcp` is the sanitized audit report under `docs/security/`.
- The credential was previously present in one historical commit.
- Cached remote-tracking evidence showed reachability from `origin/main`, `origin/HEAD`, and three `origin/fix/*` refs.
- The raw value has appeared in a screenshot and must be considered compromised.
- The value must never be reproduced in commands, logs, patches, reports, screenshots, or tool output.

## Mandatory manual prerequisites

Before doing any analysis, request or verify the owner's explicit confirmation of all three statements:

```text
NeedMCP key revoked
Sensitive screenshot deleted
Current-tree security remediation committed but not pushed
```

Verification must not test the old credential against NeedMCP.

If any statement is not confirmed, stop with:

```text
BLOCKED_SECURITY_PREREQUISITE
```

and list only the missing confirmation. Do not continue.

## Critical secrecy rules

Never:

- print or reconstruct the old credential;
- print deleted content from `.codex/config.toml`;
- run a command that displays the sensitive patch;
- use the credential in `git log -S`, `git grep`, a command argument, environment variable, temporary file, replacement map, backup file, or report;
- create a plaintext Git bundle, tag, branch, archive, mirror, patch, or backup containing the secret;
- contact NeedMCP to test whether the revoked key works;
- include a raw remote URL if it embeds credentials.

History analysis must operate by the known path `.codex/config.toml`, commit topology, and sanitized metadata—not by handling the secret value.

## Current worktree warning

The active Flemme clone previously showed many unrelated modified and untracked files across web assets, API, agent observability, Lens infrastructure, reports, and tools.

The active clone must be treated as valuable and dirty unless proven otherwise. Do not stash, reset, clean, checkout, restore, switch branches, rebase, or rewrite anything in it.

## Required execution order

### Stage 1 — Read instructions and security evidence

1. Read all applicable `AGENTS.md` files.
2. Read the sanitized report:
   - `docs/security/codex-config-credential-audit.md`.
3. Read relevant repository contribution, branch, and deployment documentation.
4. Record `git status --short`, current branch name, and current `HEAD` without expanding file diffs.
5. Confirm the raw credential is absent from the current working tree using only the established sanitized scanner behavior.

Do not display `git diff` or `git show` for `.codex/config.toml`.

### Stage 2 — Verify the current-tree remediation checkpoint

Determine without displaying sensitive diffs:

- whether `.codex/config.toml` is absent from the working tree;
- whether its deletion is committed;
- the remediation commit hash and commit subject;
- whether the remediation commit has been pushed or remains local;
- whether `docs/security/codex-config-credential-audit.md` is committed;
- whether any NeedMCP configuration remains active;
- whether any current tracked/untracked non-ignored file contains a credential-shaped NeedMCP value.

If the deletion is not yet committed, stop after writing the sanitized report. Do not stage or commit it.

### Stage 3 — Map repository topology

Using only local Git metadata, record:

- current branch;
- default branch as represented locally;
- local branches;
- remote-tracking branches;
- tags;
- worktrees;
- remotes with sanitized host/repository identity and no embedded credentials;
- ahead/behind relationships available from existing local refs;
- whether shallow clone, partial clone, alternates, grafts, or replace refs are present;
- whether submodules are involved;
- whether Git LFS is involved;
- whether `git-filter-repo` is already installed and its version.

Do not fetch, install tools, or mutate refs.

### Stage 4 — Map historical exposure by path

Audit the known sensitive path `.codex/config.toml` without printing its contents.

Record:

- all commits that add, modify, rename, or delete the path;
- earliest introduction commit;
- current-tree deletion/remediation commit;
- every local branch, remote-tracking ref, and tag that contains a commit where the file exists;
- whether the path was renamed or copied under another path;
- whether merge commits replicate the path;
- whether the path appears in trees reachable from refs not identified in the original audit.

Report only commit hashes, dates, subjects, ref names, and presence/absence facts. Do not report blobs, patches, lines, values, or object contents.

### Stage 5 — Determine remote uncertainty

Clearly distinguish:

- local branches;
- cached remote-tracking refs;
- actual remote state, which is not refreshed in this task;
- server-side pull-request refs or caches that cannot be proven from the local clone.

If GitHub CLI is already installed and authenticated, it may be used only for read-only repository metadata that cannot expose the secret, such as:

- repository visibility;
- default branch;
- branch names;
- branch protection/ruleset presence;
- open pull requests whose head/base branches intersect affected refs.

Do not authenticate, modify repository settings, fetch refs, close PRs, delete branches, or push.

If read-only remote metadata is unavailable, mark it as an explicit manual checkpoint rather than guessing.

### Stage 6 — Assess the dirty-worktree migration problem

Inventory the active clone at the path/status level only.

Classify work into:

- committed and already remote;
- committed but local-only;
- staged;
- modified tracked files;
- deleted tracked files;
- untracked files;
- ignored secret/runtime files.

Do not read unrelated user changes or generate patches.

Decide what must happen before any rewrite:

- security remediation commit completed;
- legitimate feature work divided into logical commits;
- all wanted untracked assets added intentionally;
- ignored Lens secrets retained outside Git;
- no stash containing sensitive history;
- no pending work that would be lost when the old clone is retired.

The final plan must not recommend running `git filter-repo` in this active dirty clone.

### Stage 7 — Design the cleanup strategy

Prefer removing the entire obsolete path from all affected history:

```text
.codex/config.toml
```

This avoids reading or placing the old credential into a replacement-text file.

Design a later execution procedure that uses:

1. A fresh disposable clone created only after remote refs have been deliberately refreshed.
2. A verified `git-filter-repo` installation.
3. Whole-path removal with `--invert-paths`.
4. Object/ref verification inside the disposable clone.
5. Explicit affected branch and tag pushes only.
6. No `git push --mirror`.
7. No broad wildcard force-push.
8. A second fresh clone after rewrite for verification.
9. Retirement/quarantine of the old working clone so it cannot accidentally repush old history.

Do not execute any of these steps during preflight.

### Stage 8 — Design push safety and coordination

The runbook must identify:

- exact affected branch refs;
- whether any affected tag refs exist;
- protected branch/ruleset blockers;
- open PR implications;
- collaborator coordination required;
- CI/deployment references to old commit SHAs;
- required temporary branch-protection changes, if any;
- explicit force-push commands to be reviewed later, but not executed now;
- post-rewrite instructions for collaborators to re-clone rather than merge old history;
- rollback limitations.

Do not recommend `--force` when `--force-with-lease` or an explicit expected-old-object safeguard can be used. If a mirror-style workflow makes leases unavailable, design an explicit ref-by-ref expected-old-SHA check before any later push.

Never push all refs implicitly.

### Stage 9 — Backup and recovery policy

Because the old history contains a revoked secret, do not create an ordinary plaintext backup bundle or backup branch.

The runbook must choose one:

- no additional backup because the existing remote and old quarantined clone temporarily preserve recovery material; or
- an encrypted offline backup with a defined deletion date and owner-controlled storage.

Do not create either during this task.

Explain that any recovery source containing the old history also contains the revoked credential and must never be pushed back.

### Stage 10 — Define verification gates

The later execution task must verify:

- `.codex/config.toml` is absent from every rewritten reachable tree;
- no NeedMCP credential-shaped value exists in rewritten reachable blobs;
- expected branches/tags exist and point to rewritten histories;
- current application source and legitimate recent commits remain present;
- repository build/tests can run from a fresh post-rewrite clone;
- GitHub branch/default-branch state is correct;
- old commit SHAs are no longer reachable from advertised rewritten refs;
- no old-history clone pushes after the rewrite.

The verification must not print sensitive blob contents.

### Stage 11 — Write the preflight report

Create:

```text
docs/security/needmcp-history-cleanup-preflight.md
```

Required sections:

```text
# NeedMCP History Cleanup Preflight

## Security prerequisites
## Current remediation state
## Active worktree risk
## Repository topology
## Historical exposure map
## Affected refs
## Remote-state limitations
## Selected cleanup strategy
## Dirty-worktree migration plan
## Branch and collaborator coordination
## Push safety plan
## Backup and recovery policy
## Post-rewrite verification
## Manual approval checklist
## Exact next task scope
```

The report must be sanitized and must not contain the credential or any derived representation.

## Forbidden actions

- Do not modify `.codex/config.toml` or restore it.
- Do not stage or commit anything.
- Do not fetch, pull, push, or contact a Git remote for Git operations.
- Do not create/delete/move branches, tags, refs, or worktrees.
- Do not stash, reset, clean, checkout, switch, rebase, merge, cherry-pick, or amend.
- Do not run `git filter-repo`, `filter-branch`, BFG, or replacement scripts.
- Do not install tools.
- Do not create a Git bundle, mirror clone, backup ref, archive, or patch.
- Do not alter GitHub settings, branch protection, PRs, releases, or deployments.
- Do not run commands that print the sensitive diff/blob.
- Do not begin the live-model canary, other observability phases, or deployment.

## Stop conditions

Stop and report a sanitized blocker if:

- key revocation is not explicitly confirmed;
- sensitive screenshot deletion is not explicitly confirmed;
- current-tree remediation is not committed;
- the current tree still contains a NeedMCP credential-shaped value;
- another credential is discovered;
- repository state changes unexpectedly;
- a command emits sensitive content;
- affected refs cannot be mapped reliably;
- uncommitted work would be at risk in a later rewrite;
- remote repository identity or default branch is ambiguous.

## Required final response

Return only sanitized information:

1. Preflight status: ready or blocked.
2. Confirmation of security prerequisites.
3. Remediation commit hash and pushed/unpushed state.
4. Dirty-worktree status and risk.
5. Affected local and remote-tracking refs.
6. Tags and PR/ruleset findings, if available.
7. Selected whole-path cleanup strategy.
8. Exact manual checkpoints before execution.
9. Explicit confirmation that no history or remote was changed.
10. Report path.

## Acceptance criteria

This task is complete only when:

- all manual security prerequisites are confirmed;
- current-tree remediation status is known;
- all locally discoverable affected refs are mapped;
- dirty-worktree risk is addressed in the plan;
- the plan removes the obsolete file by path without handling the credential value;
- destructive execution is deferred to a separate explicitly approved task;
- no ref, history, remote, or unrelated user work is modified.
