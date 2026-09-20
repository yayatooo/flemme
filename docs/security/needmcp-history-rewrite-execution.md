# NeedMCP history remediation

Remediation completed and was verified on 2026-09-19. No raw credential or
derived credential representation is included in this report.

## Outcome

- The exposed credential was revoked.
- The obsolete `.codex/config.toml` path is unreachable from all affected
  advertised refs.
- Current-tree and fresh-clone credential/configuration scans returned zero.
- The affected refs were updated atomically with explicit force-with-lease
  protection after local rewrite verification.
- The active clone was replaced by a verified clean clone.
- Retained pre-rewrite, rewrite, staging, and verification workspaces were
  subsequently removed after unique-data, process, symlink, and Docker-mount
  checks.
- Local environment files were never committed, displayed, or copied into a
  rewrite workspace. They remained ignored, regular non-symlink files with
  restricted permissions.

## Advertised ref mapping

| Ref | Previous SHA | Rewritten SHA |
| --- | --- | --- |
| `refs/heads/fix/agent` | `1f0823cf91c201bc0c97c86569e7becde7b12a31` | `0907d26e941685795e16f2abc92a44fbeeaf8460` |
| `refs/heads/fix/landing-page-restyling` | `5624a047826d50b914396af83d0b62d8fb64fbd1` | `7a4f5db826c33ad70a25d0951015738af47f1592` |
| `refs/heads/fix/needmcp-implementary` | `afe7ff48ef71427e7943a9a463c4aaef6daed962` | `e950fecb3e405ffe39d833adedda491999fb08fc` |
| `refs/heads/main` | `5624a047826d50b914396af83d0b62d8fb64fbd1` | `7a4f5db826c33ad70a25d0951015738af47f1592` |

The rewritten `fix/agent` tree preserved the validated source commit and
removed only the obsolete path from reachable history. Commit counts and
unaffected branch tips were preserved; no tags were affected.

## Verification evidence

- obsolete-path reachable commit count: zero across the rewritten refs;
- credential-shaped static assignment count: zero;
- NeedMCP secret-assignment count: zero;
- active non-documentation NeedMCP configuration count: zero;
- ignored environment files tracked or copied: zero;
- `git fsck --full`: passed;
- frozen install: passed without lockfile changes;
- repository tests: 511 passed with 2,374 expectations;
- root typecheck: seven of seven workspaces passed;
- production build and scoped formatting/lint checks: passed;
- rewritten-range whitespace validation: passed.

## Security limitations

The obsolete path is unreachable from the advertised refs, and current-tree
and fresh-clone scans returned zero. Local Git operations cannot physically
guarantee deletion from hosting-provider caches, unreachable server objects,
forks, backups, or historical external clones. Credential revocation is the
security control for any such retained copy.
