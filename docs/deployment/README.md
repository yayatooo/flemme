# Production deployment contract

This document defines a reviewable deployment contract. It is not evidence of
a deployed environment and does not authorize VPS or database mutation.

## Images and topology

Build from the repository root with Dockerfiles in `apps/api` and `apps/web`.
Both builders use the repository-pinned Bun 1.2.20. The web runtime is a small
static Nginx image with SPA fallback; it does not proxy API traffic.

`docker-compose.production.yml` runs web and API containers plus PostgreSQL 16.
Only these loopback publications exist:

- `127.0.0.1:${WEB_HOST_PORT}:8080` for the web container;
- `127.0.0.1:${API_HOST_PORT}:3000` for the API container.

PostgreSQL has no host port and is reachable only on the internal `private`
network. The API also joins `edge` so Google OAuth and user-triggered model
requests can reach their configured providers. Host Nginx is configured later:
`/api/*` routes to the API loopback port and all other paths route to the web
loopback port. `/api/docs` and `/api/openapi.json` must not be exposed publicly
without a separate review.

## Environment ownership

The operator owns an external production environment file, outside Git, with
mode `0600`. `.env.example` lists the complete names-only contract. `VITE_*`
values are public build inputs; all other configuration is injected at
container runtime. No secret is a build argument.

`DATABASE_URL` must use the same PostgreSQL user, password, and database as the
three `POSTGRES_*` values, with `postgres` as its Compose hostname. Production
uses `API_HOST=0.0.0.0` inside the container while published ports remain
host-loopback-only. Observability starts disabled with sample rate zero.

Google uses a Web application client with:

```text
Authorized JavaScript origin:
https://flemme.craftbygrace.com

Authorized redirect URI:
https://flemme.craftbygrace.com/api/auth/callback/google
```

Set both `GOOGLE_AUTH_ENABLED=true` and
`VITE_GOOGLE_AUTH_ENABLED=true`, then supply `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET`. Password authentication remains independently enabled.

## Migration and release order

Build the images first. Start PostgreSQL privately, verify that the target is
the intended empty database, and capture the authorized baseline. Apply only
committed Drizzle migrations with the profile-gated one-shot command:

```sh
docker-compose --env-file /path/to/flemme.production.env \
  -f docker-compose.production.yml --profile operations run --rm migrate
```

The command uses the same API image, runs `migrate.js`, and never seeds.
`db:seed`, `DEV_USER_EMAIL`, and `DEV_USER_PASSWORD` are development-only.

After migration, start API and web, then perform private loopback smoke checks.
Only after those checks pass should a separately reviewed host Nginx/TLS
configuration be enabled, followed by public smoke testing. A code rollback
does not reverse database migrations; database rollback requires its own
reviewed forward or restoration plan.

## Health and shutdown

- `/api/health` proves only that the API process can answer HTTP.
- `/api/ready` performs a bounded `select 1`; it returns 503 without internal
  error details when PostgreSQL is unavailable.
- `/healthz` is the web container liveness endpoint; all other unknown web
  routes fall back to the SPA.

On SIGTERM or SIGINT, the API stops accepting traffic, allows a bounded drain,
forces closure after eight seconds if needed, and closes PostgreSQL within the
12-second Compose grace period.

## Initial exclusions

The initial topology does not start Lens, a relay, Redis, workers, evals,
judges, canaries, or seeds. Enabling observability remains a later deployment
decision with separate relay ownership, privacy, retention, and shutdown-flush
review.
