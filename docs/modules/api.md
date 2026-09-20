# API module

`apps/api` is the Hono application boundary. It owns HTTP validation,
authentication, user ownership, orchestration, and persistence coordination.
It invokes the Agent and deterministic domain packages but does not move their
contracts into the HTTP layer.

## Responsibilities

- Better Auth email/password and Google authentication with server-managed
  HttpOnly cookies.
- One canonical current-user boundary for protected Product Domain routes.
- OpenAPI generation and Swagger UI at `/openapi.json` and `/docs`.
- Profile, Household, Kitchen, Inventory, onboarding, favorites, Cooking
  Session, cooking-phase, and nutrition orchestration.
- Ownership checks and PostgreSQL access through application services.

`GET /health` reports process health without authentication. It is not a
database, provider, or downstream readiness guarantee. Missing Agent provider
configuration does not prevent health, documentation, or persistence routes
from starting; Agent-backed routes return a controlled configuration error.

## Cooking lifecycle and mutation boundary

Recommendation and Pre-Cooking load owned persistent context, apply explicit
request overrides, call the Agent, and return validated output without creating
or mutating a Cooking Session. Session creation explicitly persists the chosen
recipe and generated plan snapshots.

Active Cooking restores the owned plan and progress and returns guidance plus
proposed actions. It does not apply them. `PATCH /cooking-sessions/:id/progress`
is the explicit persistence boundary for accepted progress changes.

Completion generation restores the plan and final progress and returns a
validated completion output without changing the database. The separate
complete endpoint recalculates deterministic nutrition from server-owned state
and persists lifecycle and snapshots atomically. Clients cannot submit a
nutrition snapshot.

The full route and configuration contract is maintained in
[`apps/api/README.md`](../../apps/api/README.md). Manual API flows are indexed in
[Testing](../testing/README.md).
