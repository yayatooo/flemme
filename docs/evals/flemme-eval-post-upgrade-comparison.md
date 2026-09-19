# Flemme eval post-upgrade comparison

Comparison captured on 2026-09-19 using the same 24 cases, 102 deterministic
metric evaluations, synthetic fixtures, `gpt-5.6-luna`, concurrency 1, and
90-second case timeout as the locked baseline. No raw prompts, responses,
credentials, or private user data are stored here.

## Dependency and compatibility result

| Dependency | Before | After |
| --- | --- | --- |
| `@anvia/core` | `1.1.2` | `1.5.0` |
| `@anvia/openai` | `1.1.2` | `1.1.5` |
| Shared workspace Zod | `4.5.4` | `4.6.5` |
| `@valibot/to-json-schema` | absent | `1.8.0` |
| Transitive OpenAI SDK | `7.10.0` | `7.19.0` (adapter range `^7.15.0`) |

Registry metadata verified that Core 1.5.0 peers with Zod `^4.6.5` and the
OpenAI adapter peers with Core `^1.5.0`. Because Flemme exchanges Zod schema
objects across workspace boundaries, the API, Agent, Contracts, Ingredients,
and Nutrition packages were aligned to exact Zod 4.6.5, with a root override
preventing nominally incompatible duplicate copies. Core's optional
`@valibot/to-json-schema` peer was added because Bun resolves its dynamic
import while bundling the API; without it, the production build fails. Public
intent signatures, provider base URL behavior, and production schemas required
no migration edits.

## Deterministic comparison

| Phase | Baseline cases | Post-upgrade cases | Baseline metrics | Post-upgrade metrics | Baseline duration | Post-upgrade duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Recommendation | 10 / 10 pass | 10 / 10 pass | 60 / 60 pass | 60 / 60 pass | 66,285 ms | 59,433 ms |
| Pre-Cooking | 3 / 3 pass | 3 / 3 pass | 9 / 9 pass | 9 / 9 pass | 18,983 ms | 18,702 ms |
| Active Cooking | 8 / 8 pass | 8 / 8 pass | 24 / 24 pass | 24 / 24 pass | 12,832 ms | 14,312 ms |
| Completion | 3 / 3 pass | 3 / 3 pass | 9 / 9 pass | 9 / 9 pass | 9,390 ms | 6,656 ms |
| **Total** | **24 / 24 pass** | **24 / 24 pass** | **102 / 102 pass** | **102 / 102 pass** | **107,490 ms** | **99,103 ms** |

No phase had failed or invalid cases. Every named metric retained the same full
pass count: six Recommendation metrics at 10/10 each, three Pre-Cooking metrics
at 3/3 each, three Active Cooking metrics at 8/8 each, and three Completion
metrics at 3/3 each. Target usage remained unavailable/zero because public
intent functions return only validated output.

The 8.4-second lower aggregate latency is one stochastic observation, not a
quality or performance improvement claim. Recipe wording and chosen valid
variants changed between runs, as expected. No output-contract or hard-rule
regression was observed. The harness adds no retry loop, and no structured
output behavior change was observed.

## Verification state

- Agent tests: 67 passed, 0 failed, 118 expectations after the later safety
  assertion was added.
- Agent typecheck: passed with the upgraded OpenAI declarations.
- Scoped Biome check: passed.
- Root build: passed after the Zod alignment and Core optional peer were
  installed.
- Root typecheck: six of seven workspaces pass; exactly the same five existing
  `apps/api` type errors from the pre-upgrade baseline remain outside this
  task. All upgrade-induced Zod/OpenAPI errors were eliminated.
- Existing offline suites: Agent 67/67, Contracts 4/4, Ingredients 19/19,
  Nutrition 60/60, and Web 175/175 pass. DB and API integration suites could
  not run because PostgreSQL was not listening on localhost:5432.
- Bounded judge rerun: 4/4 cases and 5/5 metrics passed at threshold 0.8,
  consuming 6,106 evaluation tokens. Cost is not calculated because no pricing
  table is configured.

The first judge run identified unsafe pause wording around hot oil. The Active
Cooking prompt now requires turning off heat and making the area safe before
stepping away; its prompt regression assertion and second judge run passed.
This behavior fix is separate from dependency compatibility and should not be
attributed to the upgrade itself. A final provider-backed Active Cooking rerun
against the finished prompt passed 8/8 cases and 24/24 deterministic metrics in
16,607 ms.
