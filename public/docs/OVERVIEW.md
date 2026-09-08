# Agentic

**Make your website readable to agents.** Enter your URL to generate `agentic.json` and `agentic.txt` from public documentation, API descriptions, llms.txt, and advertised agent connections.

## Start with your website

1. [Generate](https://ruagentic.org/generate/): scan a public URL, review discovered sources, and download both files.
2. Publish the pair at `/agentic.json` and `/agentic.txt` on your domain.
3. [Audit](https://ruagentic.org/audit/): check the published JSON, linked documents, and matching text index.

The JSON is the structured source of truth. The TXT file is a readable index generated from it. No central registry is required.

## Two profile types

[Site Profile 1.1](SITE-PROFILE.md) describes documentation, OpenAPI operations, and advertised MCP, A2A, or Agent Auth links. It can be generated from public sources. A linked endpoint is not a verified service or an authorization grant. The scanner reads a bounded selection of public sources; it does not execute API actions or MCP tools.

[Action Profile 1.0](SPEC.md) describes how a supporting client submits an action once, checks the original request, and verifies its result after a lost response. Its service must implement durable request tracking and the stated evidence checks. Existing valid action profiles are preserved during generation; missing recovery behavior is never inferred.

## Tools and documentation

Tools 1.2.0 support Site Profile 1.1.0, Action Profile 1.0.0, and their generated TXT indexes. Code and specifications are Apache-2.0. [Install the CLI](GETTING-STARTED.md), [compare formats](COMPARE.md), or [connect an agent](PROTOCOLS.md).

The [hosted platform](PLATFORM.md) also provides synthetic recovery checks and private reports. Our root Agentic files describe that ticket service. The reference consumers and tests are project-authored; no independent adoption or standards endorsement is claimed.
