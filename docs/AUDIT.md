# Audit your Agentic files

Use [the audit page](https://ruagentic.org/audit/) to check a public website or an exact JSON profile URL. No account is required. The page creates a private browser session when you run an audit.

A bare domain uses HTTPS. An origin checks `/agentic.json`; a URL ending in `/` checks `agentic.json` in that directory. For another path, provide the complete JSON URL. Queries, credentials, fragments, HTTP, and ports other than 443 are rejected.

## What gets checked

- The JSON file is reachable, parses correctly, and matches the Agentic 1.0 profile requirements.
- The profile origin matches the origin serving the file.
- Each linked OpenAPI document is on that origin and contains the required submission, status, and resource-read operations.
- The sibling `agentic.txt` matches the index generated from the JSON, including its profile URL. The comparison is exact, including line endings and comments.
- JSON and TXT response content types are appropriate. Optional `/llms.txt` availability is recorded without affecting the result.

The audit reads public files. It does not send your credentials to the target, execute an action, test authentication, or establish that a service implements request tracking and recovery correctly. Use behavioral tests for those properties.

## Understanding the report

Each check is **Passed**, **Note**, or **Fix**. Missing optional TXT is a note; published TXT that differs from the generated index needs a fix. Download the JSON report to keep the results.

Report version `2` preserves `valid` as the result of JSON structure, origin, and OpenAPI binding checks. TXT consistency is reported separately in `textIndex` and `checks`: a mismatch can produce a failed check while `valid` remains `true`. Consumers that require a matching pair should require `valid && textIndex.status === "matched"`. The command-line audit exits nonzero when `valid` is false; inspect `textIndex` when enforcing publication of both files.

`structure`, `bindings`, `errors`, and `observations` retain partial results when a file cannot be read. Every report includes its timestamp and `behavioralTesting: false`. A report describes the files observed at that time; it is not certification.

## Limits and privacy

The auditor accepts public HTTPS destinations on port 443. It checks all resolved addresses, pins a public address for the request, rejects private and special networks, follows no redirects, and rejects compressed responses. Each lookup has a five-second DNS deadline and each HTTP read has an eight-second deadline. Profiles, TXT, and llms.txt are limited to 64 KiB each; OpenAPI documents to 256 KiB each, with at most five unique documents. Independent linked files are read concurrently.

Browser audits are limited to six per minute per session, alongside the platform's request limits. Reports are private to the session and retained for up to 30 days. The [hosted tools](https://ruagentic.org/platform/) provide history, explicit sharing, and session deletion. Do not put secrets in public file URLs.

## Command line and agents

```sh
npm install -g ruagentic@1.1.0
agentic audit https://your-service.example
```

The same audit is available through the hosted MCP tool and the CLI. See [Connect](https://ruagentic.org/connect/) for setup. To work entirely locally, use `agentic validate agentic.json openapi.json` and `agentic text agentic.json --check`.
