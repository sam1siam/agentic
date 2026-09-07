# Security and operational limits
This is an experimental reference implementation, not a production authorization service.

Report vulnerabilities through the repository's private security reporting feature if available. Do not publish credentials, private receipts, or exploitable details in an issue. For non-sensitive bugs, include a minimal reproduction and affected version.

The public manifest is untrusted data. Keep authorization in the host; restrict destinations independently of manifest validation. Do not forward credentials to newly discovered origins or redirects. Bind request ledgers to the current principal and environment. Set response limits and timeouts.

The local demo binds to 127.0.0.1 and has no authentication. Its fault injection and inspection endpoints are intentionally for tests. Do not expose it directly to the Internet.

SQLite ledgers store inputs and receipts. Protect their directory, keep them out of Git, and define a retention policy. The included locks work only among processes on a single machine; PID reuse fails closed. They are not distributed leases.

No static declaration or receipt establishes service honesty or prevents prompt injection. JSON Schema validation is one parsing check, not authorization or a trust decision.
