# Agentic

> Help agents know what happened.

`agentic.txt` lists the actions your service offers. `agentic.json` tells an agent how to check their results and recover when a response is lost. Generate both files from the same settings and publish them on your domain.

## Start here

1. [Generate](https://ruagentic.org/generate/): Describe your action or import OpenAPI. View both files, copy either one, or download the pair.
2. [Spec](https://ruagentic.org/spec/): Read the file format, required fields, and service responsibilities.
3. [Audit](https://ruagentic.org/audit/): Check your public files, API operations, and TXT consistency.
4. [Compare](https://ruagentic.org/compare/): See how Agentic fits alongside related formats.
5. [About](https://ruagentic.org/about/): Purpose, maintainers, and contribution paths.

## Connect your API

Agentic Action Profile 1.0 connects one submission operation, a request-status lookup, and a resulting-resource read from an OpenAPI 3.1 document. A supporting client saves the request before sending, checks the original result, and records a receipt after verifying the evidence. An unresolved result remains pending or unknown.

JSON is the authoritative contract. TXT is its optional generated index. The files describe behavior that your service and client must implement; authentication, authorization, durable tracking, and duplicate prevention remain necessary.

Use the [documentation](https://ruagentic.org/docs/) for implementation guides, examples, the local validator, and recovery tools. [Connect an agent](https://ruagentic.org/connect/) through the supported MCP, WebMCP, A2A, and Agent Auth paths. The site's own [TXT](https://ruagentic.org/agentic.txt) and [JSON](https://ruagentic.org/agentic.json) describe its hosted synthetic ticket service.

Action Profile 1.0.0 and tools 1.1.0 are available under Apache-2.0. No central registry is required. [Source and releases](https://github.com/sam1siam/agentic) · [npm package](https://www.npmjs.com/package/ruagentic)
