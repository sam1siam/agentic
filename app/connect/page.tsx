import type { Metadata } from 'next';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Connect an agent',
  alternates: {
    canonical: 'https://ruagentic.org/connect/',
    types: { 'text/markdown': '/connect/index.md' },
  },
};
export const dynamic = 'force-static';
export default function Page() {
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Agentic / integrations</p>
        <h1>
          Tools your agent <span>can call.</span>
        </h1>
        <p>
          Use public MCP tools, browser page tools, a testing agent, or signed
          capabilities. All four connect to a focused set of profile and
          recovery tools.
        </p>
      </div>
      <section className="example-section" id="mcp">
        <h2>Public MCP server</h2>
        <p>
          Connect a Streamable HTTP client to{' '}
          <code>https://ruagentic.org/mcp</code>. No credential is required for
          these read-only tools.
        </p>
        <pre className="code-block">
          {JSON.stringify(
            { mcpServers: { agentic: { url: 'https://ruagentic.org/mcp' } } },
            null,
            2,
          )}
        </pre>
        <p className="small muted">
          Host configuration formats vary. Select a remote HTTP MCP server when
          your host provides a setup screen.
        </p>
        <ul>
          <li>
            <code>discover_agentic_site</code> scans a public website and
            returns JSON, TXT, README, and listing text with a source report.
          </li>
          <li>
            <code>get_agentic_spec</code> reads the site and action
            specifications.
          </li>
          <li>
            <code>generate_agentic_profile</code> creates a ticket-contract
            starter.
          </li>
          <li>
            <code>validate_agentic_profile</code> checks supplied JSON and
            OpenAPI bindings.
          </li>
          <li>
            <code>audit_agentic_url</code> reads public HTTPS files without
            executing actions.
          </li>
        </ul>
      </section>
      <section className="example-section" id="webmcp">
        <h2>WebMCP page tools</h2>
        <p>
          The <Link href="/generate">generator</Link>,{' '}
          <Link href="/validate">validator</Link>, and{' '}
          <Link href="/lab">browser lab</Link> register tools when the browser
          supports <code>document.modelContext</code>. Regular controls work in
          other browsers. The browser lab is a simulation; the hosted platform
          uses HTTP and PostgreSQL.
        </p>
      </section>
      <section className="example-section" id="a2a">
        <h2>A2A testing agent</h2>
        <p>
          The agent accepts recovery tests and read-only URL audits, then saves
          a JSON artifact under a persistent task ID. Create a private session
          token in the <Link href="/platform">platform</Link> first.
        </p>
        <pre className="code-block">{`AgentCard: https://ruagentic.org/.well-known/agent-card.json
Endpoint:  https://ruagentic.org/a2a
Binding:   JSON-RPC · A2A 1.0
Headers:   Authorization: Bearer <your-session-token>
           A2A-Version: 1.0
           Content-Type: application/json

{
  "jsonrpc": "2.0", "id": "test-1", "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "a-unique-message-id", "role": "ROLE_USER",
      "parts": [{"data": {"kind": "recovery", "scenario": "response-lost"}}]
    }
  }
}`}</pre>
        <p>
          Use <code>GetTask</code> with the returned task ID to retrieve its
          persisted result. These bounded tests do not offer streaming, push
          notifications, or cancellation after dispatch.
        </p>
      </section>
      <section className="example-section" id="agent-auth">
        <h2>Agent Auth provider</h2>
        <p>
          Register an autonomous agent with the official client. The provider
          grants only profile validation and isolated synthetic recovery
          testing. Agents receive a one-hour grant and have a one-day maximum
          lifetime.
        </p>
        <pre className="code-block">{`import { AgentAuthClient, MemoryStorage } from '@auth/agent';

const client = new AgentAuthClient({
  storage: new MemoryStorage(), urls: ['https://ruagentic.org']
});
const connection = await client.connectAgent({
  provider: 'https://ruagentic.org',
  mode: 'autonomous',
  capabilities: ['agentic.sandbox.run'],
  name: 'My recovery client'
});
try {
  const report = await client.executeCapability({
    agentId: connection.agentId,
    capability: 'agentic.sandbox.run',
    arguments: { scenario: 'response-lost' }
  });
  console.log(report);
} finally {
  await client.disconnectAgent(connection.agentId);
}`}</pre>
        <p>
          Discovery lives at <code>/.well-known/agent-configuration</code>. The
          implementation uses the official Better Auth plugin, verifies signed
          requests, and stores grants and replay protection in PostgreSQL. Human
          account delegation and payments are outside this sandbox.
        </p>
        <div className="doc-utilities">
          <Link href="/platform">
            Verify registration, execution, and revocation →
          </Link>
        </div>
      </section>
      <section className="example-section">
        <h2>Install the adoption tools</h2>
        <p>
          Install the CLI from{' '}
          <a href="https://www.npmjs.com/package/ruagentic">npm</a> with Node
          24, then initialize or validate a profile.
        </p>
        <pre className="code-block">{`npm install -g ruagentic@1.3.0
agentic init --origin https://your-service.example
agentic text agentic.json
agentic validate agentic.json openapi.json`}</pre>
        <p>
          The repository includes a reusable{' '}
          <a href="https://github.com/sam1siam/agentic/blob/main/action.yml">
            GitHub Action
          </a>{' '}
          and an{' '}
          <a href="https://github.com/sam1siam/agentic/tree/main/skills/agentic-adoption">
            adoption skill
          </a>
          .
        </p>
        <pre className="code-block">{`- uses: sam1siam/agentic@v1.3.0
  with:
    profile: agentic.json
    openapi: openapi.json`}</pre>
      </section>
      <div className="notice">
        Action Profile 1.0.0 and tools 1.3.0 provide the contract and
        connections. Test reports record observed behavior; they do not certify
        another service.
      </div>
    </main>
  );
}
