# Auth v1 A1 — Schema Integration

## Scope and version review

`better-auth` is pinned exactly to 1.7.4 in `apps/api` and resolved in bun.lock.
The installed core schema implementation (`getAuthTables`) was inspected using
`authSchemaOptions`; a regression test compares its field requirements with
Drizzle. This release provides the required UUID generation, credential and
provider account model, and disableImplicitLinking option. This is a schema/API
compatibility review, not a claim of an independent security audit.

No framework CLI migration was applied. Drizzle generated its own snapshot and
DDL; migration SQL was manually corrected to backfill before NOT NULL, retain
password bytes, allow passwordless future accounts and invalidate legacy sessions.

## Mapping

| Better Auth modelName / Drizzle export | SQL table | Notes |
| --- | --- | --- |
| users | users | Existing UUID identity preserved |
| authAccounts | auth_accounts | Renamed auth_credentials |
| authSessions | auth_sessions | Same table, new token semantics |
| authVerifications | auth_verifications | Infrastructure only |

The future Drizzle adapter must receive the schema with these export keys.
Field mappings use camelCase Drizzle properties; Drizzle maps SQL snake_case.
No separate user table. The central graph retains Product Domain relations;
credential one-to-one becomes accounts one-to-many. Verification has no user FK
in the framework model and therefore no fabricated user relation.

All four row IDs and user FKs remain PostgreSQL UUIDs. Provider accountId is
text intentionally: Google subjects are external identifiers, not Flemme UUIDs.
Credential accountId is the existing user UUID expressed as text.

## Required fields and preservation

- User: existing id/email/createdAt/updatedAt retained. Added name NOT NULL
  default `Flemme user`, emailVerified NOT NULL default false, nullable image.
  No profile names copied. Neutral defaults also preserve existing user test
  helper compatibility. Registration policy belongs to A2/later work.
- Account: existing credential id/userId/timestamps retained; password_hash is
  renamed password without changing bytes. Added required accountId/providerId
  backfilled userId::text/credential; added nullable accessToken, refreshToken,
  idToken, token-expiry timestamps and scope. Password nullable for Google.
  Unique providerId/accountId and userId index replace unique userId.
- Session: id/userId/expiry/createdAt retained structurally; legacy rows deleted
  before adding required unique token, updatedAt and optional IP/user-agent.
  tokenHash/revokedAt removed. Raw framework tokens must not be confused with
  old hashes. No production sessions existed; future revocation uses framework
  deletion. Any legacy sessions in another deployment will be invalidated.
- Verification: UUID, identifier, value, expiry, createdAt, updatedAt and
  identifier index. No verification/reset/magic-link feature is enabled.

Migration: `packages/db/drizzle/0001_brainy_stone_men.sql`. Uses transactional
Drizzle runner, no user recreation, no schema reset, no Product Domain DDL.
Email incompatibilities abort before DDL; emails are never silently rewritten.

## Password and future configuration

Non-mounted options select Bun.password.hash with explicit Argon2id and
Bun.password.verify. Existing Bun hashes remain usable; no hash rehashing or
scrypt conversion. Seed writes the new credential account shape; it was not
rerun as part of migration because rerunning intentionally replaces its hash.
Linking is locked to disableImplicitLinking=true. Explicit linking UI deferred.
No provider secrets, Google accounts, routes or auth middleware changes in A1.

## Validation

Use `bun run --filter @flemme/db db:validate-auth-preservation --check-only`
for preflight. Without that flag the validator snapshots rows in memory,
invokes the existing db:migrate command and asserts exact preservation.
Run under a maintenance window: concurrent writes invalidate comparisons.
It never prints password hashes or session secrets.

Observed database: one user and one credential before and after; UUID/email
and credential ID/hash/timestamps unchanged; known seed password verifies.
Domain row counts unchanged: profile 1, household 1, kitchen 1, equipment 2,
inventory 1, inventory item 1, Cooking Sessions 2, Favorites 0. Legacy sessions 0.

`bun run --filter @flemme/db test` reconstructs the old schema in a uniquely
named transactional test schema, applies A1, checks hashes/ownership/session
invalidation and rolls everything back. Existing lifecycle/API suites cover
session and Favorite ownership after migration. Framework metadata and password
compatibility tests run in the API suite. API: 114 passed, database: 1 passed.

## Follow-ups

A2 mounts the server/adapter and validates runtime schema/session handling.
Do not infer A1 as auth endpoint readiness. Before other deployments, back up
the DB, inspect emails and credentials, stop concurrent writers and rerun
preflight. Old application seed code is incompatible after table rename; deploy
schema-aware code together. No down migration is supplied; recover from a
backup if rollback is required. Invalidated session hashes are not recoverable
without that backup and must never be restored as raw session tokens.

Credits are deferred for Auth v1. Admin authorization, onboarding, Google
OAuth, routes and User Platform work remain outside A1.
