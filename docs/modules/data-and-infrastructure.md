# Data and infrastructure

## PostgreSQL and migrations

`packages/db` owns the Drizzle schema, migrations, and database access helpers.
The API owns transaction and persistence orchestration. Agent and Web packages
must not connect to PostgreSQL directly. Migration files are committed source;
runtime services do not invent schema changes.

Local application development uses the repository Docker Compose PostgreSQL
service. Test runs that require isolation may use a dedicated temporary
PostgreSQL instance and pass its connection URL through the process environment.
Persistent development volumes must not be repurposed as disposable test data.

## Environment responsibilities

- The root `.env` supplies local application configuration for API, Web,
  database, authentication, and Agent provider access.
- `infra/lens-local/.env` contains ignored local Lens stack configuration.
- `infra/lens-local/.env.flemme-agent` contains ignored Lens ingestion
  credentials used only by the isolated Node tool.
- Only explicitly public `VITE_*` values may reach the browser. Database,
  authentication, provider, and Lens credentials remain server-side.

Environment files are local operational state and must never be committed or
copied into reports.

## Lens local boundary

`infra/lens-local` owns the local Lens v0.13.0 Compose stack. Only the web UI is
published on loopback; PostgreSQL, ClickHouse, Redis, API, worker, and monitor
remain on private Compose networks. The local stack is evidence and development
infrastructure, not a production deployment.

The isolated `tools/lens-eval-smoke` package runs on pinned Node 24 with the
official Lens SDK. It owns eval-ingestion smoke and the runtime relay boundary.
Flemme remains a Bun application and does not add Lens SDK dependencies to its
workspaces.

See [`packages/db/README.md`](../../packages/db/README.md),
[`infra/lens-local/README.md`](../../infra/lens-local/README.md), and
[`tools/lens-eval-smoke/README.md`](../../tools/lens-eval-smoke/README.md).
