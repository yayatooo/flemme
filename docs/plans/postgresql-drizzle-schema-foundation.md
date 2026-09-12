# PostgreSQL + Drizzle Schema Foundation

## Repository findings

- Recommendation input contains persistent inventory, equipment, household
  counts, and preference context plus temporary request/serving/time context.
- Recommendation output and the selected recipe are generated structured data.
- `PreCookingOutput` is the immutable executable cooking plan and is best kept
  as a JSONB snapshot rather than decomposed into ingredient/preparation/stage
  tables.
- Active Cooking owns mutable relational progress: status, pause reason,
  current stage/step IDs, completed step IDs, and recorded changes.
- Completion output and recipe nutrition results are snapshot data.
- Canonical ingredients are owned by `packages/ingredients`; inventory stores
  only the canonical string key and does not create a second ingredient table.
- Nutrition arithmetic and current reference data remain in
  `packages/nutrition`; only a completed calculation snapshot belongs on a
  cooking session.

## Tables

### Auth

- `users`: identity and normalized unique email.
- `auth_credentials`: one password hash per user for development auth.
- `auth_sessions`: hashed opaque token, expiry, revocation, and user lookup.

### User context

- `user_profiles`: one per user; display name and current string-based food and
  cooking preferences matching agent input.
- `households`: one per user; non-negative adult/child/toddler counts matching
  the current aggregate contract. No member table until member-level behavior
  exists.
- `kitchens`: one per user.
- `kitchen_equipment`: equipment names present in a kitchen; unique per kitchen.
- `inventories`: one per user.
- `inventory_items`: canonical ingredient key, optional numeric quantity/unit,
  approximation flag, condition, and lifecycle timestamps; one row per
  canonical key in an inventory.

### Cooking lifecycle

- `cooking_sessions`: user ownership, phase, status, typed JSONB snapshots,
  mutable Active Cooking progress, and lifecycle timestamps.
- `favorites`: a user-owned reference to a cooking session's selected recipe;
  no speculative global recipe catalog.
- History is a query over completed cooking sessions, not a duplicated table.

## Snapshot strategy

JSONB snapshots preserve current validated contracts:

- recommendation output
- selected recipe
- immutable pre-cooking plan
- Active Cooking changes
- completion output
- estimated recipe nutrition result

Relational columns support ownership, lifecycle filtering, resume, progress,
timestamps, and constraints. The application must validate JSONB against the
owning package schema when writing and reading; PostgreSQL preserves the
snapshot but does not reimplement Zod.

## Constraints and indexes

- UUID primary keys consistently use `gen_random_uuid()`.
- One profile, household, kitchen, and inventory per user.
- Non-negative household counts and positive inventory quantities.
- Unique inventory canonical key within an inventory.
- Unique equipment name within a kitchen.
- Paused sessions require a pause reason; other statuses reject one.
- Completed sessions require Completion phase and `completed_at`.
- Active Cooking and Completion phases require plan/current-position snapshots.
- User/status/update index supports resume and history queries.
- Unique user/session favorite prevents duplicate favorites for one session.

## Delete behavior

Deleting a user cascades all user-owned data, including cooking history; no
independent retention policy is currently specified. Deleting a household,
kitchen, or inventory cascades its children. Deleting a cooking session cascades
its favorite because the favorite has no independent recipe identity.

## SQL naming

Code folders and modules remain kebab-case. PostgreSQL tables, columns, enums,
constraints, and indexes use unquoted snake_case identifiers for practical SQL
and Drizzle interoperability.

## Validation plan

1. Generate the initial Drizzle migration without manually editing it.
2. Apply it to the configured PostgreSQL 16 development database.
3. Run an idempotent minimal seed for a development user, profile, household,
   kitchen, and inventory.
4. Run a database lifecycle integration test: create user/context, create a
   session with snapshots, update progress, complete it, query history, and
   favorite it.
5. Run workspace tests, typecheck, build, Biome, and whitespace checks.
