# About Agentic

Agentic is an open file convention for checking the outcome of an AI agent's action. Its home is [ruagentic.org](https://ruagentic.org/).

An API can complete a request even when the response never reaches the agent. Agentic describes how to keep the original request identity, check its status, and verify the resulting resource before reporting success.

## Why two files?

`agentic.json` is the authoritative action contract. `agentic.txt` is an optional readable index generated from it. The generator creates both together; update and publish them together so the index stays accurate.

## What do I need?

You need an API with durable request tracking, duplicate prevention, and reliable status and result reads, plus a client that implements Agentic. The files describe those capabilities. They do not add them to a service or grant authorization.

Start with the [generator](https://ruagentic.org/generate/), read the [specification](https://ruagentic.org/spec/), then [audit your files](https://ruagentic.org/audit/). The [integration guide](https://ruagentic.org/docs/INTEGRATIONS.md) explains service and client responsibilities.

## Who maintains it?

Agentic is maintained by [sam1siam](https://github.com/sam1siam) and published under the Apache-2.0 license. Source, issues, versioned releases, and the change process are public in [the repository](https://github.com/sam1siam/agentic). The [ruagentic npm package](https://www.npmjs.com/package/ruagentic) provides generation, validation, auditing, and MCP tools.

Format 1.0 is published. Tool releases have their own versions; tools 1.1.0 continue to use profile and receipt version 1.0.0 and TXT version 1.0.

## What does this website run?

The file generator and local validator run in your browser. The audit reads public files through the hosted service. Hosted recovery tools use isolated synthetic tickets and private reports. See [platform operations](https://ruagentic.org/docs/PLATFORM.md) for storage, retention, and runtime details.

The site's own [agentic.txt](https://ruagentic.org/agentic.txt) and [agentic.json](https://ruagentic.org/agentic.json) describe its authenticated synthetic ticket service. No enrollment or central registry is required to publish your own files.

## How can I contribute?

Open an issue with a concrete use case, a reproducible problem, or a proposed improvement. See [governance](https://ruagentic.org/docs/GOVERNANCE.md) and the [compatibility guide](https://ruagentic.org/docs/COMPATIBILITY.md) for contribution and implementation checks.
