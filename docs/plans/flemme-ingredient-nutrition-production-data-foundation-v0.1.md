# Task — Flemme Ingredient + Nutrition Production Data Foundation v0.1

## Context

Nutrition Integration v0.1 is intentionally paused.

The integration was blocked because the current project does not yet have trustworthy production data for:

```text
canonical production ingredients
nutrition references
verified food portions
unit-to-gram conversions
fully unresolved nutrition results
```

Current status:

```text
Recommendation AI                     ✅
Pre-Cooking AI                        ✅
Cooking Session persistence           ✅
Active Cooking AI API                 ✅
Completion AI API                     ✅
Completion persistence                ✅
Nutrition package foundation          ✅
Ingredient package foundation         ✅

Nutrition Integration                 ⏸ PAUSED
Ingredient + Nutrition Data Foundation ← THIS TASK
```

The following architecture decisions are already locked:

```text
USDA FoodData Central
= primary curated v0.1 nutrition source

No bulk USDA import

Preserve provenance metadata and FDC IDs

Unit conversions require verified source-backed portion data

Fully unresolved recipes
= unavailable
≠ fake zero nutrition

TKPI
= deferred until provenance/licensing review
```

This task exists to establish the trustworthy production data layer required before Nutrition Integration can resume.

---

# Goal

Implement:

```text
Ingredient + Nutrition Production Data Foundation v0.1
```

The result should provide:

```text
production canonical ingredient catalog
        ↓
curated USDA FoodData Central mappings
        ↓
source/provenance metadata
        ↓
nutrition-per-100g references
        ↓
verified portion information where available
        ↓
deterministic normalization support
        ↓
complete / partial / unavailable nutrition semantics
```

This task does NOT add the Cooking Session nutrition HTTP endpoint.

This task does NOT integrate nutrition into `/complete`.

Those remain paused until this foundation is validated.

---

# 1. Start With an Audit

Before changing contracts or data, inspect:

```text
packages/ingredients
packages/nutrition
packages/agent
packages/db
apps/api
docs/architecture.md
docs/progress-tracker.md
```

Document the current real public contracts for:

```text
CanonicalIngredient
ingredient aliases
ingredient resolution
NutritionReference
recipe nutrition input
recipe nutrition output
unit normalization
partial coverage
test fixtures
```

Identify exactly which current data is:

```text
production
test-only
synthetic
fixture/demo
```

Do not promote test fixtures into production data.

Do not copy synthetic nutrition values into a new production file.

---

# 2. Official Production Source Policy

Use USDA FoodData Central as the primary v0.1 external source.

Official references:

```text
FoodData Central API Guide
https://fdc.nal.usda.gov/api-guide/

FoodData Central Data Documentation
https://fdc.nal.usda.gov/data-documentation/

Foundation Foods Documentation
https://fdc.nal.usda.gov/Foundation_Foods_Documentation/

Downloadable Data
https://fdc.nal.usda.gov/download-datasets/
```

USDA FoodData Central data is public domain / CC0.

Still preserve explicit source attribution and provenance.

Do not use:

```text
random nutrition blogs
search-result snippets
unverified food databases
AI-generated nutrition values
test fixture values
```

as production nutrition sources.

---

# 3. Curated Data, Not Bulk Import

Do NOT import the complete FoodData Central dataset.

The v0.1 data set should be intentionally small and reviewable.

Create a curated production reference set for common Flemme MVP ingredients.

Target approximately:

```text
10–20 canonical ingredients
```

for the first production set.

The exact final number should follow data quality, not an arbitrary quota.

Prefer ingredients that are:

```text
common in Flemme cooking flows
semantically clear
available from authoritative USDA records
useful for validating nutrition calculation
```

Candidate domain concepts may include:

```text
egg
garlic
shallot/onion where source identity is exact
rice
chicken
cooking oil / a specific oil when identity is exact
salt
tomato
carrot
potato
milk
tofu
```

These are candidates only.

Do NOT create a mapping merely to hit the target count.

If a candidate cannot be mapped confidently to an exact USDA food record, leave it unsupported and document why.

---

# 4. Canonical Ingredient Ownership

`@flemme/ingredients` remains the owner of ingredient identity.

Production canonical ingredients should use language-independent keys.

Example concept:

```ts
{
  key: "garlic",
  names: {
    id: "bawang putih",
    en: "garlic"
  },
  aliases: {
    id: [...],
    en: [...]
  }
}
```

Use the project's existing actual schema.

Do not invent a second ingredient identity inside `@flemme/nutrition`.

Do not use USDA FDC IDs as Flemme ingredient primary keys.

Correct relationship:

```text
Flemme canonical ingredient key
        ↓
nutrition mapping
        ↓
USDA FDC ID
```

not:

```text
FDC ID
= Flemme ingredient identity
```

---

# 5. Production Catalog Boundary

If the current ingredient catalog is test-only or constructed only inside tests, establish an explicit production catalog.

Prefer a clear public boundary such as:

```text
productionIngredientCatalog
```

or the naming convention that best fits the existing package.

The production catalog must be:

```text
deterministic
offline
version-controlled
reviewable
independent from API runtime network access
```

Do not make normal Flemme runtime ingredient resolution depend on the USDA API.

---

# 6. USDA Mapping Record

Create an explicit mapping between a canonical ingredient and its selected USDA record.

Use a structure compatible with existing code.

Conceptually the mapping needs enough provenance to answer:

```text
Which Flemme ingredient is this?
Which USDA record was selected?
What USDA data type is it?
What exact source description was selected?
When/which dataset/API source was verified?
```

Example conceptual shape:

```ts
type NutritionSourceProvenance = {
  provider: "usda-fooddata-central";
  fdcId: number;
  dataType: string;
  description: string;
  sourceUrl?: string;
  verifiedAt: string;
};
```

Do not copy this exact shape if the existing package architecture suggests a better minimal representation.

Required invariant:

```text
every production nutrition reference
must be traceable to a concrete FDC ID
```

---

# 7. Selecting USDA Records

Use FoodData Central's official API/site to verify each mapping.

Selection priority should favor data appropriate for basic recipe ingredients.

Prefer, when semantically suitable:

```text
Foundation Foods
```

then another appropriate USDA type such as:

```text
FNDDS
SR Legacy
```

only when necessary and documented.

Avoid branded-product records for generic canonical ingredients unless the Flemme ingredient is intentionally a specific branded food.

For every curated mapping, verify:

```text
description matches the canonical ingredient
food state/form matches sufficiently
the nutrient basis is understood
portion metadata, if used, belongs to that exact source food
```

Do not map:

```text
kecap manis
→ generic soy sauce
```

unless the source genuinely represents sweet soy sauce.

Do not map:

```text
shallot
→ generic onion
```

just because they are related.

Semantic mismatch must become unsupported, not silently approximated.

---

# 8. Required Nutrients v0.1

The current Flemme Nutrition foundation focuses on:

```text
caloriesKcal
proteinG
carbsG
fatG
```

Use the actual existing contract as source of truth.

For each selected USDA record, map only the nutrients required by that existing v0.1 contract.

Do not expand this task into:

```text
vitamins
minerals
cholesterol
fiber
sugar
sodium
micronutrient completeness
```

unless the current contract already requires them.

Keep v0.1 narrow.

---

# 9. Preserve the 100 g Reference Model

The deterministic calculator currently uses nutrition references based on a gram basis.

Preserve the existing principle:

```text
nutrition reference
= nutrient values for a known gram basis
```

Prefer normalized production references using:

```text
basisGrams = 100
```

where compatible with the actual source and package contract.

Do not store household-unit nutrient values as the canonical nutrition reference when the source provides a 100 g basis.

Portions should be treated as conversion metadata, not as a second nutrition truth.

---

# 10. Verified Portion Data

USDA FoodData Central provides gram weights for portions for some foods.

Only use a portion conversion when the selected USDA record provides a verified relevant portion.

Conceptually:

```text
canonical ingredient
+
source-specific portion
        ↓
gram weight
```

Examples of potentially source-backed portions may include:

```text
1 tablespoon
1 cup
1 fruit
1 egg / size-specific egg portion
1 piece
```

but only use what exists on the exact verified USDA record.

Do not create universal assumptions such as:

```text
1 tablespoon = X grams for every ingredient
1 clove = X grams for every ingredient
1 egg = X grams regardless of size
```

Mass conversions can be ingredient-specific.

---

# 11. Indonesian Unit Aliases

Flemme inputs may use Indonesian cooking words such as:

```text
sdm
sendok makan
sdt
sendok teh
butir
siung
gram
g
kg
ml
```

Separate:

```text
unit-name normalization
```

from:

```text
unit-to-mass conversion
```

It is acceptable for deterministic aliases to normalize:

```text
"gram" → "g"
"grams" → "g"
```

or equivalent obvious naming aliases.

But do NOT imply that recognizing:

```text
"sdm"
```

automatically provides a valid gram conversion.

A unit may be recognized but still not be convertible for a particular ingredient.

---

# 12. Direct Gram Units

Support exact metric mass units deterministically where the current package allows it:

```text
g
gram
kg
kilogram
```

These conversions are physical unit conversions, not food-density assumptions.

Examples:

```text
100 g → 100 g
0.5 kg → 500 g
```

Keep this logic generic and deterministic.

Do not treat volume as mass:

```text
ml ≠ g
```

unless an ingredient-specific verified source provides the required relationship.

---

# 13. Portion Conversion Contract

If a production portion-conversion contract is missing, add the smallest deterministic contract needed.

Conceptually:

```ts
type IngredientPortionReference = {
  ingredientKey: string;
  unit: string;
  amount: number;
  grams: number;
  source: NutritionSourceProvenance;
};
```

Adapt to current architecture rather than copying blindly.

Key invariants:

```text
conversion belongs to a canonical ingredient
conversion is source-backed
conversion is deterministic
conversion provenance is preserved
```

Do not create free-floating global household-measure-to-gram guesses.

---

# 14. Production Nutrition References

Establish a production reference collection owned by:

```text
@flemme/nutrition
```

Conceptually:

```text
canonical ingredient key
        ↓
USDA provenance
        ↓
100 g nutrition values
        ↓
verified portions[]
```

The nutrition package may depend on `@flemme/ingredients`.

Do not introduce the reverse dependency.

Required direction:

```text
@flemme/nutrition
        ↓
@flemme/ingredients
```

Never:

```text
@flemme/ingredients
        ↓
@flemme/nutrition
```

---

# 15. Runtime Must Remain Offline

Production nutrition calculation must NOT call USDA over the network on every recipe calculation.

The curated data should be committed as application data.

Desired runtime:

```text
Cooking Plan
        ↓
local canonical catalog
        ↓
local curated nutrition references
        ↓
local deterministic calculation
```

NOT:

```text
Cooking Plan
        ↓
USDA HTTP API during user request
```

This protects:

```text
latency
availability
determinism
API rate limits
historical reproducibility
```

---

# 16. Optional Curation / Verification Script

If useful, add a development-only tool such as:

```text
verify USDA curated references
```

or:

```text
fetch candidate FDC record
```

It may use:

```text
USDA_FDC_API_KEY
```

from environment configuration.

Requirements:

```text
never commit the API key
never require the script at production runtime
never automatically bulk import
never silently rewrite curated mappings
```

If the script updates production data, require an explicit developer action and make the diff reviewable.

A verification-only script is preferable to an uncontrolled sync job.

---

# 17. Data Provenance Documentation

Create a clear data document, for example:

```text
docs/data/nutrition-sources.md
```

or the best existing documentation location.

For each supported canonical ingredient, document at least:

```text
canonical ingredient key
FDC ID
USDA description
USDA data type
whether nutrition reference is supported
which portions are supported
known mapping limitations
```

Keep this human-reviewable.

Do not dump huge raw USDA responses into documentation.

---

# 18. Extend Nutrition Result Semantics

The current blocker includes an important contract problem:

```text
a fully unresolved recipe
cannot currently be represented
without fake zero totals
```

Fix this in `@flemme/nutrition`.

The result must be capable of representing:

```text
complete
partial
unavailable
```

Use the smallest change compatible with the current public API.

Conceptually:

```ts
type RecipeNutritionResult =
  | {
      status: "complete";
      ...
    }
  | {
      status: "partial";
      ...
    }
  | {
      status: "unavailable";
      ...
    };
```

Do not blindly use this exact shape.

Inspect the current contract first.

---

# 19. Meaning of `complete`

Use:

```text
status = complete
```

only when all nutritionally relevant recipe ingredients that require calculation are supported sufficiently to calculate the requested result.

Do not call a result complete merely because some values were produced.

---

# 20. Meaning of `partial`

Use:

```text
status = partial
```

when:

```text
at least one ingredient contributes trusted calculated nutrition
AND
at least one ingredient could not be included reliably
```

Possible reasons:

```text
canonical ingredient unresolved
nutrition reference missing
quantity missing
unit unsupported
portion conversion unavailable
```

Keep unresolved-reason details compatible with the current package.

---

# 21. Meaning of `unavailable`

Use:

```text
status = unavailable
```

when no meaningful trusted nutrition total can be calculated.

For `unavailable`:

```text
do NOT return fake zero calories
do NOT return fake zero macros
```

Prefer absence/null/union-specific omission according to the final Zod contract.

The API integration task later must be able to distinguish:

```text
real zero
```

from:

```text
unknown
```

---

# 22. `estimated` Semantics

Audit the current `estimated` field.

If retained, define exactly what it means.

A deterministic calculation based on food composition references and portion weights may still be an estimate of real-world food nutrition, but:

```text
estimated = true
```

must not be used as an excuse for invented inputs.

Document the intended meaning.

Do not overload `estimated` to mean:

```text
we guessed the grams
```

---

# 23. Issue / Coverage Details

If the current nutrition contract already exposes missing coverage, extend it carefully.

Useful conceptual reasons may include:

```text
ingredient-unresolved
reference-missing
quantity-missing
unit-unsupported
portion-unavailable
```

Prefer stable machine-readable reason codes over relying only on prose.

Do not over-engineer a large error taxonomy.

The purpose is to explain why a result is partial/unavailable.

---

# 24. Test the Production Catalog Separately

Add package-level integrity tests for the real production ingredient catalog.

Verify:

```text
unique canonical keys
valid kebab-case keys
aliases do not accidentally collide
ID/EN names are non-empty
resolver behavior is deterministic
```

Do not weaken existing resolver behavior to make data pass.

Fix bad data instead.

---

# 25. Test USDA Mapping Integrity

Add deterministic offline tests for production nutrition mappings.

Verify:

```text
every nutrition mapping references an existing canonical ingredient
every production mapping has a valid FDC ID
every production mapping has provenance
basis grams are valid
required macros are finite/non-negative where present
duplicate mappings are rejected or explicitly handled
```

Do not call USDA from automated unit tests.

---

# 26. Test Portion Integrity

For committed portion conversions verify:

```text
ingredient exists
amount > 0
grams > 0
normalized unit is valid
source provenance exists
no duplicate conflicting portion mapping
```

If the same unit has multiple source sizes such as:

```text
small
medium
large
```

do not collapse them into one ambiguous unit.

---

# 27. Test Nutrition Status Semantics

Add pure package tests for:

## Complete

All ingredients have:

```text
canonical identity
nutrition reference
known quantity
supported conversion
```

Expected:

```text
status = complete
trusted totals
trusted per-serving values
```

## Partial

At least one trusted ingredient contributes and another cannot be calculated.

Expected:

```text
status = partial
known subset contributes
unsupported ingredient is reported
```

## Unavailable

No ingredient can be calculated reliably.

Expected:

```text
status = unavailable
no fake zero total
no fake zero perServing
```

This is a required acceptance case.

---

# 28. Test Exact Metric Conversion

Verify deterministic mass normalization such as:

```text
250 g
1 kg
0.5 kg
```

No network and no ingredient-specific assumptions should be necessary for direct mass units.

---

# 29. Test Unsupported Household Units

Verify behavior for a recognized but unsupported conversion.

Example concept:

```text
ingredient = garlic
quantity = 2
unit = "siung"
```

If there is no verified exact portion for that selected source record:

```text
do not guess grams
mark coverage issue
```

If there is a verified portion and the semantic mapping is exact:

```text
use it deterministically
```

---

# 30. Current Telur Kecap Scenario

Use the existing Flemme manual scenario as a practical foundation check:

```text
Telur Kecap Bawang
```

Ingredients previously generated include:

```text
telur
kecap manis
bawang merah
bawang putih
minyak goreng
garam
```

Do NOT force this recipe to produce `complete` nutrition.

Instead produce a report showing for each ingredient:

```text
canonical resolution
USDA mapping present?
nutrition reference present?
quantity usable?
unit conversion supported?
final inclusion/exclusion reason
```

A result of:

```text
partial
```

or even:

```text
unavailable
```

is acceptable if that is what the trustworthy data supports.

The objective is correctness, not a green-looking status.

---

# 31. Do Not Modify Agent Output Just to Make Nutrition Pass

Do NOT change Pre-Cooking prompting/schema in this task merely to force gram quantities.

Do not tell the LLM:

```text
always convert ingredients to grams
```

as a workaround.

Agent-generated gram values would still be untrusted unless backed by deterministic conversion.

If a future Pre-Cooking contract enhancement is needed, document it as follow-up work.

---

# 32. No Cooking Session API Yet

Do NOT resume the paused Nutrition Integration in this task.

Do not add:

```http
GET /cooking-sessions/{id}/nutrition
```

Do not modify:

```http
POST /cooking-sessions/{id}/complete
```

to calculate nutrition yet.

This task must first prove that the underlying production data and contracts are trustworthy.

---

# 33. No Database Schema Requirement

Prefer keeping the curated v0.1 dataset as version-controlled package data.

Do not create database tables merely to mirror USDA data unless the current architecture proves they are required.

For this v0.1:

```text
code/package-owned curated data
```

is preferred because it is:

```text
small
deterministic
reviewable
versioned with application code
```

---

# 34. No Admin / Runtime Data Editor

Do NOT implement:

```text
admin nutrition editor
ingredient CMS
nutrition CRUD
USDA synchronization dashboard
```

in this task.

Curation remains developer-controlled for v0.1.

---

# 35. Security / Configuration

If a USDA verification script is added:

```text
USDA_FDC_API_KEY
```

must come from environment configuration.

Add only a safe placeholder to `.env.example` if appropriate.

Never commit:

```text
real API keys
API response dumps containing secrets
developer credentials
```

---

# 36. Update Architecture Documentation

Update:

```text
docs/architecture.md
docs/progress-tracker.md
```

and the chosen nutrition source documentation.

The architecture should explicitly show:

```text
@flemme/ingredients
        ↓
canonical ingredient identity

@flemme/nutrition
        ↓
curated USDA mapping
        ↓
nutrition reference
        ↓
verified portions
        ↓
deterministic calculator
```

Document that runtime USDA network access is not required.

---

# 37. Keep Nutrition Integration Paused

At the end of this task:

```text
Ingredient + Nutrition Data Foundation v0.1
```

may become:

```text
✅ COMPLETE
```

but:

```text
Nutrition Integration v0.1
```

must remain:

```text
⏸ PAUSED
```

until this foundation passes review.

The next task after successful completion will resume Nutrition Integration using the new production data.

---

# 38. Definition of Done

This task is complete when all of the following are true:

```text
[ ] A production canonical ingredient catalog exists
[ ] Test/demo ingredient fixtures remain separate
[ ] A curated USDA mapping set exists
[ ] Every production nutrition mapping preserves FDC provenance
[ ] No bulk USDA dataset was imported
[ ] Production nutrition references are deterministic and offline
[ ] Verified source-backed portions are represented where available
[ ] Unsupported household conversions are not guessed
[ ] Direct metric mass normalization is deterministic
[ ] Nutrition result can represent complete
[ ] Nutrition result can represent partial
[ ] Nutrition result can represent unavailable
[ ] Unavailable does not emit fake zero macros
[ ] Production data integrity tests pass
[ ] Nutrition calculation tests pass
[ ] Existing package tests remain passing
[ ] Architecture/data documentation is updated
[ ] Nutrition Integration remains paused
```

---

# 39. Validation

Run at minimum:

```text
@flemme/ingredients tests
@flemme/nutrition tests
full workspace tests
workspace typecheck
workspace build
scoped Biome
git diff --check
```

If a USDA verification script is implemented and credentials/network are available:

```text
run it explicitly against only the curated FDC IDs
```

Report that separately from deterministic automated tests.

Do not make CI/unit tests depend on USDA availability.

---

# 40. Expected Final Report

Return a concise implementation report containing:

```text
files changed

current contracts discovered

production ingredient catalog:
- ingredient count
- keys added

USDA mappings:
- supported ingredient count
- FDC IDs selected
- data types selected
- unsupported candidates and reasons

nutrition references:
- supported count
- macro fields mapped

portion conversions:
- supported conversions
- unsupported conversions
- how provenance is preserved

nutrition result contract:
- complete behavior
- partial behavior
- unavailable behavior

Telur Kecap foundation audit:
- resolved ingredients
- mapped ingredients
- supported quantities/units
- unresolved/unsupported ingredients
- expected nutrition coverage status

tests/typecheck/build/check results

USDA verification result if performed

remaining limitations

confirmation that Nutrition Integration is still paused
```

Also show the final data architecture:

```text
Flemme canonical ingredient
        ↓
curated USDA FDC mapping
        ↓
100 g nutrition reference
        +
verified source-specific portions
        ↓
deterministic normalization
        ↓
@flemme/nutrition
        ↓
complete | partial | unavailable
```

Stop after Ingredient + Nutrition Production Data Foundation v0.1 is implemented and validated.

Do not continue into the Cooking Session Nutrition Integration in the same task.
