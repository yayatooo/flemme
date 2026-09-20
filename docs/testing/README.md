# Testing strategy

Flemme uses layered verification so contract defects are caught at the owning
boundary.

- Package unit tests cover schemas, pure domain logic, privacy contracts, and
  deterministic eval metrics.
- API integration tests exercise authentication, ownership, persistence, and
  cooking orchestration against PostgreSQL.
- Web tests cover route guards, server-state behavior, forms, and cooking-flow
  state transitions.
- Root typecheck validates all workspaces; the production build validates the
  deployable dependency graph.
- Live target-model evals and qualitative judges are explicit, non-offline
  verification modes. They are not implicit test-suite dependencies.
- Lens ingestion and runtime canaries are explicit local operational checks and
  never substitute for functional tests.

For a completed implementation unit, run its focused tests and typecheck first,
then the root tests, root typecheck, production build, repository formatting or
lint checks, frozen installs, and `git diff --check` as appropriate. Database
integration tests must use an explicitly selected database and must not mutate
unrelated persistent volumes.

## Manual API guides

- [Complete cooking flow](swagger-cooking-flow.md)
- [Profile](swagger-profile-flow.md)
- [Household](swagger-household-flow.md)
- [Kitchen](swagger-kitchen-flow.md)
- [Inventory](swagger-inventory-flow.md)
- [Favorites](swagger-favorites-flow.md)

The generated OpenAPI document remains the authoritative HTTP shape. These
guides describe safe sequencing and expected business behavior for reviewers.
