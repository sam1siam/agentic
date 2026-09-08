# Migrate to Agentic 1.0

Agentic 1.0.0 uses explicit version identifiers for the action profile, receipt, schemas, and generated text index. The 1.0 validators accept the 1.0.0 contract only.

## New actions

1. Install and pin `ruagentic@1.2.0` and the matching service/client implementation.
2. Set the profile's `agentic` field to `1.0.0`. Use `agentic-1.0.schema.json` for profile validation and `receipt-1.0.schema.json` for receipt validation.
3. Generate new receipts with the `1.0.0` version identifier. Preserve historical receipts exactly as recorded; changing their version would not retest or reverify the original action.
4. Revalidate the profile against the service's actual OpenAPI document and run behavioral checks for request tracking, idempotency, status reconciliation, and resource evidence.
5. Regenerate `agentic.txt` from the validated profile. Its header is `Agentic-Text: 1.0` and its `Profile-Version` is `1.0.0`. Deploy the JSON and TXT together.

```sh
npm install -g ruagentic@1.2.0
agentic validate agentic.json openapi.json
agentic text agentic.json
agentic text agentic.json --check
```

The TXT generator refuses to overwrite an existing file. Review and replace a stale generated index deliberately before regenerating it. A version-field change alone does not establish behavioral compatibility.

## Unfinished requests

Preserve each unfinished request's original profile and OpenAPI snapshots, saved input, request ID, ledger, and installed compatible client. Do not relabel an in-flight request as 1.0.0, replace its saved contract, migrate it by changing its request ID, or repeat its write.

Reconcile the original attempt with the client and contract that created it. If that is unavailable or tracking has expired, keep the outcome unresolved and use the host's explicit reconciliation or handoff process. Upgrade new work separately after the new implementation passes its checks.

Retain original receipts and reports with their recorded versions and observation times. Generate fresh 1.0.0 results when verifying the upgraded integration; historical evidence is not automatically evidence for the new version.
