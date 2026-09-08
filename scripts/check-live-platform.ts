import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { ClientFactory } from '@a2a-js/sdk/client';
import { SendMessageRequest, GetTaskRequest } from '@a2a-js/sdk';

const base = 'https://ruagentic.org';
const checks: { name: string; passed: boolean }[] = [];
let cookie = '';
async function call(path: string, body?: unknown, credential = cookie) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      cookie: credential,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'error',
    signal: AbortSignal.timeout(55000),
  });
  const text = await response.text();
  assert.equal(response.status, 200, path + ': ' + text.slice(0, 300));
  return { data: JSON.parse(text), headers: response.headers };
}
function passed(name: string) {
  checks.push({ name, passed: true });
  console.log('PASS ' + name);
}
try {
  await call('/api/platform/health');
  passed('Production database health');
  const created = await call('/api/platform/session', {});
  cookie = created.headers.get('set-cookie')!.split(';')[0];
  const lost = (await call('/api/platform/run', { scenario: 'response-lost' }))
    .data;
  assert.equal(lost.receipt.outcome, 'succeeded');
  assert.equal(lost.committedWrites, 1);
  assert.equal(lost.http[0].status, 503);
  passed('Recovery after HTTP 503 following one commit');
  const stopped = (
    await call('/api/platform/run', { scenario: 'restart-after-submit' })
  ).data;
  assert.equal(stopped.interrupted, true);
  const resumed = (
    await call('/api/platform/run', {
      scenario: 'restart-after-submit',
      requestId: stopped.requestId,
      resume: true,
    })
  ).data;
  assert.equal(resumed.receipt.outcome, 'succeeded');
  assert.equal(resumed.committedWrites, 1);
  assert.ok(resumed.http.every((r: any) => r.method === 'GET'));
  passed('Fresh invocation resumes PostgreSQL ledger without a new write');
  const audit = (
    await call('/api/platform/audit', {
      url: base + '/api/platform/service/agentic.json',
    })
  ).data;
  assert.equal(audit.valid, true);
  assert.equal(audit.behavioralTesting, false);
  passed('Public HTTPS auditor and OpenAPI binding checks');
  const auth = (await call('/api/platform/auth-check', {})).data;
  assert.equal(auth.revocationEnforced, true);
  assert.equal(auth.execution.data.valid, true);
  passed('Live Agent Auth registration, grant, execution and revocation');
  const mcp = new Client({ name: 'agentic-live-check', version: '1.0' });
  try {
    await mcp.connect(
      new StreamableHTTPClientTransport(new URL(base + '/mcp')),
    );
    const tools = await mcp.listTools();
    assert.equal(tools.tools.length, 5);
    const spec = await mcp.callTool({
      name: 'get_agentic_spec',
      arguments: {},
    });
    assert.ok(
      (spec.content as { text: string }[])[0].text.includes('Version: 1.0.0'),
    );
    passed('Official MCP client and bundled specification over HTTPS');
  } finally {
    await mcp.close();
  }
  const credential = await call('/api/platform/session/token', {});
  cookie = credential.headers.get('set-cookie')!.split(';')[0];
  const a2a = await new ClientFactory().createFromUrl(base);
  const options = {
    serviceParameters: { Authorization: 'Bearer ' + credential.data.token },
  };
  const result = await a2a.sendMessage(
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
  if (!('id' in result)) throw new Error('Expected A2A task.');
  const task = await a2a.getTask(
    GetTaskRequest.fromJSON({ id: result.id }),
    options,
  );
  assert.equal(task.artifacts.length, 1);
  passed('Official A2A client, persistent task and evidence artifact');
  const reports = (await call('/api/platform/reports')).data.reports;
  assert.ok(reports.length >= 5);
  passed('Private report history');
  await mkdir('work', { recursive: true });
  await writeFile(
    'work/live-platform-check.json',
    JSON.stringify(
      {
        reportVersion: '1',
        origin: base,
        observedAt: new Date().toISOString(),
        implementation: 'Project-authored hosted platform',
        independentImplementation: false,
        checks,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  if (cookie) await call('/api/platform/session/revoke', {}).catch(() => {});
}
