import { safeOrigin } from './validation.ts';

export const documentationDefaults = {
  name: 'My service',
  origin: 'https://support.example',
  description: 'Support tools and documentation.',
};
export type DocumentationSettings = typeof documentationDefaults;

function text(value: string, label: string, limit: number) {
  if (
    !value.trim() ||
    value.length > limit ||
    // oxlint-disable-next-line no-control-regex -- rejects control, zero-width and bidi characters
    /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\ufeff]/u.test(value)
  )
    throw new Error(
      `${label} must be one line, between 1 and ${limit} characters.`,
    );
  return value.trim();
}

export function buildDocumentation(settings: DocumentationSettings) {
  const origin = safeOrigin(settings.origin.trim());
  const name = text(settings.name, 'Service name', 120);
  const description = text(settings.description, 'Description', 400);
  return {
    'llms.txt': `# ${name}\n\n> ${description}\n\n## Documentation\n- [Service documentation](${origin}/docs/): Service setup and usage.\n- [Agentic action index](${origin}/agentic.txt): Optional generated action summaries.\n- [Agentic action profile](${origin}/agentic.json): Authoritative request tracking and verification bindings.\n`,
  };
}
