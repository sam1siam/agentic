# Open call: independent clients and service pilots for Agentic 0.1

> Archived on 2026-09-07: the project owner retired the managed pilot program and further outreach. The text below is a historical record, not an active invitation or work plan. Use [Get started](https://ruagentic.org/adopt/) for direct access.

Agentic is an experimental JSON profile for reconciling uncertain action submissions and verifying their outcomes through existing OpenAPI operations.

We are opening the first pilot cohort for independently implemented consumers and service owners with one suitable sandbox action. This is a request for evidence and critique, not an adoption announcement.

## Two ways to participate

1. **Independent consumer:** implement the documented contract in your own code and connect it to the external-client runner. The runner observes HTTP calls and resource counts across seven scenarios, including response loss and process restart.
2. **Service pilot:** choose one existing idempotent record-creation action with authoritative request lookup and correlated resource evidence. Compare the profile with your current recovery workflow.

Start with the [quick start](https://ruagentic.org/docs/QUICKSTART.md), [runner guide](https://ruagentic.org/docs/PILOT-RUNNER.md), and [normative draft](https://ruagentic.org/docs/SPEC.md).

## What to share

- Project, public source, and tested revision.
- Your role and whether implementation authorship is independent of this project.
- The chosen action and any missing service capabilities.
- Current recovery approach and the question you want the pilot to answer.
- Availability for a small two-week experiment.

Apply using the [pilot form](https://github.com/sam1siam/agentic/issues/new?template=pilot.yml). Share completed work through the [implementation report](https://github.com/sam1siam/agentic/issues/new?template=implementation.yml).

Please keep private inputs, customer data, credentials, and receipts out of public issues. Attribution requires your agreement. There is no certification, payment commitment, or production deployment requirement.

## Evidence and decisions

The project has two reference clients with shared authorship. Neither counts as independent adoption. Outside participation is recorded only after agreement; independent compatibility is recorded only after source and evidence review.

Measure duplicates, false success, verified completion, unresolved outcomes, calls, and engineering effort. A negative result is useful. If the profile does not reduce integration or maintenance effort over existing workflows, we should narrow it or contribute the useful part to an existing convention.
