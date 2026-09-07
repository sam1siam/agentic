import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import {
  buildDiscovery,
  discoveryDefaults,
} from '../lib/discovery-generator.ts';

test('discovery output preserves protocol boundaries and rejects unsafe declarations', () => {
  const empty = JSON.parse(buildDiscovery(discoveryDefaults)['agents.json']);
  for (const key of ['mcp', 'webmcp', 'a2a', 'authorization', 'agentic'])
    assert.equal(key in empty, false);
  const settings = {
    ...discoveryDefaults,
    mcp: 'https://support.example/mcp',
    webmcp: 'https://support.example/tools/',
    a2a: 'https://support.example/.well-known/agent-card.json',
    auth: 'https://support.example/.well-known/agent-configuration',
  };
  const files = buildDiscovery(settings);
  const manifest = JSON.parse(files['agents.json']);
  for (const [key, directive] of [
    ['mcp', 'MCP'],
    ['webmcp', 'WebMCP'],
    ['a2a', 'A2A'],
  ])
    assert.ok(
      files['agents.txt'].includes(`${directive}: ${manifest[key][0].url}`),
    );
  assert.equal(
    manifest.authorization.discovery,
    '/.well-known/agent-configuration',
  );
  assert.ok(files['agents.txt'].includes('Authorization: agent-auth'));
  for (const patch of [
    { name: 'One\nMCP: https://injected.example' },
    { mcp: 'http://example.com/mcp' },
    { mcp: 'https://user:secret@example.com' },
    { a2a: 'javascript:alert(1)' },
    { auth: 'https://different.example/auth' },
    { origin: 'https://example.com/path' },
  ])
    assert.throws(() => buildDiscovery({ ...settings, ...patch }));
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
        'generate_agentic_profile',
        'get_agentic_spec',
        'validate_agentic_profile',
      ]);
      assert.ok(tools.every((t) => t.annotations?.readOnlyHint));
      const generated = await client.callTool({
        name: 'generate_agentic_profile',
        arguments: { origin: 'https://pilot.example' },
      });
      const data = JSON.parse(
        (generated.content as { type: string; text: string }[])[0].text,
      );
      assert.equal(data.profile.origin, 'https://pilot.example');
      assert.equal(data.validation.valid, true);
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
        (spec.content as { text: string }[])[0].text.includes(
          'Experimental draft',
        ),
      );
    } finally {
      await client.close();
    }
  },
);
