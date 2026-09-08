# Changelog

## 1.0.0 — 2026-09-07

Agentic 1.0.0 publishes the action profile, supporting tools, and hosted services as a versioned release.

- Authoritative `agentic.json` profiles and optional generated `agentic.txt` action indexes, with `Agentic-Text: 1.0`.
- Versioned `agentic-1.0.schema.json` and `receipt-1.0.schema.json` schemas for validation, OpenAPI operation binding, and verified outcome receipts.
- CLI generation, validation, public URL auditing, JSON/TXT consistency checks, and local MCP tools.
- Browser JSON/TXT generation and downloads, OpenAPI starter bundles, validation, and a recovery simulation.
- Hosted HTTP/PostgreSQL recovery checks, private report history and sharing, MCP, A2A, WebMCP page hooks, and Agent Auth verification.
- Node and Python consumers, a local HTTP/SQLite service, a compatibility runner, a GitHub Action, and an integration skill.
- Updated documentation, installation instructions, package metadata, and public release terminology.

Use profiles that declare `"agentic": "1.0.0"` with the 1.0 schemas and tools. When updating an existing integration, regenerate its TXT index and rerun profile, binding, and behavioral checks. Follow the [migration guide](MIGRATION.md) to update profile and receipt identifiers for new work while retaining the original snapshots and installed compatible clients for unfinished requests. Do not relabel a saved in-flight request or repeat its write during migration.

Compatibility evidence applies to the exact versions and scenarios recorded by each run. This release does not relabel earlier measurements as 1.0.0 results. See [GitHub releases](https://github.com/sam1siam/agentic/releases/tag/v1.0.0) for versioned artifacts and release verification.
