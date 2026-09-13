# Task — Flemme Active Cooking AI API v0.1

## Context

Flemme core cooking flow is already implemented and validated end-to-end.

Current flow:

```text
POST /cooking/recommendations
        ↓
Select Recipe
        ↓
POST /cooking/pre-cooking
        ↓
POST /cooking-sessions
        ↓
GET /cooking-sessions/{id}
        ↓
PATCH /cooking-sessions/{id}/progress
        ↓
POST /cooking-sessions/{id}/complete
```

The following are already complete:

```text
Recommendation AI                     ✅
Pre-Cooking AI                        ✅
Cooking Session persistence           ✅
Session restore                       ✅
Progress persistence                  ✅
Lifecycle guards                      ✅
Completion persistence                ✅
Swagger Full Cooking Flow v0.1        ✅
```

Important architecture boundary:

```text
AI orchestration
        ≠
session persistence
```

Cooking Session endpoints own persistence and lifecycle state.

AI endpoints should produce validated AI output, but must NOT silently mutate Cooking Session state.

---

# Goal

Implement:

```text
Active Cooking AI API v0.1
```

The API should allow an authenticated user to send a message while a Cooking Session is in progress.

Conceptual flow:

```text
HTTP request
    ↓
Development auth
    ↓
Load owned Cooking Session
    ↓
Restore immutable cookingPlan
    ↓
Restore current session progress
    ↓
Build ActiveCookingInput
    ↓
@flemme/agent Active Cooking runtime
    ↓
ActiveCookingOutputSchema
    ↓
HTTP response
```

The API must use the persisted Cooking Session as the source of truth.

The client must NOT resend:

```text
cookingPlan
currentStageId
currentStepId
completedStepIds
changes
session status
```

Those values must be restored from PostgreSQL.

---

# Existing Agent Contract

The Active Cooking agent foundation already exists in `@flemme/agent`.

Before implementing the API, inspect the actual current implementation and reuse it.

Expected conceptual input:

```ts
type ActiveCookingInput = {
  cookingPlan: PreCookingOutput;

  session: {
    status:
      | "active"
      | "paused"
      | "completed"
      | "abandoned";

    pauseReason?: string;

    currentStageId: string;
    currentStepId: string;

    completedStepIds: string[];

    changes: Array<{
      kind:
        | "ingredient"
        | "equipment"
        | "servings"
        | "step"
        | "other";

      description: string;
      relatedStepId?: string;
    }>;
  };

  message: string;
};
```

Expected conceptual output:

```ts
type ActiveCookingOutput = {
  reply: string;

  actions: Array<
    | ...
  >;
};
```

Existing action concepts include:

```text
advance
previous-step
pause
resume
record-change
complete-cooking
abandon-cooking
clarify
```

IMPORTANT:

Do not invent a replacement schema.

Reuse the real current:

```text
ActiveCookingInputSchema
ActiveCookingOutputSchema
```

and the existing runtime / intent implementation from `@flemme/agent`.

Preserve current Active Cooking rules, including:

```text
- cookingPlan remains immutable
- agent uses current progress as context
- agent may propose actions
- agent must not silently mutate application state
- clarification must not be combined with another lifecycle action
- at most one lifecycle action per output where the existing contract requires it
- actions may be empty when guidance alone is sufficient
```

---

# 1. Add Active Cooking HTTP Endpoint

Recommended endpoint:

```http
POST /cooking-sessions/{id}/active-cooking
```

If the project already has a stronger naming convention discovered during implementation, use the minimal convention-compatible variant.

Do NOT create a generic `/chat` endpoint.

The route belongs specifically to an existing Cooking Session.

---

# 2. Request Contract

The request should be intentionally small.

Prefer:

```json
{
  "message": "Bawangnya mulai gosong, harus bagaimana?"
}
```

The client should NOT be allowed to submit its own copy of:

```text
cookingPlan
session progress
selected recipe
recommendation snapshot
```

because those already exist in persisted server state.

Use Zod for request validation.

Requirements:

```text
message:
- required
- string
- trimmed
- non-empty
- use a reasonable maximum length
```

Do not over-design chat/message metadata in v0.1.

---

# 3. Load Cooking Session from PostgreSQL

Reuse the existing Cooking Session service/repository boundary where possible.

Given:

```text
currentUserId
cookingSessionId
```

load the owned session and restore:

```text
cookingPlan
session.status
session.pauseReason if persisted/supported
session.currentStageId
session.currentStepId
session.completedStepIds
session.changes
```

The restored `cookingPlan` must continue to validate through its owning Agent schema.

Do not regenerate the Pre-Cooking plan.

Do not accept a client-provided replacement plan.

---

# 4. Ownership and Lifecycle Guard

The endpoint must respect the same ownership semantics as existing Cooking Session endpoints.

Expected controlled behavior:

```text
missing session       → 404
wrong owner           → existing ownership behavior
invalid user          → 401
```

Active Cooking AI should only operate on an interactable Cooking Session.

At minimum:

```text
active     → allowed
paused     → allowed
completed  → rejected
abandoned  → rejected
```

Why paused should be allowed:

```text
User may ask:
"Saya mau lanjut masak"

while the persisted session is paused.
```

The agent can then propose a `resume` action.

Do not automatically resume the database session.

Use a controlled lifecycle error for completed/abandoned sessions.

Prefer the existing error conventions.

---

# 5. Build ActiveCookingInput Server-Side

The server should construct:

```text
ActiveCookingInput
```

from:

```text
persisted cookingPlan
+
persisted mutable session state
+
request.message
```

Conceptually:

```ts
const input = {
  cookingPlan: restoredCookingPlan,

  session: {
    status: persistedStatus,
    pauseReason: persistedPauseReason,
    currentStageId: persistedCurrentStageId,
    currentStepId: persistedCurrentStepId,
    completedStepIds: persistedCompletedStepIds,
    changes: persistedChanges,
  },

  message: request.message,
};
```

Validate through the actual owning schema before invoking the agent.

---

# 6. Invoke Existing Active Cooking Agent

Reuse the existing `@flemme/agent` runtime.

Do NOT implement Active Cooking prompting inside `apps/api`.

Expected dependency direction:

```text
apps/api
    ↓
@flemme/agent
```

not:

```text
@flemme/agent
    ↓
apps/api
```

If the runtime is not currently exported from the package public API, export the minimal existing function/schema needed.

Do not duplicate its implementation.

---

# 7. Response Contract

Return the validated Active Cooking output directly.

Conceptually:

```json
{
  "reply": "Kecilkan api dan segera aduk bawangnya agar panasnya turun merata.",
  "actions": []
}
```

or, if the agent determines a lifecycle action:

```json
{
  "reply": "Kalau kamu ingin berhenti sebentar, kita bisa pause sesi ini.",
  "actions": [
    {
      "type": "pause"
    }
  ]
}
```

Use the exact real `ActiveCookingOutputSchema` shape.

Do NOT reshape the output into a second competing API-specific action model unless technically necessary.

---

# 8. Critical Rule — No Silent Persistence

This is the most important acceptance criterion.

Calling:

```http
POST /cooking-sessions/{id}/active-cooking
```

must NOT automatically mutate:

```text
currentStageId
currentStepId
completedStepIds
changes
status
phase
completedAt
cookingPlan
```

The agent returns guidance and proposed actions only.

Example:

```text
User:
"Langkah ini sudah selesai"

Active Cooking AI:
{
  reply: "...",
  actions: [
    advance
  ]
}
```

This alone must NOT move the database session.

The client/application layer may then explicitly call:

```http
PATCH /cooking-sessions/{id}/progress
```

to persist the accepted transition.

The architecture should remain:

```text
Active Cooking AI
        ↓
proposed action
        ↓
client/application decides
        ↓
PATCH progress
        ↓
persistent state changes
```

NOT:

```text
Active Cooking AI
        ↓
database mutation
```

---

# 9. Interaction Scenarios

Add deterministic integration coverage for the API orchestration layer.

Do not rely on a real external AI provider in automated tests.

Mock/stub only the external Agent invocation boundary as already practiced in Recommendation/Pre-Cooking tests.

Cover representative scenarios.

## Scenario A — Guidance Only

Current step:

```text
stage-2-step-2
```

User:

```text
"Bawangnya mulai gosong."
```

Agent output may contain:

```text
reply
actions = []
```

Verify:

```text
HTTP 200
output schema-valid
database progress unchanged
```

---

## Scenario B — Advance Proposal

User:

```text
"Langkah ini sudah selesai, lanjut."
```

Agent returns an `advance` action.

Verify:

```text
HTTP 200
advance action returned
database currentStepId unchanged
completedStepIds unchanged
```

The caller must still PATCH progress separately.

---

## Scenario C — Pause Proposal

User:

```text
"Saya mau berhenti sebentar."
```

Agent returns a pause action.

Verify:

```text
HTTP 200
pause action returned
persisted status still unchanged
```

---

## Scenario D — Resume From Paused Session

Persist a session with:

```text
status = paused
```

Then send:

```text
"Saya mau lanjut memasak."
```

Verify:

```text
Active Cooking endpoint is allowed
agent receives paused state
resume action can be returned
database remains paused until PATCH
```

---

## Scenario E — Completed Session Rejected

For:

```text
status = completed
```

calling Active Cooking must be rejected with a controlled lifecycle error.

Do not call the agent.

---

## Scenario F — Abandoned Session Rejected

Same rule for:

```text
status = abandoned
```

Do not call the agent.

---

## Scenario G — Clarification

User message is insufficient/ambiguous.

Agent returns the existing clarification form/action.

Verify it follows the existing contract rule:

```text
clarification must not be combined with another lifecycle action
```

Do not invent API-side interpretation.

---

# 10. Protect Immutable Cooking Plan

Add an assertion proving that after Active Cooking AI requests:

```text
recommendationSnapshot
selectedRecipeSnapshot
cookingPlan
```

remain identical.

The endpoint is read-only from the Cooking Session persistence perspective.

---

# 11. Error Mapping

Follow existing API error conventions.

Use the project's established response shape:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

Expected categories:

```text
400
invalid request body

401
missing/invalid development user

403
ownership violation, if this is the current convention

404
Cooking Session not found

409
Cooking Session lifecycle does not allow Active Cooking

500
corrupt persisted snapshot / unexpected internal state

502
agent/provider invocation failure or invalid model output

503
provider configuration unavailable
```

Reuse current error utilities/patterns.

Do not invent a separate error system for Active Cooking.

---

# 12. Swagger / OpenAPI

Register the new endpoint in the existing OpenAPI surface.

Swagger should clearly describe that this endpoint:

```text
- reads the current persisted Cooking Session
- sends one user message to Active Cooking AI
- returns guidance/actions
- does NOT persist proposed actions automatically
```

Document:

```http
POST /cooking-sessions/{id}/active-cooking
```

Request example:

```json
{
  "message": "Bawangnya mulai gosong, harus bagaimana?"
}
```

Use schema-backed OpenAPI generation consistent with the existing API.

Update OpenAPI verification tests.

---

# 13. Update Manual Swagger Guide

Extend:

```text
docs/testing/swagger-cooking-flow.md
```

with an optional Active Cooking AI section.

Do not rewrite the already-locked persistence acceptance flow.

Add a new section conceptually like:

```text
Active Cooking AI interaction
        ↓
returns reply + proposed actions
        ↓
verify GET session is unchanged
        ↓
if an action is accepted:
PATCH /progress explicitly
```

Clearly distinguish:

```text
AI recommendation/action
```

from:

```text
persisted lifecycle mutation
```

---

# 14. Real Provider Smoke Test

After deterministic automated tests pass, perform one real local provider-backed smoke test if credentials are available.

Use an existing active Cooking Session.

Suggested scenario:

```text
Current cooking instruction:
Tumis bawang sampai harum.

User message:
"Bawangnya mulai gosong, harus bagaimana?"
```

Acceptance expectation:

```text
HTTP 200
schema-valid ActiveCookingOutput
context-aware reply
no cooking-plan regeneration
no database mutation
```

Do not make automated tests depend on external provider availability.

If provider credentials are unavailable, report the smoke test as skipped rather than fabricating success.

---

# 15. No Message History Yet

Do NOT add a generic Active Cooking chat-history table in this task.

Do NOT persist every user/assistant exchange yet.

The current responsibility is:

```text
current Cooking Session context
+
one user message
        ↓
one validated Active Cooking response
```

Conversation persistence can be designed separately only if the product later requires it.

---

# 16. No Automatic Progress Application Yet

Do NOT add a combined endpoint like:

```text
ask AI
+
apply returned action
```

in v0.1.

Keep these separate:

```text
POST active-cooking
= reasoning/guidance

PATCH progress
= state mutation
```

This separation is intentional.

---

# 17. Out of Scope

Do NOT implement in this task:

```text
Completion AI API
Nutrition orchestration
LLM usage tracking
Admin API
credits
provider balance
billing
subscriptions
production auth
Redis
BullMQ
SSE
WebSocket
generic chat history
inventory mutation from agent output
automatic action execution
database schema redesign
```

Do not redesign:

```text
Recommendation
Pre-Cooking
Cooking Session lifecycle
ActiveCooking schemas
```

unless a concrete blocker is discovered.

---

# 18. Definition of Done

Active Cooking AI API v0.1 is complete when:

```text
POST /cooking-sessions/{id}/active-cooking
```

can:

```text
1. authenticate the development user
2. load an owned Cooking Session
3. restore its immutable Pre-Cooking plan
4. restore current mutable progress
5. construct ActiveCookingInput server-side
6. invoke existing @flemme/agent Active Cooking runtime
7. validate ActiveCookingOutput
8. return reply + actions
9. make zero silent Cooking Session mutations
```

Lifecycle behavior must also be explicit:

```text
active      ✅ allowed
paused      ✅ allowed
completed   ❌ rejected
abandoned   ❌ rejected
```

And this architecture must remain true:

```text
User message
      ↓
Active Cooking AI
      ↓
reply + proposed actions
      ↓
NO DATABASE MUTATION
      ↓
explicit PATCH /progress if caller accepts an action
```

---

# 19. Validation

Run at minimum:

```text
Active Cooking API integration tests
all API tests
full workspace tests
database lifecycle validation
workspace typecheck
API build
web build
scoped Biome
git diff --check
OpenAPI route verification
```

Use the real PostgreSQL test strategy already established by the project.

---

# 20. Progress Tracker

Update:

```text
docs/progress-tracker.md
```

Only mark Active Cooking AI API complete after all acceptance criteria pass.

Do NOT mark Completion AI or Nutrition integration complete.

The expected roadmap after this task is:

```text
Active Cooking AI API             ← this task
        ↓
Completion AI API
        ↓
Nutrition Integration
        ↓
Profile / Household / Kitchen / Inventory APIs
        ↓
Favorites
        ↓
Auth v1
        ↓
MVP Backend Complete
```

---

# Expected Final Report

Return a concise implementation report containing:

```text
files changed
endpoint added
request contract
server-side context construction
agent runtime reused
lifecycle guards
proof of no silent persistence
Swagger/OpenAPI changes
integration test scenarios
real provider smoke-test result
test/typecheck/build/check results
deferred work
```

Also show the final architecture:

```text
POST /cooking-sessions/{id}/active-cooking
        ↓
load Cooking Session
        ↓
restore cookingPlan + current progress
        ↓
run Active Cooking Agent
        ↓
{ reply, actions[] }
        ↓
return only
        ↓
(optional explicit PATCH /progress by caller)
```

Stop after Active Cooking AI API v0.1 is implemented and validated.

Do not continue into Completion AI in the same task.
