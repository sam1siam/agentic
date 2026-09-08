# Agentic documentation

> Guides and reference material for Agentic Action Profile 1.0.

## Start here

- [Get started](https://ruagentic.org/docs/GETTING-STARTED.md): Generate files, install tools, and connect an agent.

- [Quick start](https://ruagentic.org/docs/QUICKSTART.md): Installation, synthetic ticket action, recovery, and troubleshooting.
- [Generator](https://ruagentic.org/docs/GENERATOR.md): Browser and local profile creation.
- [Hosted platform](https://ruagentic.org/docs/PLATFORM.md): HTTP recovery tests, public URL audits, private history, sharing and operations.
- [Examples](https://ruagentic.org/docs/EXAMPLES.md): Complete profile, OpenAPI contract, and illustrative receipt.
- [FAQ](https://ruagentic.org/docs/FAQ.md): Support, service requirements, safety boundaries, and versioning.

## Implement and test

- [Normative specification](https://ruagentic.org/docs/SPEC.md): JSON protocol requirements.
- [agentic.txt companion](https://ruagentic.org/docs/AGENTIC-TXT.md): Generated action index, publication, and consistency checks.
- [Migrate to 1.0](https://ruagentic.org/docs/MIGRATION.md): New version identifiers, revalidation, and preservation of unfinished requests.
- [Integration guide](https://ruagentic.org/docs/INTEGRATIONS.md): Client, service, and adjacent-convention integration.
- [Protocol setup](https://ruagentic.org/docs/PROTOCOLS.md): Public MCP, WebMCP tools, A2A testing tasks, and autonomous Agent Auth.
- [Validator](https://ruagentic.org/docs/VALIDATOR.md): Structure and binding checks.
- [Recovery lab](https://ruagentic.org/docs/LAB.md): Browser scenarios and their limitations.
- [Compatibility runner](https://ruagentic.org/docs/COMPATIBILITY.md): Run independently written client code.
- [Conformance](https://ruagentic.org/docs/CONFORMANCE.md): Evidence levels and test limits.
- [Security](https://ruagentic.org/docs/SECURITY.md): Operational controls and remaining gaps.

## Contribute

- [Governance](https://ruagentic.org/docs/GOVERNANCE.md): Change process and version compatibility.
- [Roadmap](https://ruagentic.org/docs/ROADMAP.md): Product development priorities.
- [Changelog](https://ruagentic.org/docs/CHANGELOG.md): Published changes.
- [Prior art](https://ruagentic.org/docs/PRIOR-ART.md): Related approaches.
- [Route inventory](https://ruagentic.org/docs/SITE-MAP.md): What this site actually serves.
- [Brand assets](https://ruagentic.org/docs/BRAND.md): Logo files and visual identity.

## Example commands

```sh
git clone https://github.com/sam1siam/agentic.git
cd agentic
npm ci
python -m pip install -r reference/python/requirements.txt
python reference/service/server.py --fault response-lost
```

In a second terminal, run `npm run client -- http://127.0.0.1:4318 example-001 "Example ticket"`. Repeating the exact command returns the saved receipt. See the quick start for requirements and troubleshooting.
