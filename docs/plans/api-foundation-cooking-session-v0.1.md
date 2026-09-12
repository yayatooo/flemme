# API Foundation v0.1 + Cooking Session Vertical Slice

## Repository findings

- `apps/api` is currently a placeholder with Hono and Zod dependencies but no
  application, environment, validation, auth, or error conventions.
- `packages/db` already exports the Drizzle client factory and validated schema;
  the API must inject and consume that database rather than create another
  persistence definition.
- Cooking plans and generated outputs are JSONB snapshots. The API must parse
  restored values with schemas from `@flemme/agent` and `@flemme/nutrition`.
- Active Cooking progress is relational and is validated against the immutable
  `PreCookingOutput` plan before mutation.
- A cooking session is user-owned. Development authentication can supply a real
  seeded/test user UUID through isolated middleware until production auth is a
  separate bounded task.

## Structure

```text
apps/api/
├── index.ts
└── src/
    ├── app.ts
    ├── api-error.ts
    ├── api-environment.ts
    ├── auth/development-auth-middleware.ts
    └── cooking-session/
        ├── cooking-session-route.ts
        ├── cooking-session-schema.ts
        ├── cooking-session-service.ts
        └── cooking-session.integration.test.ts
```

Request flow:

```text
HTTP → Hono route → Zod request validation → cooking-session service
     → @flemme/db → PostgreSQL → owning snapshot schemas → HTTP response
```

## Routes

- `GET /health`: process health only.
- `GET /openapi.json`: generated OpenAPI 3.1 specification sourced from the
  runtime Hono route schemas.
- `GET /docs`: interactive Swagger UI for the generated specification.
- `POST /cooking-sessions`: persist validated recommendation, selected recipe,
  immutable cooking plan, and initial Active Cooking progress without invoking
  AI.
- `GET /cooking-sessions/:id`: enforce ownership and restore schema-validated
  snapshots plus relational progress.
- `PATCH /cooking-sessions/:id/progress`: update only relational Active Cooking
  state after validating it against the persisted plan.
- `POST /cooking-sessions/:id/complete`: require an active session at its final,
  completed cooking step and persist completion state/snapshots.

## Development auth

Cooking routes require `x-flemme-user-id`. Middleware validates it as a UUID and
confirms that it identifies a real database user. This adapter is explicitly
development-only and remains outside cooking-session business logic.

## Errors

Errors use `{ error: { code, message } }`. Expected domain and request errors map
to stable 4xx responses. Invalid persisted snapshots and unexpected database
errors return controlled 500 responses without exposing raw errors.

## Boundaries

- No database schema or migration change.
- No AI invocation or historical regeneration.
- No favorite endpoint; a favorite is eligible only for an owned completed
  cooking session with a selected-recipe snapshot, to be enforced in a later
  favorite use case.
- No production authentication, other API domains, Redis, queues, or frontend.
