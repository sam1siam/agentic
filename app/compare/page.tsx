import Link from 'next/link';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Compare',
  description:
    'How Agentic fits alongside llms.txt, AGENTS.md, capability manifests, OpenAPI, and MCP.',
  alternates: {
    canonical: 'https://ruagentic.org/compare/',
    types: { 'text/markdown': '/compare/index.md' },
  },
};
const formats = [
  {
    name: 'llms.txt',
    purpose: 'Help agents find and read documentation.',
    fit: 'The generator reads it as a source. Keep it as a documentation index alongside your structured Agentic files.',
    href: 'https://llmstxt.org/',
    detail:
      'A Markdown guide with context and links to a site’s content. It can point readers toward your Agentic files and integration guide.',
  },
  {
    name: 'AGENTS.md',
    purpose: 'Tell coding agents how to work in a repository.',
    fit: 'Use it for setup, tests, and coding conventions. Agentic describes actions offered by a service.',
    href: 'https://agents.md/',
    detail:
      'Repository instructions support work on the codebase. An Agentic profile belongs with the API an agent calls.',
  },
  {
    name: 'agents.txt / agents.json',
    purpose: 'Announce a site’s agent capabilities and endpoints.',
    fit: 'Site discovery overlaps. Agentic uses its own schema and separately defines action recovery; neither convention requires the other.',
    href: 'https://agents-txt.com/spec/',
    detail:
      'These manifests declare available protocols and services. Agentic site profiles index public resources; action profiles additionally define result verification.',
  },
  {
    name: 'OpenAPI',
    purpose: 'Describe HTTP operations, inputs, responses, and authentication.',
    fit: 'Site Profile 1.1 indexes documented operations. Action Profile 1.0 binds a supported OpenAPI 3.1 subset for recovery.',
    href: 'https://spec.openapis.org/oas/latest.html',
    detail:
      'Keep OpenAPI as your API description. Agentic specifies which operations to use and what evidence establishes that the original action completed.',
  },
  {
    name: 'MCP',
    purpose: 'Connect AI applications to tools, data, and workflows.',
    fit: 'Site profiles record advertised MCP links. Use MCP itself to expose and authorize tools.',
    href: 'https://modelcontextprotocol.io/docs/getting-started/intro',
    detail:
      'This project provides MCP tools for generation, validation, and auditing. Tool access and the service’s action contract remain separate responsibilities.',
  },
];
export default function ComparePage() {
  return (
    <main className="page wrap simple-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Compare</p>
        <h1>
          Where <span>Agentic fits.</span>
        </h1>
        <p>
          Agentic describes a website’s public resources and offers a separate
          contract for checking an action’s result.
        </p>
      </div>
      <div className="table-scroll comparison-table">
        <table>
          <thead>
            <tr>
              <th>Format</th>
              <th>Main purpose</th>
              <th>Use it with Agentic</th>
            </tr>
          </thead>
          <tbody>
            {formats.map((item) => (
              <tr key={item.name}>
                <th scope="row">
                  <a href={item.href}>{item.name} ↗</a>
                </th>
                <td>{item.purpose}</td>
                <td>{item.fit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="reading-section">
        <h2>Agentic’s two files</h2>
        <p>
          <code>agentic.txt</code> is a readable index linked to the JSON.
          <code>agentic.json</code> contains either a site profile with
          resources and API operations, or an action contract for request
          tracking and result verification. JSON is authoritative.
        </p>
        <div className="doc-utilities">
          <Link href="/spec">Read the specification →</Link>
          <a href="/docs/PRIOR-ART.md">Related work and references →</a>
        </div>
      </section>
      <section aria-label="More about each format">
        {formats.map((item) => (
          <details key={item.name} className="disclosure">
            <summary>{item.name}</summary>
            <p>{item.detail}</p>
            <a href={item.href}>Official documentation ↗</a>
          </details>
        ))}
      </section>
      <section className="simple-callout">
        <div>
          <h2>Start with your website.</h2>
          <p>
            Generate files from your public documentation and API descriptions.
          </p>
        </div>
        <Link href="/generate" className="action primary">
          Generate your files →
        </Link>
      </section>
    </main>
  );
}
