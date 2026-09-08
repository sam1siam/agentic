# Where Agentic fits

Agentic provides a structured site profile and an optional action-recovery contract. It works with existing documentation and protocols.

| Format | Purpose | Relationship to Agentic |
| --- | --- | --- |
| [llms.txt](https://llmstxt.org/) | Documentation context and links. | The generator reads it as a source; keep it as a documentation index. |
| [AGENTS.md](https://agents.md/) | Instructions for coding agents in a repository. | Continue using it for setup, tests, and conventions. |
| [agents.txt / agents.json](https://agents-txt.com/spec/) | Website capability and protocol declarations. | Site discovery overlaps. Agentic has its own schema and additionally defines a separate action-recovery contract; neither convention is required by the other. |
| [OpenAPI](https://spec.openapis.org/oas/latest.html) | HTTP operations, parameters, responses, and authentication. | Site profiles index documented operations; action profiles bind a supported OpenAPI 3.1 subset. The API description remains authoritative. |
| [MCP](https://modelcontextprotocol.io/docs/getting-started/intro) | Tool and resource access for AI applications. | Site profiles can list advertised MCP URLs. Agentic's scanner never invokes discovered tools. |

`agentic.txt` is generated from `agentic.json` and links back to it. A site profile lists resources and API operations. An action profile defines submission, status lookup, result evidence, and bounded recovery. Neither profile grants authorization or installs protocol support.

Start with the [generator](https://ruagentic.org/generate/) and [specification](https://ruagentic.org/spec/). See [prior work](https://ruagentic.org/docs/PRIOR-ART.md) for related techniques and specifications.
