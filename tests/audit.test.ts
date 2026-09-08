import test from 'node:test';
import assert from 'node:assert/strict';
import {
  auditUrl,
  normalizeAuditUrl,
  type readPublic,
} from '../server/audit.ts';
import { buildProfile, starterSettings } from '../lib/profile-generator.ts';
import { buildActionIndex } from '../lib/action-index.ts';
import { validateProfile } from '../lib/validation.ts';
import ticketApi from '../examples/tickets/openapi.json' with { type: 'json' };

const origin = 'https://support.example';
type Reply = { text: string; status?: number; type?: string } | Error;
function fixture(
  profile = buildProfile(starterSettings),
  profileUrl = origin + '/agentic.json',
) {
  const files = new Map<string, Reply>([
    [
      profileUrl,
      {
        text: JSON.stringify(profile),
        type: 'application/json; charset=utf-8',
      },
    ],
    [
      origin + '/openapi.json',
      { text: JSON.stringify(ticketApi), type: 'application/json' },
    ],
    [
      new URL('agentic.txt', profileUrl).href,
      {
        text: buildActionIndex(profile, profileUrl),
        type: 'text/plain; charset=utf-8',
      },
    ],
    [origin + '/llms.txt', { text: '# Documentation', type: 'text/plain' }],
  ]);
  const calls: { url: string; limit: number }[] = [];
  const reader: typeof readPublic = async (url, limit = 262144) => {
    calls.push({ url, limit });
    const reply = files.get(url);
    assert.ok(reply, 'Unexpected fetch: ' + url);
    if (reply instanceof Error) throw reply;
    return {
      url,
      status: reply.status ?? 200,
      headers: { 'content-type': reply.type },
      text: reply.text,
    };
  };
  return { profile, files, calls, reader, profileUrl };
}

test('website and directory URLs normalize without weakening URL restrictions', async () => {
  for (const input of [
    'support.example',
    ' support.example:443 ',
    origin,
    origin + '/',
  ])
    assert.equal(normalizeAuditUrl(input), origin + '/agentic.json');
  assert.equal(
    normalizeAuditUrl(origin + '/contracts/'),
    origin + '/contracts/agentic.json',
  );
  assert.equal(
    normalizeAuditUrl(origin + '/contracts/profile.json'),
    origin + '/contracts/profile.json',
  );
  for (const input of [
    '',
    'http://support.example',
    'https://user:secret@support.example',
    origin + '#part',
    origin + '/agentic.json?token=secret',
    origin + ':8443',
  ]) {
    let reads = 0;
    await assert.rejects(
      auditUrl(input, async () => {
        reads++;
        throw new Error('Should not fetch');
      }),
    );
    assert.equal(reads, 0);
  }
});

test('generator normalizes HTTPS origins but preserves invalid input for rejection', () => {
  const profile = buildProfile({
    ...starterSettings,
    origin: ' HTTPS://SUPPORT.EXAMPLE:443/ ',
  });
  assert.equal(profile.origin, origin);
  assert.equal(validateProfile(profile, ticketApi).valid, true);
  for (const value of [
    'http://support.example',
    origin + '/path',
    origin + '?key=secret',
    origin + '#part',
    'https://user:secret@support.example',
  ])
    assert.equal(
      validateProfile(buildProfile({ ...starterSettings, origin: value }))
        .valid,
      false,
      value,
    );
});

test('audit validates the pair and fetches a shared API only once', async () => {
  const profile = buildProfile(starterSettings);
  profile.actions.push({
    ...structuredClone(profile.actions[0]),
    id: 'another-ticket',
  });
  const f = fixture(profile);
  const report = await auditUrl(origin, f.reader);
  assert.equal(report.reportVersion, '2');
  assert.equal(report.valid, true);
  assert.equal(report.textIndex.status, 'matched');
  assert.ok(report.checks.every((check) => check.status === 'pass'));
  assert.equal(report.behavioralTesting, false);
  assert.equal(
    f.calls.filter((call) => call.url.endsWith('/openapi.json')).length,
    1,
  );
  assert.deepEqual(
    f.calls.map((call) => [call.url, call.limit]).sort(),
    [
      [origin + '/agentic.json', 65536],
      [origin + '/agentic.txt', 65536],
      [origin + '/llms.txt', 65536],
      [origin + '/openapi.json', 262144],
    ].sort(),
  );
  assert.ok(!f.calls.some((call) => call.url === profile.$schema));
});

test('custom JSON locations use a sibling TXT while OpenAPI stays relative to the origin', async () => {
  const f = fixture(undefined, origin + '/contracts/profile.json');
  const report = await auditUrl(f.profileUrl, f.reader);
  assert.equal(report.valid, true);
  assert.equal(report.textIndex.url, origin + '/contracts/agentic.txt');
  assert.equal(report.textIndex.status, 'matched');
});

test('unreachable, non-JSON and invalid profiles return partial reports without dependent reads', async () => {
  for (const reply of [
    { status: 404, text: 'Missing' },
    { text: '<html>Not JSON</html>' },
    { text: '{}' },
    new Error('Response exceeds the audit size limit.'),
  ]) {
    const f = fixture();
    f.files.set(f.profileUrl, reply);
    const report = await auditUrl(f.profileUrl, f.reader);
    assert.equal(report.valid, false);
    assert.ok(report.checks.some((check) => check.status === 'fail'));
    assert.equal(report.observations.length, 1);
    assert.equal(f.calls.length, 1);
    assert.equal(report.textIndex.status, 'skipped');
  }
});

test('origin mismatch and excessive API documents stop before dependent reads', async () => {
  for (const variant of ['origin', 'documents']) {
    const f = fixture();
    const profile = structuredClone(f.profile);
    if (variant === 'origin') profile.origin = 'https://elsewhere.example';
    else
      profile.actions = Array.from({ length: 6 }, (_, i) => ({
        ...structuredClone(profile.actions[0]),
        id: 'action-' + i,
        openapi: '/api-' + i + '.json',
      }));
    f.files.set(f.profileUrl, { text: JSON.stringify(profile) });
    const report = await auditUrl(f.profileUrl, f.reader);
    assert.equal(report.valid, false);
    assert.equal(f.calls.length, 1);
    assert.ok(report.errors.length > 0);
  }
});

test('OpenAPI failures retain the other API and TXT results', async () => {
  for (const reply of [
    { status: 404, text: 'Missing' },
    { text: 'invalid JSON' },
    { text: JSON.stringify({ openapi: '3.1.0', paths: {} }) },
    new Error('Redirects are not followed.'),
  ]) {
    const profile = buildProfile(starterSettings);
    profile.actions.push({
      ...structuredClone(profile.actions[0]),
      id: 'other-ticket',
      openapi: '/other.json',
    });
    const f = fixture(profile);
    f.files.set(origin + '/other.json', reply);
    const report = await auditUrl(origin, f.reader);
    assert.equal(report.valid, false);
    assert.equal(report.bindings.length, 2);
    assert.equal(
      report.bindings.find((binding) => binding.path === '/openapi.json')
        ?.validation?.valid,
      true,
    );
    assert.equal(report.textIndex.status, 'matched');
    assert.ok(
      report.checks.some(
        (check) => check.id === 'api:/other.json' && check.status === 'fail',
      ),
    );
  }
});

test('optional TXT and llms failures stay distinct from JSON/API validity', async () => {
  for (const [reply, status] of [
    [{ status: 404, text: 'Missing' }, 'missing'],
    [new Error('HTTP read exceeded 8 seconds.'), 'unavailable'],
    [{ status: 503, text: 'Unavailable' }, 'unavailable'],
  ] as [Reply, string][]) {
    const f = fixture();
    f.files.set(origin + '/agentic.txt', reply);
    f.files.set(origin + '/llms.txt', new Error('Unavailable'));
    const report = await auditUrl(origin, f.reader);
    assert.equal(report.valid, true);
    assert.equal(report.textIndex.status, status);
    assert.equal(
      report.checks.find((check) => check.id === 'txt')?.status,
      'warn',
    );
    assert.ok(
      report.observations.find((item) => item.url.endsWith('/llms.txt'))?.error,
    );
  }
});

test('TXT drift fails its check without following text directives or changing JSON validity', async () => {
  for (const mutate of [
    (text: string) =>
      text.replace('Profile: ' + origin, 'Profile: https://127.0.0.1'),
    (text: string) => text.replaceAll('\n', '\r\n'),
    (text: string) => text.replace('Create a support ticket', 'Send payment'),
  ]) {
    const f = fixture();
    f.files.set(origin + '/agentic.txt', {
      text: mutate(buildActionIndex(f.profile)),
      type: 'text/plain',
    });
    const report = await auditUrl(origin, f.reader);
    assert.equal(report.valid, true);
    assert.equal(report.textIndex.status, 'mismatch');
    assert.equal(
      report.checks.find((check) => check.id === 'txt')?.status,
      'fail',
    );
    assert.ok(f.calls.every((call) => new URL(call.url).origin === origin));
    assert.equal(f.calls.length, 4);
  }
});

test('content type checks reject deceptive suffixes and tolerate charset parameters', async () => {
  const f = fixture();
  f.files.set(f.profileUrl, {
    text: JSON.stringify(f.profile),
    type: 'application/jsonp',
  });
  f.files.set(origin + '/agentic.txt', {
    text: buildActionIndex(f.profile),
    type: 'text/plain-extra',
  });
  const report = await auditUrl(origin, f.reader);
  assert.equal(report.valid, true);
  assert.equal(
    report.checks.find((check) => check.id === 'json-type')?.status,
    'warn',
  );
  assert.equal(
    report.checks.find((check) => check.id === 'txt-type')?.status,
    'warn',
  );
});
