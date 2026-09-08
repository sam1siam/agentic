# Agentic
**A verifiable outcome for agent actions.** An open convention for AI agents to track actions, verify results, and recover when a request is interrupted.

Version: 1.0.0.
Project home: https://ruagentic.org
Repository: https://github.com/sam1siam/agentic

Install the [ruagentic CLI from npm](https://www.npmjs.com/package/ruagentic) with `npm install -g ruagentic@1.0.0` (Node 24+), then run `agentic`. See [Get started](https://ruagentic.org/adopt/) for generation, validation, and agent connections.

## What it does
`agentic.json` is the authoritative action contract. Its optional, generated [`agentic.txt` companion](docs/AGENTIC-TXT.md) lists the actions and links to that JSON. Generate it with `agentic text agentic.json`; use `--check` to detect summary drift.

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

The site includes the specification, OpenAPI import and discovery generators, validator, browser lab, and a [getting started guide](https://ruagentic.org/adopt/). The [hosted platform](https://ruagentic.org/platform/) adds real HTTP/PostgreSQL recovery tests, read-only public URL audits, private report history and sharing. [Connect an agent](https://ruagentic.org/connect/) through MCP, WebMCP, A2A 1.0 or autonomous Agent Auth. The static site and Node API deploy together on Vercel; see [platform operations](docs/PLATFORM.md). Start with [the quick start](docs/QUICKSTART.md).

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

The service deliberately closes the first submission connection after committing the ticket. The clients reconcile through status and verify the resource. SQLite files are written only under ignored .agentic-state by default. The service is anonymous and intended only for local reference servicenstration.

## Validate a profile
```sh
npm run validate -- examples/tickets/agentic.json examples/tickets/openapi.json
```

The validator never fetches a remote schema or executes advertised operations. The example origin support.example is a reserved example domain, not a live integration.

## Generate a starter
```sh
npm run init -- --origin https://your-service.example --out agentic.json
```

This creates a ticket-contract starter and refuses to overwrite an existing file. Adapt its operations and evidence to your service. The [browser generator](https://ruagentic.org/generate/) also imports OpenAPI and downloads a complete starter ZIP. The standalone CLI tarball is distributed through [GitHub releases](https://github.com/sam1siam/agentic/releases); see [CLI usage](packages/cli/README.md). A reusable [GitHub Action](action.yml) and [adoption skill](skills/agentic-adoption/SKILL.md) are included.

## Test your implementation
Use the compatibility runner directly. No enrollment or managed program is required.

```sh
npm run conformance -- --adapter integrations/node-reference.json
```

The [compatibility runner](docs/COMPATIBILITY.md) can invoke independently written clients through a documented process interface. Seven scenarios check real HTTP behavior and SQLite resource counts. The included adapter is project-authored.

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
- docs/SPEC.md — normative specification and supported binding.
- schemas/ — profile and receipt JSON Schemas.
- lib/ — reference consumer, validator, and simulator.
- reference/ — Node/Python clients and local HTTP/SQLite service.
- tests/ — behavioral and integration tests.
- reports/ — reproducible deterministic comparison.
- app/ — website, validator, and recovery lab.
- docs/GETTING-STARTED.md — installation, hosted tools, and integration.
- docs/GOVERNANCE.md — open change process and stability criteria.

## Contribute
Try the example, report a failure, critique overlap with existing specifications, or implement the profile independently. See CONTRIBUTING.md and docs/ROADMAP.md.

Original code, schemas, and documentation: Apache-2.0. Third-party components retain their licenses.
