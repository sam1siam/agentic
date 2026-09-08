import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { buildProfile, starterSettings } from '../../lib/profile-generator.ts';
import { validateProfile } from '../../lib/validation.ts';
import { validateAgenticDocument } from '../../lib/site-profile.ts';
import { discoverWebsite } from '../../server/discovery.ts';
import { profileFiles } from '../../lib/action-index.ts';

export function createTools(options?: { readSpec?: () => Promise<string> }) {
  const server = new McpServer({
    name: 'agentic-tools',
    version: '1.2.0',
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
      description: 'Read the Agentic specification bundled with this checkout.',
      inputSchema: z.object({}).strict(),
      annotations,
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: options?.readSpec
            ? await options.readSpec()
            : (
                await Promise.all(
                  ['SPEC.md', 'SITE-PROFILE.md'].map((name) =>
                    readFile(
                      new URL('../../docs/' + name, import.meta.url),
                      'utf8',
                    ),
                  ),
                )
              ).join('\n\n---\n\n'),
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
          validateAgenticDocument(
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
  server.registerTool(
    'discover_agentic_site',
    {
      description:
        'Read a public website, documentation, OpenAPI and advertised MCP links; generate agentic.txt and agentic.json. No action execution or MCP tool invocation.',
      inputSchema: z.object({ url: z.string().max(2048) }).strict(),
      annotations: { ...annotations, openWorldHint: true },
    },
    async ({ url }) => {
      try {
        return output(await discoverWebsite(url));
      } catch (error) {
        return {
          isError: true,
          ...output({
            error: error instanceof Error ? error.message : 'Discovery failed.',
          }),
        };
      }
    },
  );
  return server;
}
