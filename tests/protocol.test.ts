import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { executeAction, MemoryLedger } from '../lib/client.ts';
import { httpTransport } from '../lib/http-transport.ts';
import { validateProfile, validateReceipt } from '../lib/validation.ts';
import { runDemo, SimulatedService } from '../lib/simulator.ts';
import type { Profile } from '../lib/types.ts';
import { buildActionIndex } from '../lib/action-index.ts';
const sample = JSON.parse(
  await readFile('examples/tickets/agentic.json', 'utf8'),
) as Profile;
const api = JSON.parse(await readFile('examples/tickets/openapi.json', 'utf8'));
test('schema and binding validation reject ambiguous or unsafe profiles', () => {
  assert.equal(validateProfile(sample, api).valid, true);
  for (const mutate of [
    (p: Profile) => p.actions.push(p.actions[0]),
    (p: Profile) => (p.origin = 'https://user:pass@example.com'),
    (p: Profile) => (p.actions[0].openapi = '/../openapi.json'),
    (p: Profile) => (p.actions[0].status = p.actions[0].submit),
    (p: Profile) => (p.agentic = '2' as Profile['agentic']),
  ]) {
    const p = structuredClone(sample);
    mutate(p);
    assert.equal(validateProfile(p, api).valid, false);
  }
});
test('receipt schema requires evidence for success', () => {
  assert.equal(
    validateReceipt({
      agentic: '1.0.0',
      request_id: 'request-001',
      action_id: 'create-ticket',
      origin: sample.origin,
      outcome: 'succeeded',
      observed_at: new Date().toISOString(),
      resource_id: 'T1',
      reason: 'claimed',
    }),
    false,
  );
});
test('recovery reconciles a committed write with a lost response', async () => {
  const r = await runDemo('response-lost', 'agentic');
  assert.equal(r.outcome, 'succeeded');
  assert.equal(r.tickets, 1);
  assert.equal(r.duplicates, 0);
  assert.equal(validateReceipt(r.receipt), true);
});
test('fair baseline: idempotent retries also avoid duplicates', async () => {
  const blind = await runDemo('response-lost', 'blind'),
    good = await runDemo('response-lost', 'idempotent');
  assert.equal(blind.duplicates, 1);
  assert.equal(good.duplicates, 0);
});
test('unavailable status and mismatched evidence never establish success', async () => {
  for (const scenario of ['status-unavailable', 'wrong-evidence'] as const) {
    const r = await runDemo(scenario, 'agentic');
    assert.equal(r.outcome, 'unknown');
    assert.equal(r.tickets, 1);
  }
});
test('temporarily stale resource reads are retried without resubmitting', async () => {
  const r = await runDemo('stale-read', 'agentic');
  assert.equal(r.outcome, 'succeeded');
  assert.equal(r.tickets, 1);
  assert.equal(r.calls, 5);
});
test('pending is distinct from completed', async () => {
  const r = await runDemo('pending', 'agentic');
  assert.equal(r.outcome, 'pending');
  assert.equal(r.tickets, 0);
});
test('expired requests are not resubmitted', async () => {
  const r = await runDemo('expired', 'agentic');
  assert.equal(r.outcome, 'unknown');
  assert.equal(r.calls, 0);
});
test('request IDs cannot be reused for changed input or changed profiles', async () => {
  const ledger = new MemoryLedger(),
    transport = new SimulatedService('normal');
  const opts = {
    profile: sample,
    openapi: api,
    actionId: 'create-ticket',
    requestId: 'repeat-request',
    input: { subject: 'one' },
    ledger,
    transport,
  };
  await executeAction(opts);
  await assert.rejects(
    executeAction({ ...opts, input: { subject: 'two' } }),
    /already bound/,
  );
  const p = structuredClone(sample);
  p.actions[0].description = 'changed';
  await assert.rejects(executeAction({ ...opts, profile: p }), /already bound/);
  assert.equal(transport.tickets.length, 1);
});
test('host origin boundary and redirects cannot be bypassed', async () => {
  const transport = httpTransport('https://support.example');
  await assert.rejects(
    transport.request('https://unapproved.example/', {
      method: 'GET',
      timeoutMs: 100,
    }),
    /not approved/,
  );
  let followed = 0;
  const server = createServer((req, res) => {
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: '/target' });
      res.end();
    } else {
      followed++;
      res.end('{}');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin =
    'http://127.0.0.1:' + (server.address() as { port: number }).port;
  try {
    await assert.rejects(
      httpTransport(origin).request(origin + '/redirect', {
        method: 'GET',
        timeoutMs: 1000,
      }),
    );
    assert.equal(followed, 0);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
async function withService(
  fault: string,
  run: (origin: string, dir: string) => Promise<void>,
) {
  const dir = await mkdtemp(join(tmpdir(), 'agentic-test-'));
  const proc = spawn(
    'python',
    [
      'reference/service/server.py',
      '--port',
      '0',
      '--db',
      join(dir, 'service.sqlite3'),
      '--fault',
      fault,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let startup = '';
  const origin = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Service startup timed out')),
      15000,
    );
    proc.stdout.on('data', (chunk) => {
      startup += chunk.toString();
      if (startup.includes('\n')) {
        clearTimeout(timer);
        try {
          resolve(JSON.parse(startup.split('\n')[0]).origin);
        } catch (e) {
          reject(e);
        }
      }
    });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (!startup) reject(new Error('Service exited ' + code));
    });
  });
  try {
    await run(origin, dir);
  } finally {
    proc.kill();
    await once(proc, 'exit');
    await rm(dir, { recursive: true, force: true });
  }
}
async function command(
  binary: string,
  args: string[],
  env: Record<string, string> = {},
) {
  const child = spawn(binary, args, {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '',
    err = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (err += d));
  const [code] = await once(child, 'exit');
  return { code, out, err };
}
async function ticketCount(origin: string) {
  return (
    (await (await fetch(origin + '/__state')).json()) as { tickets: number }
  ).tickets;
}
test('real HTTP drop and SQLite service support both reference consumers', async () => {
  await withService('response-lost', async (origin, dir) => {
    const profile = await (await fetch(origin + '/agentic.json')).json();
    const index = await fetch(origin + '/agentic.txt');
    assert.match(index.headers.get('content-type')!, /text\/plain/);
    assert.equal(
      await index.text(),
      buildActionIndex(profile, undefined, true),
    );
    const a = await command(process.execPath, [
      'reference/node/client.ts',
      origin,
      'node-http-request',
      'Node HTTP test',
      join(dir, 'node.sqlite3'),
    ]);
    assert.equal(a.code, 0, a.err);
    assert.equal(validateReceipt(JSON.parse(a.out)), true);
    const b = await command('python', [
      'reference/python/client.py',
      origin,
      'python-http-request',
      'Python HTTP test',
      join(dir, 'python.sqlite3'),
    ]);
    assert.equal(b.code, 0, b.err);
    assert.equal(validateReceipt(JSON.parse(b.out)), true);
    assert.equal(await ticketCount(origin), 2);
  });
});
test('durable Node ledger survives a process crash after submission', async () => {
  await withService('response-lost', async (origin, dir) => {
    const args = [
      'reference/node/client.ts',
      origin,
      'crash-node-request',
      'Crash test',
      join(dir, 'node.sqlite3'),
    ];
    const crashed = await command(process.execPath, args, {
      AGENTIC_TEST_CRASH: '1',
    });
    assert.equal(crashed.code, 86, crashed.err);
    const resumed = await command(process.execPath, args);
    assert.equal(resumed.code, 0, resumed.err);
    assert.equal(JSON.parse(resumed.out).outcome, 'succeeded');
    assert.equal(await ticketCount(origin), 1);
  });
});
test('durable Python ledger survives a process crash after submission', async () => {
  await withService('response-lost', async (origin, dir) => {
    const args = [
      'reference/python/client.py',
      origin,
      'crash-python-request',
      'Crash test',
      join(dir, 'python.sqlite3'),
    ];
    const crashed = await command('python', args, { AGENTIC_TEST_CRASH: '1' });
    assert.equal(crashed.code, 86, crashed.err);
    const resumed = await command('python', args);
    assert.equal(resumed.code, 0, resumed.err);
    assert.equal(await ticketCount(origin), 1);
  });
});
test('service atomically deduplicates concurrent writes and rejects key conflicts', async () => {
  await withService('normal', async (origin) => {
    const send = (subject: string) =>
      fetch(origin + '/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'parallel-request',
        },
        body: JSON.stringify({ subject }),
      });
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => send('one')),
    );
    assert(responses.every((r) => [200, 201].includes(r.status)));
    assert.equal((await send('different')).status, 409);
    assert.equal(await ticketCount(origin), 1);
  });
});
