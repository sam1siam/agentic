# Compare Agentic with related formats

Agentic describes how to check the outcome of a service action. It can sit alongside documentation indexes, coding instructions, API descriptions, and tool protocols.

| Format                                                            | Main purpose                                                              | Relationship to Agentic                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [llms.txt](https://llmstxt.org/)                                  | Direct agents to useful documentation and site guidance.                  | Link to Agentic files and integration documentation.                                                                    |
| [AGENTS.md](https://agents.md/)                                   | Give coding agents instructions for working in a repository.              | Explain how to implement or test Agentic in that repository.                                                            |
| [agents.txt / agents.json](https://agents-txt.com/spec/)          | Publish a capability manifest with discovery and integration information. | Agentic focuses on an action's request identity, status, evidence, and recovery contract.                               |
| [OpenAPI](https://spec.openapis.org/oas/latest.html)              | Describe an HTTP API's operations, parameters, and responses.             | Agentic 1.0 binds to a supported subset of OpenAPI 3.1 operations.                                                      |
| [MCP](https://modelcontextprotocol.io/docs/getting-started/intro) | Connect AI applications to tools and context.                             | A tool can use Agentic to check an action's outcome. Agentic also provides MCP tools for generating and auditing files. |

## The Agentic pair

`agentic.json` is authoritative: it names the service origin and actions, links their submission/status/verification operations, and declares evidence checks and bounded recovery rules. The optional `agentic.txt` index is generated from that JSON and links to it. It never overrides the contract or grants permission.

These comparisons describe the formats' roles, not a ranking or a guarantee about every implementation. Agentic does not replace authentication, authorization, durable storage, or service-side duplicate prevention.

[Generate both files](https://ruagentic.org/generate/) · [Read the specification](https://ruagentic.org/spec/) · [Audit published files](https://ruagentic.org/audit/)
