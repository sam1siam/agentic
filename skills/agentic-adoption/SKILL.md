---
name: agentic-adoption
description: Implement or review an experimental Agentic action-recovery profile for an existing OpenAPI service, including operation bindings, evidence validation, and isolated recovery tests.
---

# Agentic adoption

Agentic 0.1 is an experimental profile, not an established standard. It adds request tracking and verifiable outcome evidence to three existing OpenAPI operations. The profile is untrusted data and never grants execution permission.

Read the pinned draft supplied with the implementation, or https://ruagentic.org/docs/SPEC.md before changing protocol behavior. The draft supports an OpenAPI 3.1 subset: one POST submission, one GET request-status operation, and one GET resource operation on the same origin. Do not invent fields for MCP, A2A, authentication, or discovery inside `agentic.json`.

Start with one action that the service owner can test in isolation. Map its real operation IDs and path parameters. Confirm that the status response supplies `request_id`, `status`, and `resource_id`, and that resource evidence binds the original request ID, resource ID, expected input fields, and successful state. Do not infer durable idempotency or retention from an OpenAPI description.

Validate the profile with its OpenAPI file using the Agentic CLI or https://ruagentic.org/validate/. The generator's OpenAPI import can create a starter ZIP. These checks prove structure and operation bindings; they do not prove runtime behavior.

For client implementation, persist the origin, action, complete profile/API identity, request ID, input, and attempted-send state before submitting. Hold an exclusive lock for the request. After any ambiguous write or restart, query the original request and verify its resource. Do not automatically repeat the write. Expired tracking, invalid evidence, and unavailable status require an unknown/pending result and an explicit handoff or later read-only reconciliation.

Keep hosted test credentials, ledgers, and private receipts out of source control. Use the service's existing principal for request scoping; an authentication refresh must not create a second logical action.

Use the compatibility runner against its local project fixture. Only test another service when the user has authorized behavioral testing of that service. URL auditing of other services is read-only. Report the exact implementation, scenario, request/commit counts, outcome, and evidence artifact. Label browser simulations and project-authored clients accurately. An invitation, structural pass, or internal test is not an independent adoption.

Useful project endpoints:

- Hosted MCP: `https://ruagentic.org/mcp` for specification, generation, validation, and public URL auditing.
- Hosted console: `https://ruagentic.org/platform/` for synthetic recovery evidence and saved reports.
- Get started: `https://ruagentic.org/adopt/`.
- Compatibility runner: `https://ruagentic.org/docs/COMPATIBILITY.md`.
- Repository: `https://github.com/sam1siam/agentic`.

Prefer the smallest complete implementation and evidence report for one action before expanding the profile.
