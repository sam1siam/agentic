import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildProfile, starterSettings } from '../lib/profile-generator.ts';
import { buildActionIndex, profileFiles } from '../lib/action-index.ts';
import {
  publicationFiles,
  buildPublicationIndex,
  buildReadme,
  matchesTextIndex,
  projectReferences,
} from '../lib/publication.ts';
import { auditUrl, type readPublic } from '../server/audit.ts';
import {
  normalizeReadmeUrl,
  readmeLinks,
} from '../server/publication-audit.ts';
import site from '../examples/site/agentic.json' with { type: 'json' };
import api from '../examples/tickets/openapi.json' with { type: 'json' };
const action = buildProfile(starterSettings);
function fixture(profile: unknown = action, custom?: string) {
  const origin = (profile as { origin: string }).origin,
    url = origin + '/agentic.json',
    files = publicationFiles(profile);
  const sources = new Map<
    string,
    { status?: number; text: string; type?: string } | Error
  >([
    [url, { text: files['agentic.json'], type: 'application/json' }],
    [
      origin + '/agentic.txt',
      { text: files['agentic.txt'], type: 'text/plain' },
    ],
    [
      custom ?? origin + '/README.md',
      { text: files['README.md'], type: 'text/markdown' },
    ],
    [
      origin + '/openapi.json',
      { text: JSON.stringify(api), type: 'application/json' },
    ],
    [
      origin + '/docs',
      { text: '# Service documentation', type: 'text/markdown' },
    ],
  ]);
  const calls: string[] = [];
  const reader: typeof readPublic = async (target, limit = 65536) => {
    calls.push(target);
    const response = sources.get(target) ?? { status: 404, text: 'Missing' };
    if (response instanceof Error) throw response;
    if (Buffer.byteLength(response.text) > limit)
      throw new Error('Response exceeds the audit size limit.');
    return {
      url: target,
      status: response.status ?? 200,
      text: response.text,
      headers: { 'content-type': response.type ?? 'text/plain' },
    };
  };
  return { origin, url, files, sources, calls, reader };
}
test('publication bundles preserve JSON and add described project references, README and listing copy', () => {
  for (const profile of [action, site]) {
    const files = publicationFiles(profile),
      legacy = profileFiles(profile);
    assert.deepEqual(Object.keys(files).sort(), [
      'LISTING.md',
      'README.md',
      'agentic.json',
      'agentic.txt',
    ]);
    assert.equal(files['agentic.json'], legacy['agentic.json']);
    assert.match(files['agentic.txt'], /Agentic-Text: 1\.2/);
    assert.match(
      files['agentic.txt'],
      new RegExp('Profile-Version: ' + profile.agentic.replaceAll('.', '\\.')),
    );
    for (const reference of projectReferences)
      for (const name of ['agentic.txt', 'README.md', 'LISTING.md'] as const) {
        assert.ok(files[name].includes(reference.url));
        assert.ok(files[name].includes(reference.description));
      }
    assert.ok(!JSON.parse(files['agentic.json']).references);
    assert.ok(!files['README.md'].includes('listed on Smithery'));
  }
});
test('TXT matching supports both published legacy versions and 1.2, and rejects changed identities or references', () => {
  for (const profile of [action, site]) {
    for (const text of [
      buildActionIndex(profile),
      buildPublicationIndex(profile),
    ])
      assert.equal(matchesTextIndex(text, profile), true);
    for (const text of [
      buildPublicationIndex(profile).replace('ruagentic.com', 'evil.example'),
      buildPublicationIndex(profile).replace(
        'Agentic-Text: 1.2',
        'Agentic-Text: 9.9',
      ),
      buildPublicationIndex(profile).replace(
        'Profile: ' + profile.origin,
        'Profile: https://elsewhere.example',
      ),
    ])
      assert.equal(matchesTextIndex(text, profile), false);
    assert.equal(
      matchesTextIndex(
        buildPublicationIndex(profile),
        profile,
        profile.origin + '/nested/agentic.json',
      ),
      false,
    );
  }
});
test('generated README escapes source markup without injecting links or headings', () => {
  const malicious = {
    ...site,
    name: 'Name [wrong](https://evil.example) <script>',
    description:
      'Text\n## forged heading\n[Org](https://ruagentic.org.evil.example)',
  };
  const readme = buildReadme(malicious);
  assert.ok(!readme.includes('<script>'));
  assert.ok(!readme.includes('\n## forged'));
  const links = readmeLinks(readme, site.origin + '/README.md');
  assert.ok(!links.has('https://evil.example/'));
});
test('README link checks accept customization, relative paths, HTML anchors and reference links without following destinations', async () => {
  const f = fixture();
  f.sources.set(f.origin + '/README.md', {
    text: `# My service\n\nCustom instructions. [JSON](agentic.json) and [TXT](agentic.txt).\n<a href="https://ruagentic.org/spec/">Agentic specification</a>\n[Directory][directory]\n[directory]: https://ruagentic.com/`,
    type: 'text/markdown',
  });
  const report = await auditUrl(f.url, f.reader);
  assert.equal(report.valid, true);
  assert.equal(report.publication.status, 'successful');
  assert.equal(report.readme.status, 'matched');
  assert.equal(report.textIndex.version, '1.2');
  assert.ok(f.calls.every((url) => new URL(url).origin === f.origin));
});
test('a complete site publication passes while advertised MCP remains explicitly untested', async () => {
  const f = fixture(site);
  const report = await auditUrl(f.url, f.reader);
  assert.equal(report.valid, true);
  assert.equal(report.publication.status, 'successful');
  assert.ok(report.checks.some((check) => check.id === 'linked'));
  assert.ok(!f.calls.some((url) => url.endsWith('/mcp')));
});
test('missing, HTML, empty, oversized and unreachable README produce actionable partial publication without changing valid', async () => {
  for (const reply of [
    { status: 404, text: 'Missing' },
    { text: '<html>app fallback</html>', type: 'text/html' },
    { text: ' ' },
    { text: 'x'.repeat(65537) },
    new Error('Fetch exceeded 8 seconds.'),
  ]) {
    const f = fixture();
    f.sources.set(f.origin + '/README.md', reply);
    const report = await auditUrl(f.url, f.reader);
    assert.equal(report.valid, true);
    assert.equal(report.publication.status, 'partial');
    assert.ok(
      report.publication.nextSteps.some(
        (step) => step.id === 'readme' && step.remedy.length > 20,
      ),
    );
  }
});
test('wrong README file links fail publication while missing references yield partial, with exact remedies', async () => {
  const f = fixture();
  f.sources.set(f.origin + '/README.md', {
    text: f.files['README.md'].replaceAll(
      f.origin + '/agentic.json',
      'https://wrong.example/agentic.json',
    ),
  });
  let report = await auditUrl(f.url, f.reader);
  assert.equal(report.valid, true);
  assert.equal(report.publication.status, 'failed');
  assert.ok(
    report.publication.nextSteps.some(
      (step) => step.id === 'readme:json' && step.remedy.includes(f.url),
    ),
  );
  f.sources.set(f.origin + '/README.md', {
    text: f.files['README.md'].replaceAll(
      'https://ruagentic.com',
      'https://ruagentic.com.evil.example',
    ),
  });
  report = await auditUrl(f.url, f.reader);
  assert.equal(report.publication.status, 'partial');
  assert.equal(
    report.checks.find((check) => check.id === 'readme:directory')?.status,
    'warn',
  );
});
test('links inside code blocks, comments and inline code do not satisfy README attribution', () => {
  const text =
    '# Readme\n```md\n[hidden](https://ruagentic.org)\n```\n<!-- [hidden](https://ruagentic.com) -->\n`[hidden](https://ruagentic.com)`';
  assert.equal(readmeLinks(text, action.origin + '/README.md').size, 0);
});
test('missing JSON retains companion observations and specific missing-file guidance', async () => {
  const f = fixture();
  f.sources.clear();
  const report = await auditUrl(f.url, f.reader);
  assert.equal(report.valid, false);
  assert.equal(report.publication.status, 'failed');
  assert.equal(report.readme.status, 'missing');
  assert.equal(report.textIndex.status, 'missing');
  for (const suffix of ['/agentic.json', '/agentic.txt', '/README.md'])
    assert.ok(report.observations.some((item) => item.url.endsWith(suffix)));
  assert.ok(
    report.publication.nextSteps.every((step) => step.remedy.length > 0),
  );
  assert.ok(f.calls.every((url) => new URL(url).origin === f.origin));
});
test('an explicit raw README URL is supported without following any links it contains', async () => {
  const readmeUrl = 'https://raw.example/repo/README.md',
    f = fixture(action, readmeUrl);
  const report = await auditUrl(f.url, f.reader, { readmeUrl });
  assert.equal(report.readme.providedByUser, true);
  assert.equal(report.readme.url, readmeUrl);
  assert.equal(report.publication.status, 'successful');
  assert.ok(
    f.calls
      .filter((url) => new URL(url).origin !== f.origin)
      .every((url) => url === readmeUrl),
  );
  for (const target of [
    'https://127.0.0.1/README.md',
    'https://user:secret@example.com/README.md',
    'https://example.com/README.md?token=secret',
    'http://example.com/README.md',
  ])
    assert.throws(() => normalizeReadmeUrl(target));
});
test('large malformed README punctuation stays bounded', () => {
  const start = performance.now();
  readmeLinks(
    ('[](' + 'x'.repeat(40)).repeat(1400),
    action.origin + '/README.md',
  );
  assert.ok(performance.now() - start < 2000);
});
test('published legacy TXT examples remain unchanged', async () => {
  assert.equal(
    await readFile('examples/tickets/agentic.txt', 'utf8'),
    buildActionIndex(action),
  );
  assert.equal(
    await readFile('examples/site/agentic.txt', 'utf8'),
    buildActionIndex(site),
  );
});

test('misleading HTML attributes, images and escaped or hidden links cannot produce a successful publication', async () => {
  const f = fixture();
  const expected = [
    f.url,
    f.origin + '/agentic.txt',
    'https://ruagentic.org',
    'https://ruagentic.com',
  ];
  for (const disguise of [
    (url: string) =>
      `<a data-href="${url}" href="https://elsewhere.example">Other</a>`,
    (url: string) =>
      `<a title="href='${url}'" href="https://elsewhere.example">Other</a>`,
    (url: string) => `\\[Hidden](${url})`,
    (url: string) => `![Image](${url})`,
    (url: string) => `<script>[Hidden](${url})</script>`,
    (url: string) => `<pre><code>[Hidden](${url})</code></pre>`,
    (url: string) => `[unused]: <${url}>`,
    (url: string) => `![Image](<${url}>)`,
    (url: string) => `[![Image](${url})](https://elsewhere.example)`,
    (url: string) =>
      `[${url}]\n[${url}]: https://elsewhere.example\n[${url}]: ${url}`,
    (url: string) => `[Other](https://elsewhere.example '[Hidden](${url})')`,
  ]) {
    f.sources.set(f.origin + '/README.md', {
      text: '# Service README\n\n' + expected.map(disguise).join('\n'),
    });
    const report = await auditUrl(f.url, f.reader);
    assert.equal(report.valid, true);
    assert.equal(report.publication.status, 'partial');
    assert.ok(
      report.checks
        .filter((check) => check.id.startsWith('readme:'))
        .every((check) => check.status === 'warn'),
    );
  }
  assert.deepEqual(
    [
      ...readmeLinks(
        '<a title="href=wrong" href="https://ruagentic.org">Real</a>\n[TXT](<https://example.com/agentic.txt>)',
        f.origin + '/README.md',
      ),
    ].sort(),
    ['https://example.com/agentic.txt', 'https://ruagentic.org/'],
  );
});

test('invalid explicit README URLs fail before any network request', async () => {
  const f = fixture();
  await assert.rejects(() =>
    auditUrl(f.url, f.reader, { readmeUrl: 'https://127.0.0.1/README.md' }),
  );
  assert.deepEqual(f.calls, []);
});
