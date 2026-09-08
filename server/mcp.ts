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
          'Audit a website or public HTTPS Agentic JSON URL. Check the profile, API operations, matching agentic.txt, README.md links, and publication readiness with specific remedies. Does not execute actions.',
        inputSchema: z
          .object({
            url: z.string().max(2048),
            readmeUrl: z.string().max(2048).optional(),
          })
          .strict(),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async ({ url, readmeUrl }) => {
        try {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  await auditUrl(url, undefined, { readmeUrl }),
                ),
              },
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
