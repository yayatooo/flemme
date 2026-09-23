# Project status

Last reviewed: 2026-09-23.

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
- The Agent provider boundary now targets OpenRouter at its fixed official API
  endpoint and defaults to `openai/gpt-5.6-luna`. API startup, local
  runners, evals, and the structured-output probe use `OPENROUTER_API_KEY`, with
  `OPEN_API_KEY` temporarily accepted for the current local migration. A live
  probe confirmed that GPT-5.6 Luna returns schema-validated structured output
  through the Anvia runtime. Structured requests also require
  parameter-compatible OpenRouter endpoints through the provider-routing
  preference, preventing selection of an upstream endpoint that cannot honor
  JSON Schema output. The focused GPT-5.6 Luna Pre-Cooking rerun passes all 3
  cases and all 12 deterministic metric evaluations; exact required-equipment
  names are now preserved from the selected recipe snapshot.
- All four GPT-5.6 Luna development runners are live-verified. Recommendation
  now adapts its root discriminated union to OpenAI's strict schema boundary;
  Pre-Cooking completes with validated output; all ten Active Cooking scenarios
  complete, including Indonesian guidance, previous-step, and abandonment
  phrasing; and all eight Completion scenarios complete. The standalone
  structured-output probe also passes.

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
