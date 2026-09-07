# MCP, WebMCP, A2A, and Agent Auth

Agentic 0.1 describes action tracking and recovery through OpenAPI. Discovery, tool transport, agent messaging, and authorization keep their own protocols. Adding a declaration does not implement a protocol.

## Current implementation

| Protocol | Available | Not implemented |
| --- | --- | --- |
| MCP | Local stdio server: specification, profile generation, and profile validation. Tested with the official TypeScript client. | Public HTTP MCP endpoint, mutation tools, host installation. |
| WebMCP | Generator, validator, and recovery lab register page tools when the browser exposes the supported API. | Support in every browser or every agent host. |
| A2A | Generator emits AgentCard URL declarations in agents.txt and agents.json. | Hosted AgentCard, messaging endpoint, or task execution. |
| Agent Auth | Generator emits the agent-auth authorization declaration and discovery URL. | Registration, cryptographic identity verification, grants, human approval, or revocation. |

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

- `get_agentic_spec`: returns the specification bundled with the checkout.
- `generate_agentic_profile`: takes `origin` and optional `actionId`, returns the ticket starter and validation result.
- `validate_agentic_profile`: takes JSON text in `profile` and optional `openapi`. Limits: 64 KiB and 256 KiB respectively.

The server uses the official MCP TypeScript SDK 2.0.0. Tools read local bundled documentation or process supplied text. They never fetch a URL, execute the ticket action, store inputs, or download a file. The host remains responsible for permissions and its own logging. No credentials are required for these local tools.

## Use WebMCP page tools

Open /generate/, /validate/, or /lab/ in a compatible browser. Each page registers its tool through `document.modelContext.registerTool` when available and unregisters on unmount using an abort signal. This follows the current WebMCP draft; earlier browser experiments may expose a different API. The regular page controls work without WebMCP.

The generator returns profile data without changing the page. Validation and lab tools update the visible result. The lab remains a browser simulation, not an HTTP pilot. Registration is conditional and is not a claim that a particular agent host can invoke these tools.

The site's /agents.txt and /agents.json advertise these three pages from one source configuration. They omit MCP, A2A, and authorization blocks because those public services are not running here.

## Generate companion discovery files

In the [generator](https://ruagentic.org/generate/), select **Discovery files**, enter the service origin, and select only implemented capabilities. The output follows the agents.txt project's v1.0 field names:

- MCP: the HTTPS Streamable HTTP server URL.
- WebMCP: the URL of a page that registers browser tools.
- A2A: the AgentCard URL, not the message endpoint.
- Agent Auth: a same-origin discovery URL, normally `/.well-known/agent-configuration`.

Copy or download agents.txt, agents.json, and the llms.txt starter separately. Optional protocols are omitted by default. This generator checks input syntax and cross-file URL consistency; it does not fetch endpoints or certify external protocol conformance. Use the upstream schemas and validators before publishing. The llms.txt starter assumes /docs/ and /agentic.json exist; edit its links if your deployment differs.

Do not add protocol fields to agentic.json: unknown fields are rejected by the 0.1 schema. There is no registered Agentic directive in agents.txt. Pass the action profile URL explicitly or link it from documentation.

## Implement A2A and Agent Auth

For A2A, deploy an implementation using the official SDK and publish an AgentCard matching its exact protocol version, bindings, skills, and security requirements. Test message and task interactions before advertising the card. An AgentCard alone does not provide a working agent. ruagentic.org does not currently host an A2A agent.

For Agent Auth, implement the server flow and persistent identity/grant storage described by the upstream protocol. Validate signatures, audience, expiry, permissions, approval, and revocation before protecting any action with it. Scope the Agentic ledger by the authenticated principal and environment. Renewing credentials must not create a new logical request or trigger a repeat write. A revoked agent must not bypass authorization through a status or resource read.

The documentation site has no account system or protected customer actions, so it does not publish a pretend authorization service. A real authentication pilot needs a concrete service and its permission model.

## Primary references

- [MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server)
- [WebMCP draft](https://webmachinelearning.github.io/webmcp/)
- [A2A specification](https://a2a-protocol.org/latest/specification/)
- [Agent Auth discovery](https://agent-auth-protocol.com/docs/discovery)
- [Agent Auth server implementation](https://agent-auth-protocol.com/docs/server)
- [agents.txt specification and source](https://github.com/agents-txt/agents-txt)
- [agents.txt generator](https://agents-txt.com/demo/generate/)

References reviewed on 2026-09-07. These projects have not endorsed Agentic or confirmed compatibility.
