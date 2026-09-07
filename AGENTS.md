# Working on Agentic
Read docs/SPEC.md before changing protocol behavior. This is an experimental draft, not an adopted standard.

Use Node 24 and Python 3.11+. Install with npm ci and python -m pip install -r reference/python/requirements.txt.

Checks: npm test, npm run typecheck, npm run build. Run npm run benchmark after changing scenarios or client behavior. Generated validators and public artifacts come from npm run prepare:artifacts; edit their sources.

The managed pilot program and outreach are retired. Focus on direct use, documentation, tools, and voluntary contributions. Do not resume invitations or enrollment unless the user explicitly requests them.

Keep real HTTP/SQLite test evidence distinct from the browser simulation. Never invent adopters, partners, interviews, certification, or endorsements. Project-authored clients do not count as independent implementations.

Keep credentials, ledgers, private receipts, and service databases out of Git. The local demo stays loopback-only. Preserve same-origin and no-redirect execution checks. Do not automatically repeat ambiguous writes.

The website is a static export with a separate Node 24 Vercel Function for the user-authorized hosted platform. PostgreSQL stores isolated synthetic tests, reports, tasks and Agent Auth state. Read docs/PLATFORM.md for runtime requirements. Keep secrets out of generated public artifacts. Direct PostgreSQL connections are required for session advisory locks; do not replace them with transaction-pooled connections.
