# Codex Task — Audit Credential-Like Value in `.codex/config.toml`

## Objective

Safely determine whether the previously reported credential-like value at `.codex/config.toml:2` is:

- a false positive;
- ordinary non-secret configuration;
- a real credential currently tracked by Git;
- a real credential present in local history;
- a real credential visible through remote-tracking history; or
- indeterminate without additional owner input.

This task is **audit-only**. Do not remediate, rotate, revoke, delete, untrack, rewrite history, commit, push, or contact an external service.

## Confirmed context

- A previous repository secret scan reported one pre-existing credential-like value at `.codex/config.toml:2`.
- The finding was not introduced by the Lens eval or runtime observability work.
- The value has not been printed in task reports.
- Lens environment files remain ignored and untracked.
- Recommendation runtime observability now has a manually confirmed successful, payload-free trace.
- Commit, push, live-model canary, broader instrumentation, and deployment remain blocked until this finding is classified.

## Critical secrecy rules

The candidate value is sensitive until proven otherwise.

Never:

- print the raw line;
- print the candidate value, prefix, suffix, substring, encoded form, checksum, or hash;
- include it in a command argument, process title, shell history, environment variable, temporary file, report, patch, snapshot, or test output;
- use `cat`, `head`, `tail`, `sed`, `awk`, `grep`, `rg`, `git show`, `git diff`, or similar commands in a way that emits the candidate line/value;
- paste it into a browser, website, remote scanner, API request, or external validation service;
- enable shell tracing such as `set -x`;
- print a full parsed TOML object or environment dump.

Use a local in-process audit helper or an equivalent safe mechanism that reads and classifies the value without emitting it. The helper may output only sanitized facts explicitly allowed by this task.

## Sanitized facts that may be reported

- file path;
- line number;
- TOML key name, provided the key name itself contains no secret material;
- value category, such as boolean, integer, enum-like string, path, URL, identifier, placeholder, or credential-like string;
- whether the value is empty or non-empty;
- whether it matches a known local secret value, reported only as a boolean and secret category;
- classification and confidence;
- Git tracked/ignored status;
- working-tree modified/unmodified status;
- counts of commits containing the file or candidate;
- commit hashes and dates;
- local, remote-tracking, and tag ref names;
- whether a commit is reachable from a remote-tracking ref;
- evidence source names without sensitive contents.

Do not report length, alphabet, prefix, suffix, entropy, checksum, or any transformation of the candidate value.

## Required execution order

### Stage 1 — Read instructions and establish a no-output boundary

1. Read all applicable `AGENTS.md` files.
2. Read repository security guidance, `.gitignore`, `.codex` documentation, and relevant project documentation without printing `.codex/config.toml` contents.
3. Record the initial `git status --short` without expanding content diffs.
4. Confirm the target is exactly the repository-relative `.codex/config.toml` file and not a global user configuration outside the repository.
5. Disable any verbose/debug/shell tracing mode for the audit.

Do not alter the working tree during the audit other than the final sanitized report.

### Stage 2 — Determine file ownership and intended purpose

Determine:

- whether `.codex/config.toml` is tracked;
- whether it is ignored;
- whether it is currently modified;
- whether it is intended as shared repository configuration or machine-local configuration;
- which documented schema or application consumes it;
- whether the key at line 2 is a supported configuration key;
- whether that key is expected to contain a secret, identifier, model name, feature value, filesystem path, or another non-secret value.

Prefer authoritative local schema/documentation. If online documentation is required, use only the official product documentation and never send the value.

### Stage 3 — Classify the current value safely

Parse the TOML using a local in-process helper that emits only sanitized facts.

Classify the finding as exactly one of:

```text
FALSE_POSITIVE
NON_SECRET_CONFIGURATION
CONFIRMED_SECRET
INDETERMINATE
```

Evaluation criteria must include:

- the semantic purpose of the TOML key;
- whether the value is a documented enum, model identifier, harmless project identifier, path, URL, or placeholder;
- whether the value structurally represents an authentication secret;
- whether it exactly matches any configured local credential, checked in memory and reported only as a boolean/category;
- whether the value grants authentication or authorization capability;
- whether it can be regenerated publicly or is intended to remain private.

Do not attempt authentication to test whether a candidate credential works.

### Stage 4 — Audit Git exposure without revealing content

Determine:

- whether the target file is present in `HEAD`;
- whether the candidate is present in the working tree only, index, `HEAD`, earlier commits, or multiple revisions;
- the earliest and latest commit containing the candidate, if any;
- how many reachable commits contain it;
- whether those commits are reachable from:
  - the current branch;
  - another local branch;
  - a tag;
  - a local remote-tracking ref such as `origin/*`.

Important limitations:

- Remote-tracking refs are evidence of prior fetched remote state, not absolute proof of the current server state.
- Absence from remote-tracking refs does not prove the candidate was never pushed.
- Do not fetch, pull, contact the remote, or inspect hosted repository pages in this audit.

Never place the candidate value into `git log -S`, `git grep`, a shell variable, or a command argument. Perform content comparison entirely inside a local process and emit only sanitized counts/commit metadata.

### Stage 5 — Check adjacent exposure paths

Without printing values, determine whether the same candidate is duplicated in:

- tracked files;
- untracked but non-ignored files;
- staged changes;
- repository documentation;
- CI configuration;
- test fixtures or snapshots;
- generated reports;
- tracked environment files.

Exclude ignored dependency/build directories and Git object internals from ordinary file scanning. Git history is handled separately in Stage 4.

Report matches only by path and category. Do not report matching lines or snippets.

### Stage 6 — Produce a decision, not a remediation

Write a sanitized report to:

```text
docs/security/codex-config-credential-audit.md
```

The report must state one final decision:

#### If `FALSE_POSITIVE`

- explain why the value cannot authenticate or authorize anything;
- identify the scanner rule/category that produced the false positive, if discoverable;
- recommend either no change or the narrowest safe scanner exception;
- do not add a scanner exception during this task.

#### If `NON_SECRET_CONFIGURATION`

- explain the documented meaning of the key;
- explain why tracking it is acceptable or why it is machine-local despite being non-secret;
- recommend the correct repository convention;
- do not move or edit the configuration during this task.

#### If `CONFIRMED_SECRET`

- identify the service/credential category without revealing the value;
- report its Git exposure scope;
- state whether rotation/revocation is mandatory;
- recommend a safe destination such as an ignored local config, environment variable, or secret manager;
- distinguish removal from the current tree from historical cleanup;
- state whether a future history rewrite would be required;
- do not rotate, revoke, edit, untrack, or rewrite anything during this task.

#### If `INDETERMINATE`

- explain exactly what cannot be established locally;
- ask one narrowly scoped question needed from the owner;
- keep commit/push/deployment blocked.

### Stage 7 — Verify the audit itself

1. Confirm the report contains no raw candidate value or transformation of it.
2. Confirm no new file other than the sanitized report was created.
3. Confirm `.codex/config.toml`, `.gitignore`, Git index, refs, and history are unchanged.
4. Confirm no environment or secret file permissions changed.
5. Run a secret scan over the report itself.
6. Run `git diff --check` without printing a sensitive source diff.
7. Record final `git status --short`.

No application test suite is required because this is an audit-only documentation task. If repository instructions require checks for documentation changes, run only those required checks.

## Forbidden actions

- Do not edit `.codex/config.toml`.
- Do not edit `.gitignore`.
- Do not add scanner allowlists or suppressions.
- Do not stage files.
- Do not use `git rm --cached`.
- Do not rotate or revoke credentials.
- Do not contact Git hosting or credential-provider APIs.
- Do not fetch or pull.
- Do not rewrite Git history.
- Do not delete branches, tags, refs, reflogs, or files.
- Do not amend, commit, or push.
- Do not continue to the live-model canary, other phase instrumentation, or deployment.
- Do not include secret material in the report or final response.

## Stop conditions

Stop immediately and report only a sanitized incident notice if:

- a command accidentally emits the candidate value;
- the candidate is copied into a temporary or tracked file;
- an external tool or service receives the candidate;
- classification would require testing the candidate against an external service;
- repository state changes unexpectedly;
- another confirmed secret is discovered.

Do not attempt cleanup that could destroy evidence. Report what category of exposure occurred without repeating the value.

## Required report structure

```text
# `.codex/config.toml` Credential Audit

## Decision
## Confidence
## File purpose and ownership
## Sanitized finding
## Current Git state
## History exposure
## Remote-tracking evidence and limitations
## Adjacent matches
## Risk assessment
## Recommended remediation
## Actions intentionally not performed
## Verification
## Next gate
```

## Required final response

Return only sanitized information:

1. Final classification.
2. Confidence level.
3. Safe key name and category, if allowed.
4. Whether the file/value is tracked, committed, historical, and reachable from remote-tracking refs.
5. Adjacent match count and safe paths, if any.
6. Whether rotation/revocation is required.
7. Whether history cleanup may be required.
8. Recommended next task.
9. Report path.
10. Confirmation that no raw value was printed and no remediation was performed.

## Acceptance criteria

The audit is complete only when:

- the finding has exactly one supported classification;
- current-tree and Git-history exposure are distinguished;
- remote-tracking evidence is stated with its limitations;
- no candidate value or derived representation appears in output or artifacts;
- repository state is unchanged except for the sanitized audit report;
- the next action is explicit and proportional to the finding.
