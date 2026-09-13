# `@flemme/nutrition`

Deterministic estimated nutrition calculation for Flemme.

Nutrition Foundation does not calculate nutrition from natural-language recipe
text. It calculates estimated nutritional values from:

1. normalized ingredient mass in grams;
2. nutrition reference values per 100 grams.

Ingredient/unit normalization and nutrition-reference sourcing are separate
responsibilities. This package has no AI model, database, external nutrition
provider, or application persistence dependency.

Nutrition values are estimates and must not be presented as exact laboratory
measurements. Brands, varieties, cooking loss, oil absorption, evaporation,
edible yield, and measurement differences may change real-world values.

## Usage

```ts
import { calculateRecipeNutrition } from "@flemme/nutrition";

const result = calculateRecipeNutrition({
  recipe: {
    servings: 2,
    ingredients: [
      { ingredientKey: "chicken", name: "Ayam", grams: 300 },
      {
        ingredientKey: "sweet-soy-sauce",
        name: "Kecap manis",
        grams: 40,
      },
    ],
  },
  references: [
    {
      ingredientKey: "chicken",
      basisGrams: 100,
      nutrition: {
        caloriesKcal: 100,
        proteinG: 10,
        carbsG: 0,
        fatG: 5,
      },
    },
  ],
});
```

When every ingredient has a reference and there are no coverage issues, the
result has `status: "complete"` and exposes `total` and `perServing`. When at
least one trusted ingredient contributes and another input is unresolved, it
has `status: "partial"`; `knownNutrition` represents only the trusted subset.
When no ingredient can contribute trusted nutrition, it has
`status: "unavailable"` and deliberately omits totals rather than returning
fake zeros. Stable issue reasons distinguish unresolved identity, missing
references or quantities, unsupported units, and unavailable portions.

`estimated: true` means food-composition and portion reference values estimate
real-world nutrition. It never permits guessed ingredient identity or mass.

The calculator does not round. Presentation code may later format values for
display.

Nutrition and unit-conversion `ingredientKey` values can be checked against an
`@flemme/ingredients` catalog with `validateIngredientReferenceIntegrity`. The
helper returns `status: "invalid"` with separate unique unknown-key lists instead
of allowing references to create a second ingredient identity.

## Ingredient and Unit Normalization

Structured quantities can be converted before calculation:

```ts
import {
  calculateRecipeNutrition,
  type IngredientNutritionReference,
  normalizeRecipeIngredients,
} from "@flemme/nutrition";

const nutritionReferences: IngredientNutritionReference[] = [
  // Reference data supplied by the caller.
];

const normalization = normalizeRecipeIngredients({
  ingredients: [
    {
      ingredientKey: "sweet-soy-sauce",
      name: "Kecap manis",
      quantity: 2,
      unit: "tbsp",
    },
  ],
  conversions: [
    {
      ingredientKey: "sweet-soy-sauce",
      unit: "tbsp",
      gramsPerUnit: 20,
    },
  ],
});

if (normalization.unresolved.length === 0) {
  const nutrition = calculateRecipeNutrition({
    recipe: {
      servings: 2,
      ingredients: normalization.normalized,
    },
    references: nutritionReferences,
  });
}
```

`g` and `kg` convert directly. The supported volume and count units—`ml`, `l`,
`tsp`, `tbsp`, `clove`, and `piece`—require a matching ingredient-specific
`gramsPerUnit` reference. Conversion values are not built into the package.

Unsupported units fail input validation. Supported units without a matching
conversion are returned under `unresolved` with `reason: "missing-conversion"`.
Repeated ingredient rows remain separate, while duplicate conversion records
for the same ingredient and unit are rejected as ambiguous.

Normalization does not round and does not understand free-form phrases such as
“to taste”, “as needed”, “a pinch”, or “a handful”. A caller must preserve the
`unresolved` list when assessing nutrition coverage: passing only successfully
normalized rows to the nutrition calculator does not make unresolved original
ingredients disappear.

Reference values represent current inputs for new calculations. Future cooking
history must persist the resulting recipe nutrition as a snapshot so later
reference changes cannot rewrite previously completed sessions.

## Production USDA data

`PRODUCTION_NUTRITION_DATA` contains ten curated USDA FoodData Central mappings
with FDC provenance. `PRODUCTION_NUTRITION_REFERENCES` exposes their existing
100 g calculator shape, while `PRODUCTION_INGREDIENT_UNIT_CONVERSIONS` derives
only five conversions from committed USDA portion records. Runtime calculation
remains offline. See [`docs/data/nutrition-sources.md`](../../docs/data/nutrition-sources.md)
for the record-by-record review.
