import { afterEach, assert, beforeEach, test } from 'poku';
import { SCOPE_HOOKS_KEY } from 'poku/plugins';
import { composeScopeHooks, getScopeHooks } from '../src/index.ts';

const g = globalThis as Record<symbol, unknown>;
let originalHooks: unknown;

beforeEach(() => {
  originalHooks = g[SCOPE_HOOKS_KEY];
  delete g[SCOPE_HOOKS_KEY];
});

afterEach(() => {
  if (originalHooks === undefined) delete g[SCOPE_HOOKS_KEY];
  else g[SCOPE_HOOKS_KEY] = originalHooks;

  originalHooks = undefined;
});

test('getScopeHooks returns undefined before registration', () => {
  assert.strictEqual(
    getScopeHooks(),
    undefined,
    'No hooks before registration'
  );
});

test('composeScopeHooks composes providers in registration order', async () => {
  const calls: string[] = [];

  composeScopeHooks({
    name: 'provider-a',
    createHolder: () => ({ scope: { id: 'A' } }),
    runScoped: async (_holder, fn) => {
      calls.push('a:before');
      const result = fn();
      if (result instanceof Promise) await result;
      calls.push('a:after');
    },
  });

  const hooks = composeScopeHooks({
    name: 'provider-b',
    createHolder: () => ({ scope: { id: 'B' } }),
    runScoped: async (_holder, fn) => {
      calls.push('b:before');
      const result = fn();
      if (result instanceof Promise) await result;
      calls.push('b:after');
    },
  });

  await hooks.runScoped(hooks.createHolder(), () => {
    calls.push('manual:test:run');
  });

  assert.deepStrictEqual(
    calls,
    ['a:before', 'b:before', 'manual:test:run', 'b:after', 'a:after'],
    'Providers wrap the callback in registration order'
  );
});

test('composeScopeHooks dedupes providers by name', () => {
  const first = composeScopeHooks({
    name: 'provider-singleton',
    createHolder: () => ({ scope: undefined }),
    runScoped: async (_holder, fn) => {
      const result = fn();
      if (result instanceof Promise) await result;
    },
  });

  const second = composeScopeHooks({
    name: 'provider-singleton',
    createHolder: () => ({ scope: { replaced: true } }),
    runScoped: async (_holder, fn) => {
      const result = fn();
      if (result instanceof Promise) await result;
    },
  });

  assert.strictEqual(first, second, 'Provider is not composed twice');
});

test('composeScopeHooks preserves existing legacy hooks as the first provider', async () => {
  const calls: string[] = [];

  g[SCOPE_HOOKS_KEY] = {
    createHolder: () => ({ scope: { id: 'legacy' } }),
    runScoped: async (
      _holder: { scope: unknown },
      fn: () => Promise<unknown> | unknown
    ) => {
      calls.push('legacy:before');
      const result = fn();
      if (result instanceof Promise) await result;
      calls.push('legacy:after');
    },
  };

  const hooks = composeScopeHooks({
    name: 'provider-dom',
    createHolder: () => ({ scope: { id: 'dom' } }),
    runScoped: async (_holder, fn) => {
      calls.push('dom:before');
      const result = fn();
      if (result instanceof Promise) await result;
      calls.push('dom:after');
    },
  });

  await hooks.runScoped(hooks.createHolder(), () => {
    calls.push('manual:test:run');
  });

  assert.deepStrictEqual(
    calls,
    [
      'legacy:before',
      'dom:before',
      'manual:test:run',
      'dom:after',
      'legacy:after',
    ],
    'Legacy hooks stay as the outer provider when composing'
  );
});
