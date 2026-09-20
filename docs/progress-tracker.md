# Project status

Last reviewed: 2026-09-20.

## Current verified state

- The product flow is implemented across Recommendation, Pre-Cooking, Active
  Cooking, and Completion, with explicit API-owned persistence boundaries.
- Local eval coverage is complete: 26/26 synthetic cases, 17 deterministic
  metrics, and 121/121 metric evaluations. The separately verified qualitative
  baseline is 4/4 cases and 5/5 metrics.
- Four-phase Lens eval ingestion is implemented and manually confirmed. Each
  synthetic run stored one passing metric with a null payload and
  `not_requested` payload status.
- Four-phase runtime observability is implemented and manually confirmed using
  deterministic local canaries. Normal runtime defaults remain disabled with a
  zero sample rate.
- The NeedMCP credential was revoked, affected advertised Git history was
  rewritten and verified, the active clone was replaced, and obsolete local
  rewrite artifacts were removed.
- Authentication, onboarding, persistent cooking context, Cooking Sessions,
  nutrition, History, Favorites, Inventory, Profile, and the mobile-first Web
  flow are implemented within the documented package boundaries.

## Evidence

- [Four-phase eval coverage](evals/flemme-four-phase-eval-coverage-audit.md)
- [Four-phase Lens ingestion](evals/flemme-four-phase-lens-ingestion-report.md)
- [Four-phase runtime observability](evals/flemme-four-phase-runtime-observability-canary-report.md)
- [Security history remediation](security/needmcp-history-rewrite-execution.md)
- [Architecture](architecture.md)

## Next milestone

Production deployment preparation now has a local container, routing, secret
ownership, health, shutdown, and manual migration contract. Promotion and VPS
mutation remain separate reviewed checkpoints. See
[Deployment contract](deployment/README.md).

The following work is not complete:

- staging deployment;
- staging smoke testing;
- production enablement;
- host Nginx/TLS configuration and public smoke testing;
- the Flemme presentation.

## Active blockers and decisions

There is no blocker to local development. Deployment still requires explicit
decisions for trusted proxy/IP handling and distributed authentication rate
limits, production observability relay ownership, shutdown flushing, sampling,
release naming, network isolation, retention, and access control. Local Lens
Compose infrastructure must not be treated as the production topology.
