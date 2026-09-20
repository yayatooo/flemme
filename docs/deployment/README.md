# Deployment readiness

Production deployment has not started. This document records current
requirements and open operational decisions; it is not evidence of a deployed
environment.

## Deployable boundaries

- Flemme application services run on Bun.
- PostgreSQL is required by the API and migrations remain owned by
  `packages/db`.
- The Web build receives only the public API origin. API, database,
  authentication, model-provider, and Lens secrets remain outside the browser.
- API and Web origins must be explicit HTTPS origins in production so Better
  Auth cookie and CORS protections remain valid.
- Local Docker Compose files are development infrastructure, not production
  topology.

## Observability requirements

Runtime observability is implemented and locally verified for all four cooking
phases, but remains disabled with sample rate zero by default. Production use
requires a deliberately deployed loopback relay/sidecar using Node 24 and the
official Lens SDK. The Bun service must not receive Lens credentials or import
the Node-only SDK.

Before enabling production sampling, define:

- relay lifecycle and health ownership;
- application shutdown and final flush behavior;
- authentication and network isolation between Bun and the relay;
- environment and release naming;
- sampling policy and operational capacity;
- retention, access, and incident procedures.

The privacy allowlist and uncaptured input/output boundary documented in the
[Agent module](../modules/agent.md) are deployment requirements, not optional
diagnostic settings.

## Remaining milestones

1. Select and document the production/staging service topology and secret
   ownership.
2. Prepare staging deployment without enabling production traffic.
3. Run staging smoke tests for authentication, persistence, the four cooking
   phases, and observability lifecycle.
4. Prepare the Flemme presentation only after staging evidence is complete.

Local Lens operation is documented in
[`infra/lens-local/README.md`](../../infra/lens-local/README.md).
