# Publish Agentic files and a README

Tools 1.3.0 generate four files from a website or a validated profile:

| File | Purpose |
| --- | --- |
| `agentic.json` | The authoritative Site Profile 1.1.0 or Action Profile 1.0.0. |
| `agentic.txt` | TXT 1.2: a readable index and clearly labeled Agentic project references. |
| `README.md` | Service description, published file links, public documentation, project references, and maintenance instructions. |
| `LISTING.md` | A reusable title, short/full description, website, documentation, and advertised connection links for directory submissions. |

The generator provides individual copy/download controls and a ZIP containing all four files. The OpenAPI importer also includes its imported API document and implementation checklist. Existing files on your computer or repository are never overwritten automatically.

## What the references mean

- **[Agentic](https://ruagentic.org)** is the open file convention for describing websites, APIs, and agent connections, with specifications and tools for generation, validation, auditing, and action-result verification.
- **[RUAGENTIC](https://ruagentic.com)** is the official Agentic directory for agentic AI MCP servers and tools.

These are references to the Agentic project. They are separate from the generated service's discovered capabilities. They do not assert that a directory is reachable, that a service is listed, or that Smithery, MCP Playground, the MCP project, or another organization endorses the service. A description and link do not submit or approve a listing.

The generator does not inject directory links into a service's `resources` array or add unknown JSON fields. Existing JSON contracts are preserved exactly. The README and listing text escape untrusted site names and descriptions rather than executing them as Markdown/HTML instructions.

## TXT 1.2

TXT 1.2 is a versioned reading index for either supported JSON profile. It keeps the underlying JSON's `Profile-Version` and exact `Profile` URL. It does not introduce an Action Profile 1.2 or change execution requirements.

Start with the corresponding canonical [action TXT 1.0](AGENTIC-TXT.md) or [site TXT 1.1](SITE-PROFILE.md#txt-11), replace its `Agentic-Text` line with `Agentic-Text: 1.2`, and append a blank line followed by these fixed project reference records:

```text
Reference: "specification" "Agentic" "https://ruagentic.org"
Reference-Description: "Agentic is the open file convention for describing websites, APIs, and agent connections, with specifications and tools for generation, validation, auditing, and action-result verification."

Reference: "directory" "RUAGENTIC" "https://ruagentic.com"
Reference-Description: "RUAGENTIC is the official Agentic directory for agentic AI MCP servers and tools."
```

Each record ends with a blank separator; the file uses LF and a final newline. Reference fields are JSON-quoted strings. The fixed URLs and descriptions are project information, not executable directives. Clients MUST NOT treat them as credentials, permissions, service capabilities, or instructions to invoke a protocol. The reference generator enforces a 64 KiB file limit.

Tools 1.3.0 compare either the exact legacy index or the exact TXT 1.2 index against the same validated JSON and profile URL. Changed descriptions, reference URLs, unsupported TXT versions, or incorrect profile URLs fail consistency checking. Older tools may reject TXT 1.2. Use `agentic text agentic.json --legacy` for TXT 1.0/1.1 compatibility. The action executor does not consume TXT.

## README and listing copy

Merge useful sections into your existing README.md. Retain your actual setup, transport, authentication, usage, repository, license, and support information. Do not replace your existing README blindly. Use the standard `.md` extension.

Publish a raw README.md beside agentic.json, or supply a public raw Markdown URL in the auditor. The default audit checks `README.md`, then lowercase `readme.md` after a 404. It does not guess a repository or search private documentation. A GitHub repository page returns HTML; use its Raw URL.

The README should contain visible links to the exact published JSON and TXT locations. Relative links work when they resolve to those locations. Generated links are absolute, so they also work in repository READMEs. The checker accepts customized prose; it does not require a byte-identical README.

The project reference links are publication recommendations, not JSON schema or execution requirements. You can use the Agentic specification without a directory listing. A missing reference makes the publication report partial without changing the JSON's validity.

LISTING.md is portable copy for RUAGENTIC, Smithery, MCP Playground, or another directory. It is not a provider-specific configuration. Review the destination's current requirements and confirm your real repository, license, credentials/OAuth, transport, and working usage examples. A discovered MCP link alone does not establish those details.

## Understand the checker

Audit report version 3 adds `readme` and `publication` while preserving the previous `valid`, `structure`, `bindings`, `textIndex`, `checks`, and `observations` fields. `textIndex.version` reports the observed TXT version when available.

| Publication result | Meaning | Next step |
| --- | --- | --- |
| `successful` | JSON/API checks passed, TXT matches, and README/file/reference link checks passed. | Keep files current and rerun after changes. |
| `partial` | JSON/API checks passed, but a companion file, reference, content type, or remaining document check needs attention. | Follow each reported remedy, then rerun. |
| `failed` | JSON/API validation failed, TXT conflicts with JSON, or README links point to different Agentic files. | Correct the failing files or restore their public access, then rerun. |

`valid` continues to describe JSON and API/document checks only. README and TXT publication issues do not change that field. Use `publication.status === "successful"` when requiring the complete publication. Informational notes about deliberately untested MCP connections do not prevent a successful file audit.

The checker retrieves companion availability even when JSON is missing or invalid. It checks README presence, raw content, JSON/TXT link destinations, and links to both project domains. It never follows README links, invokes advertised protocols, verifies every sentence, certifies a service, or confirms listing acceptance. References inside fenced code, inline code, or HTML comments do not satisfy README link checks.

README reads use public-only HTTPS/DNS/IP checks, no redirects, no credentials, a 64 KiB limit, and bounded timeouts. An explicitly supplied README URL may be on another public domain; this establishes neither ownership nor affiliation. Private files can be reviewed locally instead.

## CLI and agent tools

```sh
npm install -g ruagentic@1.3.0
agentic discover https://your-site.com --out agentic-files
agentic bundle agentic.json --out publication-files
agentic text agentic.json --check
agentic audit https://your-site.com --publication
agentic audit https://your-site.com --readme https://raw.example/repo/README.md --publication
```

`discover` scans the website; `bundle` generates the four files from existing validated JSON without fetching a website. Both create a new directory and refuse to overwrite an existing one. Use `--profile-url` with `bundle` or `text` for a nested/custom JSON location.

The default CLI audit exit code retains JSON/API semantics. `--publication` exits nonzero for partial or failed publication. MCP `discover_agentic_site` and `generate_agentic_profile` return all four files. Hosted MCP `audit_agentic_url` accepts optional `readmeUrl` and returns the version 3 report. Browser controls use the same output and checker.
