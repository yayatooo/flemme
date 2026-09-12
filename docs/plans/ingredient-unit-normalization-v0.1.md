# Ingredient + Unit Normalization v0.1

## Goal

Convert supported structured ingredient quantities into normalized gram amounts
for `packages/nutrition` without inference, AI, persistence, or external data.

## Design

- Keep normalization under `packages/nutrition/src/normalization`.
- Convert `g` and `kg` directly.
- Require an ingredient-specific direct-to-grams conversion for `ml`, `l`,
  `tsp`, `tbsp`, `clove`, and `piece`.
- Reject units outside the explicit v0.1 enum at schema validation.
- Return valid-but-unconvertible ingredients as unresolved with
  `missing-conversion`.
- Preserve duplicate ingredient rows; reject duplicate conversion key/unit
  pairs.
- Perform no rounding.

## Validation

- Deterministic unit tests for all supported conversion paths and failures.
- Offline normalization-to-nutrition integration test.
- Workspace tests, typecheck, build, Biome, and whitespace checks.
