# MCP, WebMCP, A2A, and Agent Auth

Tools 1.3.0 generation results include agentic.json, TXT 1.2, README.md and LISTING.md. Hosted `audit_agentic_url` accepts optional `readmeUrl` and returns publication status plus remedies without changing JSON/API `valid` semantics. [Publication specification](https://ruagentic.org/docs/PUBLICATION.md).

Tools 1.3.0 expose `discover_agentic_site` to local and hosted MCP and the generator's conditional WebMCP tools. It accepts `{ "url": "https://your-site.com" }` and returns JSON, TXT, README, and listing text with a discovery report. It reads public documents and records advertised protocol URLs without invoking discovered tools. [Site Profile 1.1](https://ruagentic.org/docs/SITE-PROFILE.md) can list these links; the 1.0 action schema remains unchanged.

Agentic 1.0 describes action tracking and recovery through OpenAPI. Discovery, tool transport, agent messaging, and authorization keep their own protocols. Adding a declaration does not implement a protocol.

## Current implementation

| Protocol   | Available                                                                                                          | Not implemented                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| MCP        | Public Streamable HTTP at `/mcp`, plus local stdio. Specification, generation, validation and hosted URL auditing. | Hosted mutation tools.                                         |
| WebMCP     | Generator, validator, and recovery lab register page tools when the browser exposes the supported API.             | Support in every browser or every agent host.                  |
| A2A        | Hosted A2A 1.0 JSON-RPC testing agent, PostgreSQL tasks and report artifacts.                                      | Streaming, push notifications and cancellation after dispatch. |
| Agent Auth | Official provider: registration, signatures, autonomous grants, execution, replay protection and revocation.       | Human account delegation and payments.                         |

Use the [connection guide](https://ruagentic.org/connect/) for client examples and the [platform](https://ruagentic.org/platform/) for live verification. Hosted services use one PostgreSQL-backed testing engine. See [platform operations and retention](https://ruagentic.org/docs/PLATFORM.md).

## Public endpoints

- MCP: `https://ruagentic.org/mcp`. Five read-only tools; no token required. The additional hosted tool is `audit_agentic_url` with `{ "url": "https://your-service.example/agentic.json" }`.
- A2A card: `https://ruagentic.org/.well-known/agent-card.json`; endpoint: `https://ruagentic.org/a2a`. Create a private session token in the platform. Send `Authorization: Bearer <token>` and `A2A-Version: 1.0`. `SendMessage` accepts a data part with `{ "kind": "recovery", "scenario": "response-lost" }` or `{ "kind": "audit", "url": "...", "readmeUrl": "https://raw.example/README.md" }` (readmeUrl is optional). Retrieve results with `GetTask` and the returned ID.
- Agent Auth: `https://ruagentic.org/.well-known/agent-configuration`. Configure the official `@auth/agent` client with `urls: ['https://ruagentic.org']` for direct discovery. Autonomous capabilities are `agentic.validate` and `agentic.sandbox.run`.

Agent Auth uses inline public keys, one-hour grants, a one-day maximum agent lifetime, persistent replay detection, and revocation checks. Remote JWKS URLs are not supported. The verification flow registers an agent, executes validation, revokes it and tests rejection of an unused signed token. It does not create a human account.

## Connect the local MCP server

Clone the repository and run `npm ci` with Node 24. Configure your MCP host with the absolute path to this checkout:

```json
{
  "mcpServers": {
    "agentic": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/agentic/reference/mcp/server.ts"]
    }
  }
}
```

On Windows, use a JSON-escaped absolute path such as `C:\\projects\\agentic\\reference\\mcp\\server.ts`. The host must be able to find Node 24; use its full executable path if necessary. Host configuration formats vary; the example uses the common `mcpServers` convention. Do not use `npm run mcp` as the host command: npm writes a banner to stdout. For a terminal-only smoke check, `npm run --silent mcp` starts the same stdio server and waits for a client.

Tools:

- `discover_agentic_site`: takes a public website `url` and returns JSON, TXT, README, and listing text plus a source report.
- `get_agentic_spec`: returns the site and action specifications bundled with the checkout.
- `generate_agentic_profile`: takes `origin` and optional `actionId`, returns the ticket starter and validation result.
- `validate_agentic_profile`: takes JSON text in `profile` and optional `openapi`. Limits: 64 KiB and 256 KiB respectively.

The server uses the official MCP TypeScript SDK 2.0.0. Specification, manual generation, and validation tools work on bundled documents or supplied text. Discovery reads bounded public HTTPS sources. None executes the ticket action or writes local files. The host remains responsible for permissions and its own logging. No credentials are required for these local tools.

## Use WebMCP page tools

Open /generate/, /validate/, or /lab/ in a compatible browser. Each page registers its tool through `document.modelContext.registerTool` when available and unregisters on unmount using an abort signal. This follows the current WebMCP specification; earlier browser implementations may expose a different API. The regular page controls work without WebMCP.

Website discovery updates the visible generator and returns all four publication files with its report. The advanced action-template tool returns profile data without changing the page. Validation and lab tools update the visible result. The lab remains a browser simulation, not an HTTP execution test. Registration is conditional and is not a claim that a particular agent host can invoke these tools.

## Documentation and direct connections

Use the endpoint URLs above and the [connection guide](https://ruagentic.org/connect/) to configure a client. A2A publishes its own AgentCard, and Agent Auth publishes its own provider discovery document. Neither requires a separate agents.txt or agents.json manifest on this site.

The generated /agentic.txt index links to the live synthetic service profile at /agentic.json. It is a reading aid, not a protocol or authorization manifest. The optional /llms.txt index links to Agentic documentation and connection instructions. In the [generator](https://ruagentic.org/generate/), expand **Optional: create an llms.txt documentation index** to create an llms.txt starter for your service. Edit its /docs/, /agentic.txt, and /agentic.json links to match your published files. The generator makes no network calls.

Action Profile 1.0 remains a separate action contract; its schema rejects added protocol fields. Site Profile 1.1 uses its versioned resources array for descriptive protocol links. Pass the profile URL explicitly or link it from documentation.

## Implement A2A and Agent Auth

For another service, deploy an A2A implementation using the official SDK and publish an AgentCard matching its exact protocol version, bindings, skills, and security requirements. Test message and task interactions before advertising the card. ruagentic.org's testing agent uses the official JavaScript SDK and persists caller-scoped tasks and artifacts.

For Agent Auth, implement the server flow and persistent identity/grant storage described by the upstream protocol. Validate signatures, audience, expiry, permissions, approval, and revocation before protecting any action with it. Scope the Agentic ledger by the authenticated principal and environment. Renewing credentials must not create a new logical request or trigger a repeat write. A revoked agent must not bypass authorization through a status or resource read.

The hosted sandbox provides the concrete service for autonomous authorization testing. It isolates agents by identity and limits grants to validation and synthetic recovery tests. A customer-facing human delegation integration would require that customer's account and approval model.

## Primary references

- [MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [A2A specification](https://a2a-protocol.org/latest/specification/)
- [Agent Auth discovery](https://agent-auth-protocol.com/docs/discovery)
- [Agent Auth server implementation](https://agent-auth-protocol.com/docs/server)

References reviewed on 2026-09-07. These projects have not endorsed Agentic or confirmed compatibility.
