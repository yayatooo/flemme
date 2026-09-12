# Ingredient Catalog + Nutrition Reference v0.1

## Goal

Define canonical bilingual ingredient identity, deterministic alias resolution,
and referential validation for nutrition and unit-conversion records.

## Package boundaries

- `packages/ingredients` owns canonical keys, Indonesian and English names,
  aliases, catalog validation, and exact deterministic resolution.
- `packages/nutrition` depends one-way on `packages/ingredients` to validate that
  nutrition and conversion reference keys exist in a canonical catalog.
- No AI, fuzzy matching, database, API, network, or production reference data.

## Implementation

1. Add canonical ingredient and resolution contracts.
2. Normalize lookup strings by trimming, collapsing whitespace, and lowercasing.
3. Validate duplicate canonical keys and normalized cross-language collisions.
4. Build key and name lookup indexes through `createIngredientCatalog`.
5. Add nutrition-side reference-integrity validation.
6. Add a small bilingual fixture and deterministic unit/integration tests.
7. Document current-reference versus future-history-snapshot semantics.

## Validation

- Package and workspace tests
- Workspace typecheck and build
- Biome
- Git whitespace check
