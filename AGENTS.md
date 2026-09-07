# Working on Agentic
Read docs/SPEC.md before changing protocol behavior. This is an experimental draft, not an adopted standard.

Use Node 24 and Python 3.11+. Install with npm ci and python -m pip install -r reference/python/requirements.txt.

Checks: npm test, npm run typecheck, npm run build. Run npm run benchmark after changing scenarios or client behavior. Generated validators and public artifacts come from npm run prepare:artifacts; edit their sources.

Keep real HTTP/SQLite test evidence distinct from the browser simulation. Never invent adopters, partners, interviews, certification, or endorsements. Project-authored clients do not count as independent implementations.

Keep credentials, ledgers, private receipts, and service databases out of Git. The local demo stays loopback-only. Preserve same-origin and no-redirect execution checks. Do not automatically repeat ambiguous writes.

The website is a static export for Vercel. Keep its structure compatible with the Sites preview recorded in .openai/hosting.json. Do not add runtime secrets or hosting persistence without a concrete product need.
