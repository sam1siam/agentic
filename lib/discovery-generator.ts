import { safeOrigin } from './validation.ts';

export const discoveryDefaults = {
  name: 'My service',
  origin: 'https://support.example',
  description: 'Support tools and documentation.',
  mcp: '',
  webmcp: '',
  a2a: '',
  auth: '',
};
export type DiscoverySettings = typeof discoveryDefaults;

function text(value: string, label: string, limit: number) {
  if (
    !value.trim() ||
    value.length > limit ||
    /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\ufeff]/u.test(value)
  )
    throw new Error(
      `${label} must be one line, between 1 and ${limit} characters.`,
    );
  return value.trim();
}
function endpoint(value: string, label: string) {
  const clean = text(value, label, 2048);
  const url = new URL(clean);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash)
    throw new Error(
      `${label} must be an HTTPS URL without credentials or a fragment.`,
    );
  return url.href;
}

export function buildDiscovery(settings: DiscoverySettings) {
  const origin = safeOrigin(settings.origin.trim());
  const name = text(settings.name, 'Service name', 120);
  const description = text(settings.description, 'Description', 400);
  const manifest: Record<string, unknown> = {
    version: '1.0',
    standard: 'https://agents-txt.com',
    site: { name, url: origin, description },
  };
  const lines = [
    '# agents.txt',
    '# Standard: https://agents-txt.com',
    `# JSON: ${origin}/agents.json`,
  ];
  for (const [key, directive] of [
    ['mcp', 'MCP'],
    ['webmcp', 'WebMCP'],
    ['a2a', 'A2A'],
  ] as const) {
    if (!settings[key]) continue;
    const url = endpoint(settings[key], directive);
    manifest[key] = [
      { url, ...(key === 'mcp' ? { type: 'streamable-http' } : {}) },
    ];
    lines.push(`${directive}: ${url}`);
  }
  if (settings.auth) {
    const url = endpoint(settings.auth, 'Agent Auth discovery');
    // This generator uses same-origin discovery so issuer ownership remains explicit.
    if (new URL(url).origin !== origin)
      throw new Error('Agent Auth discovery must be on the service origin.');
    manifest.authorization = {
      protocols: ['agent-auth'],
      discovery: new URL(url).pathname + new URL(url).search,
    };
    lines.push('Authorization: agent-auth');
  }
  return {
    'agents.txt': lines.join('\n') + '\n',
    'agents.json': JSON.stringify(manifest, null, 2) + '\n',
    'llms.txt': `# ${name}\n\n> ${description}\n\n## Documentation\n- [Service documentation](${origin}/docs/): Service setup and usage.\n- [Agentic action profile](${origin}/agentic.json): Request tracking and verification bindings.\n`,
  };
}
