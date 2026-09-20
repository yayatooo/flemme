# Swagger Full Cooking Flow v0.1

This guide is the repeatable manual backend acceptance flow for Flemme's
currently implemented cooking APIs.

The flow keeps AI guidance separate from persistence and nutrition
deterministic:

```text
Recommendation Agent → Pre-Cooking Agent → explicit Cooking Session persistence
Cooking Session → read-only deterministic nutrition preview
Active Cooking Agent → proposed actions → optional explicit progress persistence
Completion Agent → completion output → completion + server nutrition persistence
```

Active Cooking AI is available as an optional read-only interaction in this
guide. Completion AI is available after the final step is recorded complete.
Nutrition uses the committed production ingredient catalog and curated USDA
references. It makes no LLM or runtime USDA request.

## Prerequisites

From the repository root:

```bash
docker-compose up -d
bun run --filter @flemme/db db:migrate
bun run --filter @flemme/api dev
```

Required root `.env` variable names:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
WEB_ORIGIN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
VITE_API_URL
MUX_API_KEY
BASE_URL
```

Do not put their values into Swagger, request bodies, screenshots, or logs.

- Swagger UI: [http://localhost:3000/docs](http://localhost:3000/api/docs)
- OpenAPI: [http://localhost:3000/openapi.json](http://localhost:3000/api/openapi.json)

## Session authentication

1. Start `apps/web` and open `http://localhost:5173/login`.
2. Register or sign in with email/password, or choose **Continue with Google**
   and finish the browser flow. Google returns through
   `http://localhost:3000/api/auth/callback/google`.
3. Open `http://localhost:3000/api/auth/me` in the same browser and confirm your
   canonical identity.
4. Open Swagger in that browser and execute protected requests. The browser
   sends the HttpOnly cookie automatically; Swagger cannot read or manually
   set it through an **Authorize** text field.

Use one account throughout the flow. Do not mix localhost and 127.0.0.1.
For another account, sign out and sign in normally. Missing, invalid, expired,
or logged-out sessions return `401 UNAUTHENTICATED`.

For command-line testing, use a private cookie jar and an existing disposable
password account. Replace the example credentials locally; never commit real
credentials or cookie jars:

```bash
curl -c /tmp/flemme-session.cookies \
  -H 'Origin: http://localhost:5173' -H 'Content-Type: application/json' \
  -d '{"email":"tester@example.com","password":"your-test-password"}' \
  http://localhost:3000/api/auth/sign-in/email
curl -b /tmp/flemme-session.cookies http://localhost:3000/api/auth/me
curl -b /tmp/flemme-session.cookies http://localhost:3000/api/profile
curl -b /tmp/flemme-session.cookies -c /tmp/flemme-session.cookies \
  -H 'Origin: http://localhost:5173' -H 'Content-Type: application/json' \
  -d '{}' http://localhost:3000/api/auth/sign-out
rm /tmp/flemme-session.cookies
```

Google authentication is a browser flow, not a manually assembled OAuth URL.

## Stable acceptance scenario

Use one consistent cooking situation in both AI-generation requests:

```text
Target dish: Telur Kecap Bawang
Servings:    2
Time:        45 minutes
```

Inventory:

```text
telur, kecap manis, bawang merah, bawang putih, minyak goreng, garam
```

Equipment:

```text
kompor, wajan, spatula, pisau, talenan
```

The actual Recommendation response remains the source of truth. Do not create
or rewrite a selected recipe manually when a real recommendation is available.

Keep these four values while working through the guide:

```text
RECOMMENDATION_RESULT = complete Step 1 response
SELECTED_RECIPE       = one exact recipe object from that response
COOKING_PLAN          = complete Step 3 response
COOKING_SESSION_ID    = id returned by Step 4
```

## Step 1 — Generate recommendations

Open `POST /api/cooking/recommendations`, select **Try it out**, and execute:

```json
{
  "inventory": [
    { "name": "telur", "quantity": "4 butir", "condition": "fresh" },
    { "name": "kecap manis", "quantity": "4 sendok makan" },
    { "name": "bawang merah", "quantity": "4 butir", "condition": "fresh" },
    { "name": "bawang putih", "quantity": "2 siung", "condition": "fresh" },
    { "name": "minyak goreng", "quantity": "2 sendok makan" },
    { "name": "garam", "quantity": "secukupnya" }
  ],
  "kitchen": {
    "equipment": ["kompor", "wajan", "spatula", "pisau", "talenan"]
  },
  "household": {
    "adults": 2,
    "children": 0,
    "toddlers": 0
  },
  "foodPreferences": ["masakan rumahan Indonesia"],
  "cookingPreferences": ["sederhana", "satu wajan"],
  "session": {
    "request": "Saya ingin memasak Telur Kecap Bawang.",
    "servings": 2,
    "availableMinutes": 45
  }
}
```

These request fields replace persistent inventory, kitchen, household, and
preference values for this request only. Omitting an override makes the API use
the authenticated user's persistent value.

Expected response types are:

- `recommendations`: save the complete response as `RECOMMENDATION_RESULT` and
  continue.
- `clarification`: answer the question with another Recommendation request.
- `no_viable_recommendation`: stop this positive scenario and correct the
  stated constraints or available context.

Recommendation validates Agent output but does not select a recipe, create a
Cooking Session, persist a snapshot, or mutate inventory.

## Step 2 — Select one exact recipe

Recipe selection is currently a manual client decision; there is no selection
endpoint.

1. Open `RECOMMENDATION_RESULT.recommendations`.
2. Choose one recipe, preferably the Telur Kecap Bawang result for this
   scenario.
3. Copy that complete object without renaming, removing, or adding fields.
4. Keep it as `SELECTED_RECIPE`.

```text
RECOMMENDATION_RESULT.recommendations[n]
        ↓ exact copy
SELECTED_RECIPE
```

## Step 3 — Generate the Pre-Cooking plan

Open `POST /api/cooking/pre-cooking`, select **Try it out**, and assemble the body
below. Replace the `SELECTED_RECIPE` placeholder with the exact JSON object from
Step 2; the placeholder itself is not valid API input.

```json
{
  "selectedRecipe": "<replace with SELECTED_RECIPE object>",
  "inventory": [
    { "name": "telur", "quantity": "4 butir", "condition": "fresh" },
    { "name": "kecap manis", "quantity": "4 sendok makan" },
    { "name": "bawang merah", "quantity": "4 butir", "condition": "fresh" },
    { "name": "bawang putih", "quantity": "2 siung", "condition": "fresh" },
    { "name": "minyak goreng", "quantity": "2 sendok makan" },
    { "name": "garam", "quantity": "secukupnya" }
  ],
  "kitchen": {
    "equipment": ["kompor", "wajan", "spatula", "pisau", "talenan"]
  },
  "household": {
    "adults": 2,
    "children": 0,
    "toddlers": 0
  },
  "foodPreferences": ["masakan rumahan Indonesia"],
  "cookingPreferences": ["sederhana", "satu wajan"],
  "session": {
    "request": "Siapkan resep Telur Kecap Bawang yang sudah dipilih.",
    "servings": 2,
    "availableMinutes": 45
  }
}
```

Reuse the same overrides from Step 1 so Recommendation and Pre-Cooking reason
from the same cooking situation.

A successful response contains:

```text
preparationSummary
ingredients
equipment
preparationSteps
cookingStages
```

Save the complete response as `COOKING_PLAN`. Also identify:

```text
FIRST_STAGE_ID = COOKING_PLAN.cookingStages[0].id
FIRST_STEP_ID  = COOKING_PLAN.cookingStages[0].steps[0].id
FINAL_STAGE_ID = last cookingStages item .id
FINAL_STEP_ID  = last step of the final cooking stage .id
```

Pre-Cooking returns generated, schema-validated output. It does not persist the
plan, create a Cooking Session, or mutate inventory.

## Step 4 — Create the Cooking Session

Open `POST /api/cooking-sessions`, select **Try it out**, and assemble the body
below. Replace each placeholder with the complete object or ID saved above.

```json
{
  "recommendationSnapshot": "<replace with RECOMMENDATION_RESULT object>",
  "selectedRecipeSnapshot": "<replace with SELECTED_RECIPE object>",
  "cookingPlan": "<replace with COOKING_PLAN object>",
  "session": {
    "status": "active",
    "currentStageId": "<FIRST_STAGE_ID>",
    "currentStepId": "<FIRST_STEP_ID>",
    "completedStepIds": [],
    "changes": []
  }
}
```

Do not include `nutritionSnapshot`. Nutrition is server-owned, and the strict
request rejects client-provided nutrition data.

Expected response:

```text
HTTP 201
phase = active_cooking
session.status = active
completionSnapshot = null
nutritionSnapshot = null
completedAt = null
```

Save the returned `id` as `COOKING_SESSION_ID`. This endpoint persists the
already-generated snapshots and initial progress; it does not invoke AI.

## Step 5 — Restore the Cooking Session

Open `GET /api/cooking-sessions/{id}`, set `id` to `COOKING_SESSION_ID`, and
execute.

Verify:

- `phase` is `active_cooking`.
- `session.status` is `active`.
- `currentStageId` and `currentStepId` equal the initial IDs.
- `recommendationSnapshot`, `selectedRecipeSnapshot`, and `cookingPlan` match
  the values submitted in Step 4.
- `completionSnapshot` and `completedAt` are `null`.

This proves PostgreSQL persisted and restored the snapshots and relational
progress. Restore does not call any Agent.

## Step 6 — Preview deterministic nutrition

Open `GET /api/cooking-sessions/{id}/nutrition`, set `id` to
`COOKING_SESSION_ID`, and execute. The client sends no ingredient body.

The API recalculates from the persisted `cookingPlan` and the selected recipe's
stored serving count. The result is one of:

- `complete`: every required ingredient contributed trusted nutrition.
- `partial`: at least one trusted ingredient contributed, with coverage issues
  for omitted ingredients or amounts.
- `unavailable`: no trusted total could be calculated; `total` and
  `perServing` are intentionally absent.

The historical Telur Kecap Bawang plan may truthfully return `unavailable`
because egg size is ambiguous, sweet soy sauce and generic cooking oil are not
resolved, qualified units are unsupported, and salt may lack a quantity. Do
not replace this with zero totals.

Run `GET /api/cooking-sessions/{id}` again and verify the session is byte-equivalent
to Step 5. Nutrition preview is allowed for owned active, paused, completed,
and abandoned sessions. It performs no mutation, Agent call, inventory read or
write, or runtime USDA request.

## Step 7 — Persist normal Active Cooking progress

The `cookingPlan` snapshot is immutable. The `session` object is mutable
relational progress:

- `currentStageId` and `currentStepId` identify the recorded position.
- `completedStepIds` contains unique IDs that exist in the saved plan.
- `changes` records relevant in-session changes; keep it empty when none exist.
- `status` is `active` or `paused` during progress updates.

Choose the step after `FIRST_STEP_ID`. It may be the next step in the same stage
or the first step in the next stage. Open
`PATCH /api/cooking-sessions/{id}/progress`, use `COOKING_SESSION_ID`, and execute:

```json
{
  "session": {
    "status": "active",
    "currentStageId": "<stage ID containing the next step>",
    "currentStepId": "<next step ID>",
    "completedStepIds": ["<FIRST_STEP_ID>"],
    "changes": []
  }
}
```

Expected result: HTTP 200, the next step is current, the first step is recorded
complete, and `cookingPlan` is unchanged. No real cooking-time delay is needed
for this backend acceptance test. This endpoint does not invoke Active Cooking
AI.

## Step 8 — Validate the final-step completion guard

First move progress to the final cooking step. Include any earlier step IDs you
have marked complete, but deliberately omit `FINAL_STEP_ID`:

```json
{
  "session": {
    "status": "active",
    "currentStageId": "<FINAL_STAGE_ID>",
    "currentStepId": "<FINAL_STEP_ID>",
    "completedStepIds": ["<all recorded completed step IDs except FINAL_STEP_ID>"],
    "changes": []
  }
}
```

After the PATCH returns HTTP 200, open
`POST /api/cooking-sessions/{id}/complete`. Use this explicitly manual/synthetic
Completion snapshot for persistence validation:

```json
{
  "completionSnapshot": {
    "reply": "Masakan selesai. Selamat menikmati!",
    "summary": {
      "title": "Telur Kecap Bawang selesai",
      "description": "Sesi memasak manual berhasil diselesaikan."
    },
    "notes": []
  }
}
```

Expected result:

```text
HTTP 409
error.code = SESSION_NOT_READY_FOR_COMPLETION
```

This is an intentional lifecycle guard: being positioned at the final step is
not the same as having completed the final step. Completion AI is not invoked.

## Step 9 — Mark the final step completed

Open `PATCH /api/cooking-sessions/{id}/progress` again. Keep the final step current
and add `FINAL_STEP_ID` to the unique completed IDs:

```json
{
  "session": {
    "status": "active",
    "currentStageId": "<FINAL_STAGE_ID>",
    "currentStepId": "<FINAL_STEP_ID>",
    "completedStepIds": ["<all completed cooking step IDs including FINAL_STEP_ID>"],
    "changes": []
  }
}
```

Expected result: HTTP 200 with the session still `active`. Cooking execution is
recorded as finished, but completion persistence has not happened yet.

## Step 10 — Generate Completion AI output before persistence

The preferred flow now generates the final conversational summary from the
completion-ready session. Open `POST /api/cooking-sessions/{id}/completion`, use
`COOKING_SESSION_ID`, and submit either an optional final message:

```json
{
  "message": "Masakannya sudah selesai."
}
```

or an empty object:

```json
{}
```

The API restores the saved plan, final progress, and recorded changes. It
verifies that the active session is positioned at the final cooking step and
that the final step is present in `completedStepIds`. It then projects
`status: "completed"` only inside the Agent input.

Save the returned `{ reply, summary, notes }` object as `COMPLETION_OUTPUT`.
Immediately run `GET /api/cooking-sessions/{id}` and verify:

```text
phase = active_cooking
session.status = active
completionSnapshot = null
completedAt = null
plan and progress unchanged
```

The distinction is intentional:

```text
POST /completion = AI generation only
POST /complete   = lifecycle and snapshot persistence
```

## Step 11 — Persist completion and trusted nutrition

Open `POST /api/cooking-sessions/{id}/complete`. Prefer the `COMPLETION_OUTPUT`
returned by Completion AI as `completionSnapshot`. The manual/synthetic
snapshot from Step 8 remains only a fallback for persistence-only acceptance
testing. Omit `nutritionSnapshot`; the strict request rejects that field.

Expected result:

```text
HTTP 200
phase = completion
session.status = completed
completedAt is not null
completionSnapshot is not null
nutritionSnapshot.status = complete | partial | unavailable
```

The endpoint recalculates nutrition from the persisted plan, then uses one
database update to persist completion lifecycle fields, the already-valid
Completion snapshot, and the nutrition snapshot together. It does not trust a
previous preview response and does not invoke Completion AI; generation
happened separately in Step 10. Partial or unavailable nutrition does not block
valid completion.

## Step 12 — Restore and verify the completed session

Run `GET /api/cooking-sessions/{id}` again with `COOKING_SESSION_ID`.

Verify:

- `phase` is `completion`.
- `session.status` is `completed`.
- `completedAt` contains a timestamp.
- `completionSnapshot` matches the Step 10 input.
- `cookingPlan` is still preserved.
- `recommendationSnapshot` is still preserved.
- `selectedRecipeSnapshot` is still preserved.
- `nutritionSnapshot` matches the server-calculated result returned by Step 11
  and validates as `complete`, `partial`, or `unavailable`.

This final restore proves the Cooking Session lifecycle survives a PostgreSQL
round trip without regenerating AI output.

## Optional Active Cooking AI interaction

Use this while the Cooking Session is `active` or `paused`. Open
`POST /api/cooking-sessions/{id}/active-cooking`, set `id` to
`COOKING_SESSION_ID`, and submit only the latest message:

```json
{
  "message": "Bawangnya mulai gosong, harus bagaimana?"
}
```

The API restores `cookingPlan` and the complete current `session` progress from
PostgreSQL. The client must not send either value. A successful response uses
the Agent-owned `{ reply, actions }` shape. The Agent may propose `advance`,
`previous-step`, `pause`, `resume`, `record-change`, `complete-cooking`,
`abandon-cooking`, or `clarify`.

Immediately run `GET /api/cooking-sessions/{id}` and verify the plan, progress,
status, snapshots, and timestamps are unchanged. Active Cooking output is a
proposal only. If the caller accepts a proposed state change, it must calculate
the appropriate state from the immutable plan and explicitly call
`PATCH /api/cooking-sessions/{id}/progress`.

Completed and abandoned sessions reject Active Cooking interaction with HTTP
409. No message history is stored in v0.1.

## Optional Drizzle Studio inspection

In another terminal, run:

```bash
bun run --filter @flemme/db db:studio
```

Inspect `cooking_sessions` to observe the session row and its changing phase,
status, progress, completion timestamp, and JSONB snapshots. Drizzle Studio is
an optional inspection aid, not an acceptance requirement.

## Acceptance checklist

- [ ] Recommendation returns valid options.
- [ ] One exact Recommendation recipe is selected.
- [ ] Pre-Cooking returns a valid structured plan.
- [ ] Cooking Session creation returns HTTP 201.
- [ ] The active session and snapshots can be restored.
- [ ] Nutrition preview returns a truthful complete, partial, or unavailable
      result without mutating the session.
- [ ] Normal progress can be updated.
- [ ] Premature completion returns `SESSION_NOT_READY_FOR_COMPLETION`.
- [ ] The final step can be marked complete while the session remains active.
- [ ] Completion AI returns valid output without mutating the session.
- [ ] The returned Completion output can be persisted explicitly.
- [ ] Completion generates and persists nutrition server-side without accepting
      client nutrition data.
- [ ] The completed session and all snapshots can be restored.

## Current boundary

```text
POST /api/cooking/recommendations          → Recommendation Agent, no persistence
Select Recipe                         → manual/client decision
POST /api/cooking/pre-cooking             → Pre-Cooking Agent, no persistence
POST /api/cooking-sessions                → persistence, no AI
GET /api/cooking-sessions/{id}            → restore, no AI
GET /api/cooking-sessions/{id}/nutrition  → deterministic preview, no persistence/AI/network
POST /api/cooking-sessions/{id}/active-cooking → Active Cooking Agent, no persistence
PATCH /api/cooking-sessions/{id}/progress → persistence, no AI
POST /api/cooking-sessions/{id}/completion → Completion Agent, no persistence
POST /api/cooking-sessions/{id}/complete  → guarded completion + nutrition persistence, no AI/network
GET /api/cooking-sessions/{id}            → completed restore, no AI
```

The endpoint accepts only `completionSnapshot`; nutrition is always
recalculated from trusted persisted server state.
