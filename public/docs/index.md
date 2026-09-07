# Agentic documentation

> Guides and reference material for Agentic Action Profile 0.1, an experimental proposal.

## Start here

- [Quick start](https://ruagentic.org/docs/QUICKSTART.md): Installation, synthetic ticket action, recovery, and troubleshooting.
- [Generator](https://ruagentic.org/docs/GENERATOR.md): Browser and local profile creation.
- [Examples](https://ruagentic.org/docs/EXAMPLES.md): Complete profile, OpenAPI contract, and illustrative receipt.
- [FAQ](https://ruagentic.org/docs/FAQ.md): Support, service requirements, safety boundaries, and draft status.

## Implement and test

- [Normative specification](https://ruagentic.org/docs/SPEC.md): Protocol requirements.
- [Integration guide](https://ruagentic.org/docs/INTEGRATIONS.md): Client, service, and adjacent-convention integration.
- [Validator](https://ruagentic.org/docs/VALIDATOR.md): Structure and binding checks.
- [Recovery lab](https://ruagentic.org/docs/LAB.md): Browser scenarios and their limitations.
- [Compatibility runner](https://ruagentic.org/docs/PILOT-RUNNER.md): Run independently written client code.
- [Conformance](https://ruagentic.org/docs/CONFORMANCE.md): Evidence levels and test limits.
- [Security](https://ruagentic.org/docs/SECURITY.md): Operational controls and remaining gaps.

## Participate

- [Pilot kit](https://ruagentic.org/docs/PILOT-KIT.md): Enrollment, interviews, experiment, and acceptance.
- [Governance](https://ruagentic.org/docs/GOVERNANCE.md): Change process and stability criteria.
- [Roadmap](https://ruagentic.org/docs/ROADMAP.md): Adoption milestones.
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

In a second terminal, run `npm run client -- http://127.0.0.1:4318 pilot-001 "Pilot ticket"`. Repeating the exact command returns the saved receipt. See the quick start for requirements and troubleshooting.
