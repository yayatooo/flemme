# Flemme local Anvia Lens

This directory owns the infrastructure-only Lens proof of concept. The separate
Node-only eval smoke package lives in `tools/lens-eval-smoke`; neither it nor the
Lens SDK is imported by Flemme application code, and the Bun runtime is
unchanged.

The stack is adapted from the official Anvia Lens production and constrained
Compose files at release
[`v0.13.0`](https://github.com/anvia-hq/lens/releases/tag/v0.13.0), commit
`d150e99b54fa12dc06a9a606bae0e668288e8b4d`. Lens images are pinned to
`0.13.0` (backend digest
`sha256:0e30c01052ad52513615bbaf44a067a76b2769c95bd02fb3479f7b523d67af29`,
web digest
`sha256:e006bd8c45f5fab183f626bf9f075c3bf0f6e1c8ec2b5d014f883227e8b928d7`).
Only the web interface is published, on
`http://127.0.0.1:18080`; PostgreSQL, ClickHouse, Redis, API, worker, and monitor
remain on private Compose networks.

## First-time setup

From the Flemme repository root:

```sh
bun infra/lens-local/generate-secrets.ts
docker-compose -p flemme-lens-local \
  --env-file infra/lens-local/.env \
  -f infra/lens-local/compose.yml \
  up -d --wait --wait-timeout 300
```

The generator refuses to overwrite either ignored environment file. The local
Compose secrets are independent random 256-bit values and the files are created
with mode `0600`.

## Inspect health and logs

```sh
docker-compose -p flemme-lens-local \
  --env-file infra/lens-local/.env \
  -f infra/lens-local/compose.yml \
  ps

docker-compose -p flemme-lens-local \
  --env-file infra/lens-local/.env \
  -f infra/lens-local/compose.yml \
  logs -f api worker web
```

The one-shot `migrate` service should exit with code 0. PostgreSQL, ClickHouse,
Redis, monitor, API, and web should report healthy; the worker should remain
running.

## Stop while preserving data

```sh
docker-compose -p flemme-lens-local \
  --env-file infra/lens-local/.env \
  -f infra/lens-local/compose.yml \
  down
```

## Completely remove only Lens-local containers and volumes

This is destructive and intentionally is not run during bootstrap:

```sh
docker-compose -p flemme-lens-local \
  --env-file infra/lens-local/.env \
  -f infra/lens-local/compose.yml \
  down --volumes --remove-orphans
```

Never omit `-p flemme-lens-local` from the destructive command.

## Isolated Node 24 boundary

Lens SDK experiments must run outside Flemme's Bun workspaces. Use the pinned
Node 24 image below; do not add `@anvia/lens` to a Flemme package. Account,
project, and ingestion-key setup remains isolated to the local stack.

```sh
docker run --rm \
  node:24.15.0-bookworm-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d \
  node --version
```

The verified output is `v24.15.0`. This does not change Flemme's Bun package
manager or application runtime.

## Eval ingestion smoke

After the owner, project, and ingestion-key setup is complete, run the isolated
tests and either the backward-compatible Recommendation smoke or the four-phase
payload-free smoke from the repository root:

```sh
bun install --cwd tools/lens-eval-smoke --frozen-lockfile
bun run --cwd tools/lens-eval-smoke test
bun run --cwd tools/lens-eval-smoke smoke
bun run --cwd tools/lens-eval-smoke smoke:four-phase
```

The last command invokes Node 24 and explicitly loads only
`infra/lens-local/.env.flemme-agent`. See
`tools/lens-eval-smoke/README.md` for the privacy contract, the deterministic
four-phase runtime canary, and Lens UI verification instructions.

## Initial account and key setup

After the stack is healthy, open `http://127.0.0.1:18080` and create the first
owner account. The first account closes public bootstrap registration. From the
workspace project list, choose **Create project**, name it `Flemme Local`, and
use slug `flemme-local`. Open that project's **Project settings**, enter a key
name such as `Flemme Local Agent`, and choose **Create key**.

The secret is displayed only once. Store the generated public and secret keys
locally in:

```text
infra/lens-local/.env.flemme-agent
```

Keep the existing base URL, service name, and environment values. Never paste
the secret key into chat or commit the ignored file.
