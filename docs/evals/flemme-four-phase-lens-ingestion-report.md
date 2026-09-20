# Four-phase Lens eval-ingestion smoke

Verified on 2026-09-20 against Lens v0.13.0 with Node 24.15.0,
`@anvia/lens` 1.2.0, and `@anvia/core` 1.5.0.

The isolated smoke command emitted one static synthetic record for each cooking
phase. It made zero target-model calls, zero qualitative-judge calls, and zero
runtime-observability calls. The four runs were manually confirmed in the Lens
UI.

```sh
bun run --cwd tools/lens-eval-smoke smoke:four-phase
```

| Phase | Suite | Run ID | Metric | Result | Payload |
| --- | --- | --- | --- | --- | --- |
| Recommendation | `flemme.eval.smoke.recommendation` | `d80e4e35-d2b7-45ae-926d-0c1438673044` | `flemme-synthetic-contract` | pass | null / `not_requested` |
| Pre-Cooking | `flemme.eval.smoke.pre-cooking` | `89fb21cd-173e-47a0-842d-432f895b5f1f` | `flemme-synthetic-contract` | pass | null / `not_requested` |
| Active Cooking | `flemme.eval.smoke.active-cooking` | `d74e5d9c-f743-4a60-9973-6540451ebf6d` | `flemme-synthetic-contract` | pass | null / `not_requested` |
| Completion | `flemme.eval.smoke.completion` | `22c3c0d3-62cc-482c-be91-cc786fdcb4f9` | `flemme-synthetic-contract` | pass | null / `not_requested` |

The reporter uses `includePayloads: false`, explicit metadata, and input,
output, error, and metadata redaction. Fixtures contain only static synthetic
markers. Storage verification confirmed one passing metric per run, null
payloads, and `not_requested` payload status. No raw prompt, response, domain
content, identity, header, credential, environment dump, or exception object
is permitted.

This smoke validates Lens eval ingestion only. It is separate from the local
four-phase eval suite and from runtime tracing. Implementation and operating
instructions are in [`tools/lens-eval-smoke/README.md`](../../tools/lens-eval-smoke/README.md).
