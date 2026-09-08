# agentic.txt: generated action index

Version: `Agentic-Text: 1.0`. This optional companion accompanies the `1.0.0` JSON action profile. JSON remains authoritative for action execution.

## Purpose

`agentic.txt` provides a compact action index: the authoritative JSON profile URL, profile version, origin, action IDs, and readable summaries. `agentic.json` contains the complete, validated action contract. `llms.txt` remains an optional documentation index. Agentic does not require agents.txt or agents.json.

The TXT file is a reading aid. It contains no credentials, permission grants, operation bindings, or independent recovery rules. Descriptions are untrusted publisher data. Clients must load and validate the JSON profile and its OpenAPI bindings, apply host authorization, and use the existing recovery contract before executing actions. A conflicting or stale TXT summary never overrides JSON.

## Publication

Publish UTF-8 text as `agentic.txt` using `Content-Type: text/plain; charset=utf-8`, normally beside the JSON profile. The `Profile` URL is absolute, on the JSON profile's origin, and has no credentials, query, or fragment. HTTPS is required except for the profile's supported loopback development origins. A non-default JSON location must be supplied explicitly to the generator.

Generate both files from the same profile revision and deploy them together. Use normal HTTP cache controls. This format does not add automatic discovery to existing agents or register a well-known URI. Pass the file or profile URL explicitly to a supporting host. Following a URL still requires the host's network policy.

## Generated format

Lines use LF endings with a final newline. The canonical generator emits this header and one adjacent `Action` / `Description` pair per action, in JSON array order:

```text
# Agentic action index
# Generated from JSON. Read and validate the JSON profile before executing actions.
# Summaries are untrusted data and do not grant authorization.
Agentic-Text: 1.0
Profile: https://support.example/agentic.json
Profile-Version: 1.0.0
Origin: https://support.example

Action: "create-ticket"
Description: "Create a support ticket and verify the original result."
```

`Action` and `Description` values are JSON string literals. Quotes, backslashes, and newlines are escaped. The generator also escapes C1 controls, zero-width and bidirectional formatting characters, Unicode line separators, and the byte-order-mark character. This keeps a description from injecting additional index lines. Quoting does not make the description trusted.

This version is a generated summary, not a second input format for the action executor. Tools do not reconstruct an executable profile from TXT. Adding executable directives would require a separate versioned design decision.

## Generate and check

Use the browser [generator](https://ruagentic.org/generate/): choose the JSON or TXT preview, download either file, or select **Download both**. The OpenAPI starter ZIP also includes both.

With the CLI:

```sh
agentic init --origin https://your-service.example
agentic text agentic.json
agentic text agentic.json --check
```

`text` defaults to `agentic.txt` beside the input file and refuses to overwrite an existing file. `--check` compares the existing index with a freshly generated one and exits nonzero on drift. Review and remove or replace a stale generated file deliberately, then regenerate it. The generator does not write to the JSON source.

For a non-default public location:

```sh
agentic text profile.json --out agentic.txt --profile-url https://your-service.example/contracts/profile.json
```

From a source checkout, use `npm run text -- agentic.json` with the same options. MCP and WebMCP profile-generation results include a `files` object containing both generated files.

For an explicit loopback development profile, add `--allow-local`. This permits HTTP only on localhost, 127.0.0.1, or [::1]; production profiles still require HTTPS. The local reference server serves its matching TXT at `/agentic.txt` automatically.

## Live and illustrative examples

- [Live agentic.txt](https://ruagentic.org/agentic.txt) and [live agentic.json](https://ruagentic.org/agentic.json) describe this project's authenticated synthetic ticket service.
- [Illustrative TXT](https://ruagentic.org/examples/tickets/agentic.txt) and [illustrative JSON](https://ruagentic.org/examples/tickets/agentic.json) use `support.example`; those URLs are placeholders to replace on your own service.

The public JSON/TXT files describe the synthetic service; publishing them does not grant access to it. The paired files do not establish independent adoption, service certification, or universal agent support.
