# Code Standards

### Simplicity Rule

If two implementations solve the same problem correctly, prefer the one that
a developer can understand faster.

Code that looks more "professional" but introduces unnecessary indirection is
not preferred over straightforward code.

## General

- Prefer stupid-simple code that is easy to understand.
- Readability is more important than making code look sophisticated.
- Prefer obvious implementation over clever abstraction.
- Keep modules small and single-purpose.
- Fix root causes instead of layering workarounds.
- Do not introduce abstractions before they are actually needed.
- Do not mix unrelated concerns.
- Avoid premature optimization.
- Avoid unnecessary wrappers, factories, generic helpers, and abstraction
  layers when straightforward code is easier to understand.
- Do not implement backward compatibility unless explicitly required.

## TypeScript

- Strict TypeScript is required.
- Avoid `any`.
- Validate unknown external input at system boundaries.
- Prefer inferred types from Zod and Drizzle where appropriate.
- Do not duplicate equivalent types manually.

## Naming

Files and folders use kebab-case.

Examples:

- `recipe-service.ts`
- `cooking-agent.ts`
- `ingredient-input.tsx`
- `cooking-session/`

Functions and variables use camelCase.

Types, interfaces, and React components use PascalCase.

Constants use UPPER_SNAKE_CASE when they represent fixed configuration.

## Web

- Use TanStack Router for routing.
- Use TanStack Query for remote/server state.
- Avoid `useEffect` when declarative alternatives exist.
- Prefer feature-oriented organization.
- Use shadcn/ui components as the base UI primitives.
- Do not modify generated shadcn primitives unnecessarily.

## API

Use colocated layered modules.

Preferred shape:

modules/
└── recipe/
    ├── recipe-route.ts
    ├── recipe-schema.ts
    ├── recipe-service.ts
    └── recipe-repository.ts

Default flow:

route → service → db

Add a repository abstraction only when query complexity justifies it.

## Agent

- Agent instructions belong in `packages/agent/src/prompts`.
- Provider configuration belongs in `packages/agent/src/providers`.
- Tools must represent real capabilities, not prompt conveniences.
- Do not create multiple agents unless their responsibilities are genuinely
  different.
- Structured outputs must use schemas instead of relying on prompt-only JSON.

## Database

- Drizzle is the database access layer.
- Schema changes require migrations.
- Avoid hidden database behavior.
- Timestamps should be used for business entities where lifecycle tracking
  matters.

## Protected Files

Do not manually edit:

- generated TanStack route tree files,
- generated migrations unless explicitly required,
- third-party dependency internals.


## React

### useEffect

`useEffect` is the last-resort option.

Do not use `useEffect` by default.

Before introducing `useEffect`, first determine whether the behavior can be
implemented using:

- derived values during render,
- event handlers,
- component composition,
- TanStack Query,
- TanStack Router,
- controlled state,
- direct user actions,
- or another declarative React pattern.

If `useEffect` still appears necessary:

1. Explain why it is required.
2. Explain why the alternatives are insufficient.
3. Ask for approval before adding it.

Do not silently introduce `useEffect`.

Existing `useEffect` usage must not be copied as a pattern without first
checking whether it is actually necessary.
