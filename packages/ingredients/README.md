# `@flemme/ingredients`

Deterministic canonical ingredient identity for Flemme.

Each ingredient has one language-independent kebab-case key, required Indonesian
and English primary names, and optional alias lists for both languages. Aliases
are alternative names for the same ingredient; quantity phrases such as
“secukupnya”, “to taste”, and “as needed” are not aliases.

Resolution trims surrounding whitespace, collapses repeated whitespace, and
matches case-insensitively. It performs no fuzzy matching, typo correction,
embedding search, or AI inference. Unknown names return an unresolved result.

```ts
import {
  createIngredientCatalog,
  resolveIngredient,
} from "@flemme/ingredients";

const catalog = createIngredientCatalog({
  ingredients: [
    {
      key: "garlic",
      names: { id: "Bawang putih", en: "Garlic" },
      aliases: { id: [], en: ["Garlic clove"] },
    },
  ],
});

const result = resolveIngredient({ query: "bawang putih", catalog });
```

Catalog creation rejects duplicate canonical keys and any normalized name or
alias claimed by different ingredients, including collisions across languages.

Ingredient identity is independent from quantity normalization. “Garam” may
resolve to `salt` while “secukupnya” remains an unresolved quantity. Nutrition
and unit-conversion references use the same canonical key, but nutrition values
remain estimates rather than laboratory measurements.

Current references are for new calculations. Future cooking history must store
the calculated nutrition result as a frozen snapshot; changes to current
references must not rewrite old cooking-session nutrition.
