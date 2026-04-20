import process from 'node:process';
import { assert, test } from 'poku';

test('scope hooks integrate with poku it execution', async () => {
  const repoDir = process.cwd();
  const fixturePath = 'tests/__fixtures__/integration/scope-hooks/integration.fixture.ts';

  const { inspectPoku } = await import('poku/plugins');

  const result = await inspectPoku({
    command: `${fixturePath} --showLogs`,
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