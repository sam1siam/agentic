import { createMcpHandler } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createTools } from '../reference/mcp/tools.ts';
import { auditUrl } from './audit.ts';

export const mcp = createMcpHandler(
  () => {
    const server = createTools();
    server.registerTool(
      'audit_agentic_url',
      {
        description:
          'Read a public HTTPS Agentic profile, its same-origin OpenAPI files and discovery files. Does not submit actions or verify service behavior.',
        inputSchema: z.object({ url: z.string().max(2048) }).strict(),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async ({ url }) => {
        try {
          return {
            content: [
              { type: 'text', text: JSON.stringify(await auditUrl(url)) },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: error instanceof Error ? error.message : 'Audit failed.',
              },
            ],
          };
        }
      },
    );
    return server;
  },
  { responseMode: 'json', maxSubscriptions: 0 },
);
