# Pilot invitations and delivery status

Prepared on 2026-09-07. The account owner approved the two GitHub proposals, which were posted from sam1siam on 2026-09-07. The AWP email remains unsent. These projects are candidates for critique or a pilot, not adopters or committed participants. No maintainer has agreed to the proposed work.

The account owner subsequently authorized more invitations. Eight additional individual invitations were sent on 2026-09-07; see [batch 2 delivery log](OUTREACH-BATCH-2.md) and [exact messages and machine-readable delivery records](OUTREACH-BATCH-2.json). Total delivered: ten. Delivery is not acceptance or adoption.

| Candidate | Delivery | Participation |
| --- | --- | --- |
| Pydantic AI Harness | [Proposal #814](https://github.com/pydantic/pydantic-ai-harness/issues/814), sent 2026-09-07 | Awaiting response |
| Mastra | [Proposal #23256](https://github.com/mastra-ai/mastra/issues/23256), sent 2026-09-07 | Awaiting response |
| Agent Web Protocol | Email draft only | Not contacted |

The messages below are the reviewed drafts. The linked posts contain their final template-aligned text and relevant references found during duplicate checks.

## 1. Pydantic AI Harness: independent consumer evaluation

Proposed channel: a capability proposal on [pydantic-ai-harness](https://github.com/pydantic/pydantic-ai-harness/issues), after checking existing issues. [Pydantic AI's contribution guide](https://github.com/pydantic/pydantic-ai/blob/main/docs/contributing.md) directs standalone agent capabilities to the harness and asks for problem/approach alignment before substantive PRs.

**Proposed title:** Evaluate an optional action-reconciliation profile against the existing recovery workflow

An agent can lose the response to a tool call after the service has committed a record. We are testing whether a small shared OpenAPI profile reduces the per-integration work of reconciling that request and verifying its resulting resource.

Agentic is an experimental proposal, not an established standard. Its local runner supplies a synthetic ticket service and observes seven failure/restart scenarios through a documented client-process interface: https://ruagentic.org/docs/PILOT-RUNNER.md

Would a harness capability experiment be useful here, or does an existing approach already cover the same integration contract? We would value an independently written adapter and a comparison of engineering effort with the current workflow before proposing any upstream change.

Draft and source: https://github.com/sam1siam/agentic

## 2. Mastra: optional integration pilot

Proposed channel: [feature request](https://github.com/mastra-ai/mastra/issues), after checking existing issues. [The contribution guide](https://github.com/mastra-ai/mastra/blob/main/CONTRIBUTING.md) requires feedback on feature requests before feature PRs proceed.

**Proposed title:** Feedback on a sandbox experiment for interrupted tool actions

We are evaluating Agentic, a small draft profile that references submit, request-status, and resource-read operations in an existing OpenAPI document. The specific problem is verifying an action after its submission response is lost, while preserving its original request identity across restart.

Could this be usefully evaluated as an optional Mastra integration outside core? The experiment would cover one synthetic record-creation action, compare against the existing recovery workflow, and record integration effort as well as outcomes. We are not assuming the profile improves an already competent workflow.

The runner and reference service are available at https://ruagentic.org/docs/PILOT-RUNNER.md. An independently written consumer can participate through a JSON stdin/stdout adapter. We would welcome feedback before writing any upstream integration.

Project: https://github.com/sam1siam/agentic

## 3. Agent Web Protocol: overlap review and interoperability critique

Proposed recipient: `spec@agentwebprotocol.org`, published on [agent.json's website](https://www.agent-json.org/). Do not treat the public address as agreement to participate.

**Subject:** Feedback on an experimental action-recovery profile alongside AWP

We are developing Agentic, a narrow draft profile for tracking one action, reconciling an uncertain submission, and checking correlated resource evidence. It references existing OpenAPI operation IDs and leaves capability discovery and authentication with their existing conventions.

Before promoting another convention, we would value your critique of overlap with AWP and whether the useful part belongs as an extension or a testing profile. We have a reproducible ticket example and seven-scenario client runner: https://ruagentic.org/docs/PILOT-RUNNER.md

Would you be open to reviewing the contract or testing a separately implemented consumer? Negative findings are useful; no partnership or reciprocal support is assumed.

Draft: https://ruagentic.org/spec/
Source: https://github.com/sam1siam/agentic

## Sending and follow-up

These are bounded, individual invitations sent under the account owner's authorization. The initial two proposals and the eight batch 2 invitations are delivered; wait for replies. Do not post a speculative implementation PR, repeatedly follow up without a response, or count delivery as pilot acceptance. Move a team into the confirmed pilot registry only after explicit agreement.
