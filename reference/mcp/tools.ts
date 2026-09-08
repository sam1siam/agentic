import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { buildProfile, starterSettings } from '../../lib/profile-generator.ts';
import { validateProfile } from '../../lib/validation.ts';
import { profileFiles } from '../../lib/action-index.ts';

export function createTools(options?: { readSpec?: () => Promise<string> }) {
  const server = new McpServer({
    name: 'agentic-tools',
    version: '1.0.0',
  });
  const annotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };
  const output = (value: unknown) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
  });
  function parse(text: string, limit: number) {
    if (Buffer.byteLength(text, 'utf8') > limit)
      throw new Error(`Input exceeds ${limit} bytes.`);
    return JSON.parse(text);
  }
  server.registerTool(
    'get_agentic_spec',
    {
      description:
        'Read the Agentic specification bundled with this checkout.',
      inputSchema: z.object({}).strict(),
      annotations,
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: options?.readSpec
            ? await options.readSpec()
            : await readFile(
                new URL('../../docs/SPEC.md', import.meta.url),
                'utf8',
              ),
        },
      ],
    }),
  );
  server.registerTool(
    'generate_agentic_profile',
    {
      description:
        'Create a ticket-contract profile for a canonical HTTPS origin. Returns data; does not write files or call a service.',
      inputSchema: z
        .object({
          origin: z.string().max(2048),
          actionId: z.string().max(80).optional(),
        })
        .strict(),
      annotations,
    },
    async ({ origin, actionId }) => {
      const profile = buildProfile({
        ...starterSettings,
        origin,
        ...(actionId !== undefined ? { actionId } : {}),
      });
      const validation = validateProfile(profile);
      return output(
        validation.valid
          ? { profile, files: profileFiles(profile), validation }
          : { validation },
      );
    },
  );
  server.registerTool(
    'validate_agentic_profile',
    {
      description:
        'Validate JSON profile text and optional OpenAPI JSON text locally. No URL fetching or action execution.',
      inputSchema: z
        .object({
          profile: z.string().max(65536),
          openapi: z.string().max(262144).optional(),
        })
        .strict(),
      annotations,
    },
    async ({ profile, openapi }) => {
      try {
        return output(
          validateProfile(
            parse(profile, 65536),
            openapi ? parse(openapi, 262144) : undefined,
          ),
        );
      } catch (error) {
        return output({
          valid: false,
          errors: [error instanceof Error ? error.message : 'Invalid JSON.'],
          warnings: [],
        });
      }
    },
  );
  return server;
}
