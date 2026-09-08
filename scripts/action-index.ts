import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { buildActionIndex } from '../lib/action-index.ts';
import { buildPublicationIndex, matchesTextIndex } from '../lib/publication.ts';

export async function writeActionIndex(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      'profile-url': { type: 'string' },
      check: { type: 'boolean', default: false },
      legacy: { type: 'boolean', default: false },
      'allow-local': { type: 'boolean', default: false },
    },
  });
  if (positionals.length !== 1)
    throw new Error(
      'Usage: agentic text profile.json [--out agentic.txt] [--profile-url https://service.example/agentic.json] [--check] [--legacy]',
    );
  const input = positionals[0];
  const source = await readFile(input, 'utf8');
  if (Buffer.byteLength(source) > 65536)
    throw new Error('Profile exceeds 64 KiB.');
  const result = (values.legacy ? buildActionIndex : buildPublicationIndex)(
    JSON.parse(source),
    values['profile-url'],
    values['allow-local'],
  );
  const output = values.out ?? join(dirname(input), 'agentic.txt');
  if (values.check) {
    if (
      values.legacy
        ? (await readFile(output, 'utf8')) !== result
        : !matchesTextIndex(
            await readFile(output, 'utf8'),
            JSON.parse(source),
            values['profile-url'],
            values['allow-local'],
          )
    )
      throw new Error(
        'Text index differs from the generated profile summary. Regenerate it from the current JSON.',
      );
    return 'Text index matches the JSON profile: ' + output;
  }
  await writeFile(output, result, { flag: 'wx' });
  return 'Created ' + output + '. The JSON profile remains authoritative.';
}
