# Flemme eval baseline — Core 1.1.2

Baseline captured on 2026-09-19 at commit `5624a04` with a dirty worktree. The
worktree contained the untracked task briefs and audit material plus the eval
harness being measured; no unrelated changes were discarded. Inputs are
synthetic repository fixtures. Raw prompts, model responses, credentials, and
household data are intentionally omitted.

## Runtime and dependencies

| Item | Baseline |
| --- | --- |
| Bun | `1.2.20` |
| `@anvia/core` | declared `^1.1.2`, locked `1.1.2` |
| `@anvia/openai` | declared `^1.1.2`, locked `1.1.2` |
| Agent-path Zod | declared `^4.5.4`, locked `4.5.4` |
| Provider model | `gpt-5.6-luna` (the eval default) |
| Target retries | provider/Core defaults; no eval-owned retry loop |
| Concurrency / timeout | 1 / 90 seconds per case |

## Locked live run

| Phase | Cases | Pass / fail / invalid | Metrics | Pass / fail / invalid | Duration |
| --- | ---: | ---: | ---: | ---: | ---: |
| Recommendation | 10 | 10 / 0 / 0 | 60 | 60 / 0 / 0 | 66,285 ms |
| Pre-Cooking | 3 | 3 / 0 / 0 | 9 | 9 / 0 / 0 | 18,983 ms |
| Active Cooking | 8 | 8 / 0 / 0 | 24 | 24 / 0 / 0 | 12,832 ms |
| Completion | 3 | 3 / 0 / 0 | 9 | 9 / 0 / 0 | 9,390 ms |
| **Total** | **24** | **24 / 0 / 0** | **102** | **102 / 0 / 0** | **107,490 ms** |

There were no failed case IDs. Target and evaluation token usage were both
reported as zero because the existing public intent contract returns validated
output only and does not expose provider usage to Core's `targetUsage` selector.
Latency is available from the suite and is shown above.

The separate recommendation smoke run passed 1/1 case and 6/6 metrics in
7,171 ms. A one-case, provider-free `runEvalSuite` capability smoke also passed
1/1 case and 1/1 metric.

Every named metric passed all of its applicable cases: Recommendation schema,
variant, servings, inventory, equipment, and optional separation each passed
10/10; Pre-Cooking schema, plan invariants, and required equipment each passed
3/3; Active Cooking schema, action intent, and state safety each passed 8/8;
Completion schema, grounding anchor, and boundary each passed 3/3.

## Typecheck blocker investigation

Before the baseline, both package and root typecheck stopped in
`node_modules/openai/internal/types.d.mts` with `TS1002` and `TS1005` parser
errors. The installed file was only 5,395 bytes and contained visibly truncated,
concatenated import strings. `openai@7.10.0` owns the declaration and is reached
through `@anvia/openai@1.1.2`; one OpenAI version was installed. TypeScript was
`7.0.2`, but parsing failed before module-resolution or Flemme types could be
checked.

`bun install --frozen-lockfile --force` restored the same locked graph without
changing dependency versions. The declaration became 6,505 bytes with complete
imports, and Agent package typecheck passed. This proves local installation
corruption, not a required Core/OpenAI/Zod upgrade. No `skipLibCheck`, declaration
patch, ignore directive, or TypeScript downgrade was used.

Root typecheck now reaches all workspaces but remains red on five pre-existing
`apps/api` errors (`TS2459`, `TS2353`, `TS2339`, and two `TS2769` failures). Those
files are outside this assignment and were not edited. Six of seven workspace
typechecks, including `@flemme/agent`, pass.

## Repeatability and nondeterminism

The model can choose different valid recipes and wording, so the baseline is not
a claim of statistical quality. Stable case IDs, unchanged fixtures, unchanged
hard-rule metrics, a fixed model identifier, bounded concurrency, and no
eval-owned retries make the pre/post API compatibility comparison reproducible.
The same cases and metrics must be used after upgrade.

## Commands

```sh
bun run --filter @flemme/agent test
bun run --filter @flemme/agent typecheck
bun run --filter @flemme/agent eval:test
bun run --filter @flemme/agent eval:smoke
bun run --filter @flemme/agent eval:all
bun run typecheck
```
