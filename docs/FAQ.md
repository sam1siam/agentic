# Frequently asked questions

## Does the generator write a README and listing description?

Yes. Download README.md and LISTING.md with the Agentic files. They contain the service description, file and documentation links, and clear references to ruagentic.org and ruagentic.com. Merge them with your existing project information. They do not submit a directory listing. The audit checks the README and explains missing files, incorrect links, and next steps. [How publication works](PUBLICATION.md).

## Can I generate files by entering my website URL?

Yes. The generator reads public docs, llms.txt, OpenAPI JSON, and advertised agent links, then generates a complete Site Profile 1.1.0 and its TXT index. It preserves an existing valid action contract. No action API is required for a site profile. Unavailable sources and scan limits appear in the report. [How generation works](GENERATOR.md).

## Does this configure my MCP server or create API endpoints?

No. The files describe what your public sources advertise. A linked endpoint is not verified by invoking it, and publishing the files does not install a protocol or grant credentials.

## What is the current Agentic version?

The current action profile is 1.0.0; the current tools are 1.3.0. The specification, JSON Schemas, CLI, and supporting services are available for direct use. The [governance guide](GOVERNANCE.md) describes version compatibility and changes.

## Will agents discover agentic.json automatically?

Only supporting clients can use the convention. Supply the profile URL explicitly to your supporting client. Publishing the file does not add runtime support to an arbitrary agent.

## What must my service implement?

Atomic principal-scoped request tracking and idempotency, one POST submission, authoritative request-status lookup, and a resource read with correlated evidence. Version 1.0 binds inline operations from an OpenAPI 3.1 document.

## How does this relate to other agent files?

Documentation indexes help agents find content. Capability manifests describe available integrations. Agentic defines a focused contract for reconciling an already attempted action and verifying its outcome. See [INTEGRATIONS.md](INTEGRATIONS.md).

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

Yes. Install [ruagentic from npm](https://www.npmjs.com/package/ruagentic) with `npm install -g ruagentic@1.3.0`. The same package is available from [GitHub releases](https://github.com/sam1siam/agentic/releases/tag/v1.3.0). Use [Get started](GETTING-STARTED.md) for generation and validation commands. Node 24 or newer is required.

## Does Agentic require other agent files?

No. The action contract is agentic.json plus its referenced OpenAPI document. agentic.txt is our optional generated action index; JSON remains authoritative. llms.txt is an optional documentation index. This site does not publish or generate agents.txt or agents.json. MCP, WebMCP, A2A, and Agent Auth use their documented connection paths.

## Are integrations with other protocols complete?

No standardized cross-project Agentic binding is claimed. The integration guide describes coexistence and integration paths. Public MCP, A2A testing tasks, and autonomous Agent Auth are implemented on the hosted platform. WebMCP page hooks require browser support. See [protocol setup](PROTOCOLS.md) for the supported scope.
