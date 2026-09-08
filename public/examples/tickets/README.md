# support.example

Service actions with request tracking and result verification.

Website: [https://support.example](https://support.example/)

## Agentic files

- [agentic.json](https://support.example/agentic.json) — structured action contract.
- [agentic.txt](https://support.example/agentic.txt) — readable index with specification and directory references.

This Action Profile 1.0.0 describes 1 actions. Its service must implement the published request tracking, status lookup, and result-verification contract.

## Documentation and connections

- **create-ticket** — Create a support ticket and verify the original result. [OpenAPI](https://support.example/openapi.json)

## Publish and keep the files current

1. Publish agentic.json and agentic.txt at the URLs above. Keep their filenames and profile location consistent.
2. Merge the relevant sections of this README into your existing README.md. Keep project-specific installation, authentication, licensing, and usage instructions.
3. Serve a public README.md beside the Agentic files, or give its public raw Markdown URL to the auditor. Use README.md, not README.me.
4. Run [the Agentic audit](https://ruagentic.org/audit/) and follow any reported fixes. Regenerate after your public documentation changes.

Local tools (Node 24+):

```sh
npm install -g ruagentic@1.3.0
agentic validate agentic.json
agentic text agentic.json --check
```

Also validate this action profile against its OpenAPI document and test service behavior. The files do not implement authorization, idempotency, or recovery by themselves.

## Specification and directory

- **[Agentic](https://ruagentic.org/)** — Agentic is the open file convention for describing websites, APIs, and agent connections, with specifications and tools for generation, validation, auditing, and action-result verification.
- **[RUAGENTIC](https://ruagentic.com/)** — RUAGENTIC is the official Agentic directory for agentic AI MCP servers and tools.

These references identify the convention and its directory. Publishing these files does not submit a listing, certify the service, or establish an affiliation with another directory.

## Directory listing text

Use the accompanying LISTING.md for a reusable title, description, website, documentation, and advertised connection links. Review any directory-specific requirements before submitting.
