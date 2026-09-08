# Get started with Agentic

Agentic's tools are publicly available at [ruagentic.org](https://ruagentic.org). Generate files, connect an agent, or install the CLI directly. No enrollment is required.

## Generate and validate

1. Open the [generator](https://ruagentic.org/generate/). Import your OpenAPI document or adapt the ticket example.
2. Bind the existing submit, request-status, and resource-read operations. The service must implement the behavior described by the profile.
3. Download agentic.json and its optional generated agentic.txt index. Check the JSON with the [validator](https://ruagentic.org/validate/).
4. Follow the [integration guide](https://ruagentic.org/docs/INTEGRATIONS.md) to connect your authorized client and publish the profile on your service origin.

## Use the hosted platform

The [platform](https://ruagentic.org/platform/) offers synthetic HTTP recovery checks, read-only public URL audits, and private report history with optional sharing. [Connect an agent](https://ruagentic.org/docs/PROTOCOLS.md) through the public MCP endpoint, supported WebMCP browser tools, A2A tasks, or autonomous Agent Auth.

The hosted ticket service operates on synthetic data. Your own business actions run on your service under your host's authorization and operational controls.

## Install the CLI

Requires Node 24. Install the versioned [ruagentic CLI from npm](https://www.npmjs.com/package/ruagentic):

```sh
npm install -g ruagentic@1.0.0
agentic init --origin https://your-service.example
agentic text agentic.json
agentic text agentic.json --check
agentic validate agentic.json openapi.json
```

The initializer creates a ticket-contract starter. `text` generates the optional TXT index; `--check` detects summary drift. [TXT format and publication](https://ruagentic.org/docs/AGENTIC-TXT.md) explains non-default profile URLs. Adapt it to your service and supply its OpenAPI document before validating. The tarball and its checksums are available in the [GitHub release](https://github.com/sam1siam/agentic/releases/tag/v1.0.0).

## Add validation to GitHub Actions

After checking out your repository, add:

```yaml
- uses: sam1siam/agentic@v1.0.0
  with:
    profile: agentic.json
    openapi: openapi.json
```

An [agent skill](https://github.com/sam1siam/agentic/releases/download/v1.0.0/agentic-adoption-skill.zip) is also available. It guides a coding agent through file generation, validation, and implementation checks.

## Build and contribute

Use the [local HTTP quick start](https://ruagentic.org/docs/QUICKSTART.md) and [compatibility runner](https://ruagentic.org/docs/COMPATIBILITY.md) to exercise your client. Report bugs, suggest improvements, or share implementations through [GitHub issues](https://github.com/sam1siam/agentic/issues/new/choose). Contributions and public reports are optional.

Use the `1.0.0` profile and pin your tool version. Review the specification's service and host requirements when integrating, and configure a supporting client with your profile URL. For existing integrations, follow the [1.0 migration guide](https://ruagentic.org/docs/MIGRATION.md); preserve original contracts and clients for unfinished requests.
