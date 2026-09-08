# Agentic CLI

Tools 1.3.0 add README.md and LISTING.md to automatic generation. TXT 1.2 includes described project references to ruagentic.org and ruagentic.com. JSON profile versions remain unchanged. `agentic bundle agentic.json --out new-directory` generates all four files locally. `agentic text agentic.json --legacy` retains old TXT compatibility. `agentic audit URL --readme RAW_README_URL --publication` checks a complete publication and exits nonzero for partial or failed results. See [publication format and checks](PUBLICATION.md).

## Generate files from a website

```sh
agentic discover https://your-site.com --out agentic-files
agentic validate agentic-files/agentic.json
agentic text agentic-files/agentic.json --check
```

The scanner reads public documentation, llms.txt, OpenAPI JSON, and advertised agent links. It writes `agentic.json`, `agentic.txt`, `README.md`, `LISTING.md`, and a discovery report to a new directory. It does not overwrite existing directories or invoke discovered MCP tools. Review the sources, then publish both files on your domain. Site Profile 1.1.0 is descriptive; existing Action Profile 1.0.0 contracts retain their execution requirements. Tools 1.3.0 support both types. See [Site Profile](SITE-PROFILE.md) for limits and compatibility.

Tools 1.3.0 for Agentic Action Profile 1.0.0 and TXT 1.0. Node 24 or newer is required.

Install the versioned CLI from [npm](https://www.npmjs.com/package/ruagentic) using `npm install -g ruagentic@1.3.0`. The same package and its checksums are available in [GitHub releases](https://github.com/sam1siam/agentic/releases/tag/v1.3.0).

```sh
agentic init --origin https://your-service.example
agentic text agentic.json
agentic text agentic.json --check
agentic validate agentic.json openapi.json
agentic audit https://your-service.example/agentic.json
agentic mcp
```

`init` and `text` refuse to overwrite files. `text` creates an optional agentic.txt site or action index from validated JSON; `--check` detects summary drift. Use `--profile-url` for a non-default public JSON location. See [the text companion guide](https://ruagentic.org/docs/AGENTIC-TXT.md). `validate` exits nonzero on invalid structure or bindings. `audit` accepts a website or full JSON URL and reads public HTTPS files without following redirects or executing actions. It checks JSON, OpenAPI bindings, and the matching TXT index. Report version 3 preserves `valid` for profile/API checks and adds `publication.status` with successful, partial, and failed outcomes. README and TXT issues include specific remedies. Use `--publication` for a nonzero exit unless the entire publication passes, and `--readme` for a public raw README hosted elsewhere. `bundle` generates all four publication files from an existing local JSON profile. `text` emits TXT 1.2 by default; `--legacy` retains TXT 1.0/1.1, and `--check` accepts either compatible index. See [audit results and limits](https://ruagentic.org/docs/AUDIT.md). `mcp` serves specification, generation and validation tools over stdio; keep stdout reserved for protocol messages.

A profile does not implement service behavior, grant permission, or certify an API. Start at https://ruagentic.org/adopt/. Run the local HTTP example from https://ruagentic.org/docs/QUICKSTART.md or test your client with https://ruagentic.org/docs/COMPATIBILITY.md.

For existing integrations, follow the [1.0 migration guide](https://ruagentic.org/docs/MIGRATION.md). Preserve unfinished requests and their original contracts when upgrading new work.
