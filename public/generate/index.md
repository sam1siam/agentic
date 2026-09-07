# Agent file generators

Open [the browser generator](https://ruagentic.org/generate/) to customize a ticket-contract starter. It runs locally in the browser and makes no service calls. Valid output can be copied or downloaded as `agentic.json`.

Editable settings: canonical HTTPS origin, action ID and description, OpenAPI path, submit/status/verify operation IDs, retention window, read path parameter names, resource/request/state JSON Pointers, accepted resource states, and one input/resource evidence pair. The full schema permits more evidence pairs and actions; edit the JSON for those cases.

The manual generator keeps the 0.1 recovery defaults: three checks, a 100 ms check delay, a 3000 ms request timeout, and `never-automatically` for mutation retries. It validates structure and semantic profile constraints. The OpenAPI import mode also checks operation bindings. Neither implements service behavior.

After generation, paste the profile and your actual OpenAPI document into [the validator](https://ruagentic.org/validate/), then run behavioral tests before publishing.

Local equivalent:

```sh
npm run init -- --origin https://service.example --out agentic.json
```

Optional `--action-id` changes the action identifier. Other ticket bindings remain unchanged until you edit the generated JSON. The initializer refuses to overwrite an existing path. `--help` shows supported flags. Node 24 is required. A standalone CLI tarball is also provided in [GitHub releases](https://github.com/sam1siam/agentic/releases).

## Import OpenAPI

Select **Import OpenAPI** and upload or paste an OpenAPI 3.1 JSON document, up to 256 KiB. Choose the POST submission, GET request-status operation and GET resource-read operation. Set the service origin, tracking window, successful states and evidence pointers. The importer derives each read path parameter from the selected operation.

The preview validates the generated profile against the imported API. Resolve unsupported operation shapes and evidence requirements before downloading. **Download starter ZIP** includes `agentic.json`, the imported `openapi.json`, and an implementation checklist. It never uploads the file or infers durable tracking from the API description.

## Discovery files

Select **Discovery files** in the browser generator to create agents.txt, agents.json, and an llms.txt starter. Configure the service name, origin, description, and optional MCP server, WebMCP page, A2A AgentCard, and Agent Auth discovery URLs. Each output can be copied or downloaded separately.

All protocols start disabled. Enabling an option declares an existing capability; it does not deploy a server, generate cryptographic keys, register an agent, or grant permission. URLs are syntax-checked, not contacted. Check the generated links and use the upstream schemas before publishing. The documentation starter assumes /docs/ and /agentic.json exist.

See [Protocol setup and status](https://ruagentic.org/docs/PROTOCOLS.md) for the working local MCP server, conditional WebMCP tools, and the service work required for A2A and Agent Auth. The action profile and discovery files remain separate formats.
