# Agentic documentation

- [Publish files and a README](PUBLICATION.md): TXT 1.2 project references, automatic README/listing copy, and successful/partial/failed audit results with fixes.

Start by [generating files from a website](GENERATOR.md). [Site Profile 1.1](SITE-PROFILE.md) defines public resources, documented API indexes, and TXT 1.1. [Action Profile 1.0](SPEC.md) defines optional request recovery and result verification. Tools 1.3.0 support both types.

> Guides for Site Profile 1.1, Action Profile 1.0, and publication tools 1.3.

## Start here

- [Generate](GENERATOR.md): Create and download agentic.txt and agentic.json together.
- [Audit](AUDIT.md): Check public files, API links, and TXT consistency.
- [Compare](COMPARE.md): How Agentic fits with other agent formats.
- [About](ABOUT.md): Purpose, maintainers, and contribution paths.

- [Get started](GETTING-STARTED.md): Generate files, install tools, and connect an agent.

- [Quick start](QUICKSTART.md): Installation, synthetic ticket action, recovery, and troubleshooting.
- [Generator](GENERATOR.md): Browser and local profile creation.
- [Hosted platform](PLATFORM.md): HTTP recovery tests, public URL audits, private history, sharing and operations.
- [Examples](EXAMPLES.md): Complete profile, OpenAPI contract, and illustrative receipt.
- [FAQ](FAQ.md): Support, service requirements, safety boundaries, and versioning.

## Implement and test

- [Normative specification](SPEC.md): JSON protocol requirements.
- [agentic.txt companion](AGENTIC-TXT.md): Generated action index, publication, and consistency checks.
- [Migrate to 1.0](MIGRATION.md): New version identifiers, revalidation, and preservation of unfinished requests.
- [Integration guide](INTEGRATIONS.md): Client, service, and adjacent-convention integration.
- [Protocol setup](PROTOCOLS.md): Public MCP, WebMCP tools, A2A testing tasks, and autonomous Agent Auth.
- [Validator](VALIDATOR.md): Structure and binding checks.
- [Recovery lab](LAB.md): Browser scenarios and their limitations.
- [Compatibility runner](COMPATIBILITY.md): Run independently written client code.
- [Conformance](CONFORMANCE.md): Evidence levels and test limits.
- [Security](SECURITY.md): Operational controls and remaining gaps.

## Contribute

- [Governance](GOVERNANCE.md): Change process and version compatibility.
- [Roadmap](ROADMAP.md): Product development priorities.
- [Changelog](CHANGELOG.md): Published changes.
- [Prior art](PRIOR-ART.md): Related approaches.
- [Route inventory](SITE-MAP.md): What this site actually serves.
- [Brand assets](BRAND.md): Logo files and visual identity.

## Example commands

```sh
git clone https://github.com/sam1siam/agentic.git
cd agentic
npm ci
python -m pip install -r reference/python/requirements.txt
python reference/service/server.py --fault response-lost
```

In a second terminal, run `npm run client -- http://127.0.0.1:4318 example-001 "Example ticket"`. Repeating the exact command returns the saved receipt. See the quick start for requirements and troubleshooting.
