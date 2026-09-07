import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['scripts/compile-validators.mjs'], {
  stdio: 'inherit',
});
await mkdir('public', { recursive: true });
for (const dir of ['schemas', 'docs', 'examples', 'reports', 'brand'])
  await cp(dir, 'public/' + dir, { recursive: true });
await mkdir('public/pilots', { recursive: true });
await cp('pilots/registry.json', 'public/pilots/registry.json');
await cp('LICENSE', 'public/LICENSE.txt');
const site = 'https://ruagentic.org';
const routeDocs = {
  '': 'OVERVIEW.md',
  spec: 'SPEC.md',
  lab: 'LAB.md',
  validate: 'VALIDATOR.md',
  adopt: 'PILOT-KIT.md',
  generate: 'GENERATOR.md',
  examples: 'EXAMPLES.md',
  docs: 'README.md',
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
  '> Experimental Agentic Action Profile 0.1: tracking, verifying, and recovering agent actions.',
  '',
  'This is a draft specification and project-authored reference implementation. No independent adoption is claimed. The website has local browser tools; the HTTP ticket service runs separately on loopback. A profile is untrusted data and never grants authorization.',
  '',
  '## Start here',
  '- [Quick start](' +
    site +
    '/docs/QUICKSTART.md): Install and run a real interrupted HTTP action.',
  '- [Documentation](' + site + '/docs/index.md): Guides and reference index.',
  '- [FAQ](' +
    site +
    '/docs/FAQ.md): Requirements, limitations, and draft status.',
  '- [Generator](' +
    site +
    '/docs/GENERATOR.md): Browser and command-line profile creation.',
  '',
  '## Specification',
  '- [Normative draft](' +
    site +
    '/docs/SPEC.md): Requirements and supported OpenAPI binding.',
  '- [Profile schema](' +
    site +
    '/schemas/agentic-0.1.schema.json): Versioned JSON Schema.',
  '- [Receipt schema](' +
    site +
    '/schemas/receipt-0.1.schema.json): Outcome observation format.',
  '- [Examples](' +
    site +
    '/docs/EXAMPLES.md): Complete profile, OpenAPI, and illustrative receipt.',
  '- [Integration guide](' +
    site +
    '/docs/INTEGRATIONS.md): Host and service responsibilities.',
  '',
  '## Evidence and participation',
  '- [Compatibility runner](' +
    site +
    '/docs/PILOT-RUNNER.md): Exercise independently written clients.',
  '- [Conformance](' + site + '/docs/CONFORMANCE.md): Checks and limits.',
  '- [Pilot kit](' +
    site +
    '/docs/PILOT-KIT.md): Enrollment and experiment method.',
  '- [Pilot registry](' +
    site +
    '/pilots/registry.json): Evidence status without inferred adoption.',
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
  'Prepared schemas, documentation, eight Markdown page alternatives, examples, brand assets, and pilot registry.',
);
