# Agentic
**A verifiable outcome for agent actions.** An experimental open convention for AI agents to track actions, verify results, and recover when a request is interrupted.

Version: 0.1.0-draft. Status: project reference implementation; not an adopted standard.
Project home: https://ruagentic.org
Repository: https://github.com/sam1siam/agentic

## What it does
A service creates a ticket, then the response is lost. The Agentic client uses its saved request ID to reconcile the original action and verify the ticket. It does not automatically repeat an ambiguous write.

The profile references existing OpenAPI operations. It specifies request tracking, outcome evidence, bounded recovery, and receipts. Authentication and authorization remain with the host. Prior art includes Arazzo, MCP, agents.json, and existing idempotency/verification techniques; see docs/PRIOR-ART.md.

## Start locally
Requirements: Node 24, Python 3.11+, npm.

```sh
npm ci
python -m pip install -r reference/python/requirements.txt
npm test
npm run dev
```

The site includes the draft, profile generator, examples, documentation hub, validator, browser recovery lab, comparison report, and pilot enrollment. It exports static assets for Vercel; see docs/DEPLOYMENT.md. Start with [the quick start](docs/QUICKSTART.md).

## Real HTTP recovery example
Start the loopback-only SQLite service in one terminal:

```sh
python reference/service/server.py --fault response-lost
```

In another terminal:

```sh
npm run client -- http://127.0.0.1:4318 example-request-001 "Please help with my account"
```

Run the same command again to return the saved receipt without creating another ticket. Change the subject with the same ID to see request-binding rejection. Use a new ID for a distinct requested action.

Python consumer:

```sh
python reference/python/client.py http://127.0.0.1:4318 python-request-001 "Please help with my account"
```

The service deliberately closes the first submission connection after committing the ticket. The clients reconcile through status and verify the resource. SQLite files are written only under ignored .agentic-state by default. The service is anonymous and intended only for local demonstration.

## Validate a profile
```sh
npm run validate -- examples/tickets/agentic.json examples/tickets/openapi.json
```

The validator never fetches a remote schema or executes advertised operations. The example origin support.example is a reserved example domain, not a live integration.

## Generate a starter
```sh
npm run init -- --origin https://your-service.example --out agentic.json
```

This creates a ticket-contract starter and refuses to overwrite an existing file. Adapt its operations and evidence to your service. The same starting contract is available in the [browser generator](https://ruagentic.org/generate/). No npm package has been published.

## Independent pilots
Enrollment is open through the [pilot application](https://github.com/sam1siam/agentic/issues/new?template=pilot.yml). No external participants are confirmed yet.

```sh
npm run pilot -- --adapter pilots/adapters/node-reference.json
```

The [compatibility runner](docs/PILOT-RUNNER.md) can invoke independently written clients through a documented process interface. Seven scenarios check real HTTP behavior and SQLite resource counts. The included adapter is project-authored. [The registry](pilots/registry.json) records independent evidence separately from reference code.

## Evidence
```sh
npm test
npm run typecheck
npm run benchmark
npm run build
```

The tests include real HTTP response loss, concurrent deduplication, and Node/Python process termination followed by ledger recovery. The browser lab and benchmark use deterministic in-memory scenarios. A separately written verification-workflow baseline demonstrates that existing techniques can achieve the same recovery result.

Both reference consumers are project-authored. They are not two independent implementations. No production adoption, partner, certification, or standards endorsement is claimed.

## Repository map
- docs/SPEC.md — normative draft and supported binding.
- schemas/ — profile and receipt JSON Schemas.
- lib/ — reference consumer, validator, and simulator.
- reference/ — Node/Python clients and local HTTP/SQLite service.
- tests/ — behavioral and integration tests.
- reports/ — reproducible deterministic comparison.
- app/ — website, validator, and recovery lab.
- docs/PILOT-KIT.md — interview guide and unsent outreach draft.
- docs/GOVERNANCE.md — open change process and stability criteria.

## Contribute
Try the example, report a failure, critique overlap with existing specifications, or implement the profile independently. See CONTRIBUTING.md and docs/ROADMAP.md.

Original code, schemas, and documentation: Apache-2.0. Third-party components retain their licenses.
