import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CodeSample } from '../code-sample';
import JsonLd, { techArticleJsonLd } from '../json-ld';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Documentation',
  description:
    'Guides for generating, publishing and auditing Agentic files, plus the specification, protocols, integration and conformance references.',
  alternates: {
    canonical: 'https://ruagentic.org/docs/',
    types: { 'text/markdown': '/docs/index.md' },
  },
};
const guides = [
  [
    'Start here',
    'Generate from your website',
    'Scan public documentation, APIs, llms.txt, and agent connections to generate JSON, TXT, README, and listing text.',
    '/docs/GENERATOR.md',
  ],
  [
    'Site format',
    'Site Profile 1.1',
    'Structured public resources, API operation indexes, and matching TXT files.',
    '/docs/SITE-PROFILE.md',
  ],
  [
    'Publishing',
    'Audit your files',
    'Check the published profile, TXT, and README, with clear results and steps to fix missing or incorrect files.',
    '/docs/AUDIT.md',
  ],
  [
    'Overview',
    'Compare the formats',
    'Understand how Agentic fits alongside documentation, APIs, and agent tools.',
    '/docs/COMPARE.md',
  ],
  [
    'Publication',
    'TXT, README, and listing text',
    'TXT 1.2 project references, automatic README and listing copy, and complete publication checks.',
    '/docs/PUBLICATION.md',
  ],
  [
    'Protocols',
    'MCP, WebMCP, A2A, and Agent Auth',
    'Connect MCP tools, WebMCP pages, A2A, and Agent Auth through their documented endpoints.',
    '/docs/PROTOCOLS.md',
  ],
  [
    'Start here',
    'Quick start',
    'Run the ticket service, lose a response, and recover the original result.',
    '/docs/QUICKSTART.md',
  ],
  [
    'Reference',
    'Specification',
    'Versioned fields, client and service requirements, and the supported OpenAPI binding.',
    '/docs/SPEC.md',
  ],
  [
    'Integration',
    'Integration guide',
    'Connect an existing API or agent runtime. Keep authorization and recovery boundaries explicit.',
    '/docs/INTEGRATIONS.md',
  ],
  [
    'Testing',
    'Compatibility runner',
    'Test a separately implemented client through a small process interface and publish evidence.',
    '/docs/COMPATIBILITY.md',
  ],
  [
    'Protocol',
    'Conformance',
    'Understand structural, binding, and behavior checks—and what the tests do not establish.',
    '/docs/CONFORMANCE.md',
  ],
  [
    'Operations',
    'Security and limits',
    'Approved origins, private ledgers, tracking windows, credentials, and unresolved outcomes.',
    '/docs/SECURITY.md',
  ],
];
const faq = [
  [
    'Is Agentic available for production use?',
    'Yes. Tools 1.3.0 support Site Profile 1.1.0 and Action Profile 1.0.0. Generate a site profile from public sources. If you implement action recovery, also validate its bindings and test the service behavior.',
  ],
  [
    'Does stable release mean every agent supports it?',
    'No. Stable versioning defines the published contract. Clients must implement that contract, and a release does not imply universal support, external certification, or standards-body endorsement.',
  ],
  [
    'Will agents discover agentic.json automatically?',
    'Only clients that implement this convention can use it. Pass the profile URL explicitly to your supporting client. Publishing the file alone does not add support to an agent.',
  ],
  [
    'What does a service need?',
    'A public website is enough for a site profile. An action contract additionally requires submission, request-status, and resource reads plus durable request tracking and idempotency.',
  ],
  [
    'Does Agentic require other agent files?',
    'No. Use agentic.json and its generated agentic.txt index. llms.txt remains an optional documentation source. Protocol links use their own contracts and authorization.',
  ],
  [
    'Does the profile make an API safe to call?',
    'No. The agent host still authorizes the action, approves destinations, protects credentials, and isolates ledgers. A publisher’s description is untrusted data.',
  ],
  [
    'Does it guarantee exactly-once execution?',
    'No. The service must enforce idempotency. The client avoids automatic repeat writes and uses authoritative status plus evidence. Unresolved cases remain pending or unknown.',
  ],
  [
    'What happens when the request window expires?',
    'The client preserves unknown and hands off to its host. It must not assume the action failed or create a fresh request automatically.',
  ],
  [
    'Can my team use it without publishing private data?',
    'Yes. Run the local example or hosted sandbox. Share redacted results and aggregate counts; do not upload tokens, customer inputs, private receipts, or ledgers.',
  ],
];
export default function DocsPage() {
  return (
    <main className="page wrap">
      <JsonLd
        data={techArticleJsonLd({
          path: '/docs/',
          headline: 'Agentic documentation',
          description:
            'Guides for generating, publishing and auditing Agentic files, plus the specification, protocols, integration and conformance references.',
        })}
      />
      <div className="page-heading">
        <p className="eyebrow">Documentation / Tools 1.3.0</p>
        <h1>
          Generate, publish, <span>and connect.</span>
        </h1>
        <p>
          Create files from your website, check them after publishing, and
          integrate action recovery when your service supports it.
        </p>
        <div className="doc-utilities">
          <a href="/docs/index.md">Read as Markdown ↗</a>
          <a href="/llms.txt">Agent documentation index ↗</a>
          <a href="/docs/CHANGELOG.md">Changelog ↗</a>
        </div>
      </div>
      <div className="doc-grid">
        {guides.map(([category, title, description, href]) => (
          <a href={href} className="doc-card" key={title}>
            <span className="doc-category">{category}</span>
            <h2>{title}</h2>
            <p>{description}</p>
            <span className="text-link">
              Read the guide <ArrowUpRight size={15} />
            </span>
          </a>
        ))}
      </div>
      <section className="docs-section prose" id="quickstart">
        <h2>Quick start</h2>
        <p>
          Requires Node 24 and Python 3.11 or later. This example runs locally
          and creates synthetic tickets.
        </p>
        <CodeSample
          value={
            'git clone https://github.com/sam1siam/agentic.git\ncd agentic\nnpm ci\npython -m pip install -r reference/python/requirements.txt\npython reference/service/server.py --fault response-lost'
          }
        />
        <p>In a second terminal, from the same repository:</p>
        <CodeSample
          value={
            'npm run client -- http://127.0.0.1:4318 example-001 "Example ticket"\n# Repeat the exact command to return the saved receipt.'
          }
        />
        <p>
          The service commits the ticket and drops its first reply. The client
          checks the saved request, reads the original ticket, and emits a
          receipt with <code>outcome: succeeded</code>. Keep the same request ID
          and input when resuming.
        </p>
        <div className="doc-utilities">
          <Link href="/examples">See the files →</Link>
          <a href="/docs/QUICKSTART.md">Full setup and troubleshooting →</a>
        </div>
      </section>
      <section className="docs-section" id="faq">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {faq.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="docs-banner">
        <h2>What this website actually serves</h2>
        <p>
          The specification, schemas, generator, validator, and protocol tools
          are live. The hosted recovery service uses HTTP and PostgreSQL with
          isolated synthetic tickets. The browser recovery lab is a simulation,
          and the repository also includes a local HTTP/SQLite service.
        </p>
        <div className="doc-utilities">
          <a href="/docs/SITE-MAP.md">Route and capability inventory →</a>
          <a href="/docs/PRIOR-ART.md">Prior work →</a>
          <a href="/docs/BRAND.md">Logo and brand assets →</a>
        </div>
      </section>
    </main>
  );
}
