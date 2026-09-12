# Swagger Cooking Flow

This guide validates only Flemme API operations that exist today. Future
Pre-Cooking and AI-guided cooking HTTP operations remain pending.

## Prerequisites

From the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/api dev
```

The root `.env` must contain `DATABASE_URL`. A real Recommendation also needs
the Agent package's existing `MUX_API_KEY` and `BASE_URL` variables. Never put
their values into Swagger or logs.

The seed output includes the UUID of the development user. Use that value for
the `x-flemme-user-id` header.

## Recommendation

1. Open [http://localhost:3000/docs](http://localhost:3000/docs).
2. Expand `POST /cooking/recommendations`.
3. Select **Try it out**.
4. Set `x-flemme-user-id` to the seeded development user UUID.
5. Use this minimal current-attempt request:

```json
{
  "session": {
    "request": "I want a simple savory dinner.",
    "servings": 1,
    "availableMinutes": 45
  }
}
```

6. Execute the request.

A successful response is one of the Agent-owned structured variants:
`recommendations`, `clarification`, or `no_viable_recommendation`. The result
must be valid structured output; the request must not create a cooking session
or change inventory.

For a one-request override, the body may additionally provide `inventory`,
`kitchen`, `household`, `foodPreferences`, or `cookingPreferences`. Supplying
one of these fields replaces its persisted counterpart for only this request.

## Existing Persistence Slice

Swagger also exposes the current cooking-session persistence endpoints:

```text
POST  /cooking-sessions
GET   /cooking-sessions/{id}
PATCH /cooking-sessions/{id}/progress
POST  /cooking-sessions/{id}/complete
```

These accept already generated snapshots and do not invoke Recommendation,
Pre-Cooking, Active Cooking, or Completion AI. The full HTTP business flow from
a chosen recommendation into Pre-Cooking is pending.
