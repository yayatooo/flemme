# Swagger Favorites Flow

Run `bun run --filter @flemme/api dev`, sign in through apps/web, then open
`http://localhost:3000/api/docs` in the same browser. Follow the
[session authentication guide](swagger-cooking-flow.md#session-authentication).
Favorites needs no AI.
Use an owned session completed via `POST /api/cooking-sessions/{id}/complete`;
Completion AI alone does not persist completion.

1. GET `/api/favorites`: an empty collection returns 200 `{ "items": [] }`.
2. POST `/api/favorites` with `{ "cookingSessionId": "<completed-session-uuid>" }`.
   Expect 201; copy the returned favorite `id`.
3. GET favorites and confirm the session ID, createdAt, and historical recipe
   summary (name, description, servings, estimatedDuration).
4. Repeat POST: expect 409 `FAVORITE_ALREADY_EXISTS`, without duplication.
5. Try a valid owned active/paused/abandoned session: expect 409
   `COOKING_SESSION_NOT_COMPLETED`. Corrupt snapshots return 500
   `INVALID_PERSISTED_SNAPSHOT`, as in the existing session API.
6. Another user's session returns 403 `COOKING_SESSION_FORBIDDEN`; a missing
   session returns 404 `COOKING_SESSION_NOT_FOUND`.
7. DELETE `/api/favorites/{id}`: expect 204, then confirm removal through GET.
8. GET `/api/cooking-sessions/{cookingSessionId}`: completed history, recipe,
   completion and nutrition must remain unchanged.

Cross-user deletion returns 403 `FAVORITE_FORBIDDEN`; missing favorite returns
404 `FAVORITE_NOT_FOUND`. Unknown request fields and malformed UUIDs return
400; missing or invalid sessions return 401. Client recipe data is rejected.

Listing sorts createdAt descending, then UUID descending. No pagination.
Recipe summaries are projections, never copied, regenerated, or derived from
current user context. Session detail remains available via the existing API.
Eligibility reuses complete session restoration, including selected recipe,
plan and completion validation, plus completed status. DB checks enforce
completion phase and completedAt. Corrupt favorite history fails closed.

Creation uses one INSERT SELECT with owner/completed predicates and existing
uniqueness after restoration. Completed snapshots are immutable through the API,
so no multi-write transaction is required. The composite session/user FK
enforces ownership and cascades if the session is deleted. Favorite deletion
does not delete that session. No session deletion endpoint is added.
