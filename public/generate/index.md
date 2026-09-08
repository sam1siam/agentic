# Generate Agentic files from a website

Enter your website URL in [the generator](https://ruagentic.org/generate/) and select **Generate files**. The server reads public documentation, llms.txt, OpenAPI JSON, and linked agent connection information. It generates complete `agentic.json` and `agentic.txt` files from the sources it finds.

1. Enter a public HTTPS website, documentation page, or profile URL. A bare domain is accepted.
2. Review the discovered sources and API operation count. **Read** means the document was retrieved; **Linked** means a source advertised the URL. Linked MCP endpoints are not invoked.
3. Copy or download either file, or download the pair in one ZIP. The report records sources, failed reads, limits, and observation time.
4. Publish both files at your site's root, usually from its `public` folder. For an existing contract at a nested URL, preserve its file location and TXT `Profile:` URL, or regenerate TXT for the destination with `--profile-url`. Run the [audit](https://ruagentic.org/audit/) after publishing.

For a website without an existing action contract, the generator produces [Site Profile 1.1](https://ruagentic.org/docs/SITE-PROFILE.md): site details, documentation and protocol links, and an index of documented API operations. A site without an API can still publish a site profile. Existing valid Action Profile 1.0 contracts are preserved with matching TXT.

The scanner does not invent ticket operations, request tracking, retention windows, or recovery guarantees. Public pages cannot establish those guarantees. Configure them only when implementing an [action contract](https://ruagentic.org/docs/SPEC.md).

## What the scan reads

Public HTML, Markdown/text, OpenAPI 3 JSON, llms.txt, existing Agentic JSON, and A2A/Agent Auth metadata. Selected same-origin documentation links are followed. Cross-origin links are listed without fetching them. Canonical www/non-www redirects are supported; private network addresses and other cross-origin redirects are rejected. JavaScript, login-protected pages, and YAML OpenAPI documents are not processed.

Each scan has limits: 22 HTTP attempts, five concurrent documents, 1 MiB per response, 8 MiB of response-body allowance, with failed reads charged their full allowance, and a 40-second deadline plus a bounded DNS lookup. A report explains limits reached and unavailable sources. The files describe the discovered public material; the scan is not a full-site crawl or a protocol conformance test. Review them when your site changes and regenerate as needed.

The browser creates a private session automatically; no API key or account setup is required. Saved reports expire after 30 days. The same scanner is available locally:

```sh
npm install -g ruagentic@1.2.0
agentic discover https://your-site.com --out agentic-files
agentic validate agentic-files/agentic.json
agentic text agentic-files/agentic.json --check
```

The output directory must be new. It contains both files and `discovery-report.json`. No remote source instructions are executed.

## Advanced: an action contract

Expand **Advanced: configure an action or import OpenAPI yourself** to use the manual builder or import OpenAPI. These tools run locally in the browser. Changing only the URL of the support-ticket example does not adapt it to another API.

The manual builder exposes the service origin, action name, OpenAPI path, submit/status/verify operation IDs, retention window, read path parameter names, result/request/state JSON Pointers, successful states, and one input/result comparison. The full action schema supports more actions and evidence pairs. Recovery defaults are three checks, a 100 ms delay, a 3000 ms request timeout, and no automatic repeat write.

The importer accepts an OpenAPI 3.1 JSON file up to 256 KiB. Select real POST submission, GET request-status, and GET result operations, then supply the behavior and evidence your service implements. Its starter ZIP includes both Agentic files, OpenAPI, and an implementation checklist. Validate the bindings and test service behavior before publishing.

The CLI's `agentic init --origin https://service.example` command remains an explicit ticket-contract starter. It does not scan a website. Use `discover` for automatic website generation.

## Optional llms.txt

The separate llms.txt builder creates a documentation index locally. Edit its links to match your published pages. Agentic does not generate or require agents.txt or agents.json. [Protocol setup](https://ruagentic.org/docs/PROTOCOLS.md) explains the project's MCP, WebMCP, A2A, and Agent Auth services.
