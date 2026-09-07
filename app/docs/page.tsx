import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CodeSample } from '../code-sample';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Documentation',
  alternates: {
    canonical: 'https://ruagentic.org/docs/',
    types: { 'text/markdown': '/docs/index.md' },
  },
};
const guides = [
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
    '/docs/PILOT-RUNNER.md',
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
    'Is this an adopted standard?',
    'No. Agentic is an experimental proposal. The project publishes reference code and is recruiting outside implementers. A stable version needs independent compatibility evidence.',
  ],
  [
    'Will agents discover agentic.json automatically?',
    'Only clients that implement this convention can use it. Pass the profile URL explicitly during a pilot. Publishing the file alone does not add support to an agent.',
  ],
  [
    'What does a service need?',
    'One JSON POST operation, an authoritative request-status GET, and a resource GET in OpenAPI 3.1, plus atomic request tracking and idempotency scoped to the authenticated principal and action.',
  ],
  [
    'How does this relate to other agent files?',
    'llms.txt guides agents to documentation. Discovery manifests describe capabilities and endpoints. Agentic proposes a narrower contract for reconciling an attempted action and verifying its result. See the integration guide for coexistence patterns.',
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
    'Can my team try it without publishing private data?',
    'Yes. Run a local or sandbox pilot. Share redacted results and aggregate counts; do not upload tokens, customer inputs, private receipts, or ledgers.',
  ],
];
export default function DocsPage() {
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Documentation / 0.1 draft</p>
        <h1>
          From a file to <span>a working contract.</span>
        </h1>
        <p>
          Build a profile, test its behavior, and integrate it into the tools
          you already use.
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
            'npm run client -- http://127.0.0.1:4318 pilot-001 "Pilot ticket"\n# Repeat the exact command to return the saved receipt.'
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
          The specification, schemas, generator, validator, examples, and
          browser recovery simulation are live. The HTTP/SQLite ticket service
          is a local reference application. This documentation website does not
          advertise itself as a ticket API.
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
