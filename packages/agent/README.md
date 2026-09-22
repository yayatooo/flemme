# Flemme agent

Reusable AI capabilities for Flemme.

Repository-level setup, environment configuration, runner commands, Active
Cooking scenarios, and programmatic usage are documented in the root
[`README.md`](../../README.md#using-the-agent-locally).

Provider credentials are supplied by the application that invokes the agent.
The package does not load environment files or own secrets.

```ts
import { createOpenRouterModel } from "@flemme/agent";

const model = createOpenRouterModel({
  apiKey: process.env.OPENROUTER_API_KEY,
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
overrides are not currently supported. The development runner defaults to
OpenRouter's `deepseek/deepseek-v4.1-flash`, which supports the structured
output required by the cooking phases. Set `OPENROUTER_MODEL` to override it.

The runner requires `OPENROUTER_API_KEY`. During the local migration,
`OPEN_API_KEY` is also accepted as a compatibility alias. It is only a local
development entry point; importing `@flemme/agent` does not load the environment
file or run a completion.

Run the development-only structured-output compatibility probe against the
configured OpenAI-compatible gateway:

```bash
bun run --filter @flemme/agent probe:structured-output
```

The probe tests `deepseek/deepseek-v4.1-flash` with the same minimal native
Anvia output schema used by the runtime.

Run Pre-Cooking independently with the deterministic Ayam Kecap development
fixture:

```bash
bun run --filter @flemme/agent runner:pre-cooking
```

The runner validates the fixture with `PreCookingInputSchema`, invokes
`runPreCooking` with DeepSeek V4.1 Flash, and prints the complete structured plan.

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
input, calls `runActiveCooking` with DeepSeek V4.1 Flash, and prints the validated
reply and proposed actions. The runner never applies those actions or mutates
the supplied session.

List or run Completion scenarios with the same development model:

```bash
bun run --filter @flemme/agent runner:completion -- --list
bun run --filter @flemme/agent runner:completion -- normal
bun run --filter @flemme/agent runner:completion -- all
```

The Completion runner reuses the Ayam Kecap plan, validates a completed session,
and prints only the structured closing reply, summary, and notes. It performs no
application mutations.

The source files for all four phase runners are grouped under `runners/`. The
package scripts above are the supported entry points, so their CLI commands stay
stable if runner internals move again.
