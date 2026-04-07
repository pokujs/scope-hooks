# @pokujs/scope-hooks

Generic per-test scope hook composition utilities for Poku plugins.

## Install

```bash
npm install @pokujs/scope-hooks poku
```

## Usage

```ts
import { composeScopeHooks, getScopeHooks } from '@pokujs/scope-hooks';
import { SCOPE_HOOKS_KEY } from 'poku/plugins';

console.log(typeof SCOPE_HOOKS_KEY === 'symbol');

composeScopeHooks({
  name: '@acme/my-plugin.scope-hooks',
  createHolder: () => ({ scope: undefined }),
  runScoped: async (holder, fn) => {
    const result = fn();
    if (result instanceof Promise) await result;
  },
});

console.log(getScopeHooks());
```
