import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import {
  buildDocumentation,
  documentationDefaults,
} from '../lib/documentation-generator.ts';

test('documentation starter links the profile without protocol declarations', () => {
  const files = buildDocumentation(documentationDefaults);
  assert.deepEqual(Object.keys(files), ['llms.txt']);
  assert.ok(
    files['llms.txt'].includes('(https://support.example/agentic.json)'),
  );
  assert.ok(files['llms.txt'].includes('(https://support.example/docs/)'));
  for (const patch of [
    { name: 'One\nInjected section' },
    { description: 'Hidden\u202econtent' },
    { name: '' },
    { origin: 'https://user:secret@example.com' },
    { origin: 'javascript:alert(1)' },
    { origin: 'https://example.com/path' },
  ])
    assert.throws(() =>
      buildDocumentation({ ...documentationDefaults, ...patch }),
    );
});

test(
  'MCP client discovers and calls local tools through a real stdio session',
  { timeout: 20000 },
  async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve('reference/mcp/server.ts')],
      stderr: 'pipe',
    });
    const client = new Client({
      name: 'agentic-integration-test',
      version: '1.0.0',
    });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      assert.deepEqual(tools.map((t) => t.name).sort(), [
        'discover_agentic_site',
        'generate_agentic_profile',
        'get_agentic_spec',
        'validate_agentic_profile',
      ]);
      assert.ok(tools.every((t) => t.annotations?.readOnlyHint));
      const rejectedDiscovery = await client.callTool({
        name: 'discover_agentic_site',
        arguments: { url: 'https://127.0.0.1/' },
      });
      assert.equal(rejectedDiscovery.isError, true);
      const siteCheck = await client.callTool({
        name: 'validate_agentic_profile',
        arguments: {
          profile: await readFile('examples/site/agentic.json', 'utf8'),
        },
      });
      assert.equal(
        JSON.parse((siteCheck.content as { text: string }[])[0].text).valid,
        true,
      );
      const generated = await client.callTool({
        name: 'generate_agentic_profile',
        arguments: { origin: 'https://service.example' },
      });
      const data = JSON.parse(
        (generated.content as { type: string; text: string }[])[0].text,
      );
      assert.equal(data.profile.origin, 'https://service.example');
      assert.equal(data.validation.valid, true);
      assert.deepEqual(Object.keys(data.files).sort(), [
        'agentic.json',
        'agentic.txt',
      ]);
      assert.ok(
        data.files['agentic.txt'].includes(
          'Profile: https://service.example/agentic.json\n',
        ),
      );
      const checked = await client.callTool({
        name: 'validate_agentic_profile',
        arguments: {
          profile: JSON.stringify(data.profile),
          openapi: await readFile('examples/tickets/openapi.json', 'utf8'),
        },
      });
      assert.equal(
        JSON.parse((checked.content as { text: string }[])[0].text).valid,
        true,
      );
      const malformed = await client.callTool({
        name: 'validate_agentic_profile',
        arguments: { profile: '{' },
      });
      assert.equal(
        JSON.parse((malformed.content as { text: string }[])[0].text).valid,
        false,
      );
      const invalid = await client.callTool({
        name: 'generate_agentic_profile',
        arguments: { origin: 'http://untrusted.example' },
      });
      assert.equal(
        JSON.parse((invalid.content as { text: string }[])[0].text).validation
          .valid,
        false,
      );
      const spec = await client.callTool({
        name: 'get_agentic_spec',
        arguments: {},
      });
      assert.ok(
        (spec.content as { text: string }[])[0].text.includes('Version: 1.0.0'),
      );
      assert.ok(
        (spec.content as { text: string }[])[0].text.includes(
          'Agentic Site Profile 1.1',
        ),
      );
    } finally {
      await client.close();
    }
  },
);
