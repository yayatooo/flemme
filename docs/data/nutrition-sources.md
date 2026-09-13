# Nutrition Data Sources v0.1

Flemme's production nutrition data is a small, version-controlled curation from
[USDA FoodData Central](https://fdc.nal.usda.gov/). USDA describes FoodData
Central data as public domain under CC0 and requests source attribution. Normal
application runtime is fully offline; it does not call USDA.

Source policy:

- Primary source: USDA FoodData Central.
- Foundation Foods are preferred when the exact food has all four required
  v0.1 values. SR Legacy is used when it is the better complete record.
- Required values are energy, protein, carbohydrate, and total fat per 100 g.
- FDC IDs, descriptions, data types, publication dates, dataset releases,
  nutrient IDs, verification dates, and portion IDs are committed with data.
- Portion conversions are included only when the exact selected food record
  contains an unambiguous matching gram weight.
- TKPI is not used in v0.1 and remains pending provenance/licensing review.

Official documentation:

- [FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/)
- [Data Type Documentation](https://fdc.nal.usda.gov/data-documentation/)
- [Foundation Foods Documentation](https://fdc.nal.usda.gov/Foundation_Foods_Documentation/)
- [Downloadable Data](https://fdc.nal.usda.gov/download-datasets/)

## Curated mappings

The records were verified on 2026-09-13 against the official April 2026
Foundation Foods JSON archive and April 2018 SR Legacy JSON archive. Values are
stored exactly as published for the selected nutrient IDs; no presentation
rounding is applied.

| Flemme key | FDC ID | USDA description | Type | Supported portions | Limitation |
| --- | ---: | --- | --- | --- | --- |
| `egg` | [171287](https://fdc.nal.usda.gov/food-details/171287/nutrients) | Egg, whole, raw, fresh | SR Legacy | None | USDA egg weights are size-specific; generic `piece` is ambiguous. |
| `garlic` | [1104647](https://fdc.nal.usda.gov/food-details/1104647/nutrients) | Garlic, raw | Foundation | None | The record has no exact clove portion. |
| `shallot` | [170499](https://fdc.nal.usda.gov/food-details/170499/nutrients) | Shallots, raw | SR Legacy | 1 tbsp chopped = 10 g | The April 2026 Foundation record lacks all required v0.1 macros. |
| `raw-white-rice` | [2512381](https://fdc.nal.usda.gov/food-details/2512381/nutrients) | Rice, white, long grain, unenriched, raw | Foundation | None | Represents raw unenriched long-grain rice, not cooked rice. |
| `boneless-skinless-chicken-thigh` | [2646171](https://fdc.nal.usda.gov/food-details/2646171/nutrients) | Chicken, thigh, boneless, skinless, raw | Foundation | None | Does not represent skin-on, bone-in, or cooked thigh. |
| `canola-oil` | [172336](https://fdc.nal.usda.gov/food-details/172336/nutrients) | Oil, canola | SR Legacy | 1 tsp = 4.5 g; 1 tbsp = 14 g | Generic “cooking oil” is not assumed to be canola oil. |
| `table-salt` | [173468](https://fdc.nal.usda.gov/food-details/173468/nutrients) | Salt, table | SR Legacy | 1 tsp = 6 g; 1 tbsp = 18 g | A missing or “to taste” quantity remains unresolved. |
| `tomato` | [170457](https://fdc.nal.usda.gov/food-details/170457/nutrients) | Tomatoes, red, ripe, raw, year round average | SR Legacy | None | Size-specific whole-tomato portions are not collapsed into `piece`. |
| `carrot` | [170393](https://fdc.nal.usda.gov/food-details/170393/nutrients) | Carrots, raw | SR Legacy | None | Small/medium/large portions remain distinct and unsupported by generic `piece`. |
| `potato` | [170026](https://fdc.nal.usda.gov/food-details/170026/nutrients) | Potatoes, flesh and skin, raw | SR Legacy | None | Small/medium/large portions remain distinct and unsupported by generic `piece`. |

Foundation garlic uses energy nutrient ID 1008. Foundation rice and chicken
use Atwater Specific energy nutrient ID 2048. SR Legacy records use energy ID
1008. Protein, carbohydrate by difference, and total lipid use IDs 1003, 1005,
and 1004 respectively.

## Deliberately unsupported mappings

- `kecap manis` is not mapped to generic soy sauce because the foods are not
  semantically equivalent.
- `minyak goreng` is not mapped to canola oil because the underlying oil is
  unspecified.
- Generic onion is not used as a substitute for shallot.
- Milk and tofu remain outside this first curated set; no mapping was added
  merely to increase the record count.
- No clove or generic egg/vegetable `piece` conversion is inferred.

## Telur Kecap Bawang foundation audit

This audit uses the plan shape recorded in the Swagger cooking scenario. It is
not an API calculation yet.

| Plan ingredient | Identity | USDA reference | Quantity/unit outcome | Inclusion |
| --- | --- | --- | --- | --- |
| `telur`, 4 `butir` | `egg` | Present | `butir` is recognized as `piece`, but egg sizes differ | Excluded: `portion-unavailable` |
| `kecap manis`, 2.5 `sendok makan (kisaran 2–3)` | Unresolved | None | Qualified free-form unit is not parsed | Excluded: `ingredient-unresolved` |
| `bawang merah`, 2 `siung (kisaran 2–4)` | `shallot` | Present | Qualified unit does not exactly match the verified chopped-tablespoon portion | Excluded: `unit-unsupported` |
| `bawang putih`, 1 `siung (kisaran 1–2)` | `garlic` | Present | Qualified unit is unsupported; selected FDC record has no clove portion | Excluded: `unit-unsupported` |
| `minyak goreng`, 1.5 `sendok makan (kisaran 1–2)` | Unresolved | None | Oil type is unspecified | Excluded: `ingredient-unresolved` |
| `garam`, no quantity | `table-salt` | Present | Quantity is missing | Excluded: `quantity-missing` |

With the historical plan exactly as stored, no ingredient has a trustworthy
normalized mass. Its expected foundation-level nutrition status is therefore
`unavailable`, with no `total` or `perServing` fields. This is preferable to
inventing quantities or returning fake zeros.
