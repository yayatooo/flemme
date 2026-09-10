# Flemme agent

Reusable AI capabilities for Flemme.

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

The runner contains a default ingredient-based test prompt. Pass an argument to
override it:

```bash
bun run --filter @flemme/agent runner -- "Suggest a meal with eggs and rice"
```

The runner requires `MUX_API_KEY` and `BASE_URL`. It is only a local development
entry point; importing `@flemme/agent` does not load the environment file or run
a completion.
