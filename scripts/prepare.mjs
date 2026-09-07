import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['scripts/compile-validators.mjs'], {
  stdio: 'inherit',
});
await mkdir('public', { recursive: true });
for (const dir of ['schemas', 'docs', 'examples', 'reports'])
  await cp(dir, 'public/' + dir, { recursive: true });
await cp('LICENSE', 'public/LICENSE.txt');
await writeFile(
  'public/llms.txt',
  [
    '# Agentic',
    '',
    '> Experimental Agentic Action Profile 0.1: tracking, verifying, and recovering agent actions.',
    '',
    'This project publishes a draft specification and reference implementations. It is not an adopted standard or a ticket service. The recovery lab is an in-memory browser simulation. Node and Python reference clients share project authorship.',
    '',
    '## Specification',
    '- [Normative draft](/docs/SPEC.md)',
    '- [JSON Schema](/schemas/agentic-0.1.schema.json)',
    '- [Receipt schema](/schemas/receipt-0.1.schema.json)',
    '- [Ticket example](/examples/tickets/agentic.json)',
    '- [OpenAPI example](/examples/tickets/openapi.json)',
    '',
    '## Evidence and participation',
    '- [Conformance](/docs/CONFORMANCE.md)',
    '- [Comparison results](/reports/benchmark.json)',
    '- [Prior work](/docs/PRIOR-ART.md)',
    '- [Pilot kit](/docs/PILOT-KIT.md)',
    '- [Governance](/docs/GOVERNANCE.md)',
    '- [Repository](https://github.com/sam1siam/agentic)',
    '',
  ].join('\n'),
);
const paths = ['', 'spec/', 'lab/', 'validate/', 'adopt/'];
await writeFile(
  'public/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths
      .map((p) => '<url><loc>https://ruagentic.org/' + p + '</loc></url>')
      .join('') +
    '</urlset>\n',
);
await writeFile(
  'public/robots.txt',
  'User-agent: *\nAllow: /\nSitemap: https://ruagentic.org/sitemap.xml\n',
);
console.log('Prepared public schemas, documentation, examples, and reports.');
