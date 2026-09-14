# Swagger Inventory Flow

Start the API with `bun run --filter @flemme/api dev` and open
`http://localhost:3000/docs`. Authorize DevelopmentUser with an existing user
UUID. No AI provider is required. Use a disposable development user: these
operations persist real changes.

1. GET `/inventory`. A user without a parent gets 404 `INVENTORY_NOT_FOUND`;
   GET does not initialize persistence. An existing empty parent returns
   `{ "items": [] }`.
2. POST `/inventory/items` with the following body. Expect 201; copy its `id`.

```json
{
  "ingredientKey": "egg",
  "quantity": 6,
  "unit": "pcs",
  "isApproximate": false,
  "condition": "fresh"
}
```

3. GET inventory and confirm the item and Indonesian canonical display name.
   Repeating POST returns 409 `DUPLICATE_INVENTORY_ITEM`.
4. PUT `/inventory/items/{id}` using the body below. All four fields are required;
   `ingredientKey` is immutable and is not accepted in PUT.

```json
{
  "quantity": 2.5,
  "unit": "g",
  "isApproximate": true,
  "condition": "use_soon"
}
```

5. GET and confirm replacement. PUT with both quantity and unit null is also
   valid; use `condition: "unknown"` when condition is unknown.
6. DELETE the item; expect 204. GET confirms its removal; deleting the last item
   leaves an empty inventory, not a missing parent.
7. POST with `ingredientKey: "invented-food"` or `"telur"` returns 422
   `INGREDIENT_NOT_FOUND`. Only exact production canonical keys are accepted,
   not aliases. Malformed keys/payloads return 400. No fuzzy fallback exists.

Quantity must be positive, finite, at most 99,999,999,999.999 and have at most
three decimal places (the existing PostgreSQL numeric(14,3) representation).
Zero and negative quantities are invalid. Quantity/unit are both null or both
present. Units remain free-form, trimmed, nonblank text without nutrition
conversion requirements. Conditions are exactly `fresh`, `use_soon`, `unknown`.
Creation defaults condition to unknown and isApproximate to false.

Responses expose id, ingredientKey, name, quantity, unit, isApproximate and
condition, never user/inventory foreign keys or timestamps. GET sorts by key.
Legacy persisted keys such as `salt` remain readable using the key as the name
fallback; new writes require a production key such as `table-salt`. No legacy
key is automatically mapped to another ingredient.

Missing/invalid development identities return 401. Another user's item returns
403, matching existing cooking-session ownership semantics; absent items return
404. All mutations use authenticated ownership, and unknown fields are rejected.
Creating the parent and item is atomic. Deletion never changes cooking history
or triggers consumption. Existing cooking-context reads use these same rows;
request-level inventory overrides still replace the whole persistent list.
