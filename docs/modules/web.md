# Web module

`apps/web` is the React/Vite user platform. TanStack Router owns routing and
TanStack Query owns server state. The browser depends on the API through the
public `VITE_API_URL` origin and authenticates with server-managed cookies;
secrets and provider tokens never belong in browser configuration or storage.

## Routing and application shell

- `/` is the public landing page.
- `/login` and `/register` are guest-only authentication routes.
- `/onboarding` and its Profile, Household, Kitchen, Inventory, and completion
  steps are protected setup routes.
- `/app` is the protected application shell for Home, recommendation,
  pre-cooking, active cooking, completion, nutrition, history, favorites,
  inventory, and profile flows.

Route guards restore identity through `/auth/me` and resolve onboarding state
through the API. A Product Domain `401` clears the query cache and returns to
login; documented missing-resource `404` responses drive onboarding rather
than invalidating authentication. Logout clears server session and cached
Product Domain state.

The cooking flow carries only the browser state required to reach a persisted
session. Once a session exists, refresh-safe routes restore canonical plan and
progress data from the API. The UI submits accepted actions to the API's
explicit mutation endpoints rather than treating Agent output as persisted
state.

Unknown routes use the shared not-found experience. Unexpected loading and API
failures remain explicit error states rather than being reinterpreted as empty
domain data.

Deployment-facing browser configuration is limited to a valid HTTP(S) API
origin. See [`apps/web/README.md`](../../apps/web/README.md),
[UI context](../ui-context.md), and [Deployment readiness](../deployment/README.md).
