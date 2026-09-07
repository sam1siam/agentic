# External-client compatibility runner

This runner gives separately written clients the same synthetic ticket service and seven behavior scenarios. It checks outcomes and observes HTTP calls and persisted resources. It does not certify the implementation or prove independent authorship.

## Run the reference adapter

From the repository root, after the [quick start](QUICKSTART.md) installation:

```sh
npm run pilot -- --adapter pilots/adapters/node-reference.json
```

To retain a report, create a private output directory and pass `--out path/to/report.json`. Add `--revision YOUR_IMPLEMENTATION_COMMIT` when submitting evidence. The example adapter is project-authored; its passing report is not an independent pilot.

## Connect your implementation

Create a local JSON configuration, for example:

```json
{
  "name": "Your independently written client",
  "authorship": "external-self-declared",
  "command": ["python", "/absolute/path/to/your_adapter.py"]
}
```

`command` is a locally trusted executable and argument array, not a shell string or a value obtained from a remote manifest. The process runs with the repository root as its current directory. The harness launches a fresh loopback service and temporary ledger directory per scenario. It never points at production.

The adapter reads one JSON object from stdin:

| Key | Meaning |
| --- | --- |
| profile | Full Agentic profile, with an explicit `http://127.0.0.1:PORT` test origin |
| openapi | The matching OpenAPI 3.1 document |
| request_id | Identity to persist and use throughout the attempt |
| input | Synthetic ticket input |
| ledger_path | A temporary persistent location shared across restart calls |
| test_crash_after_submit | Test hook: terminate with exit code 86 after the submission has been attempted and before reconciliation |

In normal execution, write exactly one receipt JSON object to stdout and exit zero, including for a valid `unknown` or `pending` receipt. Put diagnostic logs on stderr. For the crash hook, exit 86 without a receipt. Never implement this test hook in an untrusted production request interface.

You may use a different persistence format at `ledger_path`; treat it as a per-scenario namespace. When invoked again with the same location and request identity, resume the saved attempt without another POST. Preserve host permission and origin policy in your actual integration; the harness is deliberately local and single-principal.

Run:

```sh
npm run pilot -- --adapter /path/to/adapter.json --revision YOUR_COMMIT --out report.json
```

## Scenarios

| Scenario | Expected result |
| --- | --- |
| normal | One resource; verified success |
| response-lost | One resource despite a dropped reply; verified success |
| status-unavailable | One committed resource, unknown outcome, no repeated write |
| stale-read | An initially missing resource becomes readable; verified success |
| wrong-evidence | Mismatched request evidence produces unknown |
| pending | Pending receipt, zero resources |
| restart-after-submit | Process exits after committing the submission; a new process recovers without another POST |

Each case checks receipt structure, request/action/origin identity, a single submission, status lookup, and expected resource count. Successful cases also check resource reads and evidence identity, source, state, input bindings, and stored input. `--scenario normal` runs just that case for adapter debugging.

## Submit evidence

Use the repository's implementation-report issue form. Include your source repository, tested revision, adapter interface, report, provenance, and comparison against the existing workflow. Redact private information before uploading anything. Maintainers must review independence and reproducibility before adding a verified independent entry.

## Limits

The runner does not test production authentication, principal isolation, distributed leases, provider retention over real days, malicious destination policy, all malformed inputs, or all process-crash timings. A client can pass these examples and still violate other requirements. The broader project tests and manual integration review remain necessary. Self-declared external authorship is always recorded with `independence_verified: false`; the harness never awards adoption status automatically.
