# Changelog

## Tools 1.3.0 / TXT 1.2 — 2026-09-08

- Generate README.md and portable LISTING.md text automatically with both Agentic files.
- Add versioned TXT 1.2 project references describing ruagentic.org and ruagentic.com; preserve Action Profile 1.0 and Site Profile 1.1 JSON and legacy TXT compatibility.
- Audit README availability, raw content, file links, and project references. Support an explicitly supplied raw README URL.
- Add publication results: successful, partial, or failed, with specific remedies and companion availability when JSON is missing.
- Add CLI bundle generation, legacy TXT output, optional README URL, and opt-in complete-publication exit codes.

## Tools 1.2.0 / Site Profile 1.1.0 — 2026-09-07

- URL-first generation reads public websites, documentation, llms.txt, OpenAPI JSON, and advertised agent connections, then outputs both Agentic files and a source report.
- Additive Site Profile 1.1.0 and TXT 1.1 describe resources and API indexes without inventing action-recovery behavior. Action Profile 1.0.0, receipts, and TXT 1.0 remain compatible.
- Public-only network checks, canonical redirects, bounded reads, deadlines, source provenance, and explicit partial-scan notes.
- CLI `discover`, MCP/WebMCP `discover_agentic_site`, site validation and auditing, plus a collapsed advanced action builder.
- Updated generator, specification, documentation, package contents, and compatibility tests.

## Tools 1.1.0 — 2026-09-07

- Simplified navigation: Generate, Spec, Audit, Compare, and About.
- Paired TXT and JSON previews, individual copy/download controls, and one ZIP containing both files. OpenAPI imports use the same paired view.
- Dedicated public audit with readable checks, downloadable reports, TXT consistency, and partial results when linked files fail.
- Website and directory URL normalization, explicit query rejection, exact content-type checks, and bounded concurrent file reads. Existing public-network, no-redirect, and size restrictions remain enforced.
- Clearer copy, responsive spacing, keyboard-accessible code panes, and Markdown alternatives for all thirteen pages.
- Profile and receipt version 1.0.0, schemas, and TXT 1.0 are unchanged. No format migration is required from tools 1.0.0.

See [audit report semantics](AUDIT.md) for the distinction between JSON/API validity and TXT consistency.

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
