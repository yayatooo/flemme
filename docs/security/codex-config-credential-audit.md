# `.codex/config.toml` Credential Audit

## Decision

`CONFIRMED_SECRET`

The finding is a static NeedMCP API credential configured as an authentication
header. It is not a false positive or ordinary non-secret configuration.

## Confidence

High.

The classification is based on the parsed TOML key hierarchy, the header name,
the value category and structure, the official Codex configuration schema, and
local Git-object comparison. The credential was not tested against NeedMCP or
sent to any external service.

## File purpose and ownership

The target is the repository-relative `.codex/config.toml`, not the user-level
`~/.codex/config.toml`. It is mode `0644`, tracked by Git, not ignored, present
in `HEAD`, and currently unmodified and unstaged.

The file configures the `needmcp` HTTP MCP server for Codex. Its safe parsed
shape contains:

- `mcp_servers.needmcp.url`: URL configuration;
- `mcp_servers.needmcp.http_headers`: a static header map.

Official OpenAI documentation says project-specific `.codex/config.toml` files
are loaded for trusted projects. It defines
`mcp_servers.<id>.http_headers` as static HTTP headers included with every MCP
HTTP request and offers `env_http_headers` for values sourced from environment
variables. See the [Codex configuration reference](https://developers.openai.com/codex/config-reference)
and [Codex MCP configuration guide](https://developers.openai.com/codex/mcp).

This makes the file shared repository configuration in its current tracked
form, even though the credential inside it should have been machine-local.

## Sanitized finding

- Path: `.codex/config.toml`
- Line: 2
- Key: `http_headers`
- Full safe key context: `mcp_servers.needmcp.http_headers`
- Header key: `X-API-Key`
- Value category: non-empty credential-like string
- Authentication capability: yes; Codex sends this static header with MCP HTTP
  requests
- Placeholder: no
- URL, path, enum, or harmless identifier: no
- Exact match in the checked process environment, repository `.env`, Lens-local
  ignored environment files, user-level Codex config, or user-level Codex auth
  store: no

The lack of a duplicate in those local sources does not reduce the finding: its
documented use as an API authentication header is sufficient to classify it as
a secret.

## Current Git state

- Present in working tree: yes
- Present in index: yes
- Present in `HEAD`: yes
- Tracked: yes
- Ignored: no
- Working-tree modification: none
- Staged modification: none
- Current branch: `fix/agent`

The current tree, index, and `HEAD` contain the same candidate. This audit did
not stage or modify the target.

## History exposure

Exactly one reachable commit contains the file, and that commit contains the
candidate credential:

- Commit: `afe7ff48ef71427e7943a9a463c4aaef6daed962`
- Commit date: `2026-09-18T16:59:42+07:00`
- Earliest candidate commit: the commit above
- Latest candidate commit: the commit above
- Reachable commits containing the file: 1
- Reachable commits containing the candidate: 1

The commit is reachable from these local branches:

- `fix/agent`
- `fix/landing-page-restyling`
- `fix/needmcp-implementary`
- `main`

No local tag contains the candidate commit.

## Remote-tracking evidence and limitations

The candidate commit is reachable from the locally available remote-tracking
refs:

- `origin/HEAD`
- `origin/fix/agent`
- `origin/fix/landing-page-restyling`
- `origin/fix/needmcp-implementary`
- `origin/main`

These refs prove that a previously fetched view of `origin` contained the
credential-bearing commit. They are not absolute proof of the hosting service's
current state. No fetch, pull, remote API request, or hosted-repository lookup
was performed. Conversely, removing a remote-tracking ref locally would not
prove that the credential had never been pushed.

## Adjacent matches

The candidate appears in exactly one current repository path:

- `.codex/config.toml` — tracked working tree and Git index

No duplicate was found in:

- other tracked files;
- untracked, non-ignored files;
- repository documentation;
- CI configuration;
- test fixtures or snapshots;
- tracked environment files.

Ignored dependency/build directories and Git object internals were excluded
from ordinary file scanning. Git objects were audited separately through local
Git commands without emitting object contents.

## Risk assessment

Risk is high. Anyone able to read the repository or the exposed commit may be
able to authenticate to the configured NeedMCP service with the API key until
it is revoked. Repository removal alone cannot invalidate a copied credential.

Rotation or revocation is mandatory. Treat the credential as compromised even
if the repository is believed to be private.

Current-tree cleanup and historical cleanup solve different problems:

- current-tree cleanup prevents future clones and commits from exposing the
  credential at the tip;
- rotation or revocation removes the old credential's authorization power;
- history cleanup removes the old bytes from rewritten repository refs, but
  cannot retract copies already fetched, cached, logged, or forked.

Because the commit is reachable from `origin/main` and multiple other
remote-tracking refs, a coordinated history rewrite may be required by the
repository owner's security policy after rotation. Rotation must not wait for a
history-rewrite decision.

## Recommended remediation

The next bounded task should be a NeedMCP credential-incident remediation:

1. The credential owner revokes or rotates the exposed NeedMCP API key through
   the provider's trusted administration channel. Do not paste the replacement
   into chat, issue comments, logs, or task reports.
2. Replace the tracked static header value with the supported
   `env_http_headers` indirection and a machine-local environment variable, or
   another approved secret-manager integration. Keep the replacement secret
   outside Git.
3. Remove the exposed value from the current tree, verify the new key is absent
   from tracked and staged content, and test the MCP connection without logging
   request headers.
4. Decide, with repository owners, whether to rewrite all affected branches and
   remote refs. Coordinate that operation because it changes commit identities
   and requires downstream clones to rebase or reclone.
5. Re-scan the current tree and relevant rewritten refs before allowing commit,
   push, live-model work, broader instrumentation, or deployment.

## Actions intentionally not performed

This audit did not:

- edit `.codex/config.toml` or `.gitignore`;
- rotate, revoke, validate, or transmit the credential;
- contact NeedMCP, Git hosting, or any credential-provider API;
- fetch, pull, stage, commit, push, or modify refs;
- remove the file from Git;
- add a scanner suppression;
- rewrite history;
- continue to live-model tracing, broader instrumentation, or deployment.

## Verification

- The target was parsed only inside local in-process helpers.
- Helpers emitted only allowed key names, categories, booleans, paths, counts,
  commit metadata, and ref names.
- No candidate value, substring, transformation, checksum, hash, length, or
  encoded representation is included in this report.
- The report is the only new audit artifact.
- `.codex/config.toml` remains tracked, unmodified, and unstaged.
- `.gitignore`, the Git index, local refs, and history were not changed.
- No environment or secret-file permission was changed.
- Application tests were not run because this is an audit-only documentation
  task.

## Next gate

Commit, push, live-model canaries, broader observability instrumentation, and
deployment remain blocked until the NeedMCP API key has been revoked or rotated
and removed from the current tracked configuration. The history-cleanup decision
must then be recorded explicitly.
