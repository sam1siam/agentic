# Working on Agentic

Read docs/SPEC.md and docs/SITE-PROFILE.md before changing protocol behavior. Site Profile 1.1.0, Action Profile 1.0.0, and tools 1.2.0 are the current releases; preserve published requirements and version compatibility explicitly.

Use Node 24 and Python 3.11+. Install with npm ci and python -m pip install -r reference/python/requirements.txt.

Checks: npm test, npm run typecheck, npm run build. Run npm run benchmark after changing scenarios or client behavior. Generated validators and public artifacts come from npm run prepare:artifacts; edit their sources.

Focus on direct use, documentation, tools, and voluntary contributions. Managed enrollment and outreach are retired. Do not resume invitations or enrollment unless the user explicitly requests them.

Keep real HTTP/SQLite test evidence distinct from the browser simulation. Never invent adopters, partners, interviews, certification, or endorsements. Project-authored clients do not count as independent implementations.

Keep credentials, ledgers, private receipts, and service databases out of Git. The local reference service stays loopback-only. Preserve same-origin and no-redirect execution checks. Do not automatically repeat ambiguous writes.

The website is a static export with a separate Node 24 Vercel Function for the user-authorized hosted platform. PostgreSQL stores isolated synthetic tests, reports, tasks and Agent Auth state. Read docs/PLATFORM.md for runtime requirements. Keep secrets out of generated public artifacts. Direct PostgreSQL connections are required for session advisory locks; do not replace them with transaction-pooled connections.
