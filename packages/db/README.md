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
bun run --filter @flemme/db db:validate-lifecycle
```

Cooking plans, recommendations, completion output, and nutrition results are
stored as JSONB snapshots. Ownership, lifecycle state, resume pointers, and
timestamps are relational columns.

Completed `cooking_sessions` are the cooking-history source. No separate history
table exists. Inventory stores canonical `ingredient_key` values owned by
`@flemme/ingredients`; PostgreSQL does not create another ingredient catalog.

The development seed creates only a local user, password credential, profile,
aggregate household, kitchen, and inventory. It is not production auth setup.
