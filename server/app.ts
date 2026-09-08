import { AgentCard } from '@a2a-js/sdk';
import { mcp } from './mcp.ts';
import { auth, authHandler } from './auth.ts';
import { agentCard, handleA2a } from './a2a.ts';
import { auditUrl, normalizeAuditUrl } from './audit.ts';
import {
  sandboxService,
  sandboxProfile,
  runSandbox,
  saveReport,
} from './sandbox.ts';
import { buildActionIndex } from '../lib/action-index.ts';
import { runAuthCheck } from './auth-check.ts';
import { database } from './db.ts';
import {
  checkOrigin,
  clientAddress,
  createSession,
  digest,
  HttpError,
  jsonBody,
  owner,
  rateLimit,
  secret,
  sessionCookie,
} from './security.ts';

async function route(request: Request) {
  const url = new URL(request.url),
    path = url.pathname.replace(/\/$/, '');
  if (
    ['GET', 'HEAD'].includes(request.method) &&
    (path === '/agentic.json' || path === '/agentic.txt')
  ) {
    const profile = sandboxProfile();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type':
        path === '/agentic.json'
          ? 'application/json'
          : 'text/plain; charset=utf-8',
    };
    const body =
      path === '/agentic.json'
        ? JSON.stringify(profile, null, 2) + '\n'
        : buildActionIndex(
            profile,
            undefined,
            process.env.AGENTIC_ALLOW_LOCAL === '1',
          );
    return new Response(request.method === 'HEAD' ? null : body, { headers });
  }
  checkOrigin(request);
  if (path === '/api/platform/health' && request.method === 'GET') {
    await database().query('SELECT 1');
    return Response.json({
      status: 'ok',
      service: 'Agentic platform',
      version: '1.1.0',
    });
  }
  await rateLimit('ip:' + clientAddress(request), 120);
  if (path === '/mcp' || path === '/api/mcp') {
    const body =
      request.method === 'POST' ? await jsonBody(request) : undefined;
    return mcp.fetch(request, { parsedBody: body });
  }
  if (path === '/.well-known/agent-card.json')
    return Response.json(AgentCard.toJSON(agentCard()));
  if (path === '/.well-known/agent-configuration')
    return Response.json(
      await auth().api.getAgentConfiguration({ headers: request.headers }),
    );
  if (path.startsWith('/api/auth/')) return authHandler(request);
  if (path.startsWith('/api/platform/service/'))
    return sandboxService(request, path.slice('/api/platform/service'.length));
  if (path === '/api/platform/session' && request.method === 'POST') {
    await rateLimit('session:' + clientAddress(request), 10, 3600);
    const session = await createSession();
    return Response.json(
      { id: session.id, expires: session.expires },
      { headers: { 'Set-Cookie': sessionCookie(session.token) } },
    );
  }
  if (path === '/api/platform/shared' && request.method === 'GET') {
    const token = url.searchParams.get('token') ?? '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new HttpError(404, 'Shared report not found.');
    const row = (
      await database().query(
        'SELECT id,kind,data,created_at FROM platform_reports WHERE share_hash=$1 AND expires_at>now()',
        [digest(token)],
      )
    ).rows[0];
    if (!row) throw new HttpError(404, 'Shared report not found or expired.');
    return Response.json(row);
  }
  if (path === '/api/platform/cleanup' && request.method === 'GET') {
    if (
      !process.env.CRON_SECRET ||
      request.headers.get('authorization') !==
        'Bearer ' + process.env.CRON_SECRET
    )
      throw new HttpError(401, 'Cron authorization required.');
    await database().query(
      "DELETE FROM platform_reports WHERE expires_at<now(); DELETE FROM platform_rate_limits WHERE expires_at<now(); DELETE FROM platform_auth_cache WHERE expires_at<now(); DELETE FROM platform_a2a_tasks WHERE updated_at<now()-interval '30 days'",
    );
    return Response.json({ cleaned: true });
  }
  const ownerId = await owner(request);
  if (path === '/api/platform/session' && request.method === 'GET')
    return Response.json({ id: ownerId });
  if (path === '/api/platform/session/revoke' && request.method === 'POST') {
    await database().query(
      'UPDATE platform_sessions SET revoked_at=now() WHERE id=$1',
      [ownerId],
    );
    return Response.json(
      { revoked: true },
      { headers: { 'Set-Cookie': sessionCookie('') + '; Max-Age=0' } },
    );
  }
  if (path === '/api/platform/session/token' && request.method === 'POST') {
    // The explicit export action rotates the bearer credential and browser cookie together.
    const token = secret();
    await database().query(
      'UPDATE platform_sessions SET token_hash=$1 WHERE id=$2',
      [digest(token), ownerId],
    );
    return Response.json(
      { token },
      { headers: { 'Set-Cookie': sessionCookie(token) } },
    );
  }
  if (path === '/a2a' && request.method === 'POST') {
    await rateLimit('a2a:' + ownerId, 12);
    return Response.json(
      await handleA2a(
        await jsonBody(request),
        ownerId,
        request.headers.get('a2a-version') ?? '0.3',
      ),
    );
  }
  if (path === '/api/platform/run' && request.method === 'POST') {
    await rateLimit('run:' + ownerId, 12);
    return Response.json(
      await runSandbox(ownerId, await jsonBody(request, 2048)),
    );
  }
  if (path === '/api/platform/audit' && request.method === 'POST') {
    await rateLimit('audit:' + ownerId, 6);
    const body = await jsonBody(request, 4096);
    if (typeof body.url !== 'string')
      throw new HttpError(400, 'Provide the profile URL.');
    let profileUrl: string;
    try {
      profileUrl = normalizeAuditUrl(body.url);
    } catch (error) {
      // URL validation is local and emits safe input guidance. Do not classify
      // the word "query" in that guidance as an infrastructure failure.
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Use a public HTTPS profile URL.',
        },
        { status: 400 },
      );
    }
    return Response.json(
      await saveReport(ownerId, 'audit', await auditUrl(profileUrl)),
    );
  }
  if (path === '/api/platform/auth-check' && request.method === 'POST') {
    await rateLimit('auth-check:' + ownerId, 3);
    return Response.json(await runAuthCheck(ownerId));
  }
  if (path === '/api/platform/reports' && request.method === 'GET') {
    const rows = (
      await database().query(
        'SELECT id,kind,data,created_at,share_hash IS NOT NULL AS shared FROM platform_reports WHERE owner_id=$1 AND expires_at>now() ORDER BY created_at DESC LIMIT 100',
        [ownerId],
      )
    ).rows;
    return Response.json({ reports: rows, retentionDays: 30 });
  }
  const reportId = path.match(
    /^\/api\/platform\/reports\/([0-9a-f-]{36})\/share$/,
  )?.[1];
  if (reportId && request.method === 'POST') {
    const body = await jsonBody(request, 1024),
      token = body.enabled === false ? null : secret();
    const result = await database().query(
      'UPDATE platform_reports SET share_hash=$1 WHERE owner_id=$2 AND id=$3 AND expires_at>now() RETURNING id',
      [token ? digest(token) : null, ownerId, reportId],
    );
    if (!result.rowCount) throw new HttpError(404, 'Report not found.');
    return Response.json({ shared: !!token, token });
  }
  throw new HttpError(404, 'Platform endpoint not found.');
}
export async function handle(request: Request) {
  const started = Date.now();
  let response: Response;
  try {
    response = await route(request);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 400;
    const message = error instanceof Error ? error.message : 'Request failed.';
    // Database and infrastructure details are never returned to callers.
    const safe =
      /database|postgres|relation |password|ECONN|query|connect|certificate|SSL/i.test(
        message,
      )
        ? 'The platform service is temporarily unavailable.'
        : message;
    response = Response.json(
      { error: safe },
      { status: safe !== message ? 503 : status },
    );
  }
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  console.info(
    JSON.stringify({
      service: 'agentic-platform',
      method: request.method,
      path: new URL(request.url).pathname,
      status: response.status,
      ms: Date.now() - started,
    }),
  );
  return response;
}
