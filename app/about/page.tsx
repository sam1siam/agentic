import Link from 'next/link';
export const dynamic = 'force-static';
export const metadata = {
  title: 'About',
  description:
    'What Agentic does, who maintains it, and how to use or contribute to it.',
  alternates: {
    canonical: 'https://ruagentic.org/about/',
    types: { 'text/markdown': '/about/index.md' },
  },
};
export default function AboutPage() {
  return (
    <main className="page wrap simple-page reading-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">About</p>
        <h1>
          Clear files for <span>AI agents.</span>
        </h1>
        <p>
          Agentic helps agents find your documentation, APIs, and agent
          connections, and gives supporting clients a contract for checking
          action results.
        </p>
      </div>
      <section className="reading-section">
        <h2>Why does it exist?</h2>
        <p>
          Public information is easier to use when an agent can find it in a
          structured file. For action recovery, a service can complete an action
          before its reply reaches the agent. Repeating that request can create
          a duplicate. Agentic describes where to look up the original request
          and what to check before reporting success.
        </p>
      </section>
      <section className="reading-section">
        <h2>Why two files?</h2>
        <p>
          <code>agentic.json</code> contains the structured site profile or
          action contract. <code>agentic.txt</code> is its readable, generated
          index. Update the JSON first, then regenerate the text file.
        </p>
        <div className="doc-utilities">
          <a href="/agentic.txt">Our agentic.txt →</a>
          <a href="/agentic.json">Our agentic.json →</a>
          <Link href="/spec">Read the format →</Link>
        </div>
      </section>
      <section className="reading-section">
        <h2>What do I need to use it?</h2>
        <p>
          A public website is enough to generate a site profile. Action recovery
          additionally requires an API with request tracking, status lookup, and
          result reads, plus a supporting client. The project includes a
          generator, auditor, CLI, and Node and Python clients. Publishing files
          does not change your API’s behavior or automatically add support to
          every agent.
        </p>
        <div className="doc-utilities">
          <Link href="/generate">Generate files →</Link>
          <Link href="/adopt">Install and integrate →</Link>
        </div>
      </section>
      <section className="reading-section">
        <h2>Who maintains it?</h2>
        <p>
          Agentic is maintained by{' '}
          <a href="https://github.com/sam1siam">sam1siam</a>. The specification,
          schemas, and tools are open source under Apache-2.0. Site Profile 1.1
          and Action Profile 1.0 are supported; tools are available as the{' '}
          <a href="https://www.npmjs.com/package/ruagentic">
            ruagentic npm package
          </a>
          .
        </p>
        <p>
          Report bugs, suggest improvements, and contribute implementations in
          the{' '}
          <a href="https://github.com/sam1siam/agentic">GitHub repository</a>.
        </p>
      </section>
      <section className="reading-section">
        <h2>What does this website run?</h2>
        <p>
          The website generator and auditor read public HTTPS documents on the
          server. The advanced manual builder runs in your browser. Recovery
          tools use an isolated ticket service to check interrupted requests
          with synthetic data. Our root Agentic files describe that service.
        </p>
        <p>
          MCP, WebMCP, A2A, and Agent Auth connections are documented in the{' '}
          <Link href="/connect">connection guide</Link>. Private hosted reports
          expire after 30 days; sharing is an explicit action in the recovery
          tools.
        </p>
      </section>
      <section className="reading-section">
        <h2>How can I contribute?</h2>
        <p>
          Use the files, report a reproducible issue, or submit a focused pull
          request. You do not need to enroll in a program or register with a
          central service.
        </p>
        <div className="doc-utilities">
          <a href="https://github.com/sam1siam/agentic/issues">Issues →</a>
          <a href="/docs/GOVERNANCE.md">Governance →</a>
          <a href="/docs/SECURITY.md">Security →</a>
          <a href="/docs/BRAND.md">Brand assets →</a>
        </div>
      </section>
    </main>
  );
}
