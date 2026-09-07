# Published routes and capabilities

This inventory distinguishes documentation and browser tools from the local reference API.

| Route | What is available |
| --- | --- |
| / | Project overview and complete starting profile |
| /spec/ | Human reading guide to the normative draft |
| /generate/ | Local browser profile generator and download |
| /examples/ | Profile, OpenAPI, and synthetic receipt examples |
| /validate/ | Local structure and optional OpenAPI binding validation |
| /lab/ | In-memory recovery comparison; no production API calls |
| /docs/ | Guide index, quick start, FAQ, and reference links |
| /adopt/ | Pilot enrollment, evidence policy, and comparison results |
| /llms.txt | Concise Markdown documentation index |
| /llms-full.txt | Optional combined documentation bundle |
| /docs/*.md | Plain Markdown source documents |
| /schemas/*.json | Versioned profile and receipt schemas |
| /examples/tickets/* | Static illustrative example files |
| /pilots/registry.json | Project-authored references and independently reviewed pilot status |
| /brand/*.svg | Downloadable identity assets |
| /sitemap.xml | Human page inventory |
| /robots.txt | Public crawl guidance |

Every human route has an `index.md` alternative. HTML metadata exposes `rel="alternate"` with `type="text/markdown"`; the deployment's Link header also identifies the relevant alternate and `/llms.txt` as `describedby`.

The documentation website has no ticket-creation endpoint, MCP server, payment system, or production Agentic execution backend. The local Python reference server serves `/agentic.json`, `/openapi.json`, `/tickets`, `/requests/{requestId}`, and `/tickets/{ticketId}` on loopback only. An optional WebMCP experiment exposes local page tools where supported; broad runtime compatibility has not been verified.
