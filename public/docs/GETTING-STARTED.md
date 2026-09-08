# Get started with Agentic

## Generate and publish

1. Open [Generate](https://ruagentic.org/generate/), enter your website URL, and choose **Generate files**.
2. Review the documentation, APIs, and advertised agent connections found by the scan.
3. Download both files and publish them at `/agentic.json` and `/agentic.txt` on your domain.
4. Run the [public audit](https://ruagentic.org/audit/) after publishing.

The [site profile](SITE-PROFILE.md) works with public documentation even when no API is available. To implement request recovery, use an [action contract](SPEC.md) and the [integration guide](INTEGRATIONS.md). Its operations and behavior must match your service.

## Install the CLI

Node 24 or newer is required.

```sh
npm install -g ruagentic@1.2.0
agentic discover https://your-site.com --out agentic-files
agentic validate agentic-files/agentic.json
agentic text agentic-files/agentic.json --check
```

The new output directory contains both files and a discovery report. Publish the pair, then run:

```sh
agentic audit https://your-site.com/agentic.json
```

`agentic text` regenerates TXT from either supported JSON type. `--check` detects drift. The separate `agentic init --origin https://service.example` command creates a ticket-contract starter requiring manual adaptation. Validate that action contract with `agentic validate agentic.json openapi.json`.

The package and checksums are available in the [GitHub release](https://github.com/sam1siam/agentic/releases/tag/v1.2.0).

## Add validation to GitHub Actions

After checking out your repository:

```yaml
- uses: sam1siam/agentic@v1.2.0
  with:
    profile: agentic.json
```

For an action profile, also set `openapi: openapi.json` to check its operation bindings. The [agent skill](https://github.com/sam1siam/agentic/releases/download/v1.2.0/agentic-adoption-skill.zip) guides a coding agent through publication and validation.

## Connect or contribute

[Connect an agent](PROTOCOLS.md) through MCP, conditional WebMCP, or the hosted A2A and Agent Auth services. The [platform](PLATFORM.md) provides private scan/audit reports and synthetic HTTP recovery checks. Reports expire after 30 days. Your business actions remain on your service.

Use the [HTTP quick start](QUICKSTART.md) and [compatibility runner](COMPATIBILITY.md) when implementing action recovery. Existing action profiles remain at 1.0.0; preserve the original contracts and clients for unfinished requests. Tools 1.2.0 add Site Profile 1.1.0 without changing action or receipt semantics. Contributions are welcome through [GitHub](https://github.com/sam1siam/agentic).
