FROM oven/bun:1.2.20-alpine AS build

WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/agent/package.json packages/agent/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ingredients/package.json packages/ingredients/package.json
COPY packages/nutrition/package.json packages/nutrition/package.json
RUN bun install --frozen-lockfile

COPY apps/api apps/api
COPY packages packages
RUN bun run --cwd apps/api build

FROM oven/bun:1.2.20-alpine AS runtime

WORKDIR /app

COPY --from=build --chown=bun:bun /app/apps/api/dist/index.js ./index.js
COPY --from=build --chown=bun:bun /app/apps/api/dist/migrate.js ./migrate.js
COPY --from=build --chown=bun:bun /app/packages/db/drizzle ./drizzle

USER bun

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:3000/api/ready').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["bun", "/app/index.js"]
