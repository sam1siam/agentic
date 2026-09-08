import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { buildProfile, starterSettings } from '../lib/profile-generator.ts';
import { buildActionIndex } from '../lib/action-index.ts';
import ticketApi from '../examples/tickets/openapi.json' with { type: 'json' };
import { executeAction } from '../lib/client.ts';
import { canonical } from '../lib/validation.ts';
import type { Trace } from '../lib/types.ts';
import { database, transaction } from './db.ts';
import { PostgresLedger } from './ledger.ts';
import { HttpError, publicOrigin, owner, jsonBody } from './security.ts';

export const scenarios = [
  'normal',
  'response-lost',
  'restart-after-submit',
  'status-unavailable',
  'wrong-evidence',
  'pending',
] as const;
export type Scenario = (typeof scenarios)[number];
export function sandboxProfile() {
  return buildProfile({
    ...starterSettings,
    origin: publicOrigin(),
    openapi: '/api/platform/service/openapi.json',
    description:
      'Create one synthetic ticket in your isolated Agentic sandbox.',
  });
}
export function sandboxOpenapi() {
  return {
    ...ticketApi,
    info: { ...ticketApi.info, title: 'Agentic hosted synthetic sandbox' },
    paths: Object.fromEntries(
      Object.entries(ticketApi.paths).map(([path, item]) => [
        '/api/platform/service' + path,
        item,
      ]),
    ),
  };
}
function mac(value: string) {
  if (!process.env.BETTER_AUTH_SECRET)
    throw new Error('Platform signing secret is not configured.');
  return createHmac('sha256', process.env.BETTER_AUTH_SECRET)
    .update(value)
    .digest('base64url');
}
function internalToken(ownerId: string) {
  const body = Buffer.from(
    JSON.stringify({ ownerId, expires: Date.now() + 120000 }),
  ).toString('base64url');
  return body + '.' + mac(body);
}
async function serviceOwner(request: Request) {
  const token = request.headers.get('x-agentic-internal');
  if (!token) return owner(request);
  const [body, signature, ...extra] = token.split('.');
  const expected = mac(body ?? '');
  if (
    extra.length ||
    !signature ||
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    throw new HttpError(401, 'Invalid internal authorization.');
  const parsed = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (typeof parsed.ownerId !== 'string' || !(parsed.expires > Date.now()))
    throw new HttpError(401, 'Expired internal authorization.');
  return parsed.ownerId as string;
}
export function scenarioValue(value: unknown): Scenario {
  if (!scenarios.includes(value as Scenario))
    throw new HttpError(400, 'Choose a supported sandbox scenario.');
  return value as Scenario;
}
const resource = (row: any) => ({
  id: row.resource_id,
  request_id: row.request_id,
  status: 'open',
  subject: row.input.subject,
});
export async function sandboxService(
  request: Request,
  path: string,
): Promise<Response> {
  if (request.method === 'GET' && path === '/openapi.json')
    return Response.json(sandboxOpenapi());
  if (request.method === 'GET' && path === '/agentic.json')
    return Response.json(sandboxProfile());
  if (request.method === 'GET' && path === '/agentic.txt')
    return new Response(
      buildActionIndex(
        sandboxProfile(),
        publicOrigin() + '/api/platform/service/agentic.json',
        process.env.AGENTIC_ALLOW_LOCAL === '1',
      ),
      {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    );
  const ownerId = await serviceOwner(request);
  if (request.method === 'POST' && path === '/tickets') {
    const key = request.headers.get('idempotency-key');
    if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key))
      throw new HttpError(
        400,
        'Idempotency-Key must contain 8–128 letters, digits, underscores or hyphens.',
      );
    const input = await jsonBody(request, 2048);
    if (
      !input ||
      typeof input.subject !== 'string' ||
      input.subject.length < 1 ||
      input.subject.length > 200 ||
      Object.keys(input).some((k) => k !== 'subject')
    )
      throw new HttpError(400, 'Send a synthetic subject of 1–200 characters.');
    const scenario = scenarioValue(
      request.headers.get('x-agentic-scenario') ?? 'normal',
    );
    const result = await transaction(async (db) => {
      await db.query(
        `INSERT INTO platform_requests(owner_id,request_id,input,scenario,resource_id) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(owner_id,request_id) DO NOTHING`,
        [ownerId, key, JSON.stringify(input), scenario, randomUUID()],
      );
      const row = (
        await db.query(
          'SELECT * FROM platform_requests WHERE owner_id=$1 AND request_id=$2 FOR UPDATE',
          [ownerId, key],
        )
      ).rows[0];
      if (Date.now() - new Date(row.created_at).getTime() >= 86400000)
        throw new HttpError(
          409,
          'Tracking window expired. This request ID will not create a second resource.',
        );
      if (
        canonical(row.input) !== canonical(input) ||
        row.scenario !== scenario
      )
        throw new HttpError(
          409,
          'Request ID already belongs to another input or scenario.',
        );
      return row;
    });
    if (scenario === 'response-lost')
      return Response.json(
        { error: 'Synthetic upstream failure after the database commit.' },
        { status: 503 },
      );
    return Response.json(resource(result), { status: 201 });
  }
  const statusId = path.match(/^\/requests\/([A-Za-z0-9_-]{8,128})$/)?.[1];
  if (request.method === 'GET' && statusId) {
    const row = (
      await database().query(
        `UPDATE platform_requests SET status_count=status_count+1 WHERE owner_id=$1 AND request_id=$2 RETURNING *`,
        [ownerId, statusId],
      )
    ).rows[0];
    if (!row || Date.now() - new Date(row.created_at).getTime() >= 86400000)
      return Response.json({
        request_id: statusId,
        status: 'unknown',
        resource_id: null,
      });
    if (row.scenario === 'status-unavailable')
      return Response.json(
        { error: 'Synthetic status outage.' },
        { status: 503 },
      );
    return Response.json({
      request_id: statusId,
      status: row.scenario === 'pending' ? 'pending' : 'succeeded',
      resource_id: row.scenario === 'pending' ? null : row.resource_id,
    });
  }
  const resourceId = path.match(/^\/tickets\/([0-9a-f-]{36})$/)?.[1];
  if (request.method === 'GET' && resourceId) {
    const row = (
      await database().query(
        'SELECT * FROM platform_requests WHERE owner_id=$1 AND resource_id=$2',
        [ownerId, resourceId],
      )
    ).rows[0];
    if (!row || Date.now() - new Date(row.created_at).getTime() >= 86400000)
      throw new HttpError(404, 'Resource not found.');
    return Response.json({
      ...resource(row),
      ...(row.scenario === 'wrong-evidence'
        ? { subject: 'A different synthetic input' }
        : {}),
    });
  }
  throw new HttpError(404, 'Sandbox operation not found.');
}

export async function runSandbox(
  ownerId: string,
  options: { requestId?: string; scenario?: unknown; resume?: boolean },
) {
  const scenario = scenarioValue(options.scenario ?? 'response-lost');
  const requestId = options.requestId ?? randomUUID();
  const prior = (
    await database().query(
      'SELECT scenario FROM platform_requests WHERE owner_id=$1 AND request_id=$2',
      [ownerId, requestId],
    )
  ).rows[0];
  if (prior && prior.scenario !== scenario)
    throw new HttpError(
      409,
      'Resume with the original scenario and request ID.',
    );
  const trace: Trace[] = [],
    http: { method: string; path: string; status: number }[] = [];
  const token = internalToken(ownerId);
  // A restart rebuilds every client object. Only the PostgreSQL ledger survives.
  const ledger = new PostgresLedger(ownerId);
  let interrupted = false;
  let receipt;
  try {
    receipt = await executeAction({
      profile: sandboxProfile(),
      openapi: sandboxOpenapi(),
      actionId: 'create-ticket',
      requestId,
      input: { subject: 'Agentic synthetic recovery test' },
      ledger,
      allowLocal: process.env.AGENTIC_ALLOW_LOCAL === '1',
      onTrace: (event) => trace.push(event),
      afterSubmit:
        scenario === 'restart-after-submit' && !options.resume
          ? () => {
              interrupted = true;
              throw new Error('Synthetic process interruption.');
            }
          : undefined,
      transport: {
        request: async (url, init) => {
          if (new URL(url).origin !== publicOrigin())
            throw new Error('Sandbox requests must stay on this service.');
          const response = await fetch(url, {
            method: init.method,
            body: init.body,
            redirect: 'error',
            signal: AbortSignal.timeout(init.timeoutMs),
            headers: {
              ...init.headers,
              'x-agentic-internal': token,
              'x-agentic-scenario': scenario,
            },
          });
          http.push({
            method: init.method,
            path: new URL(url).pathname,
            status: response.status,
          });
          const body = await response.json();
          if (init.method === 'POST' && response.status === 503)
            throw new Error('Submission returned HTTP 503 after commit.');
          return { status: response.status, body };
        },
      },
    });
  } catch (error) {
    if (!interrupted) throw error;
    trace.push({
      kind: 'interrupted',
      message:
        'Client execution stopped after submission. Resume from the persisted ledger in a new request.',
    });
  }
  const row = (
    await database().query(
      'SELECT resource_id,submit_count,status_count FROM platform_requests WHERE owner_id=$1 AND request_id=$2',
      [ownerId, requestId],
    )
  ).rows[0];
  const report = {
    reportVersion: '1',
    kind: 'hosted-recovery',
    observedAt: new Date().toISOString(),
    requestId,
    scenario,
    interrupted,
    receipt: receipt ?? null,
    trace,
    http,
    resourcesCreated: row ? 1 : 0,
    committedWrites: row?.submit_count ?? 0,
    statusReads: row?.status_count ?? 0,
    evidenceSource:
      'Real HTTP requests and PostgreSQL records in the project-authored synthetic sandbox.',
    fault:
      scenario === 'response-lost'
        ? 'HTTP 503 returned after commit; the client treats the submission response as unavailable.'
        : scenario,
    independentImplementation: false,
  };
  return saveReport(ownerId, 'recovery', report);
}
export async function saveReport(ownerId: string, kind: string, data: unknown) {
  const id = randomUUID();
  await database().query(
    'INSERT INTO platform_reports(id,owner_id,kind,data) VALUES($1,$2,$3,$4)',
    [id, ownerId, kind, JSON.stringify(data)],
  );
  return { id, ...(data as Record<string, unknown>) };
}
