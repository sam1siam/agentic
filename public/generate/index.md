# Agent file generators

Open [the browser generator](https://ruagentic.org/generate/) to customize a ticket-contract starter. It runs locally in the browser and makes no service calls. Select the `agentic.json` or `agentic.txt` preview, copy or download either file, or choose **Download both**. The TXT index is generated from the validated JSON profile. JSON remains authoritative; see [the companion guide](https://ruagentic.org/docs/AGENTIC-TXT.md).

Editable settings: canonical HTTPS origin, action ID and description, OpenAPI path, submit/status/verify operation IDs, retention window, read path parameter names, resource/request/state JSON Pointers, accepted resource states, and one input/resource evidence pair. The full schema permits more evidence pairs and actions; edit the JSON for those cases.

The manual generator keeps the 0.1 recovery defaults: three checks, a 100 ms check delay, a 3000 ms request timeout, and `never-automatically` for mutation retries. It validates structure and semantic profile constraints. The OpenAPI import mode also checks operation bindings. Neither implements service behavior.

After generation, paste the profile and your actual OpenAPI document into [the validator](https://ruagentic.org/validate/), then run behavioral tests before publishing.

Local equivalent:

```sh
npm run init -- --origin https://service.example --out agentic.json
```

Optional `--action-id` changes the action identifier. Other ticket bindings remain unchanged until you edit the generated JSON. The initializer refuses to overwrite an existing path. `--help` shows supported flags. Node 24 is required. Install the standalone CLI using the [getting-started guide](https://ruagentic.org/docs/GETTING-STARTED.md).

## Import OpenAPI

Select **Import OpenAPI** and upload or paste an OpenAPI 3.1 JSON document, up to 256 KiB. Choose the POST submission, GET request-status operation and GET resource-read operation. Set the service origin, tracking window, successful states and evidence pointers. The importer derives each read path parameter from the selected operation.

The preview validates the generated profile against the imported API. Resolve unsupported operation shapes and evidence requirements before downloading. **Download starter ZIP** includes `agentic.json`, its generated `agentic.txt`, the imported `openapi.json`, and an implementation checklist. It never uploads the file or infers durable tracking from the API description.

## Optional documentation index

Select **Documentation index** to create an llms.txt starter. Enter your service name, origin, and description, then copy or download the file. It links to /docs/, /agentic.txt, and /agentic.json on that origin; edit the links to match your published files and omit unpublished optional files. The generator makes no network calls and does not enable protocols or grant authorization.

The generator produces Agentic JSON profiles and TXT companions, OpenAPI starter bundles, and this optional documentation index. It does not produce agents.txt or agents.json.

See [Protocol setup and status](https://ruagentic.org/docs/PROTOCOLS.md) for direct MCP, WebMCP, A2A, and Agent Auth connections. Agentic does not require another project's discovery manifest.
