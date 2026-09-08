import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createTools } from '../../reference/mcp/tools.ts';
import { validateProfile } from '../../lib/validation.ts';
import { validateAgenticDocument } from '../../lib/site-profile.ts';
import { discoverWebsite } from '../../server/discovery.ts';
import { buildProfile, starterSettings } from '../../lib/profile-generator.ts';
import { auditUrl } from '../../server/audit.ts';
import { writeActionIndex } from '../../scripts/action-index.ts';
import { publicationFiles } from '../../lib/publication.ts';

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'init') {
    const { values } = parseArgs({
      args,
      options: {
        origin: { type: 'string' },
        out: { type: 'string', default: 'agentic.json' },
        'action-id': { type: 'string', default: 'create-ticket' },
      },
    });
    if (!values.origin)
      throw new Error('Use --origin https://your-service.example.');
    const profile = buildProfile({
      ...starterSettings,
      origin: values.origin,
      actionId: values['action-id'],
    });
    const result = validateProfile(profile);
    if (!result.valid) throw new Error(result.errors.join('\n'));
    await writeFile(values.out, JSON.stringify(profile, null, 2) + '\n', {
      flag: 'wx',
    });
    console.log(
      'Created ' +
        values.out +
        '. Implement the service contract and validate it with your OpenAPI file.',
    );
  } else if (command === 'discover') {
    const { values, positionals } = parseArgs({
      args,
      allowPositionals: true,
      options: { out: { type: 'string', default: 'agentic-files' } },
    });
    if (positionals.length !== 1)
      throw new Error(
        'Usage: agentic discover https://your-site.com [--out new-directory]',
      );
    const result = await discoverWebsite(positionals[0]);
    const { mkdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await mkdir(values.out, { recursive: false });
    for (const [name, content] of Object.entries(result.files))
      await writeFile(join(values.out, name), content, { flag: 'wx' });
    await writeFile(
      join(values.out, 'discovery-report.json'),
      JSON.stringify(result, null, 2) + '\n',
      { flag: 'wx' },
    );
    console.log(
      'Created agentic.txt, agentic.json, README.md and LISTING.md in ' +
        values.out +
        ' from ' +
        result.origin +
        '.',
    );
    for (const note of result.notes) console.log(note);
  } else if (command === 'bundle') {
    const { values, positionals } = parseArgs({
      args,
      allowPositionals: true,
      options: {
        out: { type: 'string', default: 'agentic-files' },
        'profile-url': { type: 'string' },
      },
    });
    if (positionals.length !== 1)
      throw new Error(
        'Usage: agentic bundle agentic.json [--out new-directory] [--profile-url public-json-url]',
      );
    const source = await readFile(positionals[0], 'utf8');
    if (Buffer.byteLength(source) > 65536)
      throw new Error('Profile exceeds 64 KiB.');
    const files = publicationFiles(JSON.parse(source), values['profile-url']);
    const { mkdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    await mkdir(values.out, { recursive: false });
    for (const [name, content] of Object.entries(files))
      await writeFile(join(values.out, name), content, { flag: 'wx' });
    console.log(
      'Created agentic.json, agentic.txt, README.md and LISTING.md in ' +
        values.out +
        '.',
    );
  } else if (command === 'text') {
    console.log(await writeActionIndex(args));
  } else if (command === 'validate') {
    if (args.length < 1 || args.length > 2)
      throw new Error('Usage: agentic validate profile.json [openapi.json]');
    const result = validateAgenticDocument(
      JSON.parse(await readFile(args[0], 'utf8')),
      args[1] ? JSON.parse(await readFile(args[1], 'utf8')) : undefined,
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
  } else if (command === 'audit') {
    const { values, positionals } = parseArgs({
      args,
      allowPositionals: true,
      options: {
        readme: { type: 'string' },
        publication: { type: 'boolean', default: false },
      },
    });
    if (positionals.length !== 1)
      throw new Error(
        'Usage: agentic audit URL [--readme raw-readme-url] [--publication]',
      );
    const result = await auditUrl(positionals[0], undefined, {
      readmeUrl: values.readme,
    });
    console.log(JSON.stringify(result, null, 2));
    if (
      values.publication
        ? result.publication.status !== 'successful'
        : !result.valid
    )
      process.exitCode = 1;
  } else if (command === 'mcp') {
    await createTools({
      readSpec: async () =>
        (
          await Promise.all(
            ['SPEC.md', 'SITE-PROFILE.md', 'PUBLICATION.md'].map((name) =>
              readFile(new URL('../' + name, import.meta.url), 'utf8'),
            ),
          )
        ).join('\n\n---\n\n'),
    }).connect(new StdioServerTransport());
  } else if (command === '--version') console.log('1.3.0');
  else {
    console.log(
      'Agentic tools\n\nagentic discover https://your-site.com [--out new-directory]\nagentic init --origin https://service.example [--out agentic.json]\nagentic bundle agentic.json [--out new-directory]\nagentic text agentic.json [--out agentic.txt] [--profile-url https://service.example/agentic.json] [--check] [--legacy]\nagentic validate agentic.json openapi.json\nagentic audit https://service.example/agentic.json [--readme raw-readme-url] [--publication]\nagentic mcp\n\nValidation is structural. Audits only read public HTTPS files. Neither proves service behavior.',
    );
    if (command && command !== '--help') process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Command failed.');
  process.exitCode = 1;
}
