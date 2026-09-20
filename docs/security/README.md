# Security documentation

Security-sensitive operational evidence is kept concise and free of credential
values, environment contents, local machine paths, and disposable workspace
details.

## Current controls

- Local environment files are ignored and are not copied into documentation.
- Browser configuration exposes only explicitly public values.
- Authentication, database, model-provider, and Lens credentials stay on their
  owning server boundary.
- Agent eval, Lens ingestion, and runtime observability use synthetic fixtures
  and strict payload/metadata controls.
- Runtime observability excludes raw prompts, responses, domain payloads,
  identities, headers, credentials, and raw exceptions.

## History remediation

The NeedMCP credential incident was remediated by revoking the credential,
removing the obsolete configuration path from the affected advertised Git
history, atomically updating the affected refs, replacing the active clone, and
removing retained local rewrite artifacts. The preserved mapping and security
limitations are recorded in the
[execution report](needmcp-history-rewrite-execution.md).

Local Git operations cannot guarantee physical deletion from hosting-provider
caches, unreachable server objects, forks, or historical external clones.
Credential revocation remains the control for those copies.
