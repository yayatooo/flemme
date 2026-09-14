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
  natural-language ingredient parsing, runtime external reference fetching,
  persistence, or AI reasoning.

Production ingredient and nutrition reference data is established through a
separate, curated Ingredient + Nutrition Data Foundation. USDA FoodData Central
is the primary v0.1 source. Stored references preserve provenance and FoodData
Central IDs; Flemme does not bulk-import the complete dataset. Unit-to-gram
conversions are supported only when backed by verified source portion data.
TKPI remains a possible Indonesia-specific source after a separate provenance
and licensing review.

The production data flow is:

```text
@flemme/ingredients production catalog
        ↓ canonical ingredient key
@flemme/nutrition curated USDA FDC mapping
        ↓ 100 g reference + verified source-specific portions
deterministic normalization and calculation
        ↓
complete | partial | unavailable
```

FDC IDs are provenance identifiers, not Flemme ingredient identities. The
curated mappings are committed package data, so normal runtime has no USDA
network dependency.

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

## API Foundation

API features use colocated Hono route, transport schema, and service modules.
Routes validate HTTP input with Zod, services coordinate domain rules and
`@flemme/db`, and database schema definitions remain inside `packages/db`.
Hono OpenAPI route definitions generate the specification served at
`/openapi.json`; Swagger UI is available at `/docs`.

Persisted agent and nutrition JSONB snapshots are untrusted when restored. The
API parses them through the runtime schema exported by the package that owns
the snapshot before returning or using them.

Cooking Session nutrition is orchestrated in `apps/api` from the persisted
Pre-Cooking plan and selected recipe serving count. The read-only preview and
completion persistence paths share one deterministic mapper that resolves only
the production ingredient catalog, exact supported unit aliases, verified
portion conversions, and committed USDA references. Preview performs no write;
completion calculates before one update persists lifecycle state, Completion
output, and the server-owned nutrition snapshot together. Neither path invokes
an Agent or accesses USDA over the network.

Product-domain APIs use the same authenticated `currentUserId` boundary as the
Cooking Engine. Profile v0.1 exposes the existing optional one-to-one
`user_profiles` row through a read plus idempotent full replacement of its two
cooking-preference arrays. It does not introduce another preference model;
Recommendation and Pre-Cooking continue reading those columns through the
existing cooking-context service, with request-level arrays replacing
persistent arrays for one request.

Household v0.1 follows the same current-user resource boundary over the
existing optional one-to-one `households` row. Its API replaces the complete
aggregate adults, children, and toddlers counts without introducing household
members or a second representation. The existing cooking-context service reads
the saved row directly, while a request-level household remains a whole-object
override for one cooking request.

Until production authentication is implemented as a separate milestone,
cooking routes use an isolated development middleware that accepts a real user
UUID and verifies it against PostgreSQL. The API refuses to start that adapter
when `NODE_ENV=production`.

## Agent Boundary

Favorites are an overlay on completed Cooking Sessions, not recipe storage.
The API reuses session restoration and projects historical recipe summaries.
Creation uses an ownership/status-filtered insert and the existing composite
session/user FK and unique constraint. Removing a favorite preserves history.
No AI, current cooking context, copied snapshot or new history table is involved.

Inventory API writes the existing inventory parent and item rows. Ingredient
identity is validated by the production catalog in `@flemme/ingredients`, not
by a new database master table. Creation atomically initializes the parent and
inserts a unique canonical-key item. Updates preserve ingredient identity;
updates and deletes include authenticated ownership in their SQL predicates.
Legacy keys outside the production catalog remain readable with their key as
the display fallback; they are never guessed or silently remapped. New unknown
keys are rejected. Cooking-context loading and request overrides are unchanged.

Kitchen API uses the existing user-owned kitchen parent and equipment child
rows. Equipment identity remains free-form text. A full replacement upserts the
parent, deletes previous child rows, and inserts the requested names in one
PostgreSQL transaction. The parent upsert serializes concurrent replacements
for the same user. Cooking-context orchestration reads these same child rows;
its existing unspecified ordering and whole-request override behavior remain
unchanged. The Kitchen response alone sorts names deterministically.

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
9. Unknown or fully unresolved nutrition is represented explicitly as
   unavailable and must never be replaced with zero-valued nutrition.
10. Nutrition snapshots are server-calculated historical metadata; clients may
    not supply them when creating or completing a Cooking Session.
