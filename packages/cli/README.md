# Agentic CLI

Experimental tools for the Agentic Action Profile. Node 24 or newer is required.

Install the release tarball with `npm install -g ./ruagentic-0.1.0-draft.3.tgz`. A GitHub release download URL can be used in place of the local filename.

```sh
agentic init --origin https://your-service.example
agentic validate agentic.json openapi.json
agentic audit https://your-service.example/agentic.json
agentic mcp
```

`init` refuses to overwrite files. `validate` exits nonzero on invalid structure or bindings. `audit` reads public HTTPS files without following redirects or executing actions. `mcp` serves specification, generation and validation tools over stdio; keep stdout reserved for protocol messages.

A profile does not implement service behavior, grant permission, or certify an API. See https://ruagentic.org/docs/QUICKSTART.md and the real HTTP pilot harness at https://github.com/sam1siam/agentic.
