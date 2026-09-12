# Nutrition Foundation v0.1

## Goal

Create a deterministic nutrition domain package that calculates estimated
recipe totals and per-serving values from normalized ingredient grams and
explicit per-100-gram references.

## Boundaries

- Lives in `packages/nutrition`, independent from `packages/agent`.
- Uses no AI model, database, external provider, or natural-language unit
  normalization.
- Returns a discriminated complete or partial result so missing references are
  never silently treated as zero-value ingredients.
- Preserves calculation precision; presentation owns rounding.

## Implementation

1. Define Zod contracts for nutrition values, references, normalized amounts,
   recipe input, calculator input, and result variants.
2. Implement a pure calculator using explicit references.
3. Add synthetic offline fixtures and deterministic tests.
4. Document package usage and estimation limitations.
5. Update architecture and progress documentation.

## Validation

- Package and workspace tests
- Workspace typecheck
- Workspace build
- Biome
- Git whitespace check
