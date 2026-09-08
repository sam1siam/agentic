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
    fit: 'Keep it as a documentation index. Use Agentic to describe how an action’s result is checked.',
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
    fit: 'Capability discovery and action verification solve different problems. Agentic does not require these files.',
    href: 'https://agents-txt.com/spec/',
    detail:
      'These manifests declare available protocols and services. Agentic connects a specific action to its submission, status, and result operations.',
  },
  {
    name: 'OpenAPI',
    purpose: 'Describe HTTP operations, inputs, responses, and authentication.',
    fit: 'Agentic 1.0 uses your existing OpenAPI 3.1 operation IDs and defines a consistent recovery contract.',
    href: 'https://spec.openapis.org/oas/latest.html',
    detail:
      'Keep OpenAPI as your API description. Agentic specifies which operations to use and what evidence establishes that the original action completed.',
  },
  {
    name: 'MCP',
    purpose: 'Connect AI applications to tools, data, and workflows.',
    fit: 'Use MCP to expose tools. Agentic can describe how your client checks the result of a service action.',
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
          Different files answer different questions. Agentic answers: “Did this
          action finish, and how can I verify the result?”
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
          <code>agentic.txt</code> gives a short action list and links to the
          JSON. <code>agentic.json</code> supplies the action rules: submit the
          request, look up its status, and verify the resulting resource. JSON
          is authoritative.
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
          <h2>Start with your existing API.</h2>
          <p>Add a shared description of how to check its results.</p>
        </div>
        <Link href="/generate" className="action primary">
          Generate your files →
        </Link>
      </section>
    </main>
  );
}
