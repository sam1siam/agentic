# Quick start

Run Agentic 1.0 with synthetic tickets on a loopback reference service. The service intentionally supports fault injection for recovery testing and has no authentication; keep it local.

## Requirements

- Node 24.x and npm.
- Python 3.11 or later, available as `python`.
- Two terminals in the repository directory.

```sh
git clone https://github.com/sam1siam/agentic.git
cd agentic
npm ci
python -m pip install -r reference/python/requirements.txt
```

## Run an interrupted action

First terminal:

```sh
python reference/service/server.py --fault response-lost
```

Second terminal:

```sh
npm run client -- http://127.0.0.1:4318 example-001 "Example ticket"
```

The service commits one ticket, then closes the connection before delivering its first response. The client reconciles the request, reads the ticket, verifies its identity and subject, and prints a JSON receipt with `outcome: succeeded`.

Repeat the exact client command. It returns the saved receipt without creating another ticket. Its `observed_at` is the original observation time. Stop the service with Ctrl+C. State lives under the ignored `.agentic-state` directory.

The Python client can run the same operation:

```sh
python reference/python/client.py http://127.0.0.1:4318 python-example-001 "Python example ticket"
```

## Create a profile for your service

```sh
npm run init -- --origin https://your-service.example --out agentic.json
npm run validate -- agentic.json examples/tickets/openapi.json
```

The initializer refuses to overwrite existing files. Its starting operations and evidence are for the ticket example. Replace them with your actual service contract, then validate against your actual OpenAPI file. Validation does not call the service.

The [browser generator](https://ruagentic.org/generate/) offers the same starting contract with editable fields and a JSON download. The [validator](https://ruagentic.org/validate/) accepts pasted profile and OpenAPI JSON.

Publish the file on the service origin as `/agentic.json` with `Content-Type: application/json`, or give the profile URL explicitly to a supporting client. The service needs real atomic request tracking, idempotency, status lookup, and correlated resource evidence. Uploading JSON alone does not implement those capabilities.

## Verify the implementation

```sh
npm test
npm run typecheck
npm run conformance -- --adapter integrations/node-reference.json --out .agentic-state/compatibility-report.json
```

The first command exercises the project tests. The compatibility runner can also drive your own client; see [COMPATIBILITY.md](COMPATIBILITY.md). Project-authored runs are reference checks, not independent adoption.

## Troubleshooting

- **Port 4318 is busy:** use `--port 4319` on the server and the matching client origin.
- **Request ID reused with changed input:** restore the original input to reconcile that attempt. Only choose a new ID when intentionally authorizing a separate new action.
- **Outcome unknown or pending:** retain the request ID and ledger. Inspect the reason; do not automatically repeat the mutation.
- **Python is unavailable:** install Python 3.11+ and ensure the `python` command works before the HTTP tests.
- **Schema passes but binding fails:** the binding requires inline OpenAPI 3.1 operations without server overrides or parameter references. See [INTEGRATIONS.md](INTEGRATIONS.md).
- **Expired tracking:** use the host's reconciliation or human handoff process. Expiry is not proof the action failed.

See the [normative specification](SPEC.md) and [security limits](SECURITY.md) before integrating another service.
