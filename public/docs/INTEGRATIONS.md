# Integration guide

The initial Agentic binding supports one POST submission and two GET operations in an OpenAPI 3.1 document. It intentionally does not replace authentication, endpoint discovery, or an agent runtime's permission model.

For runnable MCP tools, WebMCP pages, and A2A / Agent Auth discovery configuration, see [Protocol setup and implementation status](PROTOCOLS.md).

## Service checklist

1. Choose one record-creation operation in a sandbox.
2. Atomically persist the principal, action, idempotency key, exact input, and result. Reject the same key with different input.
3. Expose authoritative request lookup. Return `request_id`, `status`, and `resource_id` using the contract in SPEC.md section 4.
4. Expose a resource read that identifies the original request and required input evidence.
5. Describe the three operations with inline OpenAPI parameters. Bind their operation IDs in the profile.
6. Publish the profile on the service origin, and test the advertised retention window and failures.

An API that only offers idempotency, without a way to reconcile the request or identify its resulting resource, cannot satisfy this specification. Do not invent endpoints in a profile. A gateway can implement missing behavior only if it can make authoritative guarantees about the underlying operation; proxying HTTP alone is insufficient.

## Consumer integration

Keep the profile, OpenAPI snapshot, origin, input, and request ID in a durable record before sending. The project exposes `executeAction` in `lib/client.ts`, `httpTransport` in `lib/http-transport.ts`, and the single-host `SqliteLedger` in `reference/node/ledger.ts`.

The host authorizes the action before execution, approves the destination, chooses the credential context, and isolates ledgers by authenticated principal and environment. The reference CLI illustrates local execution; production authentication remains the host adapter's responsibility. A production adapter must apply those host policies rather than forwarding publisher-specified credentials.

Treat receipts as observations. Store them privately, preserve their timestamps, and surface `pending` or `unknown` to the host instead of mapping either to success or retry.

## Alongside other conventions

These are optional coexistence patterns. Agentic does not require agents.txt, agents.json, or llms.txt. Configure protocol clients with the direct endpoints in the connection guide.

| Existing convention | Coexistence approach |
| --- | --- |
| [llms.txt](https://llmstxt.org/) | Link to a Markdown integration guide. Offer page Markdown alternates and `describedby` links to the documentation index. |
| [agent.json / AWP](https://www.agent-json.org/) | Keep capability and authentication discovery there. Pass the Agentic profile URL explicitly to your adapter; no standardized Agentic binding is claimed. |
| OpenAPI | Keep operation schemas in OpenAPI; reference IDs instead of duplicating endpoints in Agentic. The 1.0 subset is intentionally limited. |
| Arazzo | Compare existing workflow verification and recovery with the profile. An Arazzo mapping is future work, not an implemented adapter. |
| MCP and other tool runtimes | Wrap an authorized host operation around the same execution contract. Tool descriptions or annotations alone do not establish the service's behavior. |

No reciprocal support, partnership, or endorsement from these projects is implied. These integration patterns do not establish cross-project interoperability.

## Evaluate your integration

Compare against the team's competent existing recovery workflow. Measure implementation effort, maintenance burden, duplicate resources, false success, and unresolved outcomes. If the shared file saves no meaningful work, report that result and consider contributing a narrower extension to an existing convention instead.
