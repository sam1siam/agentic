# Get started with Agentic

Agentic's tools are publicly available at [ruagentic.org](https://ruagentic.org). Generate files, connect an agent, or install the CLI directly. No enrollment is required.

## Generate and validate

1. Open the [generator](https://ruagentic.org/generate/). Import your OpenAPI document or adapt the ticket example.
2. Bind the existing submit, request-status, and resource-read operations. The service must implement the behavior described by the profile.
3. Download agentic.json and its optional generated agentic.txt index. Check the JSON with the [validator](https://ruagentic.org/validate/).
4. Follow the [integration guide](INTEGRATIONS.md) to connect your authorized client and publish the profile on your service origin.

## Use the hosted platform

The [platform](https://ruagentic.org/platform/) offers synthetic HTTP recovery checks, read-only public URL audits, and private report history with optional sharing. [Connect an agent](PROTOCOLS.md) through the public MCP endpoint, supported WebMCP browser tools, A2A tasks, or autonomous Agent Auth.

The hosted ticket service operates on synthetic data. Your own business actions run on your service under your host's authorization and operational controls.

## Install the CLI

Requires Node 24. Install the versioned [ruagentic CLI from npm](https://www.npmjs.com/package/ruagentic):

```sh
npm install -g ruagentic@0.1.0-draft.6
agentic init --origin https://your-service.example
agentic text agentic.json
agentic text agentic.json --check
agentic validate agentic.json openapi.json
```

The initializer creates a ticket-contract starter. `text` generates the optional TXT index; `--check` detects summary drift. [TXT format and publication](AGENTIC-TXT.md) explains non-default profile URLs. Adapt it to your service and supply its OpenAPI document before validating. The tarball and its checksums are available in the [GitHub release](https://github.com/sam1siam/agentic/releases/tag/v0.1.0-draft.6).

## Add validation to GitHub Actions

After checking out your repository, add:

```yaml
- uses: sam1siam/agentic@v0.1.0-draft.6
  with:
    profile: agentic.json
    openapi: openapi.json
```

An [agent skill](https://github.com/sam1siam/agentic/releases/download/v0.1.0-draft.6/agentic-adoption-skill.zip) is also available. It guides a coding agent through file generation, validation, and implementation checks.

## Build and contribute

Use the [local HTTP quick start](QUICKSTART.md) and [compatibility runner](COMPATIBILITY.md) to exercise your client. Report bugs, suggest improvements, or share implementations through [GitHub issues](https://github.com/sam1siam/agentic/issues/new/choose). Contributions and public reports are optional.

The profile remains `0.1.0-draft`. Pin versions and review the specification's service and host requirements when integrating. Public availability does not imply a stable standard or universal agent support.
