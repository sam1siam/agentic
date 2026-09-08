# Audit your Agentic publication

Enter your website or full agentic.json URL in [the auditor](https://ruagentic.org/audit/). It checks the JSON, linked API/documents, matching agentic.txt, and README.md. The result explains what passed, what is missing, and how to fix each issue.

## Results

- **Successful:** the JSON/API checks, TXT consistency, and README/file/reference link checks passed.
- **Partial:** the JSON/API checks passed, but optional companion files, project references, content types, or remaining document checks need attention.
- **Failed:** JSON/API checks failed, TXT conflicts with JSON, or README links point to different Agentic files.

Every issue includes a concrete remedy, such as the exact file URL to publish, a Markdown link to add, or the API binding to correct. The checker reports TXT and README availability even when agentic.json is missing.

## README location and content

By default the checker reads README.md beside agentic.json, then tries lowercase readme.md after a 404. Expand **README hosted elsewhere?** to enter a public raw Markdown URL. For GitHub, use the Raw URL rather than an HTML repository page. Use README.md as the filename; README.me is a typo the checker will flag when supplied.

The README may contain customized prose. Checks look for visible links to the exact JSON/TXT locations, ruagentic.org, and ruagentic.com. Fenced code, inline code and HTML comments do not count. README links are inspected without being fetched. The checker does not verify every claim or confirm directory acceptance.

## JSON and API scope

Both Site Profile 1.1.0 and Action Profile 1.0.0 are supported. Site audits check structure, serving origin, matching TXT, and up to five retrieved same-origin documents, prioritizing indexed APIs. Action audits check the JSON and up to five referenced OpenAPI binding documents. An advertised MCP link is not invoked; that informational boundary does not prevent a successful file audit.

The auditor accepts exact legacy TXT 1.0/1.1 or publication TXT 1.2. JSON is limited to 64 KiB, README/TXT to 64 KiB each, action OpenAPI documents to 256 KiB, and site documents to 1 MiB each. Reads use public-only HTTPS, pinned DNS/IP checks, no redirects or forwarded credentials, and bounded timeouts. The auditor never fetches arbitrary schema URLs or submits service actions.

## Reports and CLI

Report version 3 retains `valid` for JSON/API checks and adds `readme` and `publication`. Missing README/TXT does not by itself make JSON invalid. Require `publication.status === "successful"` to enforce a complete publication, or `valid && textIndex.status === "matched"` to require only the pair. README references are recommendations, not protocol authorization requirements.

```sh
npm install -g ruagentic@1.3.0
agentic audit https://your-site.com
agentic audit https://your-site.com --publication
agentic audit https://your-site.com --readme https://raw.example/repo/README.md --publication
```

The default exit code preserves JSON/API validity. `--publication` exits nonzero for partial or failed publication. Hosted MCP exposes the same report through `audit_agentic_url`, with optional `readmeUrl`. Reports are private to the caller and retained for up to 30 days.

Use [Generate](GENERATOR.md) to create all files. [Publication details](PUBLICATION.md) describe the versions, exact TXT references, README merging, and listing copy. A successful file audit is not a runtime test, security certification, or endorsement.
