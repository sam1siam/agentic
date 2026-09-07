# Profile generator

Open [the browser generator](https://ruagentic.org/generate/) to customize a ticket-contract starter. It runs locally in the browser and makes no service calls. Valid output can be copied or downloaded as `agentic.json`.

Editable settings: canonical HTTPS origin, action ID and description, OpenAPI path, submit/status/verify operation IDs, retention window, read path parameter names, resource/request/state JSON Pointers, accepted resource states, and one input/resource evidence pair. The full schema permits more evidence pairs and actions; edit the JSON for those cases.

The generator keeps the 0.1 recovery defaults: three checks, a 100 ms check delay, a 3000 ms request timeout, and `never-automatically` for mutation retries. It validates structure and semantic profile constraints; it does not check your OpenAPI document or implement the server behavior.

After generation, paste the profile and your actual OpenAPI document into [the validator](https://ruagentic.org/validate/), then run behavioral tests before publishing.

Local equivalent:

```sh
npm run init -- --origin https://service.example --out agentic.json
```

Optional `--action-id` changes the action identifier. Other ticket bindings remain unchanged until you edit the generated JSON. The initializer refuses to overwrite an existing path. `--help` shows supported flags. Node 24 is required; these are repository commands, not a published npm package.
