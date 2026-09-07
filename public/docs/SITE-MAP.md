# Published routes and capabilities

This inventory distinguishes browser tools, hosted services and the separate local reference API.

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
| /platform/ | Hosted recovery tests, URL auditor, Agent Auth demo and private/shared reports |
| /connect/ | Public MCP, WebMCP, A2A and Agent Auth client setup |
| /mcp | Read-only Streamable HTTP MCP tools |
| /a2a | Authenticated A2A 1.0 JSON-RPC testing tasks |
| /.well-known/agent-card.json | A2A card matching the hosted agent |
| /.well-known/agent-configuration | Live autonomous Agent Auth provider discovery |
| /api/platform/* | Isolated sandbox, auditing, sessions and evidence reports |
| /api/auth/* | Official Agent Auth registration, grants, execution and revocation |
| /llms.txt | Concise Markdown documentation index |
| /agents.txt and /agents.json | Public MCP, A2A, Agent Auth and conditional WebMCP discovery |
| /llms-full.txt | Optional combined documentation bundle |
| /docs/*.md | Plain Markdown source documents |
| /schemas/*.json | Versioned profile and receipt schemas |
| /examples/tickets/* | Static illustrative example files |
| /pilots/registry.json | Project-authored references and independently reviewed pilot status |
| /brand/*.svg | Downloadable identity assets |
| /sitemap.xml | Human page inventory |
| /robots.txt | Public crawl guidance |

Every human route has an `index.md` alternative. HTML metadata exposes `rel="alternate"` with `type="text/markdown"`; the deployment's Link header also identifies the relevant alternate and `/llms.txt` as `describedby`.

The hosted runtime uses PostgreSQL and Node 24 Vercel Functions; see [platform operations](PLATFORM.md). It provides synthetic testing, not customer actions or payments. The separate local Python reference server still serves `/agentic.json`, `/openapi.json`, `/tickets`, `/requests/{requestId}`, and `/tickets/{ticketId}` on loopback only. Optional WebMCP tools remain conditional on browser support.
