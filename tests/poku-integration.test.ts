import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';
import { afterEach, assert, test } from 'poku';

test('scope hooks integrate with poku it execution', async () => {
  const repoDir = process.cwd();
  const tempDir = await mkdtemp(join(repoDir, '.poku-scope-hooks-'));
  const fixturePath = join(tempDir, 'scope-hooks-it.fixture.ts');
  const fixtureRelativePath = relative(repoDir, fixturePath).replaceAll(
    '\\',
    '/'
  );
  const scopeHooksModuleUrl = new URL('../src/index.ts', import.meta.url).href;

  const fixtureSource = `
import { AsyncLocalStorage } from 'node:async_hooks';
import { assert, describe, it } from 'poku';
import { composeScopeHooks } from '${scopeHooksModuleUrl}';

const als = new AsyncLocalStorage<number>();
const events: string[] = [];
const seenIds: number[] = [];
let idSeed = 0;

composeScopeHooks({
  name: '@pokujs/scope-hooks.integration-fixture',
  createHolder: () => ({ scope: undefined }),
  runScoped: async (holder, fn) => {
    const id = ++idSeed;
    holder.scope = { id };
    events.push(\`before:\${id}\`);

    await als.run(id, async () => {
      const result = fn();
      if (result instanceof Promise) await result;
    });

    events.push(\`after:\${id}\`);
  },
});

await describe('scope hooks integration fixture', async () => {
  const runs = [
    it('first test executes inside the composed scope', async () => {
      const id = als.getStore();
      assert.ok(typeof id === 'number', 'ALS store exists for the first test');
      seenIds.push(id as number);

      await Promise.resolve();

      assert.strictEqual(
        als.getStore(),
        id,
        'ALS store remains stable for the first test'
      );

      events.push(\`test:\${id}\`);
    }),

    it('second test executes inside the composed scope', async () => {
      const id = als.getStore();
      assert.ok(typeof id === 'number', 'ALS store exists for the second test');
      seenIds.push(id as number);

      await Promise.resolve();

      assert.strictEqual(
        als.getStore(),
        id,
        'ALS store remains stable for the second test'
      );

      events.push(\`test:\${id}\`);
    }),
  ];

  await Promise.all(runs);
});

assert.strictEqual(seenIds.length, 2, 'Both poku it callbacks executed');
assert.ok(
  seenIds[0] !== seenIds[1],
  'Each poku it callback received an isolated scope id'
);

for (const id of seenIds) {
  const beforeIndex = events.indexOf(\`before:\${id}\`);
  const testIndex = events.indexOf(\`test:\${id}\`);
  const afterIndex = events.indexOf(\`after:\${id}\`);

  assert.ok(beforeIndex >= 0, \`before hook ran for scope \${id}\`);
  assert.ok(testIndex > beforeIndex, \`test body ran after before hook for scope \${id}\`);
  assert.ok(afterIndex > testIndex, \`after hook ran after test body for scope \${id}\`);
}
`;

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  await writeFile(fixturePath, fixtureSource, 'utf8');

  const { inspectPoku } = await import('poku/plugins');

  const result = await inspectPoku({
    command: `./${fixtureRelativePath} --showLogs`,
    spawnOptions: { cwd: repoDir },
  });

  assert.strictEqual(
    result.exitCode,
    0,
    `Fixture should pass. stdout:\n${result.stdout}\n\nstderr:\n${result.stderr}`
  );
  assert.ok(
    result.stdout.includes('scope hooks integration fixture'),
    'Fixture suite ran through the poku reporter'
  );
  assert.ok(
    result.stdout.includes('first test executes inside the composed scope'),
    'First test executed through poku'
  );
  assert.ok(
    result.stdout.includes('second test executes inside the composed scope'),
    'Second test executed through poku'
  );
});
