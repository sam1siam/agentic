import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildProfile, starterSettings } from '../lib/profile-generator.ts';
import { validateProfile, validateReceipt } from '../lib/validation.ts';

test('generator matches the published contract and rejects unusable settings', async () => {
  const fixture = JSON.parse(
    await readFile('examples/tickets/agentic.json', 'utf8'),
  );
  const api = JSON.parse(
    await readFile('examples/tickets/openapi.json', 'utf8'),
  );
  assert.deepEqual(buildProfile(starterSettings), fixture);
  assert.equal(validateProfile(buildProfile(starterSettings), api).valid, true);
  for (const patch of [
    { origin: 'https://example.com/extra' },
    { retentionSeconds: 'not-a-number' },
    { status: 'createTicket' },
    { successValues: '' },
  ]) {
    assert.equal(
      validateProfile(buildProfile({ ...starterSettings, ...patch })).valid,
      false,
    );
  }
  assert.equal(
    validateReceipt(
      JSON.parse(await readFile('examples/tickets/receipt.json', 'utf8')),
    ),
    true,
  );
});

test('initializer creates valid output and never overwrites an existing file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agentic-init-'));
  const output = join(directory, 'agentic.json');
  try {
    const args = [
      'scripts/init.ts',
      '--origin',
      'https://pilot.example',
      '--out',
      output,
    ];
    const first = spawnSync(process.execPath, args, {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(first.status, 0, first.stderr);
    const original = await readFile(output, 'utf8');
    assert.equal(JSON.parse(original).origin, 'https://pilot.example');
    const second = spawnSync(
      process.execPath,
      [...args, '--action-id', 'changed'],
      { encoding: 'utf8', timeout: 10000 },
    );
    assert.equal(second.status, 1);
    assert.equal(await readFile(output, 'utf8'), original);
    const invalid = spawnSync(
      process.execPath,
      [
        'scripts/init.ts',
        '--origin',
        'http://untrusted.example',
        '--out',
        join(directory, 'bad.json'),
      ],
      { encoding: 'utf8', timeout: 10000 },
    );
    assert.equal(invalid.status, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('pilot runner rejects a success receipt without the required service interaction', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'agentic-runner-'));
  try {
    const fake = join(directory, 'fake.mjs');
    await writeFile(
      fake,
      `import { readFileSync } from 'node:fs'; const p=JSON.parse(readFileSync(0,'utf8')); console.log(JSON.stringify({agentic:'0.1.0-draft',request_id:p.request_id,action_id:p.profile.actions[0].id,origin:p.profile.origin,outcome:'succeeded',observed_at:new Date().toISOString(),resource_id:'invented',reason:'invented',evidence:{url:p.profile.origin+'/tickets/invented',resource_id:'invented',request_id:p.request_id,state:'open',matched:p.profile.actions[0].evidence.inputBindings}}));`,
    );
    const config = join(directory, 'adapter.json');
    await writeFile(
      config,
      JSON.stringify({
        name: 'Deliberately invalid test adapter',
        authorship: 'project',
        command: [process.execPath, fake],
      }),
    );
    const run = spawnSync(
      'python',
      ['scripts/pilot.py', '--adapter', config, '--scenario', 'normal'],
      { encoding: 'utf8', timeout: 30000 },
    );
    assert.equal(run.status, 1, run.stderr);
    const report = JSON.parse(run.stdout);
    assert.equal(report.passed, false);
    assert.equal(report.independence_verified, false);
    assert.equal(report.scenarios[0].checks.exactly_one_submit, false);
    assert.equal(report.scenarios[0].checks.status_read, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
