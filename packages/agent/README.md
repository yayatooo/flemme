# Flemme agent

Reusable AI capabilities for Flemme.

Repository-level setup, environment configuration, runner commands, Active
Cooking scenarios, and programmatic usage are documented in the root
[`README.md`](../../README.md#using-the-agent-locally).

Provider credentials are supplied by the application that invokes the agent.
The package does not load environment files or own secrets.

```ts
import { createOpenAIModel } from "@flemme/agent";

const model = createOpenAIModel({
  apiKey: process.env.MUX_API_KEY,
  baseUrl: process.env.BASE_URL,
});
```

Install workspace dependencies from the repository root:

```bash
bun install
```

Run a one-off completion using the provider values from the repository `.env`:

```bash
bun run --filter @flemme/agent runner
```

The runner validates its built-in structured cooking context with
`CookingRecommendationInputSchema` before invoking the agent and prints the
schema-validated cooking recommendation output. Free-form command line prompt
overrides are not currently supported. The development runner explicitly uses
`gpt-5.6-luna`, which passed the native structured-output compatibility probe;
this does not change the provider factory's default model.

The runner requires `MUX_API_KEY` and `BASE_URL`. It is only a local development
entry point; importing `@flemme/agent` does not load the environment file or run
a completion.

Run the development-only structured-output compatibility probe against the
configured OpenAI-compatible gateway:

```bash
bun run --filter @flemme/agent probe:structured-output
```

The probe tests `glm-5.3-flash`, `deepseek-v4-flash-0731`, and `gpt-5.6-luna`
individually with the same minimal native Anvia output schema.

Run Pre-Cooking independently with the deterministic Ayam Kecap development
fixture:

```bash
bun run --filter @flemme/agent runner:pre-cooking
```

The runner validates the fixture with `PreCookingInputSchema`, invokes
`runPreCooking` with `gpt-5.6-luna`, and prints the complete structured plan.

List the available Active Cooking development scenarios:

```bash
bun run --filter @flemme/agent runner:active-cooking -- --list
```

Run the default current-step guidance scenario or choose a named scenario:

```bash
bun run --filter @flemme/agent runner:active-cooking
bun run --filter @flemme/agent runner:active-cooking -- missing-ingredient
```

Use `all` to invoke all ten scenarios sequentially. Each scenario validates its
input, calls `runActiveCooking` with `gpt-5.6-luna`, and prints the validated
reply and proposed actions. The runner never applies those actions or mutates
the supplied session.
