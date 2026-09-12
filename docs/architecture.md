# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Runtime | Bun | Runtime and package manager |
| Monorepo | Turborepo | Workspace and task orchestration |
| Web | Vite + React | Browser application |
| Routing | TanStack Router | Typed client routing |
| Server State | TanStack Query | Remote/server state |
| UI | Tailwind CSS + shadcn/ui | Design system foundation |
| API | Hono | HTTP application layer |
| API Contract | Zod + Hono OpenAPI | Runtime validation and OpenAPI |
| Agent | Anvia | Agent runtime |
| Models | OpenAI / OpenRouter | Model providers |
| Database | PostgreSQL | Persistent application data |
| ORM | Drizzle | Database schema and access |
| Validation | Zod | Runtime contracts |

## System Boundaries

- `apps/web`
  Owns browser UI, routing, forms, and frontend state.

- `apps/api`
  Owns HTTP boundaries, application orchestration, auth, authorization,
  persistence coordination, and agent invocation.

- `packages/agent`
  Owns AI instructions, model configuration, agent tools, structured AI
  behavior, and agent evaluation.

- `packages/ingredients`
  Owns language-independent canonical ingredient keys, bilingual display names,
  aliases, deterministic exact-name resolution, and catalog validation. It does
  not own nutrition arithmetic, fuzzy matching, persistence, or AI resolution.

- `packages/nutrition`
  Owns deterministic structured-unit normalization, estimated-nutrition
  contracts, and calculation from normalized ingredient masses and explicit
  reference values. It validates nutrition and conversion keys against
  `packages/ingredients` through a one-way dependency. It does not own
  natural-language ingredient parsing, reference sourcing, persistence, or AI
  reasoning.

- `packages/db`
  Owns database schemas, migrations, and database access.

Local PostgreSQL infrastructure is defined in the root `docker-compose.yml`.
It is a development concern only; application containers and production
deployment infrastructure remain outside the current architecture.

- `packages/contracts`
  Owns shared Zod contracts used across workspace boundaries.

## Request Flow

Web
→ API
→ application logic
→ Agent, Nutrition, and/or Database

The web application must not directly access the database or private AI
provider credentials.

## Agent Boundary

The agent is a reusable capability, not an independent backend.

Agent code does not own:

- HTTP authentication
- user authorization
- application persistence
- secrets management
- direct business side effects

## Invariants

1. Web never connects directly to PostgreSQL.
2. Web never receives private provider API keys.
3. The agent does not become a second application backend.
4. External input is validated before business logic trusts it.
5. Shared cross-workspace contracts belong in `packages/contracts`.
6. Do not add distributed infrastructure without a proven requirement.
7. Core cooking flow must not depend on secondary modules such as budgeting.
8. Ingredient identity, unit conversions, and nutrition references share the
   same language-independent canonical ingredient key.
