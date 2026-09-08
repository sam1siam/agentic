import {
  buildProfile,
  starterSettings,
  type StarterSettings,
} from './profile-generator.ts';
import { validateProfile } from './validation.ts';
import { profileFiles } from './action-index.ts';
export type ImportedOperation = {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  parameters: string[];
};
export function listOperations(document: unknown): ImportedOperation[] {
  const api = document as any;
  if (
    !api ||
    typeof api !== 'object' ||
    typeof api.openapi !== 'string' ||
    !api.openapi.startsWith('3.1.') ||
    !api.paths ||
    typeof api.paths !== 'object'
  )
    throw new Error('Import an OpenAPI 3.1 JSON document.');
  const result: ImportedOperation[] = [];
  for (const [path, item] of Object.entries(api.paths) as [string, any][]) {
    for (const method of ['get', 'post'] as const) {
      const operation = item?.[method];
      if (typeof operation?.operationId === 'string')
        result.push({
          id: operation.operationId,
          method: method.toUpperCase() as 'GET' | 'POST',
          path,
          parameters: [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]),
        });
    }
  }
  if (new Set(result.map((o) => o.id)).size !== result.length)
    throw new Error('Operation IDs must be unique.');
  if (!result.length)
    throw new Error('No named GET or POST operations were found.');
  return result;
}
export function importBundle(document: unknown, settings: StarterSettings) {
  listOperations(document);
  const profile = buildProfile(settings),
    validation = validateProfile(profile, document);
  const instructions = `# Agentic starter bundle\n\nExperimental Agentic Action Profile 0.1.\n\n1. Review the selected operations and evidence pointers.\n2. Serve agentic.json and the generated agentic.txt at your service origin. Regenerate TXT after changing the profile; JSON remains authoritative. Serve openapi.json at ${settings.openapi}.\n3. Implement durable, principal-scoped request tracking, status lookup and resource verification.\n4. Run the CLI validator against both files.\n5. Use the compatibility runner to test your client against the isolated project fixture. Test your own service only where authorized.\n\nStructural validation does not prove idempotency, authorization, retention or recovery behavior. Import does not add these behaviors to your service.\n\nDocs: https://ruagentic.org/docs/QUICKSTART.md\nCompatibility runner: https://ruagentic.org/docs/COMPATIBILITY.md\n`;
  return {
    profile,
    validation,
    files: {
      ...(validation.valid
        ? profileFiles(profile)
        : { 'agentic.json': JSON.stringify(profile, null, 2) + '\n' }),
      'openapi.json': JSON.stringify(document, null, 2) + '\n',
      'README.md': instructions,
    },
  };
}
export { starterSettings };
