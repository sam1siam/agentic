# Frequently asked questions

## Is Agentic an adopted standard?
No. It is an experimental proposal. Both reference clients share project authorship. Independent compatibility evidence and review are prerequisites for a stable release.

## Will agents discover agentic.json automatically?
Only supporting clients can use the convention. Supply the profile URL explicitly to your supporting client. Publishing the file does not add runtime support to an arbitrary agent.

## What must my service implement?
Atomic principal-scoped request tracking and idempotency, one POST submission, authoritative request-status lookup, and a resource read with correlated evidence. The first draft binds inline operations from an OpenAPI 3.1 document.

## How does this relate to other agent files?
Documentation indexes help agents find content. Capability manifests describe available integrations. Agentic proposes a narrower contract for reconciling an already attempted action and verifying its outcome. See [INTEGRATIONS.md](INTEGRATIONS.md).

## Does the file authorize an action?
No. The host must authorize the action, approve destinations, control credentials, and isolate ledgers. A publisher's text is untrusted data.

## Does it guarantee exactly-once execution?
No. The service must enforce idempotency and truthful status. The client avoids automatic repeat writes and requires evidence before declaring success. An unavailable or inconsistent result can remain unknown.

## What happens after tracking expires?
Preserve unknown and use the host's reconciliation or handoff process. Expiry is not proof that a new mutation is safe.

## Can we use Agentic without joining a program?
Yes. The specification, generators, validator, CLI, and hosted tools are available directly. Feedback and contributions are optional.

## Can we keep our implementation private?
Use a sandbox and keep customer information, tokens, receipts, and ledgers private. Share only approved redacted evidence. Public attribution is optional; an unreviewable private implementation cannot be counted as publicly verified independent compatibility.

## Is there an npm package?
The standalone `ruagentic` CLI is distributed as a versioned GitHub release tarball and can be installed directly with npm. See [Get started](GETTING-STARTED.md). It has not yet been published to the npm registry; `npx agentic` is not this project's installation command.

## Are integrations with AWP, agents.txt, MCP, or Arazzo complete?
No standardized cross-project Agentic binding is claimed. The integration guide describes coexistence and proposed evaluation paths. Public MCP, A2A testing tasks, and autonomous Agent Auth are implemented on the hosted platform. WebMCP page hooks require browser support. See [protocol setup](PROTOCOLS.md) for the supported scope.
