# Contributing

Thank you for contributing to @pokujs/scope-hooks.

## Setup

1. Install dependencies:

```sh
npm ci
```

2. Run checks:

```sh
npm run check
```

## Development Guidelines

- Keep the package generic and independent from adapter-specific runtime behavior.
- Treat `poku` as the owner of the symbol contract and this package as the owner of composition logic.
- Add tests for every behavior change in hook lookup or provider composition.

## Test Commands

```sh
npm test
npm run test:bun
npm run test:deno
npm run typecheck
```

## Pull Requests

Please include:

- What changed and why.
- Tests added or updated.
- Any impact on downstream packages such as @pokujs/dom, @pokujs/react, or @pokujs/vue.
