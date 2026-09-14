# Swagger Kitchen / Equipment API v0.1

Start the API with `bun run --filter @flemme/api dev`, open
http://localhost:3000/docs, and authorize with an existing development user UUID.
PostgreSQL must be running; use `docker-compose up -d` if needed.

1. Execute `GET /kitchen`. An existing kitchen returns its equipment; a user
   without a kitchen receives HTTP 404 `KITCHEN_NOT_FOUND`. GET creates nothing.
2. Execute `PUT /kitchen` with:

   ```json
   { "equipment": ["kompor", "wajan", "blender"] }
   ```

3. Execute GET again and confirm all three names persist.
4. PUT `{ "equipment": ["wajan"] }`, then GET. Only `wajan` remains.
5. PUT `{ "equipment": [] }`, then GET. The kitchen exists with empty equipment.
6. PUT duplicate names such as `wajan` and ` Wajan `, or a whitespace-only name.
   Expect HTTP 400 and the previously saved state to remain unchanged.

Both request and response expose only `equipment`. Names are trimmed, case is
preserved, and duplicates are rejected ignoring case after trimming. Internal
whitespace and synonyms are not normalized. Responses use case-insensitive
lexical order; the database stores no user-defined equipment order.

Equipment names have no arbitrary application length maximum. PostgreSQL text
and unique-index storage limits still apply; a database insertion failure rolls
back the entire replacement. Existing invalid legacy names cause a controlled
500 on GET and can be replaced with a valid PUT.

An empty kitchen is valid cooking context. Omitting the Kitchen override in a
cooking request uses persisted equipment; supplying it replaces the whole
equipment list for that request. This flow does not invoke AI.
