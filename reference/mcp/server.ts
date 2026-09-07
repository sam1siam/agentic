import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createTools } from './tools.ts';
await createTools().connect(new StdioServerTransport());
