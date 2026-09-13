# Swagger Cooking Flow

This guide validates only Flemme API operations that exist today. Active
Cooking and Completion AI HTTP operations remain pending.

## Prerequisites

From the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/db db:seed
bun run --filter @flemme/api dev
```

The root `.env` must contain `DATABASE_URL`. Real Recommendation and
Pre-Cooking requests also need the Agent package's existing `MUX_API_KEY` and
`BASE_URL` variables. Never put their values into Swagger or logs.

The seed output includes the UUID of the development user. Use that value for
Swagger authentication:

1. Copy the development user UUID printed by the seed command.
2. Open Swagger and select **Authorize**.
3. Paste the UUID into `DevelopmentUser` and select **Authorize**.
4. Close the dialog. Swagger will send it as `x-flemme-user-id` for every
   protected cooking request.

Do not use the all-zero UUID from older examples. It has the correct UUID shape
but does not identify a database user, so the API correctly returns
`UNAUTHENTICATED`.

## Step 1 — Recommendation

1. Open [http://localhost:3000/docs](http://localhost:3000/docs).
2. Expand `POST /cooking/recommendations`.
3. Select **Try it out**.
4. Confirm that the endpoint shows the closed-lock authorization indicator.
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

## Step 2 — Select Recipe

Continue only when the Recommendation response has `type: "recommendations"`.
Choose one object from its `recommendations` array. Copy that complete object
without changing its shape; it is the `selectedRecipe` value in the next step.

If the result is `clarification`, answer it with another Recommendation request.
If it is `no_viable_recommendation`, do not proceed with Pre-Cooking.

## Step 3 — Pre-Cooking

1. Expand `POST /cooking/pre-cooking`.
2. Select **Try it out**.
3. Confirm that the endpoint uses the existing `DevelopmentUser`
   authorization.
4. Use a body with the complete selected recipe and the current session:

```json
{
  "selectedRecipe": {
    "name": "Copy the chosen recommendation name",
    "description": "Copy its description",
    "reason": "Copy its reason",
    "estimatedDuration": {
      "minMinutes": 20,
      "maxMinutes": 30
    },
    "servings": 1,
    "feasibility": "ready",
    "ingredients": [
      {
        "name": "salt",
        "status": "available",
        "requiredAmount": "as needed"
      }
    ],
    "equipment": [
      {
        "name": "wok",
        "status": "available"
      }
    ],
    "preferenceMatches": [],
    "requiredConfirmations": [],
    "optionalIngredients": [],
    "warnings": []
  },
  "session": {
    "request": "Prepare the selected recipe for cooking.",
    "servings": 1,
    "availableMinutes": 45
  }
}
```

Replace the complete example `selectedRecipe` with the exact object chosen in
Step 2. The session and optional overrides follow the same rules as the
Recommendation request. Omitted profile, household, kitchen, and inventory
context is loaded from PostgreSQL.

5. Execute the request.

A successful response is a schema-valid Pre-Cooking plan with
`preparationSummary`, `ingredients`, `equipment`, `preparationSteps`, and
`cookingStages`. The request must not create a cooking session or mutate
inventory.

## Step 4 — Cooking Session

Swagger also exposes the current cooking-session persistence endpoints:

```text
POST  /cooking-sessions
GET   /cooking-sessions/{id}
PATCH /cooking-sessions/{id}/progress
POST  /cooking-sessions/{id}/complete
```

These accept already generated snapshots and do not invoke Recommendation,
Pre-Cooking, Active Cooking, or Completion AI. `POST /cooking-sessions` can
accept the returned Pre-Cooking plan as its `cookingPlan`, alongside the
required snapshots and initial progress.

Status: the Cooking Session endpoint already exists, but the complete chained
Swagger execution is intentionally deferred to the next task. This guide does
not yet claim that Recommendation → Pre-Cooking → Cooking Session has been
validated end to end.
