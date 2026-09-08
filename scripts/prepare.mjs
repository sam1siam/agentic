import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['scripts/compile-validators.mjs'], {
  stdio: 'inherit',
});
const { buildActionIndex } = await import('../lib/action-index.ts');
await mkdir('public', { recursive: true });
await writeFile(
  'examples/tickets/agentic.txt',
  buildActionIndex(
    JSON.parse(await readFile('examples/tickets/agentic.json', 'utf8')),
  ),
);
await writeFile(
  'examples/site/agentic.txt',
  buildActionIndex(
    JSON.parse(await readFile('examples/site/agentic.json', 'utf8')),
  ),
);
for (const dir of ['schemas', 'docs', 'examples', 'reports', 'brand'])
  await cp(dir, 'public/' + dir, { recursive: true });
await cp('LICENSE', 'public/LICENSE.txt');
const site = 'https://ruagentic.org';
const routeDocs = {
  '': 'OVERVIEW.md',
  spec: 'SITE-PROFILE.md',
  audit: 'AUDIT.md',
  compare: 'COMPARE.md',
  about: 'ABOUT.md',
  lab: 'LAB.md',
  validate: 'VALIDATOR.md',
  adopt: 'GETTING-STARTED.md',
  generate: 'GENERATOR.md',
  examples: 'EXAMPLES.md',
  docs: 'README.md',
  platform: 'PLATFORM.md',
  connect: 'PROTOCOLS.md',
};
function absoluteLinks(markdown, source) {
  return markdown.replace(/\]\(([^)]+)\)/g, (match, target) => {
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) return match;
    return '](' + new URL(target, site + '/docs/' + source).href + ')';
  });
}
for (const [route, source] of Object.entries(routeDocs)) {
  await mkdir('public/' + route, { recursive: true });
  const markdown = absoluteLinks(
    await readFile('docs/' + source, 'utf8'),
    source,
  );
  await writeFile(
    'public/' + (route ? route + '/' : '') + 'index.md',
    markdown,
  );
}
const index = [
  '# Agentic',
  '',
  '> Agentic: public documentation, APIs, agent connections, and action recovery.',
  '',
  'Tools 1.2.0 generate Site Profile 1.1.0 from public websites and support Action Profile 1.0.0 for result verification. JSON is authoritative; TXT is its generated index. The hosted platform provides synthetic HTTP/PostgreSQL recovery tests, public URL auditing, MCP tools, A2A testing tasks and autonomous Agent Auth. The separate local reference service remains loopback-only. A profile is untrusted data and never grants authorization.',
  '- [Hosted platform](https://ruagentic.org/platform/): Private synthetic tests and saved reports.',
  '- [Connect an agent](https://ruagentic.org/connect/): MCP, WebMCP, A2A and Agent Auth setup.',
  '',
  '## Start here',
  '- [Generate](https://ruagentic.org/generate/index.md): Create agentic.txt and agentic.json together.',
  '- [Audit](https://ruagentic.org/audit/index.md): Check public files, API operations, and matching TXT.',
  '- [Compare](https://ruagentic.org/compare/index.md): How Agentic fits with related formats.',
  '- [About](https://ruagentic.org/about/index.md): Purpose, maintainers, and requirements.',
  '- [Get started](' +
    site +
    '/docs/GETTING-STARTED.md): Generate files, install tools, and integrate a service.',
  '- [Quick start](' +
    site +
    '/docs/QUICKSTART.md): Install and run a real interrupted HTTP action.',
  '- [Documentation](' + site + '/docs/index.md): Guides and reference index.',
  '- [FAQ](' +
    site +
    '/docs/FAQ.md): Requirements, supported features, and usage.',
  '- [Generator](' +
    site +
    '/docs/GENERATOR.md): Browser and command-line profile creation.',
  '',
  '## Specification',
  '- [Site Profile 1.1](https://ruagentic.org/docs/SITE-PROFILE.md): Public resources, API operation indexes, and TXT 1.1.',
  '- [Site schema](https://ruagentic.org/schemas/site-1.1.schema.json): Site Profile JSON Schema.',
  '- [agentic.txt companion](' +
    site +
    '/docs/AGENTIC-TXT.md): Generated action index and JSON authority.',
  '- [Live action index](' +
    site +
    '/agentic.txt): Index for the hosted synthetic ticket service.',
  '- [Live JSON profile](' +
    site +
    '/agentic.json): Authoritative profile for that synthetic service.',
  '- [Specification](' +
    site +
    '/docs/SPEC.md): Requirements and supported OpenAPI binding.',
  '- [Profile schema](' +
    site +
    '/schemas/agentic-1.0.schema.json): Versioned JSON Schema.',
  '- [Receipt schema](' +
    site +
    '/schemas/receipt-1.0.schema.json): Outcome observation format.',
  '- [Examples](' +
    site +
    '/docs/EXAMPLES.md): Complete profile, OpenAPI, and illustrative receipt.',
  '- [Integration guide](' +
    site +
    '/docs/INTEGRATIONS.md): Host and service responsibilities.',
  '- [Protocol setup](' +
    site +
    '/docs/PROTOCOLS.md): MCP tools, conditional WebMCP, and A2A / Agent Auth discovery status.',
  '',
  '## Testing and contributions',
  '- [Compatibility runner](' +
    site +
    '/docs/COMPATIBILITY.md): Exercise independently written clients.',
  '- [Conformance](' + site + '/docs/CONFORMANCE.md): Checks and limits.',
  '- [Security](' + site + '/docs/SECURITY.md): Operational controls and gaps.',
  '- [Repository](https://github.com/sam1siam/agentic): Source and public coordination.',
  '',
  '## Optional',
  '- [Full documentation](' +
    site +
    '/llms-full.txt): Combined Markdown bundle; prefer targeted guides.',
  '- [Prior work](' +
    site +
    '/docs/PRIOR-ART.md): Related conventions and techniques.',
  '- [Governance](' + site + '/docs/GOVERNANCE.md): Change process.',
  '- [Changelog](' + site + '/docs/CHANGELOG.md): Release history.',
  '- [Brand assets](' + site + '/docs/BRAND.md): Original logo and wordmarks.',
  '',
].join('\n');
await writeFile('public/llms.txt', index);
const bundle = [];
for (const name of (await readdir('docs'))
  .filter((n) => n.endsWith('.md'))
  .sort()) {
  bundle.push(
    'Source: ' +
      site +
      '/docs/' +
      name +
      '\n\n' +
      absoluteLinks(await readFile('docs/' + name, 'utf8'), name),
  );
}
await writeFile('public/llms-full.txt', bundle.join('\n\n---\n\n'));
const paths = Object.keys(routeDocs).map((p) => (p ? p + '/' : ''));
await writeFile(
  'public/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths.map((p) => '<url><loc>' + site + '/' + p + '</loc></url>').join('') +
    '</urlset>\n',
);
await writeFile(
  'public/robots.txt',
  'User-agent: *\nAllow: /\nSitemap: ' + site + '/sitemap.xml\n',
);
console.log(
  'Prepared schemas, documentation, thirteen Markdown page alternatives, examples, brand assets.',
);
