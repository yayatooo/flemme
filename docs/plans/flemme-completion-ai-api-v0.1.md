# Task — Flemme Completion AI API v0.1

## Context

Flemme's core cooking flow and Active Cooking AI orchestration are already implemented and validated.

Current implemented flow:

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
POST /cooking-sessions/{id}/active-cooking
        ↓
optional PATCH /cooking-sessions/{id}/progress
        ↓
POST /cooking-sessions/{id}/complete
```

Current status:

```text
Recommendation AI                     ✅
Pre-Cooking AI                        ✅
Cooking Session persistence           ✅
Session restore                       ✅
Progress persistence                  ✅
Lifecycle guards                      ✅
Active Cooking AI API                 ✅
Completion persistence                ✅
Swagger Full Cooking Flow             ✅
```

Important architecture boundary:

```text
AI generation/orchestration
        ≠
session persistence
```

Active Cooking already follows this rule:

```text
POST active-cooking
        ↓
reply + proposed actions
        ↓
NO database mutation
        ↓
explicit PATCH /progress if accepted
```

Completion AI must follow the same principle.

---

# Goal

Implement:

```text
Completion AI API v0.1
```

The endpoint should generate a validated `CompletionOutput` from an owned Cooking Session that has genuinely finished all cooking steps.

It must NOT itself mark the Cooking Session as completed.

Conceptual flow:

```text
completion-ready Cooking Session
        ↓
POST Completion AI endpoint
        ↓
restore immutable cookingPlan
        ↓
restore final session progress
        ↓
build CompletionInput in memory
        ↓
@flemme/agent Completion runtime
        ↓
CompletionOutputSchema
        ↓
return {
  reply,
  summary,
  notes
}
        ↓
NO persistence mutation
```

Then the caller may explicitly persist it through the already-existing endpoint:

```text
POST /cooking-sessions/{id}/complete
```

with the returned output as:

```text
completionSnapshot
```

---

# 1. Inspect and Reuse Existing Completion Agent

Before changing the API, inspect the current `@flemme/agent` Completion implementation.

Reuse the actual current:

```text
CompletionInputSchema
CompletionOutputSchema
Completion runtime / intent
Completion prompt
```

Do NOT invent a second Completion contract inside `apps/api`.

The existing conceptual input is:

```ts
type CompletionInput = {
  cookingPlan: PreCookingOutput;

  session: {
    status: "completed";

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

  message?: string;
};
```

Conceptual output:

```ts
type CompletionOutput = {
  reply: string;

  summary: {
    title: string;
    description: string;
  };

  notes: string[];
};
```

Use the real schemas as source of truth.

---

# 2. Important Existing Contract Detail

The persisted Cooking Session is still:

```text
status = active
```

when the final cooking step has been completed but before:

```http
POST /cooking-sessions/{id}/complete
```

is called.

However, the existing `CompletionInputSchema` expects:

```text
session.status = completed
```

Do NOT mutate PostgreSQL just to satisfy the Agent contract.

Instead build an in-memory completion projection.

Conceptually:

```text
persisted session:

status = active
final step is current
final step ∈ completedStepIds
        ↓

server verifies session is completion-ready
        ↓

construct CompletionInput:

status = completed
same currentStageId
same currentStepId
same completedStepIds
same changes
        ↓

invoke Completion Agent
```

This is only an Agent input projection.

It must NOT change persisted status.

Do not weaken or redesign the existing Completion Agent schema solely for the HTTP API.

---

# 3. Add Completion AI HTTP Endpoint

Recommended endpoint:

```http
POST /cooking-sessions/{id}/completion
```

This endpoint means:

```text
generate Completion AI output
```

The existing endpoint:

```http
POST /cooking-sessions/{id}/complete
```

must continue to mean:

```text
persist completion and transition lifecycle
```

Do not merge these two responsibilities in v0.1.

Avoid naming the new endpoint `/complete-ai` or creating a generic `/chat`.

Use the existing project naming conventions if a slightly different minimal name fits better.

---

# 4. Request Contract

Keep the request intentionally small.

Completion should use persisted session state as the source of truth.

Prefer an optional request such as:

```json
{
  "message": "Masakannya sudah selesai."
}
```

The `message` should only exist if the existing Completion Agent contract can use it meaningfully.

If `message` is optional in the owning schema, allow:

```json
{}
```

or an omitted body if the current API/OpenAPI stack supports that cleanly.

The client must NOT submit:

```text
cookingPlan
currentStageId
currentStepId
completedStepIds
changes
status
selected recipe
recommendation snapshot
```

All of those must come from persisted server state.

If message is supplied:

```text
trim it
reject whitespace-only values
apply a reasonable maximum length
```

Do not add unnecessary completion-feedback fields in v0.1.

---

# 5. Load Owned Cooking Session

Use:

```text
currentUserId
cookingSessionId
```

to load the owned Cooking Session using the existing service/repository boundary where possible.

Restore and validate:

```text
cookingPlan
status
phase
currentStageId
currentStepId
completedStepIds
changes
completionSnapshot
completedAt
```

Do not regenerate Pre-Cooking output.

Do not trust a client-supplied plan.

---

# 6. Completion-Ready Guard

The Completion AI endpoint must only run when the cooking execution is genuinely finished.

Reuse the same lifecycle meaning already proven by the persistence flow:

```text
being positioned at final step
        ≠
final step completed
```

A session is completion-ready only when the existing lifecycle rules indicate it can proceed to completion.

At minimum verify:

```text
status = active
current stage = final cooking stage
current step = final cooking step
final step is present in completedStepIds
```

Prefer reusing an existing shared readiness helper if one already exists.

Do not duplicate lifecycle logic if the same validation can be safely reused from the existing completion service.

Expected invalid states:

```text
active but final step incomplete    → 409
paused                              → 409
completed                           → 409
abandoned                           → 409
```

For the "final step incomplete" case, prefer reusing the already-established:

```text
SESSION_NOT_READY_FOR_COMPLETION
```

For incompatible lifecycle states, use the project's existing conventions or a concise Completion-specific lifecycle error.

Do not invoke the Agent when the lifecycle guard fails.

---

# 7. Build CompletionInput Server-Side

After the session passes completion readiness, construct the owning Agent input in memory.

Conceptually:

```ts
const input = {
  cookingPlan: restoredCookingPlan,

  session: {
    status: "completed",
    currentStageId: persistedCurrentStageId,
    currentStepId: persistedCurrentStepId,
    completedStepIds: persistedCompletedStepIds,
    changes: persistedChanges,
  },

  ...(request.message ? { message: request.message } : {}),
};
```

Important:

```text
"completed"
```

here is only the Completion Agent's semantic input state.

The database remains:

```text
status = active
phase = active_cooking
completedAt = null
```

until the separate persistence endpoint succeeds.

Validate the constructed input through the real:

```text
CompletionInputSchema
```

before invocation where appropriate.

---

# 8. Invoke Existing Completion Agent

Reuse the Completion runtime from:

```text
@flemme/agent
```

The dependency direction remains:

```text
apps/api
    ↓
@flemme/agent
```

If the existing Completion runtime/schema is not exported from the package public API, export only the minimal required existing symbols.

Do not copy Completion logic into the API package.

---

# 9. Response Contract

Return the validated `CompletionOutput` directly.

Expected shape:

```json
{
  "reply": "Masakanmu sudah selesai dan siap disajikan.",
  "summary": {
    "title": "Telur Kecap Bawang Selesai",
    "description": "Sesi memasak berhasil diselesaikan mengikuti rencana yang dipilih."
  },
  "notes": [
    "Seluruh langkah memasak telah selesai."
  ]
}
```

Use the exact current:

```text
CompletionOutputSchema
```

Do not create a second API-specific representation.

---

# 10. Critical Rule — No Silent Persistence

Calling:

```http
POST /cooking-sessions/{id}/completion
```

must NOT mutate:

```text
phase
status
currentStageId
currentStepId
completedStepIds
changes
completionSnapshot
nutritionSnapshot
completedAt
cookingPlan
recommendationSnapshot
selectedRecipeSnapshot
```

The endpoint is AI generation only.

Required architecture:

```text
POST /completion
        ↓
generate CompletionOutput
        ↓
return only
        ↓
caller accepts output
        ↓
POST /complete
        ↓
persist completionSnapshot
        ↓
status = completed
phase = completion
```

Do NOT automatically call `/complete` internally.

---

# 11. Integration Tests

Add deterministic integration coverage for the Completion AI orchestration.

Do not depend on a real external AI provider in automated tests.

Mock/stub only the external Agent invocation boundary, consistent with Recommendation / Pre-Cooking / Active Cooking tests.

Cover at least the following.

## Scenario A — Completion-Ready Session

Prepare a real PostgreSQL Cooking Session with:

```text
status = active
currentStageId = final stage
currentStepId = final step
completedStepIds includes final step
completionSnapshot = null
completedAt = null
```

Call:

```http
POST /cooking-sessions/{id}/completion
```

Verify:

```text
HTTP 200
CompletionOutput schema-valid
Agent receives restored cookingPlan
Agent receives final progress
Agent receives projected status = completed
```

---

## Scenario B — No Silent Persistence

After a successful Completion AI request, restore the Cooking Session.

Verify it is still:

```text
phase = active_cooking
status = active
completionSnapshot = null
completedAt = null
```

Also verify:

```text
currentStageId unchanged
currentStepId unchanged
completedStepIds unchanged
changes unchanged
cookingPlan unchanged
```

This is a critical acceptance test.

---

## Scenario C — Final Step Not Completed

Prepare:

```text
current step = final step
final step NOT in completedStepIds
```

Call Completion AI.

Expected:

```text
409
SESSION_NOT_READY_FOR_COMPLETION
```

Verify:

```text
Agent not invoked
database unchanged
```

---

## Scenario D — Not Yet at Final Step

Prepare a session still in an earlier cooking step.

Expected:

```text
409
controlled lifecycle error
Agent not invoked
```

---

## Scenario E — Paused Session

Expected:

```text
409
Completion AI not allowed
Agent not invoked
```

Do not implicitly resume.

---

## Scenario F — Completed Session

Calling Completion AI again on an already completed session should be rejected in v0.1.

Expected:

```text
409
Agent not invoked
```

Do not regenerate an alternate historical Completion snapshot.

---

## Scenario G — Abandoned Session

Expected:

```text
409
Agent not invoked
```

---

## Scenario H — Provider Failure

Mock an Agent/provider failure.

Verify it maps through the established API error conventions.

Expected category:

```text
502
```

where consistent with existing Agent endpoints.

---

## Scenario I — Provider Configuration Missing

Expected category:

```text
503
```

where consistent with current Recommendation / Pre-Cooking / Active Cooking behavior.

---

# 12. Preserve Historical Inputs

Completion AI should reason from the persisted Cooking Session.

It should use:

```text
stored cookingPlan
stored final progress
stored changes
```

It must NOT:

```text
reload current inventory and replace historical cooking context
regenerate Recommendation
regenerate Pre-Cooking
modify old snapshots
```

The Cooking Session is the source of truth for what actually happened during that cooking session.

---

# 13. Active Cooking Changes

Make sure persisted `session.changes` are included in `CompletionInput`.

Examples:

```text
ingredient substituted
equipment changed
servings adjusted
step modified
other cooking adaptation
```

Completion should be able to summarize the actual session, including recorded deviations where relevant.

Do not create new change semantics here.

Reuse the existing Active Cooking / Cooking Session contract.

---

# 14. Swagger / OpenAPI

Register:

```http
POST /cooking-sessions/{id}/completion
```

in the existing OpenAPI surface.

Swagger should state clearly:

```text
- Requires an owned completion-ready Cooking Session
- Generates a Completion AI summary
- Does NOT mutate or complete the session
- Returned output may be passed as completionSnapshot to POST /complete
```

Document lifecycle failures, especially:

```text
SESSION_NOT_READY_FOR_COMPLETION
```

Use schema-backed OpenAPI generation consistent with the project.

Update OpenAPI route verification tests.

---

# 15. Update Swagger Cooking Flow Guide

Extend:

```text
docs/testing/swagger-cooking-flow.md
```

without rewriting the already-locked persistence acceptance flow.

Add a Completion AI section:

```text
final cooking step completed
        ↓
POST /cooking-sessions/{id}/completion
        ↓
receive CompletionOutput
        ↓
verify GET session is still active / unchanged
        ↓
POST /cooking-sessions/{id}/complete
with CompletionOutput as completionSnapshot
        ↓
GET completed session
```

Clearly explain the distinction:

```text
/completion
= AI generation

/complete
= lifecycle persistence
```

This distinction must be obvious to future developers.

---

# 16. Manual Swagger Acceptance Flow

The new preferred manual end-to-end flow becomes:

```text
POST /cooking/recommendations
        ↓
Select Recipe
        ↓
POST /cooking/pre-cooking
        ↓
POST /cooking-sessions
        ↓
GET session
        ↓
POST /active-cooking as needed
        ↓
PATCH /progress as accepted
        ↓
complete final cooking step
        ↓
POST /completion
        ↓
CompletionOutput
        ↓
verify session still unchanged
        ↓
POST /complete
with completionSnapshot
        ↓
GET completed session
```

Do not require Active Cooking AI to be called on every step.

It is an optional interaction path during cooking.

---

# 17. Real Provider Smoke Test

After deterministic tests pass, run one real provider-backed request if credentials and a completion-ready Cooking Session are available.

Suggested message:

```text
"Masakannya sudah selesai."
```

Acceptance criteria:

```text
HTTP 200
schema-valid CompletionOutput
summary is context-aware
no plan regeneration
no database mutation
```

Then verify the Cooking Session remains active until `/complete` is explicitly called.

If credentials are unavailable, report the smoke test as skipped.

Do not fabricate success.

---

# 18. Nutrition Boundary

Do NOT generate or calculate nutrition inside Completion AI v0.1.

The Completion output remains:

```text
reply
summary
notes
```

Nutrition will be integrated in the next milestone using deterministic:

```text
@flemme/nutrition
```

not model-generated nutrition values.

Do not add fake zero-valued nutrition.

Do not ask the Completion Agent to estimate macros.

---

# 19. No Completion Chat History

Do NOT add:

```text
completion_messages
chat_history
agent_messages
```

or any generic LLM message persistence.

The persisted canonical artifact remains:

```text
completionSnapshot
```

when the separate `/complete` endpoint is called.

---

# 20. Out of Scope

Do NOT implement in this task:

```text
Nutrition integration
Inventory consumption
LLM usage tracking
Admin API
credits
provider balance
billing
subscription
production auth
Redis
BullMQ
SSE
WebSocket
generic chat history
automatic completion persistence
database schema redesign
```

Do not redesign:

```text
Recommendation
Pre-Cooking
Active Cooking
Cooking Session lifecycle
Completion schemas
```

unless an actual blocker is discovered.

---

# 21. Definition of Done

Completion AI API v0.1 is complete when:

```text
POST /cooking-sessions/{id}/completion
```

can:

```text
1. authenticate development user
2. load an owned Cooking Session
3. verify the session is completion-ready
4. restore persisted cookingPlan and progress
5. construct CompletionInput server-side
6. project status = completed in memory only
7. invoke existing @flemme/agent Completion runtime
8. validate CompletionOutput
9. return reply + summary + notes
10. make zero Cooking Session mutations
```

And the persistence flow remains explicit:

```text
Completion AI output
        ↓
POST /cooking-sessions/{id}/complete
        ↓
persist completionSnapshot
        ↓
phase = completion
status = completed
completedAt = timestamp
```

---

# 22. Validation

Run at minimum:

```text
Completion AI focused integration tests
all API tests
full workspace tests
database lifecycle validation
workspace typecheck
API build
web build
scoped Biome
git diff --check
OpenAPI verification
```

Use the project's existing real PostgreSQL integration strategy.

---

# 23. Progress Tracker

Update:

```text
docs/progress-tracker.md
```

Only mark:

```text
Completion AI API v0.1
```

complete after all acceptance criteria pass.

Do NOT mark Nutrition integration complete.

Expected roadmap after this task:

```text
Completion AI API              ← this task
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
completion-ready lifecycle guard
server-side CompletionInput construction
in-memory completed-state projection
Agent runtime reused
proof of zero persistence mutation
Swagger/OpenAPI changes
integration tests
real provider smoke-test result
test/typecheck/build/check results
deferred work
```

Also show the final architecture:

```text
POST /cooking-sessions/{id}/completion
        ↓
load completion-ready session
        ↓
restore plan + final progress
        ↓
project completed state in memory
        ↓
run Completion Agent
        ↓
{ reply, summary, notes }
        ↓
return only
        ↓
POST /cooking-sessions/{id}/complete
        ↓
persist accepted completion
```

Stop after Completion AI API v0.1 is implemented and validated.

Do not continue into Nutrition Integration in the same task.
