import { access, readFile } from 'node:fs/promises';
const routes = [
  '',
  'spec/',
  'audit/',
  'compare/',
  'about/',
  'lab/',
  'validate/',
  'adopt/',
  'generate/',
  'examples/',
  'docs/',
  'platform/',
  'connect/',
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
  for (const tag of [
    'property="og:image"',
    'name="twitter:card"',
    'rel="apple-touch-icon"',
    'rel="manifest"',
    'name="description"',
  ])
    if (!html.includes(tag))
      throw new Error('Missing ' + tag + ' on route: ' + route);
  const assets = [
    ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)(?:[^"]*)"/g),
  ].map((match) => match[1]);
  for (const asset of assets) await access('dist/client' + asset);
  const links = [...html.matchAll(/href="(\/[^"?#]*)(?:[^"]*)"/g)].map(
    (m) => m[1],
  );
  for (const link of links) {
    if (
      /^\/(?:agentic\.(?:txt|json)$|api\/platform\/|mcp\/?$|a2a\/?$|\.well-known\/)/.test(
        link,
      )
    )
      continue;
    const target = 'dist/client' + link;
    if (link.endsWith('/')) await access(target + 'index.html');
    else if (!link.split('/').at(-1).includes('.'))
      await access(target + '/index.html');
    else await access(target);
  }
}
for (const file of [
  'docs/SPEC.md',
  'docs/PUBLICATION.md',
  'README.md',
  'examples/site/README.md',
  'examples/site/LISTING.md',
  'examples/tickets/README.md',
  'examples/tickets/LISTING.md',
  'docs/SITE-PROFILE.md',
  'schemas/site-1.1.schema.json',
  'examples/site/agentic.json',
  'examples/site/agentic.txt',
  'docs/AUDIT.md',
  'docs/COMPARE.md',
  'docs/ABOUT.md',
  'docs/GOVERNANCE.md',
  'docs/CONFORMANCE.md',
  'docs/GETTING-STARTED.md',
  'docs/COMPATIBILITY.md',
  'schemas/agentic-1.0.schema.json',
  'examples/tickets/agentic.json',
  'examples/tickets/agentic.txt',
  'docs/AGENTIC-TXT.md',
  'examples/tickets/openapi.json',
  'reports/benchmark.json',
  'llms.txt',
  'llms-full.txt',
  'docs/PROTOCOLS.md',
  'brand/agentic-mark.svg',
  'examples/tickets/receipt.json',
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
  'og.png',
])
  await access('dist/client/' + file);
for (const file of ['agents.txt', 'agents.json']) {
  const exists = await access('dist/client/' + file).then(
    () => true,
    () => false,
  );
  if (exists) throw new Error('Removed companion file still exported: ' + file);
}
console.log(
  'Verified all thirteen exported pages, local links, Markdown alternatives, assets, and core downloads.',
);
