# Hosted testing platform

## Website discovery

`POST /api/platform/discover` accepts `{ "url": "https://your-site.com" }` for an owner authenticated by the browser session or platform credentials. The generator creates its browser session automatically. Reports use kind `discovery`, remain private, and expire after 30 days. Limits are three scans per minute per owner and six per minute per client IP, including hosted MCP discovery calls. [Scanner limits](SITE-PROFILE.md#discovery-and-auditing) bound network reads and file generation. No database migration is required beyond the existing report store.

The [Agentic platform](https://ruagentic.org/platform/) runs synthetic recovery tests over HTTP with a PostgreSQL service and request ledger. This is separate from the browser lab simulation and the loopback Python reference service.

The [production verification record](https://ruagentic.org/reports/platform-live.json) records the live checks performed by the project. It is project-authored evidence for the tested deployment.

## Recovery sandbox

Start a test to create an isolated private session. Choose normal completion, response failure after commit, interruption after submission, status outage, mismatched evidence, or pending status. Only the fixed synthetic ticket input is used by the console.

The response-failure scenario returns HTTP 503 after the resource commit. It does not claim to reproduce a physical network disconnect. The interruption scenario stops client execution after submission. Resume starts a fresh HTTP invocation and reconstructs the client from the persisted PostgreSQL ledger, with no repeat submission. The local compatibility runner additionally tests actual process termination.

Each report includes observed HTTP responses, a recovery trace, the receipt, committed-write count, resource count, and status reads. A structure pass, project-authored test, or synthetic result is not independent certification.

The service profile is at https://ruagentic.org/api/platform/service/agentic.json and its OpenAPI document at https://ruagentic.org/api/platform/service/openapi.json. Service operations require the session bearer token or authenticated internal execution. Request IDs are scoped to the principal. The tracking window is 24 hours; retained tombstones prevent reuse of an old request ID from creating another resource.

## Public URL auditor

The [auditor](https://ruagentic.org/audit/) accepts a website or full JSON URL and reads its profile, same-origin OpenAPI bindings, matching TXT index, and optional llms.txt documentation index. See [audit checks and report semantics](AUDIT.md). It reports content types, sizes, and status codes. It makes no action submissions and does not prove runtime idempotency, authorization, retention, or recovery behavior.

Only public HTTPS on port 443 is accepted. All resolved IP addresses must be public. Connections pin the resolved address while retaining TLS hostname verification. Redirects, compressed responses, private networks, credentials in URLs, oversized bodies, and long requests are rejected. The profile limit is 64 KiB; OpenAPI is 256 KiB per document, up to five documents.

## Reports and sessions

Private reports and A2A tasks are isolated by session or authenticated agent. The console shows up to 100 recent reports. Reports expire after 30 days. A daily cleanup removes expired reports, tasks and temporary cache entries. An explicit sharing action creates an unguessable report link; disabling sharing immediately invalidates it.

Session credentials are random, stored as hashes, and delivered in an HttpOnly, SameSite cookie. Exporting a bearer token rotates the browser's credential. Revoking the session invalidates that token and private-history access. This anonymous sandbox does not offer customer account recovery or cross-device login. Do not submit secrets or personal information in audit URLs or uploaded profiles.

## Agent connections

See [Connect an agent](https://ruagentic.org/connect/): public MCP, conditional WebMCP page tools, A2A 1.0 JSON-RPC testing tasks, and autonomous Agent Auth registration, grants, execution and revocation.

## Operations

The static website and Node 24 Vercel Function share one deployment. A free Neon PostgreSQL database stores requests, ledgers, reports, tasks, rate limits and Agent Auth state. Direct database connections are required for PostgreSQL session advisory locks. Neon transaction-pooled URLs must not be used for those locks.

Required environment variables: `DATABASE_URL_UNPOOLED` (or direct `DATABASE_URL`), `BETTER_AUTH_SECRET`, `CRON_SECRET`, and `AGENTIC_ORIGIN=https://ruagentic.org`. Keep them in the hosting environment. Run `node scripts/platform-migrate.ts` before deployment with those variables available. Never run migrations on each HTTP request.

Public requests are rate limited in PostgreSQL; testing, auditing and registration have additional limits. Logs contain route, method, response status and duration, not bearer credentials, bodies or query strings. Daily cleanup uses a secret-protected Vercel cron endpoint. Requests and ledger tombstones outlive the 24-hour tracking window to prevent duplicate writes.

For local development, use an isolated PostgreSQL database, set `.env.platform-test`, run migrations and `npm run platform:dev`, then `npm run dev`. The frontend development proxy connects to the loopback platform server on port 3002. `AGENTIC_ALLOW_LOCAL=1` is for local tests only.
