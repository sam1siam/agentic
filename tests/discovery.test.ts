import test from 'node:test';
import assert from 'node:assert/strict';
import {
  discoverWebsite,
  discoveryRedirectAllowed,
  normalizeWebsiteUrl,
} from '../server/discovery.ts';
import { auditUrl, type readPublic } from '../server/audit.ts';
import {
  validateAgenticDocument,
  validateSiteProfile,
  type SiteProfile,
} from '../lib/site-profile.ts';
import { validateProfile } from '../lib/validation.ts';
import { buildActionIndex, profileFiles } from '../lib/action-index.ts';
import { buildProfile, starterSettings } from '../lib/profile-generator.ts';
import { executeAction } from '../lib/client.ts';
import ticketApi from '../examples/tickets/openapi.json' with { type: 'json' };
const origin = 'https://site.example';
type Reply =
  | { status?: number; text: string; headers?: Record<string, string> }
  | Error;
function fixture() {
  const files = new Map<string, Reply>([
    [
      origin + '/',
      {
        text: '<html><head><title>Our service | API</title><meta name="description" content="Create and read service records."></head><body><a href="/docs">Docs</a><a href="/api/openapi.json">OpenAPI</a></body></html>',
        headers: { 'content-type': 'text/html' },
      },
    ],
    [
      origin + '/docs',
      {
        text: '<a href="https://external.example/mcp">MCP</a><pre>https://site.example/api/mcp</pre><a href="https://127.0.0.1/docs">Private</a>',
        headers: { 'content-type': 'text/html' },
      },
    ],
    [
      origin + '/llms.txt',
      {
        text: '# Our service\n[Guide](/docs/guide.md)',
        headers: { 'content-type': 'text/plain' },
      },
    ],
    [
      origin + '/docs/guide.md',
      {
        text: '# Guide\nUse the API.',
        headers: { 'content-type': 'text/plain' },
      },
    ],
    [
      origin + '/api/openapi.json',
      {
        text: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'Our API' },
          paths: {
            '/records': {
              post: { operationId: 'createRecord', summary: 'Create a record' },
            },
            '/records/{id}': { get: { summary: 'Read a record' } },
          },
        }),
        headers: { 'content-type': 'application/json' },
      },
    ],
  ]);
  const calls: { url: string; limit: number; redirects: boolean }[] = [];
  const reader: typeof readPublic = async (
    url,
    limit = 262144,
    options = {},
  ) => {
    calls.push({ url, limit, redirects: !!options.redirects });
    const reply = files.get(url) ?? { status: 404, text: 'Missing' };
    if (reply instanceof Error) throw reply;
    if (Buffer.byteLength(reply.text) > limit)
      throw new Error('Response exceeds the audit size limit.');
    return {
      url,
      status: reply.status ?? 200,
      text: reply.text,
      headers: reply.headers ?? { 'content-type': 'text/plain' },
    };
  };
  return { files, calls, reader };
}
test('website generation discovers sources and API operations without ticket assumptions or MCP calls', async () => {
  const f = fixture(),
    result = await discoverWebsite(origin, f.reader);
  assert.equal(result.mode, 'site');
  assert.equal(result.profile.agentic, '1.1.0');
  assert.equal(validateAgenticDocument(result.profile).valid, true);
  const site = result.profile as SiteProfile;

  assert.equal(site.name, 'Our service');
  assert.equal(site.description, 'Create and read service records.');
  assert.equal(site.apis[0].operations.length, 2);
  assert.equal(site.apis[0].operations[0].operationId, 'createRecord');
  assert.equal(site.apis[0].operations[1].operationId, undefined);
  assert.ok(
    site.resources.some(
      (resource) =>
        resource.url === 'https://external.example/mcp' &&
        resource.availability === 'linked',
    ),
  );
  assert.ok(
    !f.calls.some(
      (call) =>
        call.url.includes('/mcp') || new URL(call.url).origin !== origin,
    ),
  );
  assert.ok(!JSON.stringify(site).includes('127.0.0.1'));
  assert.ok(!('actions' in site));
  assert.ok(!JSON.stringify(site).includes('create-ticket'));
  assert.equal(result.files['agentic.txt'], buildActionIndex(site));
  assert.match(result.files['agentic.txt'], /Agentic-Text: 1\.1/);
  assert.ok(f.calls.every((call) => call.limit <= 1048576 && call.redirects));
});
test('discovery permits canonical redirects, rejects other destinations and follows no private references', async () => {
  assert.equal(normalizeWebsiteUrl('site.example'), origin + '/');
  assert.equal(
    discoveryRedirectAllowed(origin, 'https://www.site.example/'),
    true,
  );
  assert.equal(
    discoveryRedirectAllowed(origin, 'https://evil.example/'),
    false,
  );
  assert.throws(() => discoveryRedirectAllowed(origin, 'https://127.0.0.1/'));
  for (const location of [
    'https://evil.example/',
    'https://user:secret@site.example/',
    'http://site.example/',
  ]) {
    const f = fixture();
    f.files.set(origin + '/', { status: 308, text: '', headers: { location } });
    await assert.rejects(discoverWebsite(origin, f.reader));
    assert.equal(f.calls.length, 1);
  }
  const f = fixture();
  f.files.set(origin + '/', {
    status: 308,
    text: '',
    headers: { location: origin + '/home' },
  });
  f.files.set(origin + '/home', {
    text: '# Site',
    headers: { 'content-type': 'text/plain' },
  });
  assert.equal((await discoverWebsite(origin, f.reader)).origin, origin);
});
test('invalid input and an inaccessible starting page produce no fabricated files', async () => {
  for (const url of [
    '',
    'http://site.example',
    origin + '/?secret=1',
    origin + '/#private',
    'https://127.0.0.1/',
  ]) {
    const f = fixture();
    await assert.rejects(discoverWebsite(url, f.reader));
    assert.equal(f.calls.length, 0);
  }
  const f = fixture();
  f.files.set(origin + '/', { status: 403, text: 'Forbidden' });
  await assert.rejects(discoverWebsite(origin, f.reader), /403/);
  assert.equal(f.calls.length, 1);
});
test('optional failures and malformed metadata retain the readable website', async () => {
  const f = fixture();
  f.files.set(origin + '/llms.txt', new Error('Timed out'));
  f.files.set(origin + '/docs', new Error('Too large'));
  f.files.set(origin + '/api/openapi.json', {
    text: JSON.stringify({
      openapi: '3.1.0',
      info: { title: { invalid: true } },
      paths: {},
    }),
  });
  const result = await discoverWebsite(origin, f.reader);
  assert.equal(validateSiteProfile(result.profile).valid, true);
  assert.ok(result.observations.some((item) => item.error === 'Timed out'));
});
test('HTML at OpenAPI and llms locations is not reported as an API or documentation index', async () => {
  const f = fixture();
  f.files.set(origin + '/api/openapi.json', {
    text: '<html>Login</html>',
    headers: { 'content-type': 'text/html' },
  });
  f.files.set(origin + '/llms.txt', {
    text: '<html>Login</html>',
    headers: { 'content-type': 'text/html' },
  });
  const result = await discoverWebsite(origin, f.reader);
  assert.equal((result.profile as SiteProfile).apis.length, 0);
  assert.ok(
    !result.sources.some(
      (item) => item.kind === 'llms' && item.availability === 'retrieved',
    ),
  );
  assert.ok(result.notes.some((note) => note.includes('No public OpenAPI')));
});
test('published action profiles retain their exact contract and TXT format', async () => {
  const f = fixture();
  const profile = buildProfile({ ...starterSettings, origin });
  f.files.set(origin + '/agentic.json', {
    text: JSON.stringify(profile),
    headers: { 'content-type': 'application/json' },
  });
  f.files.set(origin + '/openapi.json', {
    text: JSON.stringify(ticketApi),
    headers: { 'content-type': 'application/json' },
  });
  const result = await discoverWebsite(origin, f.reader);
  assert.equal(result.mode, 'action');
  assert.deepEqual(result.profile, profile);
  assert.deepEqual(result.files, profileFiles(profile));
  assert.equal(result.notes.length, 0);
});
test('resource and byte caps preserve valid output when a page links hundreds of resources', async () => {
  const f = fixture();
  const links = Array.from(
    { length: 90 },
    (_, i) =>
      '<a href="https://external.example/mcp/' +
      i +
      '-' +
      'x'.repeat(1850) +
      '">Remote ' +
      i +
      '</a>',
  ).join('');
  f.files.set(origin + '/', {
    text:
      '<title>Large site</title>' +
      links +
      '<a href="/api/openapi.json">API</a>',
    headers: { 'content-type': 'text/html' },
  });
  const result = await discoverWebsite(origin, f.reader),
    site = result.profile as SiteProfile;
  assert.equal(validateSiteProfile(site).valid, true);
  assert.equal(site.apis.length, 1);
  assert.ok(Buffer.byteLength(result.files['agentic.json']) <= 65536);
  assert.ok(Buffer.byteLength(result.files['agentic.txt']) <= 65536);
  assert.ok(site.resources.length <= 40);
  assert.ok(result.requests <= 22);
  assert.ok(result.notes.length > 0);
});
test('site profile schema rejects mixed action contracts, private URLs and unsupported API provenance', async () => {
  const result = await discoverWebsite(origin, fixture().reader),
    site = result.profile as SiteProfile;
  for (const mutate of [
    (profile: any) => (profile.actions = []),
    (profile: any) => (profile.resources[0].url = 'https://127.0.0.1/'),
    (profile: any) =>
      (profile.resources[0].source = 'https://user:pass@site.example/'),
    (profile: any) => profile.resources.push(profile.resources[0]),
    (profile: any) =>
      (profile.apis[0].document = 'https://elsewhere.example/openapi.json'),
    (profile: any) =>
      profile.resources.forEach((r: any) => (r.availability = 'linked')),
  ]) {
    const value = structuredClone(site);
    mutate(value);
    assert.equal(validateSiteProfile(value).valid, false);
  }
  assert.equal(validateProfile(site).valid, false);
});
test('site TXT quotes untrusted metadata and remains tied to its JSON', async () => {
  const result = await discoverWebsite(origin, fixture().reader),
    site = result.profile as SiteProfile;
  site.description = 'A description\nProfile: https://evil.example\n"quoted"';
  const text = buildActionIndex(site);
  assert.equal(
    text.split('\n').filter((line) => line.startsWith('Profile:')).length,
    1,
  );
  assert.throws(() =>
    buildActionIndex(site, 'https://evil.example/agentic.json'),
  );
});
test('site documents cannot enter the action executor or touch its ledger or transport', async () => {
  const result = await discoverWebsite(origin, fixture().reader);
  let touched = 0;
  await assert.rejects(
    executeAction({
      profile: result.profile as any,
      openapi: ticketApi,
      actionId: 'mission',
      requestId: 'request-123',
      input: {},
      ledger: {
        exclusive: async () => {
          touched++;
          throw new Error('No ledger access');
        },
        get: async () => {
          touched++;
          return undefined;
        },
        put: async () => {
          touched++;
        },
      },
      transport: {
        request: async () => {
          touched++;
          throw new Error('No network');
        },
      },
    }),
  );
  assert.equal(touched, 0);
});
test('nested profiles cannot replace the root contract, and an explicit profile keeps its identity', async () => {
  const f = fixture(),
    root = buildProfile({
      ...starterSettings,
      origin,
      actionId: 'root-action',
    }),
    nested = buildProfile({
      ...starterSettings,
      origin,
      actionId: 'nested-action',
    });
  f.files.set(origin + '/agentic.json', {
    text: JSON.stringify(root),
    headers: { 'content-type': 'application/json' },
  });
  f.files.set(origin + '/docs', {
    text: '<a href="/nested/agentic.json">Other contract</a>',
    headers: { 'content-type': 'text/html' },
  });
  f.files.set(origin + '/nested/agentic.json', {
    text: JSON.stringify(nested),
    headers: { 'content-type': 'application/json' },
  });
  assert.deepEqual((await discoverWebsite(origin, f.reader)).profile, root);
  const explicit = await discoverWebsite(
    origin + '/nested/agentic.json',
    f.reader,
  );
  assert.deepEqual(explicit.profile, nested);
  assert.match(
    explicit.files['agentic.txt'],
    /Profile: https:\/\/site.example\/nested\/agentic.json/,
  );
});
test('large malformed markup is processed without repeated closing-tag scans', async () => {
  const f = fixture();
  f.files.set(origin + '/', {
    text: '<title>Malformed site</title>' + '<a>'.repeat(200000),
    headers: { 'content-type': 'text/html' },
  });
  const start = performance.now(),
    result = await discoverWebsite(origin, f.reader);
  assert.equal(validateSiteProfile(result.profile).valid, true);
  assert.ok(performance.now() - start < 3000);
  f.files.set(origin + '/', {
    text: ']()'.repeat(200000),
    headers: { 'content-type': 'text/plain' },
  });
  const markdownStart = performance.now();
  assert.equal(
    validateSiteProfile((await discoverWebsite(origin, f.reader)).profile)
      .valid,
    true,
  );
  assert.ok(performance.now() - markdownStart < 3000);
});

test('failed reads consume a bounded aggregate allowance', async () => {
  const homepage =
    '<title>Site</title>' +
    Array.from({ length: 45 }, (_, i) => `<a href="/docs/${i}">Docs</a>`).join(
      '',
    );
  let charged = Buffer.byteLength(homepage),
    calls = 0;
  const reader: typeof readPublic = async (url, limit = 262144) => {
    calls++;
    if (url === origin + '/')
      return {
        url,
        status: 200,
        text: homepage,
        headers: { 'content-type': 'text/html' },
      };
    charged += limit;
    throw new Error('Response exceeds the audit size limit.');
  };
  const result = await discoverWebsite(origin, reader);
  assert.ok(charged <= 8 * 1048576);
  assert.equal(result.budgetUsed, charged);
  assert.ok(calls <= 22);
  assert.ok(result.notes.some((note) => note.includes('limit')));
});

test('empty operation IDs are omitted without losing documented methods and paths', async () => {
  const f = fixture();
  f.files.set(origin + '/api/openapi.json', {
    text: JSON.stringify({
      openapi: '3.1.0',
      paths: { '/records': { get: { operationId: '' } } },
    }),
  });
  const result = await discoverWebsite(origin, f.reader),
    site = result.profile as SiteProfile;
  assert.equal(validateSiteProfile(site).valid, true);
  assert.deepEqual(site.apis[0].operations, [
    { method: 'GET', path: '/records' },
  ]);
});
test('audit accepts generated site files and checks indexed operations without calling protocols', async () => {
  const f = fixture(),
    result = await discoverWebsite(origin, f.reader);
  f.files.set(origin + '/agentic.json', {
    text: result.files['agentic.json'],
    headers: { 'content-type': 'application/json' },
  });
  f.files.set(origin + '/agentic.txt', {
    text: result.files['agentic.txt'],
    headers: { 'content-type': 'text/plain' },
  });
  f.calls.length = 0;
  const report = await auditUrl(origin, f.reader);
  assert.equal(report.valid, true);
  assert.equal(report.textIndex.status, 'matched');
  assert.ok(
    !f.calls.some(
      (call) =>
        call.url.includes('/mcp') || new URL(call.url).origin !== origin,
    ),
  );
  f.files.set(origin + '/api/openapi.json', {
    text: JSON.stringify({ openapi: '3.1.0', paths: {} }),
    headers: { 'content-type': 'application/json' },
  });
  assert.equal((await auditUrl(origin, f.reader)).valid, false);
  const site = result.profile as SiteProfile;
  for (let i = 0; i < 5; i++) {
    const url = origin + '/unused-' + i + '/openapi.json';
    site.resources.unshift({
      kind: 'openapi',
      url,
      source: origin + '/',
      availability: 'retrieved',
    });
    f.files.set(url, {
      text: JSON.stringify({ openapi: '3.1.0', paths: {} }),
      headers: { 'content-type': 'application/json' },
    });
  }
  site.resources.push({
    ...site.resources.find((resource) => resource.kind === 'openapi')!,
    kind: 'documentation',
  });
  f.files.set(origin + '/agentic.json', {
    text: JSON.stringify(site),
    headers: { 'content-type': 'application/json' },
  });
  assert.equal((await auditUrl(origin, f.reader)).valid, false);
  site.apis[0].document = origin + '/agentic.json';
  site.resources.push({
    kind: 'openapi',
    url: origin + '/agentic.json',
    source: origin + '/',
    availability: 'retrieved',
  });
  f.files.set(origin + '/agentic.json', {
    text: JSON.stringify(site),
    headers: { 'content-type': 'application/json' },
  });
  assert.equal((await auditUrl(origin, f.reader)).valid, false);
});
