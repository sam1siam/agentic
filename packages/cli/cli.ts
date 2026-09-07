import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createTools } from '../../reference/mcp/tools.ts';
import { validateProfile } from '../../lib/validation.ts';
import { buildProfile, starterSettings } from '../../lib/profile-generator.ts';
import { auditUrl } from '../../server/audit.ts';

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
  } else if (command === 'validate') {
    if (args.length < 1 || args.length > 2)
      throw new Error('Usage: agentic validate profile.json [openapi.json]');
    const result = validateProfile(
      JSON.parse(await readFile(args[0], 'utf8')),
      args[1] ? JSON.parse(await readFile(args[1], 'utf8')) : undefined,
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
  } else if (command === 'audit') {
    if (args.length !== 1)
      throw new Error(
        'Usage: agentic audit https://your-service.example/agentic.json',
      );
    const result = await auditUrl(args[0]);
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
  } else if (command === 'mcp') {
    await createTools({
      readSpec: () => readFile(new URL('../SPEC.md', import.meta.url), 'utf8'),
    }).connect(new StdioServerTransport());
  } else if (command === '--version') console.log('0.1.0-draft.4');
  else {
    console.log(
      'Agentic experimental tools\n\nagentic init --origin https://service.example [--out agentic.json]\nagentic validate agentic.json openapi.json\nagentic audit https://service.example/agentic.json\nagentic mcp\n\nValidation is structural. Audits only read public HTTPS files. Neither proves service behavior.',
    );
    if (command && command !== '--help') process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Command failed.');
  process.exitCode = 1;
}
