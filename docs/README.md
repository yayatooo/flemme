# Flemme documentation

This directory contains the durable product, architecture, operational, and
verification documentation for Flemme. Package-specific setup remains next to
the package that owns it.

## Start here

- [Project overview](project-overview.md) — product goals and scope.
- [Business context](business-context.md) — product rules and cooking-flow
  contracts.
- [Architecture](architecture.md) — system topology and cross-package
  invariants.
- [Code standards](code-standards.md) and [UI context](ui-context.md) —
  implementation conventions.
- [Current status](progress-tracker.md) — completed milestones, active work,
  and links to evidence.

## Module guides

- [Agent](modules/agent.md)
- [API](modules/api.md)
- [Web](modules/web.md)
- [Data and infrastructure](modules/data-and-infrastructure.md)

## Verification and operations

- [Evaluation coverage](evals/flemme-four-phase-eval-coverage-audit.md)
- [Lens ingestion smoke](evals/flemme-four-phase-lens-ingestion-report.md)
- [Runtime observability canary](evals/flemme-four-phase-runtime-observability-canary-report.md)
- [Security evidence](security/README.md)
- [Testing guides](testing/README.md)
- [Deployment readiness](deployment/README.md)
- [Nutrition data provenance](data/nutrition-sources.md)

Operational instructions that are specific to a component remain colocated:

- [`apps/api/README.md`](../apps/api/README.md)
- [`apps/web/README.md`](../apps/web/README.md)
- [`packages/agent/evals/README.md`](../packages/agent/evals/README.md)
- [`packages/agent/src/observability/README.md`](../packages/agent/src/observability/README.md)
- [`infra/lens-local/README.md`](../infra/lens-local/README.md)
- [`tools/lens-eval-smoke/README.md`](../tools/lens-eval-smoke/README.md)
