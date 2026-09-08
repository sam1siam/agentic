# Published routes and capabilities

`/README.md` serves this project's public README. Generation now includes README.md and LISTING.md; the audit accepts an optional raw README URL and provides publication status and remedies. See [Publication](PUBLICATION.md).

The primary `/generate/` flow scans a website and produces JSON, TXT, README, and listing text through `POST /api/platform/discover`. [Site Profile 1.1](SITE-PROFILE.md) and `/schemas/site-1.1.schema.json` describe the output. Manual action configuration remains under Advanced.

This inventory distinguishes browser tools, hosted services and the separate local reference API.

| Route                            | What is available                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| /                                | Project overview and complete starting profile                                                          |
| /audit/                          | Public website or JSON URL checks with readable results and report download                             |
| /compare/                        | Comparison with documentation, repository, capability, API, and tool formats                            |
| /about/                          | Purpose, maintainers, requirements, and contribution paths                                              |
| /spec/                           | Human reading guide to the normative specification                                                      |
| /generate/                       | Action profile, OpenAPI import and optional llms.txt generators, copy/download, conditional WebMCP tool |
| /examples/                       | Profile, OpenAPI, and synthetic receipt examples                                                        |
| /validate/                       | Local structure and optional OpenAPI binding validation                                                 |
| /lab/                            | In-memory recovery comparison; no production API calls                                                  |
| /docs/                           | Guide index, quick start, FAQ, and reference links                                                      |
| /adopt/                          | Getting started, CLI installation, GitHub Action, and integration guides                                |
| /platform/                       | Hosted recovery tests, URL auditor, Agent Auth verification and private/shared reports                  |
| /connect/                        | Public MCP, WebMCP, A2A and Agent Auth client setup                                                     |
| /mcp                             | Read-only Streamable HTTP MCP tools                                                                     |
| /a2a                             | Authenticated A2A 1.0 JSON-RPC testing tasks                                                            |
| /.well-known/agent-card.json     | A2A card matching the hosted agent                                                                      |
| /.well-known/agent-configuration | Live autonomous Agent Auth provider discovery                                                           |
| /api/platform/*                  | Isolated sandbox, auditing, sessions and evidence reports                                               |
| /api/auth/*                      | Official Agent Auth registration, grants, execution and revocation                                      |
| /agentic.txt                     | Generated action index for the hosted synthetic ticket service                                          |
| /agentic.json                    | Authoritative JSON profile of that service                                                              |
| /llms.txt                        | Concise Markdown documentation index                                                                    |
| /llms-full.txt                   | Optional combined documentation bundle                                                                  |
| /docs/*.md                       | Plain Markdown source documents                                                                         |
| /schemas/*.json                  | Versioned profile and receipt schemas                                                                   |
| /examples/tickets/*              | Static illustrative example files                                                                       |
| /brand/*.svg                     | Downloadable identity assets                                                                            |
| /sitemap.xml                     | Human page inventory                                                                                    |
| /robots.txt                      | Public crawl guidance                                                                                   |

Every human route has an `index.md` alternative. HTML metadata exposes `rel="alternate"` with `type="text/markdown"`; the deployment's Link header also identifies the relevant alternate and `/llms.txt` as `describedby`.

The hosted runtime uses PostgreSQL and Node 24 Vercel Functions; see [platform operations](PLATFORM.md). It provides synthetic testing, not customer actions or payments. The separate local Python reference server serves `/agentic.txt`, `/agentic.json`, `/openapi.json`, `/tickets`, `/requests/{requestId}`, and `/tickets/{ticketId}` on loopback only. Optional WebMCP tools remain conditional on browser support.
