import { access, readFile } from 'node:fs/promises';
const routes = ['', 'spec/', 'lab/', 'validate/', 'adopt/'];
for (const route of routes) {
  const file = 'dist/client/' + route + 'index.html';
  const html = await readFile(file, 'utf8');
  if (!html.includes('</html>') || html.includes('Your site is taking shape'))
    throw new Error('Incomplete exported route: ' + route);
  const assets = [
    ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)(?:[^\"]*)"/g),
  ].map((match) => match[1]);
  for (const asset of assets) await access('dist/client' + asset);
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
])
  await access('dist/client/' + file);
console.log(
  'Verified all five exported pages and their referenced assets and core downloads.',
);
