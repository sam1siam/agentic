# Agentic CLI

Tools 1.1.0 for Agentic Action Profile 1.0.0 and TXT 1.0. Node 24 or newer is required.

Install the versioned CLI from [npm](https://www.npmjs.com/package/ruagentic) using `npm install -g ruagentic@1.1.0`. The same package and its checksums are available in [GitHub releases](https://github.com/sam1siam/agentic/releases/tag/v1.1.0).

```sh
agentic init --origin https://your-service.example
agentic text agentic.json
agentic text agentic.json --check
agentic validate agentic.json openapi.json
agentic audit https://your-service.example/agentic.json
agentic mcp
```

`init` and `text` refuse to overwrite files. `text` creates an optional agentic.txt action index from validated JSON; `--check` detects summary drift. Use `--profile-url` for a non-default public JSON location. See [the text companion guide](https://ruagentic.org/docs/AGENTIC-TXT.md). `validate` exits nonzero on invalid structure or bindings. `audit` accepts a website or full JSON URL and reads public HTTPS files without following redirects or executing actions. It checks JSON, OpenAPI bindings, and the matching TXT index. Report version 2 preserves `valid` for JSON/API checks; require `valid && textIndex.status === "matched"` when checking both files. A TXT mismatch is a failed check but does not change the JSON/API exit code. See [audit results and limits](https://ruagentic.org/docs/AUDIT.md). `mcp` serves specification, generation and validation tools over stdio; keep stdout reserved for protocol messages.

A profile does not implement service behavior, grant permission, or certify an API. Start at https://ruagentic.org/adopt/. Run the local HTTP example from https://ruagentic.org/docs/QUICKSTART.md or test your client with https://ruagentic.org/docs/COMPATIBILITY.md.

For existing integrations, follow the [1.0 migration guide](https://ruagentic.org/docs/MIGRATION.md). Preserve unfinished requests and their original contracts when upgrading new work.
