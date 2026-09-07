# Profile validator

The [browser validator](https://ruagentic.org/validate/) checks pasted `agentic.json` against the pinned 0.1 schema and semantic rules. An optional pasted OpenAPI document enables operation-binding checks. It does not fetch external schemas, inspect live services, or execute actions.

Use the profile and OpenAPI tabs, load the ticket example or paste your own files, and select **Validate profile**. Editing either file clears the old result. Profile input is limited to 64 KiB and OpenAPI input to 256 KiB. The copy action copies the profile JSON.

Checks cover field types and limits, canonical HTTPS origin, unique action IDs, same-origin paths, distinct operations, required idempotency headers, supported JSON submissions, and required read-path parameters. Duplicate JSON member detection remains a known parser gap documented in SPEC.md.

The command-line equivalent is:

```sh
npm run validate -- profile.json openapi.json
```

A valid profile is a declaration, not evidence that a service implements its claims. Use the compatibility runner and service review to test behavior. See [CONFORMANCE.md](https://ruagentic.org/docs/CONFORMANCE.md).
