# Changelog

## Generator and protocol tooling update — 2026-09-07

- Add space between code, buttons, headings, and example explanations; simplify instructional copy.
- Add companion agents.txt, agents.json, and llms.txt generation with optional MCP, WebMCP, A2A, and Agent Auth declarations.
- Add a local MCP stdio server using the official SDK and a real client/server integration test.
- Add a WebMCP generation tool and a protocol status / setup guide.

Agentic protocol fields and action-execution behavior are unchanged. A2A and Agent Auth are discovery options, not hosted services.

## 0.1.0-draft.2 — 2026-09-07

- New ink-and-blue visual identity and downloadable bracket/check logo.
- Profile generator in the browser and a local initializer that refuses overwrites.
- Documentation hub, quick start, examples, FAQ, integration guide, and page Markdown alternates.
- Public pilot enrollment and an external-client compatibility runner.
- Pilot evidence registry distinguishes project-authored reference checks from independent implementations.
- Close SQLite service connections after each transaction so the in-process pilot harness releases database files on Windows.

The profile version remains `0.1.0-draft`. No protocol fields or runtime execution rules changed in this release.

## 0.1.0-draft.1 — 2026-09-07

- Initial experimental specification, profile and receipt schemas.
- Node and Python reference clients, durable SQLite ledgers, and a local HTTP ticket service.
- Recovery lab, JSON validator, governance, prior-art review, and pilot kit.

See [GitHub releases](https://github.com/sam1siam/agentic/releases) for published artifacts and checks. A draft is not a stable interoperability commitment.
