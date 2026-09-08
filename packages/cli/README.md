# Agentic CLI

Experimental tools for the Agentic Action Profile. Node 24 or newer is required.

Install the versioned CLI from [npm](https://www.npmjs.com/package/ruagentic) using `npm install -g ruagentic@0.1.0-draft.6`. The same package and its checksums are available in [GitHub releases](https://github.com/sam1siam/agentic/releases/tag/v0.1.0-draft.6).

```sh
agentic init --origin https://your-service.example
agentic text agentic.json
agentic text agentic.json --check
agentic validate agentic.json openapi.json
agentic audit https://your-service.example/agentic.json
agentic mcp
```

`init` and `text` refuse to overwrite files. `text` creates an optional agentic.txt action index from validated JSON; `--check` detects summary drift. Use `--profile-url` for a non-default public JSON location. See [the text companion guide](https://ruagentic.org/docs/AGENTIC-TXT.md). `validate` exits nonzero on invalid structure or bindings. `audit` reads public HTTPS files without following redirects or executing actions. `mcp` serves specification, generation and validation tools over stdio; keep stdout reserved for protocol messages.

A profile does not implement service behavior, grant permission, or certify an API. Start at https://ruagentic.org/adopt/. Run the local HTTP example from https://ruagentic.org/docs/QUICKSTART.md or test your client with https://ruagentic.org/docs/COMPATIBILITY.md.
