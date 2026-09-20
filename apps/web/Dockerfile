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

COPY apps/web apps/web
COPY packages packages

ARG VITE_API_URL=/api
ARG GOOGLE_LOGIN_ENABLED=false
RUN VITE_API_URL=${VITE_API_URL} VITE_GOOGLE_AUTH_ENABLED=${GOOGLE_LOGIN_ENABLED} \
  bun run --cwd apps/web build

FROM nginx:1.27.5-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "--spider", "-q", "http://127.0.0.1:8080/healthz"]
