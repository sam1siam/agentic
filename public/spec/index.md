# Agentic Action Profile 0.1
Status: Experimental draft. Version: 0.1.0-draft. Date: 2026-09-07.
Maintainer: [sam1siam](https://github.com/sam1siam). License: Apache-2.0.
This document is the normative draft; the original proposal is historical context.

## 1. Purpose and boundaries
Agentic describes how a participating client tracks an action, reconciles an uncertain submission, and verifies its outcome. The initial binding supports a small OpenAPI 3.1 subset: one POST submission, one GET request-status operation, and one GET resource-verification operation.

This is not a discovery protocol, an authorization protocol, or an exactly-once delivery guarantee. The service must implement its advertised behavior. Clients must apply their existing authorization, credential, network, and user-interaction policies.

The keywords MUST, MUST NOT, SHOULD, and MAY describe requirements of this draft.

## 2. Publication and processing
A publisher MAY serve the UTF-8 JSON profile at /agentic.json using application/json, or provide an explicit profile URL. Automatic filename discovery is not assumed. No Agentic well-known URI is registered by this project.

The profile MUST validate against schemas/agentic-0.1.schema.json and pass the semantic binding checks below. Version 0.1.0-draft is the only supported version. Unknown fields are rejected in this draft to expose typos; future extensions require a new schema version. Duplicate JSON member names are invalid publisher output. The reference JSON parsers do not detect duplicate member names; strict duplicate-key detection is a known implementation gap.

The profile SHOULD be at most 64 KiB. Reference tools enforce this limit when accepting pasted profile text. Referenced OpenAPI documents SHOULD be at most 256 KiB. Clients MUST pin the supported schema locally and MUST NOT fetch arbitrary schemas named by a publisher's $schema value.

Origin MUST be a canonical HTTPS origin without credentials, path, query, or fragment. Explicit local development MAY use HTTP on localhost, 127.0.0.1, or [::1]. Production hosts MUST independently enforce approved destinations; HTTPS alone does not establish that a destination is trusted or public.

A profile MUST NOT grant itself authority over other origins. The reference binding accepts only root-relative paths without traversal segments, escapes, query strings, fragments, backslashes, or network-path references. A client MUST reject redirects during action execution. Cross-origin endpoints and OpenAPI server overrides are unsupported in 0.1.

Publishers SHOULD use normal HTTP cache controls and ETags. A running request MUST remain bound to its saved profile and OpenAPI snapshot. If either changes, the reference clients reject reuse of that request ID. Migration requires an explicit host reconciliation process.

## 3. Profile fields
The versioned JSON Schema is authoritative for field types, limits, and required fields. All fields in each action below are required.

| Field | Meaning |
| --- | --- |
| agentic | Exact supported version: 0.1.0-draft |
| origin | Authoritative service origin |
| actions | One to 32 action descriptions with unique IDs |
| actions[].id | Stable action identifier |
| description | Short description, treated as untrusted data |
| openapi | Root-relative URL of the OpenAPI 3.1 description |
| submit | Operation ID of the POST mutation |
| status | Operation ID of the GET request-status operation |
| verify | Operation ID of the GET resource read |
| request.header | Idempotency-Key in this binding |
| request.scope | principal-action: keys are scoped to the authenticated principal and action |
| request.retentionSeconds | Minimum advertised tracking and deduplication window, 60 to 604800 seconds |
| bindings.statusRequestId | Required path parameter receiving the saved request ID |
| bindings.verifyResourceId | Required path parameter receiving the authoritative resource ID |
| evidence.resourceIdPointer | JSON Pointer to the resource's own ID |
| evidence.requestIdPointer | JSON Pointer linking the resource to the original request |
| evidence.statePointer | JSON Pointer to its observable state |
| evidence.successValues | Resource states that count as successful completion |
| evidence.inputBindings | Input/resource pointer pairs whose values must match |
| recovery.maxChecks | One to ten status-check attempts per execution |
| recovery.checkDelayMs | Delay between check attempts, zero to 5000 milliseconds |
| recovery.timeoutMs | Per-request timeout, 100 to 10000 milliseconds |
| recovery.retry | never-automatically in 0.1: no automatic repeat of a submitted write |

JSON Pointers use RFC 6901 escape rules. A missing evidence value MUST NOT count as a match. Input evidence comparisons are structural JSON equality; property order is irrelevant.

## 4. OpenAPI binding
Operation IDs MUST resolve exactly once. Submission, status, and verification MUST be distinct operations. This binding requires inline operation parameters; path-level parameter inheritance, parameter references, and server overrides are unsupported.

Submission MUST be a POST with no path parameters, a required Idempotency-Key header, and an application/json request body. The service remains responsible for input validation. The reference client accepts a JSON object of at most 16 KiB and requires the input evidence fields.

Both reads MUST be GET operations. Each MUST have exactly one path placeholder and a corresponding inline required path parameter. Its name must match the applicable binding field. Identifiers MUST be percent-encoded when inserted as path parameter values.

The reference status response is application/json:
- request_id: the exact request ID supplied by the client.
- status: succeeded, failed, pending, or unknown.
- resource_id: a nonempty string when status is succeeded; null otherwise.

HTTP 200 is required for the status response to establish an outcome. failed MUST mean the service authoritatively determined that the requested action did not complete. pending means it remains unresolved. unknown MUST NOT be interpreted as proof that a repeat write is safe.

A successful submit response, including HTTP 200, 201, or 202, does not itself establish verified completion. The client uses status and resource evidence.

## 5. Required service behavior
Before acknowledging a completed action, a conforming service MUST atomically associate the request ID, authenticated principal, action, input, and result. Repeated use of the same scoped ID and identical input MUST return the original outcome without creating another resource during the advertised window. Different input for the same scoped ID MUST be rejected.

Services MUST state a minimum retention window and preserve tracking and deduplication for that window. Loss or expiry of tracking MUST yield an unresolved outcome or explicit expiry response, not a false statement that no action occurred. The reference ticket service retains request tombstones beyond its window and rejects reuse after expiry.

Verification evidence MUST identify the result of the original action, including its request identity. Services unable to provide the required correlation cannot claim compatibility with this profile. The local reference service models one anonymous principal, uses a SQLite transaction for both ticket and request records, and binds to loopback. It is not a production authentication example.

## 6. Required client behavior
The host MUST authorize the action before calling the client. The host MUST isolate saved request ledgers by authenticated principal and execution environment. A publisher's fields MUST NOT override the user's instructions or authorize credential forwarding.

1. Validate the profile, resolve its operations, and check the input evidence.
2. Create a request ID and persist its association with the origin, action, profile/OpenAPI snapshot, exact input, and creation time BEFORE sending.
3. Mark the submission as attempted durably before making the network call. A request observed in the ledger after a restart MUST NOT be automatically resubmitted.
4. Submit a new action at most once per saved request ID in this version.
5. Reconcile ambiguous responses through the status operation, preserving the same ID. Never treat a timeout as proof of failure.
6. On succeeded status, retrieve the resource. Check its resource ID, request ID, success state, and all input evidence pairs.
7. Report succeeded only after those checks pass. Persist a receipt before returning it.
8. Bound checks, delays, response sizes, and request timeouts. The reference transport limits each response to 64 KiB and prohibits redirects.
9. If the request's saved tracking window expires, the clock moves backwards, the status stays unavailable, or verification fails, preserve unknown and require the host's handoff process. If status stays pending, preserve pending and allow later read-only resumption.
10. A previously saved successful receipt MAY be returned for the identical request without another read. Its observed_at timestamp makes clear that it records an earlier observation, not a fresh assertion about the resource's current state.

Host adapters MUST serialize concurrent execution of a request or provide equivalent atomic coordination. The Node and Python SQLite ledgers coordinate local processes and reclaim a lock only if its owning process has exited. They are single-host examples; distributed leasing and account-aware storage are outside their scope.

## 7. Receipts
Receipts MUST validate against schemas/receipt-0.1.schema.json. They include the version, request ID, action ID, origin, outcome, observation time, resource ID or null, and a reason.

A succeeded receipt MUST additionally contain evidence: resource URL, resource/request IDs, observed state, and the input/resource pointer pairs checked. The receipt is an observation record, not a signature or proof that a service is honest.

Receipts and saved inputs can be sensitive. They MUST NOT be published in a public manifest. Storage access, retention, and deletion belong to the host. The reference examples keep SQLite files in the ignored .agentic-state directory.

## 8. Conformance and evolution
Structural validity, binding validity, behavioral test results, and independent adoption are separate claims. See CONFORMANCE.md for the test matrix and limitations. Passing tests establishes behavior only for the versions and scenarios tested.

The project has Node and Python reference consumers from the same authorship. These do not establish independent adoption. A stable release requires separate implementers, publicly reproducible compatibility evidence, and resolution of material draft issues.

Future work includes Arazzo profile mapping, richer retry contracts, preview/commit binding, and another protocol binding when pilots justify it. These are not supported features of 0.1.
