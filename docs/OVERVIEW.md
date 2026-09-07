# Agentic

> An experimental JSON profile for verifying agent actions and recovering interrupted requests.

`agentic.json` connects a submission operation, authoritative request-status lookup, and a resulting-resource read. It references an existing OpenAPI 3.1 document. The client saves its request identity before sending, reconciles uncertainty, and emits a receipt only after checking evidence.

The production website includes generators, validation, public MCP tools, a hosted HTTP/PostgreSQL recovery sandbox, URL audits, saved reports, A2A tasks, and autonomous Agent Auth. Its browser recovery lab is a separate simulation; the local reference application also supports real HTTP disconnection tests. No independent adoption or universal agent support is claimed.

## Start

- [Quick start](https://ruagentic.org/docs/QUICKSTART.md): Run a real dropped-response example.
- [Normative draft](https://ruagentic.org/docs/SPEC.md): Requirements, fields, and boundaries.
- [Generator guide](https://ruagentic.org/docs/GENERATOR.md): Build and download a starting profile.
- [Examples](https://ruagentic.org/docs/EXAMPLES.md): Profile, OpenAPI document, and synthetic receipt.
- [Get started](https://ruagentic.org/adopt/): Install tools, connect an agent, and integrate your service.
- [Repository](https://github.com/sam1siam/agentic): Source, issues, and releases.

Keep request identity durable. Check the original result. Preserve unknown when evidence is insufficient. Existing authentication, authorization, and idempotency remain necessary.
