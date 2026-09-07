import { access, readFile } from 'node:fs/promises';
const routes = [
  '',
  'spec/',
  'lab/',
  'validate/',
  'adopt/',
  'generate/',
  'examples/',
  'docs/',
];
for (const route of routes) {
  const file = 'dist/client/' + route + 'index.html';
  const html = await readFile(file, 'utf8');
  if (!html.includes('</html>') || html.includes('Your site is taking shape'))
    throw new Error('Incomplete exported route: ' + route);
  await access('dist/client/' + route + 'index.md');
  await access('dist/client/' + route + 'index.txt');
  if (!html.includes('text/markdown'))
    throw new Error('Missing Markdown discovery metadata: ' + route);
  const assets = [
    ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)(?:[^\"]*)"/g),
  ].map((match) => match[1]);
  for (const asset of assets) await access('dist/client' + asset);
  const links = [...html.matchAll(/href="(\/[^"?#]*)(?:[^\"]*)"/g)].map(
    (m) => m[1],
  );
  for (const link of links) {
    const target = 'dist/client' + link;
    if (link.endsWith('/')) await access(target + 'index.html');
    else if (!link.split('/').at(-1).includes('.'))
      await access(target + '/index.html');
    else await access(target);
  }
}
for (const file of [
  'docs/SPEC.md',
  'docs/GOVERNANCE.md',
  'docs/CONFORMANCE.md',
  'docs/PILOT-KIT.md',
  'schemas/agentic-0.1.schema.json',
  'examples/tickets/agentic.json',
  'examples/tickets/openapi.json',
  'reports/benchmark.json',
  'llms.txt',
  'llms-full.txt',
  'agents.txt',
  'agents.json',
  'docs/PROTOCOLS.md',
  'pilots/registry.json',
  'brand/agentic-mark.svg',
  'examples/tickets/receipt.json',
])
  await access('dist/client/' + file);
console.log(
  'Verified all eight exported pages, local links, Markdown alternatives, assets, and core downloads.',
);
