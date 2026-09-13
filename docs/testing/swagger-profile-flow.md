# Swagger Profile API v0.1

Use this flow to validate persistent cooking preferences without invoking an
Agent.

## Prerequisites

From the repository root, start PostgreSQL and the API using the existing local
commands:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/api dev
```

Open [Swagger UI](http://localhost:3000/docs), select **Authorize**, and enter
the real development user UUID printed by the seed command.

## Read the current profile

Execute `GET /profile`.

The seeded user returns HTTP 200. A valid user without a profile returns HTTP
404 with `PROFILE_NOT_FOUND`.

## Create or replace cooking preferences

Execute `PUT /profile`:

```json
{
  "foodPreferences": ["masakan rumahan Indonesia", "pedas"],
  "cookingPreferences": ["sederhana", "satu wajan"]
}
```

Expected result: HTTP 200 with the same two arrays. Both arrays are complete
replacement values, not additions to old values. Use `[]` to clear a category.
The API does not accept `userId` and always writes the authorized user's row.

## Verify persistence

Execute `GET /profile` again. It must return the values saved above.

The existing cooking-context service now supplies these arrays to
Recommendation and Pre-Cooking whenever their corresponding request-level
overrides are omitted. A request-level array still replaces the persistent
array for that request only; arrays are never merged implicitly.
