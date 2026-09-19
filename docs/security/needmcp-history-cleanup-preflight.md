# NeedMCP History Cleanup Preflight

Preflight status: **BLOCKED FOR EXECUTION**. The local evidence is sufficient to
design the cleanup, but history rewriting must not begin until the dirty
worktree is migrated, the current remote state is refreshed, repository rules
and pull requests are reviewed, and `git-filter-repo` is installed and
verified.

This report contains only path, commit, and ref metadata. It does not contain
the revoked credential or any representation derived from it.

## Security prerequisites

The repository owner explicitly confirmed on 2026-09-19:

- the NeedMCP key is revoked;
- the sensitive screenshot is deleted;
- the current-tree security remediation is committed but not pushed.

The old credential was not tested and no NeedMCP service was contacted.

A value-suppressing scan examined 569 tracked and untracked, non-ignored text
files. Nine binary or large files were skipped. It found:

- zero credential-shaped static NeedMCP assignments;
- zero active NeedMCP configuration candidates;
- two sanitized NeedMCP references before this report was created:
  `docs/plans/codex-task-flemme-needmcp-history-cleanup-preflight.md` and
  `docs/security/codex-config-credential-audit.md`.

The scan emitted only counts and paths. The credential value, prefix, length,
hash, encoding, and fragments were neither supplied to the scanner nor
printed.

## Current remediation state

- Current branch: `fix/agent`
- Current `HEAD`: `9f767476409e0c91084d90be1e76c7f22aafbe78`
- Commit date: `2026-09-19T21:03:15+07:00`
- Commit subject: `security: remove unused NeedMCP integration`
- Parent: `1f0823cf91c201bc0c97c86569e7becde7b12a31`
- `.codex/config.toml`: absent from the working tree, index, and `HEAD`
- Remediation commit path changes: deletion of `.codex/config.toml` and
  addition of `docs/security/codex-config-credential-audit.md`
- Sanitized audit report: tracked and committed in the remediation commit
- Active NeedMCP configuration: none detected

The branch has no configured upstream. Comparing it directly with the cached
same-named remote-tracking ref shows `fix/agent` is one commit ahead and zero
behind `origin/fix/agent`. The cached remote tip is the remediation commit's
parent. Together with the owner's confirmation, this establishes that the
remediation commit remains local-only. The actual remote was not refreshed in
this preflight.

## Active worktree risk

The active clone is valuable and dirty. It must not be used for the rewrite.
No paths are staged and no stashes exist. The path-level inventory is:

- 12 modified tracked paths:
  `.env.example`, `apps/api/index.ts`, `apps/web/index.html`,
  `apps/web/src/auth/auth-shell.tsx`, `apps/web/src/routes/__root.tsx`,
  `docs/evals/flemme-evals-observability-implementation-report.md`,
  `docs/progress-tracker.md`, `packages/agent/evals/README.md`,
  `packages/agent/index.ts`, `packages/agent/package.json`,
  `packages/agent/src/intents/cooking-recommendation.ts`, and
  `packages/agent/src/runtime/cooking-agent.ts`;
- 3 deleted tracked paths:
  `apps/web/public/brain-flemme-recolored.png`,
  `apps/web/public/brain-flemme.png`, and
  `apps/web/public/flemme-mascot.png`;
- 30 untracked, non-ignored files under web assets/components, evaluation and
  plan documentation, `infra/lens-local`, agent observability, and
  `tools/lens-eval-smoke`;
- 3 ignored environment files: `.env`, `infra/lens-local/.env`, and
  `infra/lens-local/.env.flemme-agent`.

The full untracked inventory at preflight time is:

```text
apps/web/public/favicon.ico
apps/web/public/not-found.png
apps/web/src/components/not-found-page.tsx
docs/evals/flemme-recommendation-runtime-observability-canary-report.md
docs/plans/codex-task-flemme-codex-config-credential-audit.md
docs/plans/codex-task-flemme-lens-eval-ingestion-smoke-test.md
docs/plans/codex-task-flemme-needmcp-history-cleanup-preflight.md
docs/plans/codex-task-flemme-recommendation-runtime-observability-canary.md
infra/lens-local/.env.example
infra/lens-local/README.md
infra/lens-local/compose.yml
infra/lens-local/generate-secrets.ts
packages/agent/runners/recommendation-observability-canary.ts
packages/agent/src/observability/recommendation-observability.test.ts
packages/agent/src/observability/recommendation-observability.ts
packages/agent/src/observability/recommendation-relay.test.ts
packages/agent/src/observability/recommendation-relay.ts
packages/agent/src/runtime/cooking-agent-observability.test.ts
tools/lens-eval-smoke/README.md
tools/lens-eval-smoke/bun.lock
tools/lens-eval-smoke/package.json
tools/lens-eval-smoke/src/config.test.ts
tools/lens-eval-smoke/src/config.ts
tools/lens-eval-smoke/src/run-runtime-canary.ts
tools/lens-eval-smoke/src/run-smoke.ts
tools/lens-eval-smoke/src/runtime-trace.test.ts
tools/lens-eval-smoke/src/runtime-trace.ts
tools/lens-eval-smoke/src/telemetry.test.ts
tools/lens-eval-smoke/src/telemetry.ts
tools/lens-eval-smoke/tsconfig.json
```

At the cached-ref level, `features/web` and `fix/agent` are each one commit
ahead of their same-named remote-tracking refs. The other same-named local and
cached remote-tracking branch tips are equal. None of the local branches has a
configured upstream, so these are explicit comparisons rather than tracking
status. Live remote equivalence is unverified.

## Repository topology

- Repository: `github.com/yayatooo/flemme` (sanitized host/repository identity)
- Locally represented default branch: `origin/main`
- Worktrees: one, at the active Flemme clone, on `fix/agent`
- Shallow clone: no
- Partial clone: no
- Object alternates: none
- Grafts: none
- Replace refs: none
- Submodules: none
- Git LFS tracked patterns: none
- Git LFS client: not installed
- `git-filter-repo`: not installed
- Tags: none

Local branches and preflight tips:

| Local branch | Tip | Same-named cached remote relation |
| --- | --- | --- |
| `features/agent` | `269d41ceb7773cbb0fd897d0866faefb7c889f42` | equal |
| `features/api` | `d0391c139c3e821720711811b22dd919472aeb7e` | equal |
| `features/schema` | `350cd97e67b483e9a0e00fd3f8d310314c42f989` | equal |
| `features/web` | `885f1a0c02279ceccb9da5a0846ae0275e0b2b21` | ahead 1, behind 0 |
| `fix/agent` | `9f767476409e0c91084d90be1e76c7f22aafbe78` | ahead 1, behind 0 |
| `fix/improve-website` | `fcf565006e9358c6e0e7c2157caf1548d23067d4` | equal |
| `fix/landing-page-restyling` | `5624a047826d50b914396af83d0b62d8fb64fbd1` | equal |
| `fix/needmcp-implementary` | `afe7ff48ef71427e7943a9a463c4aaef6daed962` | equal |
| `main` | `5624a047826d50b914396af83d0b62d8fb64fbd1` | equal |

Cached remote-tracking refs also include matching `origin/features/*`,
`origin/fix/*`, `origin/main`, and symbolic `origin/HEAD`. No other local ref
namespace is present.

## Historical exposure map

Path history contains two changes:

| Operation | Commit | Date | Subject |
| --- | --- | --- | --- |
| Added | `afe7ff48ef71427e7943a9a463c4aaef6daed962` | `2026-09-18T16:59:42+07:00` | `improve change fro neubrutalism to bento style` |
| Deleted | `9f767476409e0c91084d90be1e76c7f22aafbe78` | `2026-09-19T21:03:15+07:00` | `security: remove unused NeedMCP integration` |

No modify, rename, or copy operation was found for the path. No merge commit's
tree contains the path.

The path exists in three reachable commit trees:

| Commit | Date | Subject |
| --- | --- | --- |
| `afe7ff48ef71427e7943a9a463c4aaef6daed962` | `2026-09-18T16:59:42+07:00` | `improve change fro neubrutalism to bento style` |
| `5624a047826d50b914396af83d0b62d8fb64fbd1` | `2026-09-19T01:58:44+07:00` | `improve landing page` |
| `1f0823cf91c201bc0c97c86569e7becde7b12a31` | `2026-09-19T14:24:57+07:00` | `feat(agent): add eval foundation and complete regression verification` |

The first commit introduces the path; the next two inherit it unchanged. This
distinguishes the single introduction/change commit from every commit tree in
which the file remains present. The remediation commit is the next descendant
on `fix/agent` and removes it.

No additional ref beyond the affected refs below reaches the introduction
commit. The only current tracked reference to the relevant old commit IDs is
the sanitized credential audit. No CI configuration exists under `.github`,
and no current CI or deployment path was found referencing those old commit
IDs.

## Affected refs

Local branches whose ancestry contains the introduction commit:

- `refs/heads/fix/agent`
- `refs/heads/fix/landing-page-restyling`
- `refs/heads/fix/needmcp-implementary`
- `refs/heads/main`

Cached remote-tracking refs whose ancestry contains it:

- `refs/remotes/origin/fix/agent`
- `refs/remotes/origin/fix/landing-page-restyling`
- `refs/remotes/origin/fix/needmcp-implementary`
- `refs/remotes/origin/main`
- `refs/remotes/origin/HEAD`, a symbolic alias of `origin/main`

Preflight cached remote tips are:

| Remote branch | Cached tip |
| --- | --- |
| `origin/fix/agent` | `1f0823cf91c201bc0c97c86569e7becde7b12a31` |
| `origin/fix/landing-page-restyling` | `5624a047826d50b914396af83d0b62d8fb64fbd1` |
| `origin/fix/needmcp-implementary` | `afe7ff48ef71427e7943a9a463c4aaef6daed962` |
| `origin/main` | `5624a047826d50b914396af83d0b62d8fb64fbd1` |

There are no affected tags because the repository has no local tags. Cached
remote tips are evidence only and must not be reused as force-push lease values
without a deliberate refresh in the execution task.

## Remote-state limitations

No fetch, pull, push, or Git remote operation was performed. The cached
remote-tracking refs establish a previously fetched view, not the current
GitHub state.

GitHub CLI is not installed, so this preflight could not verify:

- current repository visibility or advertised default branch;
- current branch tips or branch existence on GitHub;
- branch protection or repository rulesets;
- open pull requests involving affected branches;
- forks, server-side pull-request refs, caches, releases, deployments, or
  other hosting-service retention of old objects.

These are mandatory live, read-only checks during the approved maintenance
window. Server-side caches and external clones may retain unreachable objects
even after advertised refs are rewritten.

## Selected cleanup strategy

Remove the entire obsolete path from all reachable history in a fresh,
disposable mirror clone. Do not search for, reconstruct, or replace the
credential value.

The approved execution shape is:

1. Freeze merges and pushes and record the freshly advertised branch and tag
   tips.
2. Confirm the intended local-only commits and dirty work have been preserved
   in reviewed logical commits and made available to the canonical remote.
3. Create a new disposable mirror clone from the deliberately refreshed
   remote. This is an execution workspace, not a backup, and it contains the
   compromised old history until it is destroyed.
4. Verify an owner-approved `git-filter-repo` installation and record its
   version.
5. In that disposable clone only, run:

   ```sh
   git filter-repo --path .codex/config.toml --invert-paths --force
   ```

6. Verify the rewritten objects and refs locally before restoring the remote
   URL if `git-filter-repo` removed it.
7. Push only the four explicitly affected branch refs, guarded by expected-old
   SHA leases. Do not use `git push --mirror`, wildcard refspecs, or bare
   `--force`.
8. Make a second fresh clone after the push and run all verification gates.
9. Quarantine the old active clone so it cannot push old history, then destroy
   contaminated disposable clones after owner sign-off.

Unaffected branch refs must not be force-pushed. There are currently no tag
refs to push; freshly advertised tags must be rechecked before execution.

## Dirty-worktree migration plan

Before the rewrite:

1. Complete and review the current logical units in the active clone. Preserve
   the existing remediation commit as well as wanted observability, Lens, and
   web work.
2. Divide legitimate feature work into explicit logical commits. Do not fold
   unrelated work into the security remediation commit.
3. Decide intentionally whether each untracked file is wanted; commit wanted
   files and remove or relocate unwanted files through a separately approved
   workflow.
4. Keep `.env`, `infra/lens-local/.env`, and
   `infra/lens-local/.env.flemme-agent` ignored and outside Git. Copy required
   ignored values to the replacement clone through an owner-controlled local
   channel only after the rewrite; do not place them in commits, patches,
   bundles, or chat.
5. Confirm there is still no stash. Do not create a stash as a migration
   mechanism.
6. Push all approved, intended pre-rewrite commits during the coordinated
   maintenance window so the freshly cloned remote is the canonical input.
7. Re-run the sanitized current-tree scan and record only its pass/fail result.

Only after all wanted work is committed and available from the frozen remote
may the disposable rewrite clone be created. Never run `git-filter-repo` in
this active clone.

## Branch and collaborator coordination

Before execution, the repository owner must:

- announce a push/merge freeze to every collaborator with a clone or fork;
- enumerate current affected branches and open PRs from live GitHub metadata;
- determine whether PR heads, bases, CI jobs, releases, deployments, or
  external automation pin old commit IDs;
- ensure no CI/deployment process will redeploy or push an old SHA;
- approve any narrowly scoped, temporary ruleset/protection bypass required
  for the four affected refs;
- preserve the default branch designation and restore protections immediately
  after the atomic push;
- instruct collaborators to make a fresh clone after completion, not merge,
  pull, or push from an old clone;
- coordinate fork owners separately because this repository cannot rewrite
  their refs.

Open PRs based on affected history must be recreated or rebased onto rewritten
refs. They must not merge an old-history head after cleanup. GitHub caches and
closed PR refs may require a hosting-provider support request if organizational
policy requires removal beyond advertised refs.

## Push safety plan

During the later execution task, capture each freshly advertised old SHA into
task-specific variables after the freeze:

```sh
NEEDMCP_OLD_FIX_AGENT=<freshly-verified-old-sha>
NEEDMCP_OLD_FIX_LANDING=<freshly-verified-old-sha>
NEEDMCP_OLD_FIX_IMPLEMENTARY=<freshly-verified-old-sha>
NEEDMCP_OLD_MAIN=<freshly-verified-old-sha>
```

Review those values against the frozen remote inventory. Then use one explicit
atomic push from the disposable rewritten clone:

```sh
git push --atomic origin \
  --force-with-lease=refs/heads/fix/agent:${NEEDMCP_OLD_FIX_AGENT} \
  --force-with-lease=refs/heads/fix/landing-page-restyling:${NEEDMCP_OLD_FIX_LANDING} \
  --force-with-lease=refs/heads/fix/needmcp-implementary:${NEEDMCP_OLD_FIX_IMPLEMENTARY} \
  --force-with-lease=refs/heads/main:${NEEDMCP_OLD_MAIN} \
  refs/heads/fix/agent:refs/heads/fix/agent \
  refs/heads/fix/landing-page-restyling:refs/heads/fix/landing-page-restyling \
  refs/heads/fix/needmcp-implementary:refs/heads/fix/needmcp-implementary \
  refs/heads/main:refs/heads/main
```

Do not execute the command if any expected-old SHA is missing, stale, or
different from the final frozen inventory. If the server does not support an
atomic push, stop and obtain a separately reviewed ref-by-ref procedure rather
than silently accepting a partial rewrite. Do not push `origin/HEAD`; GitHub's
default-branch symbolic relationship is server-owned and must be verified
afterward.

## Backup and recovery policy

Selected policy: **no additional backup**.

Do not create a plaintext bundle, archive, mirror backup, backup branch, tag,
or alternate ref. Before the push, the existing remote and quarantined old
clone temporarily provide recovery material. After the push, the quarantined
old clone is the only intentional short-lived recovery source until the second
fresh-clone verification is signed off.

Every recovery source containing old history also contains the revoked
credential. It must remain offline, must never be pushed back, and must be
destroyed after verification and owner approval. Rollback by restoring old
refs would restore the credential exposure and is therefore a last-resort
security incident action, not a normal rollback. Application defects should
instead be repaired on the rewritten history.

## Post-rewrite verification

The execution task is not complete until a second fresh clone verifies all of
the following without printing blob contents:

- `.codex/config.toml` is absent from every tree reachable from every
  advertised branch and tag;
- a value-suppressing scan of all reachable blobs finds zero credential-shaped
  NeedMCP values and emits only counts and paths;
- `fix/agent`, `fix/landing-page-restyling`,
  `fix/needmcp-implementary`, and `main` exist at their expected rewritten
  tips;
- all unrelated branches and any approved tags retain their expected tips;
- the default branch remains `main` and branch protections/rulesets are
  restored;
- old commit IDs are unreachable from all advertised rewritten refs;
- current application source, the remediation, and every approved recent
  logical commit remain present;
- Bun install, relevant typechecks, builds, and the full test suite succeed in
  the fresh clone;
- open PRs and CI/deployment references no longer target old history;
- the old active clone has no usable push URL and is clearly quarantined;
- collaborators confirm they have recloned and will not push from old clones.

Absence from advertised refs does not prove deletion from provider caches,
forks, logs, screenshots, or previously fetched clones. The revoked-key and
deleted-screenshot prerequisites remain the controls for those copies.

## Manual approval checklist

- [ ] Finish, review, and logically commit every wanted dirty-worktree change.
- [ ] Confirm all wanted untracked assets are intentionally preserved.
- [ ] Confirm ignored Lens and application secrets remain outside Git.
- [ ] Confirm no stash or unpushed wanted commit will be stranded.
- [ ] Schedule and announce a repository-wide push/merge freeze.
- [ ] Refresh and record all advertised heads and tags from the live remote.
- [ ] Verify GitHub visibility, default branch, open PRs, rulesets, branch
      protection, releases, deployments, and automation references.
- [ ] Confirm the four affected branch refs; stop if the live set differs.
- [ ] Confirm there are still no affected tags; stop and extend the plan if any
      exist.
- [ ] Install `git-filter-repo` through an owner-approved mechanism and verify
      its version before cloning the execution workspace.
- [ ] Approve any minimal temporary ruleset/protection change and its immediate
      restoration procedure.
- [ ] Review the fresh expected-old SHAs and the exact atomic push command.
- [ ] Approve the no-additional-backup policy and old-clone quarantine period.
- [ ] Approve destructive execution as a separate task.

## Exact next task scope

The next task is a separately approved, coordinated history-rewrite execution.
It may begin only after every manual checklist item above is satisfied. Its
scope is limited to:

1. freezing repository writes and collecting live GitHub/ref metadata;
2. creating a disposable fresh clone;
3. removing `.codex/config.toml` from history with whole-path
   `git-filter-repo --invert-paths`;
4. locally validating rewritten refs and sanitized blob scans;
5. atomically force-with-lease pushing only the four approved affected branch
   refs;
6. restoring repository protections;
7. verifying from a second fresh clone; and
8. quarantining the old clone and destroying disposable contaminated clones
   after sign-off.

It must not use a value replacement map, mirror push, wildcard force-push,
plaintext history backup, or the active dirty clone as the rewrite workspace.

No history, ref, index, remote, branch, tag, worktree, stash, or unrelated user
file was changed during this preflight.
