# `@flemme/db`

PostgreSQL persistence schema and database access for Flemme.

Code modules use kebab-case paths. Physical PostgreSQL identifiers use unquoted
snake_case names to remain practical in SQL and Drizzle.

## Commands

From the repository root, with `DATABASE_URL` configured in `.env`:

```bash
bun run --filter @flemme/db db:check
bun run --filter @flemme/db db:generate
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/db db:studio
bun run --filter @flemme/db db:validate-lifecycle
```

`db:studio` loads `DATABASE_URL` from the root `.env` and starts Drizzle Studio
for the local database.

For local development, PostgreSQL is managed from the repository root:

```bash
docker-compose up -d
docker-compose ps
bun run --filter @flemme/db db:migrate
```

Use `docker-compose down` to stop PostgreSQL while retaining the named data
volume. See the root README for environment setup and the intentionally
destructive reset command.

Cooking plans, recommendations, completion output, and nutrition results are
stored as JSONB snapshots. Ownership, lifecycle state, resume pointers, and
timestamps are relational columns.

Completed `cooking_sessions` are the cooking-history source. No separate history
table exists. Inventory stores canonical `ingredient_key` values owned by
`@flemme/ingredients`; PostgreSQL does not create another ingredient catalog.

The development seed creates only a local user, password credential, profile,
aggregate household, kitchen with basic equipment, inventory, and one `salt`
inventory item. It is idempotent and is not production auth setup.

`db:validate-lifecycle` uses a temporary user and real PostgreSQL rows to verify
profile and household context, kitchen equipment, a canonical ingredient-key
inventory item, cooking snapshots, mutable progress, completion/history lookup,
and favorites. Restored JSONB snapshots are parsed through their owning agent
and nutrition schemas before the temporary user is deleted.
