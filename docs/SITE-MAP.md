# Published routes and capabilities

This inventory distinguishes documentation and browser tools from the local reference API.

| Route | What is available |
| --- | --- |
| / | Project overview and complete starting profile |
| /spec/ | Human reading guide to the normative draft |
| /generate/ | Action profile and companion discovery generators, copy/download, conditional WebMCP tool |
| /examples/ | Profile, OpenAPI, and synthetic receipt examples |
| /validate/ | Local structure and optional OpenAPI binding validation |
| /lab/ | In-memory recovery comparison; no production API calls |
| /docs/ | Guide index, quick start, FAQ, and reference links |
| /adopt/ | Pilot enrollment, evidence policy, and comparison results |
| /llms.txt | Concise Markdown documentation index |
| /agents.txt and /agents.json | Discovery declarations for the three conditional WebMCP pages |
| /llms-full.txt | Optional combined documentation bundle |
| /docs/*.md | Plain Markdown source documents |
| /schemas/*.json | Versioned profile and receipt schemas |
| /examples/tickets/* | Static illustrative example files |
| /pilots/registry.json | Project-authored references and independently reviewed pilot status |
| /brand/*.svg | Downloadable identity assets |
| /sitemap.xml | Human page inventory |
| /robots.txt | Public crawl guidance |

Every human route has an `index.md` alternative. HTML metadata exposes `rel="alternate"` with `type="text/markdown"`; the deployment's Link header also identifies the relevant alternate and `/llms.txt` as `describedby`.

The documentation website has no ticket-creation endpoint, hosted MCP endpoint, A2A agent, Agent Auth server, payment system, or production Agentic execution backend. A separate local stdio MCP server provides specification, generation, and validation tools; see [Protocol setup](PROTOCOLS.md). The local Python reference server serves `/agentic.json`, `/openapi.json`, `/tickets`, `/requests/{requestId}`, and `/tickets/{ticketId}` on loopback only. Optional WebMCP tools are registered on /generate/, /validate/, and /lab/ where supported; broad runtime compatibility has not been verified.
