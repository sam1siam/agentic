# Changelog

## 0.1.0-draft.6 — 2026-09-07

- Add the optional agentic.txt action index, generated from a validated JSON profile. Document its format and JSON authority.
- Add paired browser previews/downloads, TXT in OpenAPI starter ZIPs, and file pairs in MCP/WebMCP generator responses.
- Add `agentic text` and `--check` for existing profiles, with same-origin URL checks, escaped summaries, and overwrite protection.
- Publish live root JSON/TXT files for the synthetic service, a local HTTP TXT endpoint, and an illustrative generated file.
- Keep llms.txt and the existing protocol endpoints. The Agentic JSON schema and action-execution semantics are unchanged.

## 0.1.0-draft.5 — 2026-09-07

- Remove agents.txt and agents.json publishing, generator outputs, and auditor requests. Keep llms.txt as an optional documentation index.
- Simplify the generator to an Agentic action profile, OpenAPI import, and an optional llms.txt starter.
- Preserve direct MCP, WebMCP, A2A, and Agent Auth connections and the existing action-profile schema.
- Update the bundled CLI auditor to match the hosted auditor. Older release artifacts remain historical snapshots.

## 0.1.0-draft.4 — 2026-09-07

- Publish `ruagentic@0.1.0-draft.4` to npm with the same tarball as the GitHub release; verify a fresh registry installation and update the installation guides.
- Refresh the CLI documentation, downloadable agent skill, and generated starter README for direct use and compatibility testing.
- Correct the conformance guide to distinguish hosted MCP, A2A, Agent Auth, and PostgreSQL coverage from remaining implementation gaps.
- Include the production getting-started flow and retired enrollment status in a versioned release.
- Preserve older release artifacts; the Agentic profile format and action-execution behavior are unchanged.

## Direct-use production launch — 2026-09-07

- Replace pilot enrollment and cohort counters with a getting-started page for generators, hosted tools, CLI installation, the GitHub Action, and agent skill.
- Retire the pilot issue form and outreach program. Keep existing documentation links working and preserve historical records as archived.
- Publish the compatibility guide and `npm run conformance` command; retain the old command as an alias.
- Update human documentation and agent-readable discovery to the direct-use flow. The profile version and runtime behavior are unchanged.

## Site spacing and outreach review — 2026-09-07

- Give every action row 24px of separation from preceding copy, inputs, selects, or code; preserve 12px gaps between buttons.
- Allow button labels to wrap and keep 20px between platform actions and their explanatory text.
- Record the Mastra triage notice, Pydantic automated assessment, and CrewAI participant comment in the [outreach feedback log](https://github.com/sam1siam/agentic/blob/main/pilots/FEEDBACK.md). None establishes an independent pilot.

## 0.1.0-draft.3 — 2026-09-07

- Hosted recovery sandbox with real HTTP, PostgreSQL state, six scenarios and durable restart/resume.
- Read-only public HTTPS auditor with same-origin OpenAPI binding checks and network restrictions.
- Public MCP tools and A2A 1.0 testing tasks with persisted evidence artifacts.
- Official Agent Auth provider with autonomous registration, grants, signed execution, persistent replay checks and revocation.
- Private session history, downloadable versioned reports, optional share links and rate limits.
- OpenAPI import and downloadable starter ZIP, standalone CLI tarball, reusable GitHub Action and adoption skill.
- Free Neon database connected to the Vercel deployment; migrations, direct connections, secret-protected cleanup and runtime logging.

Validation: 28 automated checks passed, including real HTTP/PostgreSQL and official MCP, A2A and Agent Auth clients. Production checks passed on ruagentic.org; see the [hosted verification record](https://ruagentic.org/reports/platform-live.json). The website exports ten human routes with Markdown alternatives.

The Agentic profile remains `0.1.0-draft`. Tests are project-authored, and no independent adoption or certification is claimed. Human account delegation and payments are not part of this sandbox.

## Generator and protocol tooling update — 2026-09-07

- Add space between code, buttons, headings, and example explanations; simplify instructional copy.
- Add companion agents.txt, agents.json, and llms.txt generation with optional MCP, WebMCP, A2A, and Agent Auth declarations.
- Add a local MCP stdio server using the official SDK and a real client/server integration test.
- Add a WebMCP generation tool and a protocol status / setup guide.

Agentic protocol fields and action-execution behavior are unchanged. At that release, A2A and Agent Auth were discovery options. Hosted implementations were subsequently added in draft.3.

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
