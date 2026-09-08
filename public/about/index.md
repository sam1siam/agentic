# About Agentic

Agentic is an open file convention that helps agents find a website's documentation, APIs, and agent connections, and describes how supporting clients can verify completed actions.

`agentic.json` contains structured information. Its generated `agentic.txt` provides a readable index. The [generator](https://ruagentic.org/generate/) reads public sources and produces the pair. JSON remains authoritative.

[Site Profile 1.1](https://ruagentic.org/docs/SITE-PROFILE.md) describes discovered resources and documented operations. [Action Profile 1.0](https://ruagentic.org/docs/SPEC.md) defines request tracking and result checks for services that implement its contract. A website can publish a site profile without implementing action recovery. Files do not create endpoints, grant authorization, or automatically add support to every agent.

Maintained by [sam1siam](https://github.com/sam1siam), the specification, schemas, and tools are Apache-2.0. Tools 1.3.0 support both profile types. Install [ruagentic from npm](https://www.npmjs.com/package/ruagentic), use the CLI or browser tools, or contribute in the [repository](https://github.com/sam1siam/agentic).

## What the website runs

The website scanner and auditor read public HTTPS documents on the server. The advanced manual builder and OpenAPI importer run locally in the browser. The recovery service uses isolated synthetic ticket data; our root Agentic files describe that service. MCP, conditional WebMCP, A2A and Agent Auth connections are documented in [Protocol setup](https://ruagentic.org/docs/PROTOCOLS.md).

Reports are private to a browser session or agent owner and expire after 30 days. Share a report only through the explicit sharing controls. See [platform operations](https://ruagentic.org/docs/PLATFORM.md).

No enrollment or central registry is required. Report reproducible bugs, propose improvements, or submit focused pull requests. [Governance](https://ruagentic.org/docs/GOVERNANCE.md), [security](https://ruagentic.org/docs/SECURITY.md), and [brand assets](https://ruagentic.org/docs/BRAND.md) are public. The project does not claim independent adoption, certification, or standards-body endorsement.
