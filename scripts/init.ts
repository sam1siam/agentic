import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { buildProfile, starterSettings } from '../lib/profile-generator.ts';
import { validateProfile } from '../lib/validation.ts';

try {
  const { values } = parseArgs({
    options: {
      origin: { type: 'string', default: starterSettings.origin },
      out: { type: 'string', default: 'agentic.json' },
      'action-id': { type: 'string', default: starterSettings.actionId },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });
  if (values.help) {
    console.log(
      'Usage: npm run init -- --origin https://service.example --out agentic.json [--action-id create-ticket]\nCreates a ticket-contract starter. Refuses to overwrite an existing file.',
    );
  } else {
    const profile = buildProfile({
      ...starterSettings,
      origin: values.origin,
      actionId: values['action-id'],
    });
    const report = validateProfile(profile);
    if (!report.valid) throw new Error(report.errors.join('\n'));
    await writeFile(values.out, JSON.stringify(profile, null, 2) + '\n', {
      flag: 'wx',
    });
    console.log(
      'Created ' +
        values.out +
        '. Adapt the ticket operations and evidence to your service, then validate with its OpenAPI document.',
    );
  }
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
