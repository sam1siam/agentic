# Pilot kit
Prepared materials. No interviews have been conducted and no organizations listed here have agreed to participate.

## First cohort
Seek five developers of agent consumers and five owners of SaaS APIs that create records such as support tickets. Prefer services already offering request IDs, status lookup, and idempotency. Recruit outside implementers rather than counting two clients written within this project as adoption.

Potential technical communities to approach after reviewing their contribution guidelines: OpenAPI/Arazzo contributors, MCP tool authors, maintainers of open agent runtimes, and teams building support or CRM integrations. Seek critique of overlap before proposing integration work.

## Interview guide
1. Describe the last time a tool call timed out after possibly changing state.
2. How did you determine whether the action completed?
3. What causes duplicate writes or false success reports today?
4. Which existing workflow or protocol solves this for you?
5. What would a shared file save you, and what would it force you to maintain?
6. Would you test the ticket example with your client or service?
7. What would convince you to abandon or adopt this proposal?

Capture the date, participant role, permission to attribute comments, failure description, existing solution, integration cost, and willingness to pilot. Keep private notes and credentials outside the public repository.

## Outreach draft
Subject: Feedback on a small agent action-recovery profile

We are testing Agentic, an experimental convention for verifying actions and recovering when a submission response is lost. It references existing OpenAPI operations and includes a ticket example with reproducible failure tests.

We would value your critique, especially where existing Arazzo or MCP capabilities already solve the problem. Would you be willing to try the example or share how your system handles ambiguous tool results?

Project: https://github.com/sam1siam/agentic
Draft and example: https://github.com/sam1siam/agentic/tree/main/examples/tickets

This is a draft invitation, not a message already sent.

## Pilot acceptance
- Identify the action, client version, service version, and authenticated principal boundary.
- Validate the profile and operation binding.
- Test normal completion and a response lost after service commit.
- Test status unavailability, resource mismatch, and resumption after a client crash.
- Compare with the team's existing competent workflow.
- Record duplicates, false success reports, verified completions, unresolved outcomes, calls, and integration/maintenance time.
- Publish only results and attribution approved by the participant.

## Decision gate
Continue toward a separate convention only if at least three prospective consumer teams identify the same useful gap and outside implementations find the profile worth maintaining. Otherwise narrow the work to an extension or conformance toolkit for an existing specification.
