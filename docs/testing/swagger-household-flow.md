# Swagger Household API v0.1

Use this flow to validate persistent aggregate household cooking context
without invoking an Agent.

## Prerequisites

From the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/api dev
```

Sign in through apps/web and open [Swagger UI](http://localhost:3000/docs) in
the same browser. Follow the
[session authentication guide](swagger-cooking-flow.md#session-authentication).

## Read the current household

Execute `GET /household`.

An account with an existing household returns HTTP 200. Otherwise it returns
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
