import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { ClientFactory } from '@a2a-js/sdk/client';
import { SendMessageRequest, GetTaskRequest } from '@a2a-js/sdk';
import { AgentAuthClient, MemoryStorage } from '@auth/agent';
import { publicAddress, publicUrl, readPublic } from '../server/audit.ts';
import {
  importBundle,
  listOperations,
  starterSettings,
} from '../lib/openapi-import.ts';
import ticketApi from '../examples/tickets/openapi.json' with { type: 'json' };
import { buildActionIndex } from '../lib/action-index.ts';

test('public auditor blocks private, special and unsafe addresses', async () => {
  for (const address of [
    '127.0.0.1',
    '10.1.2.3',
    '169.254.169.254',
    '192.168.1.1',
    '0.0.0.0',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fe80::1',
    '100.64.0.1',
    '198.18.0.1',
  ])
    assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress('1.1.1.1'), true);
  for (const url of [
    'http://example.com',
    'https://user:password@example.com',
    'https://example.com:8443',
    'https://example.com/#secret',
  ])
    assert.throws(() => publicUrl(url));
  await assert.rejects(() => readPublic('https://127.0.0.1/'), /public IP/);
  await assert.rejects(
    () => readPublic('https://[::ffff:127.0.0.1]/'),
    /public IP/,
  );
});
test('OpenAPI import produces a complete validated bundle and rejects mismatched operations', () => {
  assert.equal(listOperations(ticketApi).length, 3);
  const result = importBundle(ticketApi, starterSettings);
  assert.equal(result.validation.valid, true);
  assert.deepEqual(Object.keys(result.files).sort(), [
    'README.md',
    'agentic.json',
    'agentic.txt',
    'openapi.json',
  ]);
  assert.equal(
    importBundle(ticketApi, { ...starterSettings, status: 'nonexistent' })
      .validation.valid,
    false,
  );
  assert.throws(
    () => listOperations({ ...ticketApi, openapi: '3.0.0' }),
    /3.1/,
  );
});

test(
  'hosted platform uses real HTTP, PostgreSQL isolation and official protocol clients',
  { skip: !process.env.DATABASE_URL, timeout: 120000 },
  async (t) => {
    const { handle } = await import('../server/app.ts');
    const { database, closeDatabase } = await import('../server/db.ts');
    process.env.AGENTIC_ALLOW_LOCAL = '1';
    const server = createServer(async (req, res) => {
      const response = await handle(
        new Request(process.env.AGENTIC_ORIGIN + req.url!, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          ...(req.method !== 'GET' && req.method !== 'HEAD'
            ? { body: Readable.toWeb(req), duplex: 'half' }
            : {}),
        } as RequestInit),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body as any).pipe(res);
      else res.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const base = 'http://127.0.0.1:' + address.port;
    process.env.AGENTIC_ORIGIN = base;
    let cookie = '',
      otherCookie = '',
      ownerId = '',
      otherOwner = '';
    async function call(
      path: string,
      body?: unknown,
      credential = cookie,
      extra: Record<string, string> = {},
    ) {
      const response = await fetch(base + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          cookie: credential,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...extra,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
      });
      const data = (await response.json()) as any;
      return { status: response.status, data, headers: response.headers };
    }
    try {
      await t.test(
        'public JSON and TXT describe the same synthetic service',
        async () => {
          const manifest = await fetch(base + '/agentic.json', {
            headers: { Origin: 'https://reader.example' },
          });
          assert.equal(manifest.status, 200);
          assert.equal(
            manifest.headers.get('access-control-allow-origin'),
            '*',
          );
          const profile = await manifest.json();
          const index = await fetch(base + '/agentic.txt');
          assert.match(index.headers.get('content-type')!, /text\/plain/);
          assert.equal(
            await index.text(),
            buildActionIndex(profile, undefined, true),
          );
          const nested = await fetch(
            base + '/api/platform/service/agentic.txt',
          );
          assert.equal(
            await nested.text(),
            buildActionIndex(
              profile,
              base + '/api/platform/service/agentic.json',
              true,
            ),
          );
          const head = await fetch(base + '/agentic.txt', { method: 'HEAD' });
          assert.equal(head.status, 200);
          assert.equal(await head.text(), '');
        },
      );
      const first = await call('/api/platform/session', {});
      assert.equal(first.status, 200);
      cookie = first.headers.get('set-cookie')!.split(';')[0];
      ownerId = first.data.id;
      await t.test(
        'website discovery requires a session and rejects private or credential-bearing input',
        async () => {
          assert.equal(
            (
              await call(
                '/api/platform/discover',
                { url: 'https://public.example' },
                '',
              )
            ).status,
            401,
          );
          for (const url of [
            'https://127.0.0.1/',
            'https://public.example/?secret=do-not-echo-this-value',
          ]) {
            const result = await call('/api/platform/discover', { url });
            assert.equal(result.status, 400);
            assert.ok(!result.data.error.includes('do-not-echo-this-value'));
          }
        },
      );
      await t.test(
        'invalid audit URLs return input guidance instead of an infrastructure error',
        async () => {
          for (const url of [
            'https://service.example/agentic.json?token=private',
            'http://service.example',
          ]) {
            const result = await call('/api/platform/audit', { url });
            assert.equal(result.status, 400);
            assert.ok(!result.data.error.includes('temporarily unavailable'));
            assert.ok(!result.data.error.includes('private'));
          }
        },
      );
      const second = await call('/api/platform/session', {}, '');
      assert.equal(second.status, 200);
      otherCookie = second.headers.get('set-cookie')!.split(';')[0];
      otherOwner = second.data.id;
      let report: any;
      await t.test(
        'error after commit recovers one resource and restart never resubmits',
        async () => {
          const lost = await call('/api/platform/run', {
            scenario: 'response-lost',
          });
          assert.equal(lost.status, 200);
          assert.equal(lost.data.receipt.outcome, 'succeeded');
          assert.equal(lost.data.committedWrites, 1);
          assert.equal(lost.data.http[0].status, 503);
          const stopped = await call('/api/platform/run', {
            scenario: 'restart-after-submit',
          });
          assert.equal(stopped.data.interrupted, true);
          assert.equal(stopped.data.receipt, null);
          const resumed = await call('/api/platform/run', {
            scenario: 'restart-after-submit',
            requestId: stopped.data.requestId,
            resume: true,
          });
          assert.equal(resumed.data.receipt.outcome, 'succeeded');
          assert.equal(resumed.data.resourcesCreated, 1);
          assert.ok(resumed.data.http.every((r: any) => r.method === 'GET'));
          report = resumed.data;
          for (const [scenario, outcome] of [
            ['status-unavailable', 'unknown'],
            ['wrong-evidence', 'unknown'],
            ['pending', 'pending'],
          ]) {
            const r = await call('/api/platform/run', { scenario });
            assert.equal(r.data.receipt.outcome, outcome);
            assert.equal(r.data.committedWrites, 1);
          }
        },
      );
      await t.test(
        'private reads, sharing and revocation enforce ownership',
        async () => {
          const id = report.receipt.resource_id;
          assert.equal(
            (
              await call(
                '/api/platform/service/tickets/' + id,
                undefined,
                otherCookie,
              )
            ).status,
            404,
          );
          assert.equal(
            (
              await call(
                '/api/platform/reports/' + report.id + '/share',
                { enabled: true },
                otherCookie,
              )
            ).status,
            404,
          );
          assert.equal(
            (await call('/api/platform/reports', undefined, otherCookie)).data
              .reports.length,
            0,
          );
          const share = await call(
            '/api/platform/reports/' + report.id + '/share',
            { enabled: true },
          );
          assert.equal(
            (
              await call(
                '/api/platform/shared?token=' + share.data.token,
                undefined,
                '',
              )
            ).status,
            200,
          );
          await call('/api/platform/reports/' + report.id + '/share', {
            enabled: false,
          });
          assert.equal(
            (
              await call(
                '/api/platform/shared?token=' + share.data.token,
                undefined,
                '',
              )
            ).status,
            404,
          );
          assert.equal(
            (
              await call('/api/platform/run', { scenario: 'normal' }, cookie, {
                origin: 'https://foreign.example',
              })
            ).status,
            403,
          );
        },
      );
      await t.test(
        'official MCP client discovers and calls the HTTP tools',
        async () => {
          const client = new Client({
            name: 'agentic-platform-test',
            version: '1.0',
          });
          try {
            await client.connect(
              new StreamableHTTPClientTransport(new URL(base + '/mcp')),
            );
            const tools = await client.listTools();
            assert.equal(tools.tools.length, 5);
            const result = await client.callTool({
              name: 'generate_agentic_profile',
              arguments: { origin: 'https://service.example' },
            });
            assert.equal(
              JSON.parse((result.content as { text: string }[])[0].text)
                .validation.valid,
              true,
            );
          } finally {
            await client.close();
          }
        },
      );
      await t.test(
        'official A2A client completes a task and retrieves the saved artifact',
        async () => {
          const token = await call('/api/platform/session/token', {});
          cookie = token.headers.get('set-cookie')!.split(';')[0];
          const client = await new ClientFactory().createFromUrl(base);
          const options = {
            serviceParameters: { Authorization: 'Bearer ' + token.data.token },
          };
          const result = await client.sendMessage(
            SendMessageRequest.fromJSON({
              message: {
                messageId: randomUUID(),
                role: 'ROLE_USER',
                parts: [{ data: { kind: 'recovery', scenario: 'normal' } }],
              },
            }),
            options,
          );
          assert.ok('id' in result);
          if (!('id' in result)) throw new Error('Expected a task.');
          const task = await client.getTask(
            GetTaskRequest.fromJSON({ id: result.id }),
            options,
          );
          assert.equal(task.artifacts.length, 1);
          const denied = await call(
            '/a2a',
            {
              jsonrpc: '2.0',
              id: 'isolation',
              method: 'GetTask',
              params: { id: task.id },
            },
            otherCookie,
            { 'A2A-Version': '1.0' },
          );
          assert.ok(denied.data.error);
        },
      );
      await t.test(
        'Agent Auth grants execution, rejects replay, and enforces revocation',
        async () => {
          const client = new AgentAuthClient({
            storage: new MemoryStorage(),
            urls: [base],
            allowDirectDiscovery: true,
          });
          const connected = await client.connectAgent({
            provider: base,
            mode: 'autonomous',
            capabilities: ['agentic.validate'],
            name: 'Protocol integration test',
          });
          const { sandboxProfile, sandboxOpenapi } =
            await import('../server/sandbox.ts');
          const execution = await client.executeCapability({
            agentId: connected.agentId,
            capability: 'agentic.validate',
            arguments: {
              profile: {
                ...sandboxProfile(),
                origin: 'https://service.example',
              },
              openapi: sandboxOpenapi(),
            },
          });
          assert.ok(execution);
          const signed = await client.signJwt({ agentId: connected.agentId });
          const headers = { authorization: 'Bearer ' + signed.token };
          const first = await fetch(base + '/api/auth/agent/session', {
            headers,
          });
          assert.equal(first.status, 200);
          const replay = await fetch(base + '/api/auth/agent/session', {
            headers,
          });
          assert.ok([401, 403].includes(replay.status));
          const unused = await client.signJwt({ agentId: connected.agentId });
          await client.disconnectAgent(connected.agentId);
          const revoked = await fetch(base + '/api/auth/agent/session', {
            headers: { authorization: 'Bearer ' + unused.token },
          });
          assert.ok([401, 403].includes(revoked.status));
        },
      );
      await t.test(
        'session tokens stop working immediately after revocation',
        async () => {
          await call('/api/platform/session/revoke', {});
          assert.equal((await call('/api/platform/reports')).status, 401);
        },
      );
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      for (const id of [ownerId, otherOwner].filter(Boolean)) {
        for (const table of [
          'platform_requests',
          'platform_ledger',
          'platform_reports',
          'platform_a2a_tasks',
        ])
          await database().query(
            'DELETE FROM ' + table + ' WHERE owner_id=$1',
            [id],
          );
        await database().query('DELETE FROM platform_sessions WHERE id=$1', [
          id,
        ]);
      }
      await closeDatabase();
    }
  },
);
