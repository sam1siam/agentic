import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';
await mkdir('packages/cli/dist', { recursive: true });
await build({
  entryPoints: ['packages/cli/cli.ts'],
  outfile: 'packages/cli/dist/cli.mjs',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  minify: false,
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire as _createRequire } from "node:module"; const require = _createRequire(import.meta.url);',
  },
});
await cp('docs/SPEC.md', 'packages/cli/SPEC.md');
await cp('LICENSE', 'packages/cli/LICENSE');
console.log('Built standalone Agentic CLI.');
