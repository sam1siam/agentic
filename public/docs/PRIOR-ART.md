# Prior work and positioning
Research checked September 7, 2026. These projects cover different parts of the agent ecosystem; inclusion is not an adoption or endorsement claim.

- [llms.txt](https://llmstxt.org/): concise website context and links.
- [AGENTS.md](https://agents.md/): instructions for coding agents in repositories.
- [Wildcard agents.json](https://github.com/wild-card-ai/agents-json): API contracts and flows built on OpenAPI.
- [OpenAPI Arazzo](https://spec.openapis.org/arazzo/latest.html): workflows, outputs, success criteria, and failure actions. Agentic should reuse its machinery where useful.
- [Agentic Resource Discovery](https://github.com/ards-project/ard-spec): discovery and federated search for agent resources.
- [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html): API catalogs.
- [A2A](https://a2a-protocol.org/): agent descriptions, communication, tasks, and artifacts.
- [MCP tool annotations](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/): behavioral hints; metadata is not enforcement.
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/): structured tools in web applications.
- [Agent Permissions](https://github.com/las-wg/agent-permissions.json): advisory interaction permissions.
- [Verified Tool Calls Improve LLM Agent Reliability Under Non-Atomic Failures](https://arxiv.org/abs/2608.02645): direct research precedent for postcondition verification and interrupted-call recovery.

Agentic does not claim invention of idempotency, status reconciliation, receipts, or verification. Agentic provides a focused shared profile and reproducible behavioral tests for interrupted action recovery. Its integration guide explains how it works alongside existing API descriptions and agent protocols.
