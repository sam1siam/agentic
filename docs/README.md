# Agentic documentation

> Guides and reference material for Agentic Action Profile 0.1, an experimental proposal.

## Start here

- [Quick start](QUICKSTART.md): Installation, synthetic ticket action, recovery, and troubleshooting.
- [Generator](GENERATOR.md): Browser and local profile creation.
- [Hosted platform](PLATFORM.md): HTTP recovery tests, public URL audits, private history, sharing and operations.
- [Examples](EXAMPLES.md): Complete profile, OpenAPI contract, and illustrative receipt.
- [FAQ](FAQ.md): Support, service requirements, safety boundaries, and draft status.

## Implement and test

- [Normative specification](SPEC.md): Protocol requirements.
- [Integration guide](INTEGRATIONS.md): Client, service, and adjacent-convention integration.
- [Protocol setup](PROTOCOLS.md): Public MCP, WebMCP tools, A2A testing tasks, and autonomous Agent Auth.
- [Validator](VALIDATOR.md): Structure and binding checks.
- [Recovery lab](LAB.md): Browser scenarios and their limitations.
- [Compatibility runner](PILOT-RUNNER.md): Run independently written client code.
- [Conformance](CONFORMANCE.md): Evidence levels and test limits.
- [Security](SECURITY.md): Operational controls and remaining gaps.

## Participate

- [Pilot kit](PILOT-KIT.md): Enrollment, interviews, experiment, and acceptance.
- [Governance](GOVERNANCE.md): Change process and stability criteria.
- [Roadmap](ROADMAP.md): Adoption milestones.
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

In a second terminal, run `npm run client -- http://127.0.0.1:4318 pilot-001 "Pilot ticket"`. Repeating the exact command returns the saved receipt. See the quick start for requirements and troubleshooting.
