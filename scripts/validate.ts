import { readFile } from 'node:fs/promises';
import { validateProfile } from '../lib/validation.ts';
const paths = process.argv.slice(2);
if (!paths.length) {
  console.error('Usage: npm run validate -- profile.json [openapi.json]');
  process.exit(1);
}
try {
  const value = JSON.parse(await readFile(paths[0], 'utf8'));
  const api = paths[1]
    ? JSON.parse(await readFile(paths[1], 'utf8'))
    : undefined;
  const report = validateProfile(value, api);
  console.log(JSON.stringify(report, null, 2));
  if (!report.valid) process.exitCode = 1;
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
