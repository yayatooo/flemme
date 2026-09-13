# Swagger Household API v0.1

Use this flow to validate persistent aggregate household cooking context
without invoking an Agent.

## Prerequisites

From the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/api dev
```

Open [Swagger UI](http://localhost:3000/docs), select **Authorize**, and enter
the real development user UUID printed by the seed command.

## Read the current household

Execute `GET /household`.

The seeded user returns HTTP 200. A valid user without a household row returns
HTTP 404 with `HOUSEHOLD_NOT_FOUND`; GET does not create defaults.

## Create or replace household counts

Execute `PUT /household`:

```json
{
  "adults": 2,
  "children": 1,
  "toddlers": 0
}
```

Expected result: HTTP 200 with the same complete household value. Execute
`GET /household` again to verify persistence.

A second PUT replaces all three counts rather than merging state:

```json
{
  "adults": 1,
  "children": 0,
  "toddlers": 0
}
```

All-zero counts are schema-valid and can be used when no household occupants
are currently represented:

```json
{
  "adults": 0,
  "children": 0,
  "toddlers": 0
}
```

The API rejects negative, fractional, missing, oversized PostgreSQL integers,
unknown fields, and client-provided user IDs. Recommendation and Pre-Cooking
use these persisted values when no request-level household override is sent.
