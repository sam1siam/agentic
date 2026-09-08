# Agentic Site Profile 1.1

For TXT 1.2 with project descriptions, automatically generated README.md/LISTING.md, and publication checks, see [the publication specification](https://ruagentic.org/docs/PUBLICATION.md). Tools 1.3.0 preserve this JSON schema and continue accepting its original TXT 1.1 index.

Version: 1.1.0. Released: 2026-09-07. License: Apache-2.0.

A site profile describes a website's public documentation, APIs, and advertised agent connections. A publisher can generate it from public sources without defining an executable action contract. Serve the JSON at `/agentic.json` and its generated text index at `/agentic.txt`.

This is an additive profile type. Action Profile 1.0.0 and receipt 1.0.0 retain their published requirements. A site profile is not an action profile and MUST NOT be passed to the action executor. A supporting client uses the linked API or protocol's own contract and authorization rules.

## Required JSON fields

The [site schema](https://ruagentic.org/schemas/site-1.1.schema.json) defines exact fields and limits. Unknown fields are rejected.

| Field | Meaning |
| --- | --- |
| `agentic` | Exactly `1.1.0`. |
| `type` | Exactly `site`; distinguishes descriptive site information from action execution contracts. |
| `origin` | Canonical HTTPS origin of the website. |
| `name` | Site name, up to 160 characters. |
| `description` | Public site description, up to 600 characters. |
| `resources` | One to forty resource records. At least one must identify a retrieved source. |
| `apis` | Zero to five OpenAPI indexes, each with up to 160 operations. |

The optional `$schema` is `https://ruagentic.org/schemas/site-1.1.schema.json`. Tools MUST pin the supported schema locally and MUST NOT fetch a publisher-supplied schema URI.

## Resource records

Each resource requires `kind`, `url`, `source`, and `availability`. An optional `title` is at most 160 characters.

- `kind`: `website`, `documentation`, `llms`, `openapi`, `mcp`, `a2a`, `agent-auth`, or `agentic`.
- `url`: the resource's HTTPS URL.
- `source`: the public document from which the URL was discovered. A directly retrieved well-known file may name itself as the source.
- `availability`: `retrieved` when the document was successfully read, or `linked` when a retrieved source referenced it.

URLs are at most 2048 characters and MUST NOT contain credentials, queries, fragments, or alternate ports. Explicit local/private IP addresses and localhost links are rejected. A `(kind, url)` pair MUST be unique.

An external connection can be listed as `linked`. That does not establish ownership, protocol conformance, authorization, or permission to forward credentials. `retrieved` records the publisher's observation of a document, not an independent attestation. Consumers MUST independently enforce their network and authorization policies.

## OpenAPI indexes

Each API has `document`, `openapi`, and `operations`. `document` MUST reference a `retrieved` OpenAPI resource in the same profile. The index copies facts from that document:

- `method`: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, or TRACE.
- `path`: the documented API path, up to 512 characters. It starts with one `/` and contains no query, fragment, or backslash.
- Optional `operationId`: copied verbatim when present, up to 160 characters. Missing identifiers MUST NOT be invented.
- Optional `summary`: public operation summary, up to 240 characters.

Method/path pairs MUST be unique within an API. The full OpenAPI document remains authoritative, including server URLs, security requirements, parameters, and response schemas. Indexed operations are descriptions, not executable Agentic actions.

No retention window, idempotency guarantee, request/result correlation, success state, or recovery rule may be inferred merely from operation names or marketing descriptions. Those require the separately defined [Action Profile 1.0](https://ruagentic.org/docs/SPEC.md) and a conforming implementation.

## TXT 1.1

Generate the text index from validated JSON. JSON remains authoritative. Site TXT uses:

```text
# Agentic site index
# Generated from JSON. Resources are discovery information, not execution instructions.
Agentic-Text: 1.1
Profile: https://service.example/agentic.json
Profile-Version: 1.1.0
Type: site
Origin: https://service.example
Name: "Example service"
Description: "Public API and documentation."

Resource: "documentation" "https://service.example/docs"
Availability: retrieved
Source: "https://service.example/docs"
```

Resources follow JSON array order; optional titles use `Title: <quoted string>`. API sections use `OpenAPI: <quoted document URL>`, `OpenAPI-Version: <quoted version>`, and one `Operation: <quoted method> <quoted path> [<quoted operation ID>]` per indexed operation. Empty lines separate records. Strings use JSON quoting with control, directional, and invisible formatting characters escaped by the published generator. TXT does not reconstruct an executable contract.

The `Profile:` URL MUST share the profile origin and contain no credentials, query, or fragment. Serve both files as UTF-8; use `application/json` and `text/plain; charset=utf-8`. Keep each generated file within 64 KiB. Action TXT 1.0 remains byte-compatible and unchanged.

## Discovery and auditing

The website generator reads public HTML, text/Markdown, JSON metadata, and OpenAPI 3 JSON documents. It follows same-origin links selected as documentation or API descriptions and checks conventional Agentic, OpenAPI, llms.txt, A2A, and Agent Auth metadata paths. It records advertised MCP URLs without invoking tools. It does not run browser JavaScript or access login-protected documents.

The scan permits up to three redirects per document, only on the same HTTPS origin or its exact www/non-www counterpart. Every hop is checked against public-only DNS/IP rules. Redirect bodies are closed immediately. Cross-origin documentation and connection links are recorded without being fetched.

Limits: twenty-two HTTP attempts, five concurrent documents, one MiB per response, eight MiB of response-body allowance, with failed reads charged their full allowance, and a forty-second scan deadline, with a bounded DNS lookup finishing at most five seconds later. Sources or operation indexes may be shortened to keep the file size bounded; the report explains truncation. The report records failures and the observation time.

If a valid existing action profile is found, the generator preserves it and regenerates its matching TXT. The root profile takes priority over nested profiles, unless the user explicitly supplied another profile URL. Missing OpenAPI binding checks are reported, not invented.

The auditor validates site structure, the serving origin, matching TXT, and up to five retrieved same-origin documents, prioritizing OpenAPI operation indexes. Linked or external protocols are not invoked. Its `valid` field excludes optional TXT consistency, which remains in `textIndex` and `checks`; require `valid && textIndex.status === "matched"` when enforcing a matching pair.

## Tools and compatibility

Tools 1.3.0 support Site Profile 1.1.0 alongside Action Profile 1.0.0. Earlier tools must be upgraded to read the site profile. The 1.0 action executor intentionally rejects site profiles before any ledger or network access. Existing action contracts, receipts, and in-flight request identities must not be relabeled.

```sh
npm install -g ruagentic@1.3.0
agentic discover https://your-site.example --out agentic-files
agentic validate agentic-files/agentic.json
agentic text agentic-files/agentic.json --check
```

The `discover` command creates a new directory containing agentic.json, agentic.txt, README.md, LISTING.md, and a discovery report; it refuses to overwrite an existing directory. The `discover_agentic_site` tool exposes the same scanner through local and hosted MCP. The generator page also exposes it through WebMCP when the browser supports that API.
