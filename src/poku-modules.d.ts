declare module 'poku' {
  export const assert: {
    strictEqual(actual: unknown, expected: unknown, message?: string): void;
    deepStrictEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
  };

  export const test: (
    title: string,
    cb: () => unknown | Promise<unknown>
  ) => Promise<void> | void;
  export const beforeEach: (cb: () => unknown | Promise<unknown>) => unknown;
  export const afterEach: (cb: () => unknown | Promise<unknown>) => unknown;
}

declare module 'poku/plugins' {
  export const SCOPE_HOOKS_KEY: symbol;
}
