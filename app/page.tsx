import Link from 'next/link';
import {
  ArrowRight,
  Braces,
  Fingerprint,
  FileCheck2,
  History,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { CodeSample } from './code-sample';
import sample from '@/examples/tickets/agentic.json';
export const dynamic = 'force-static';
export const metadata = {
  alternates: {
    canonical: 'https://ruagentic.org/',
    types: { 'text/markdown': '/index.md' },
  },
};
const features = [
  [
    Fingerprint,
    'A durable request identity',
    'Bind each attempt to its original input before sending. Keep that identity through a restart.',
  ],
  [
    History,
    'Recovery after interruption',
    'Use the service’s status operation to find out what happened when a submission response is lost.',
  ],
  [
    FileCheck2,
    'Evidence before success',
    'Check the resulting resource, its request identity, and the input values that matter.',
  ],
  [
    Braces,
    'Your existing OpenAPI',
    'Reference three operations in an OpenAPI 3.1 document. Keep your API as the source of truth.',
  ],
  [
    ShieldCheck,
    'A portable receipt',
    'Return a structured observation of the outcome that the host can retain and inspect.',
  ],
  [
    Unplug,
    'An honest unknown',
    'When evidence is unavailable or inconsistent, preserve uncertainty for the host to resolve.',
  ],
] as const;
export default function Home() {
  return (
    <main className="wrap">
      <section className="masthead">
        <div className="version-pill">
          <span className="status-dot" /> Agentic Action Profile · 0.1 draft
        </div>
        <h1>
          Give agent actions
          <br />
          <span>a verifiable outcome.</span>
        </h1>
        <p className="lead">
          <code>agentic.json</code> describes how an AI agent checks whether an
          action completed and recovers an interrupted request. One JSON
          profile, connected to your existing API.
        </p>
        <div className="actions">
          <Link className="action primary" href="/spec">
            Read the specification <ArrowRight size={17} />
          </Link>
          <Link className="action secondary" href="/generate">
            Build a profile
          </Link>
        </div>
        <p className="micro">
          Open source · No registry required · Experimental proposal
        </p>
      </section>
      <section
        className="home-code"
        aria-label="A complete example Agentic profile"
      >
        <div className="code-title">
          <span>your-service.example / agentic.json</span>
          <a href="/examples/tickets/agentic.json" download>
            Download ↓
          </a>
        </div>
        <CodeSample value={sample} />
        <div className="code-foot">
          <span>
            Complete ticket example · Service behavior must match the file
          </span>
          <Link href="/examples">Explore the example →</Link>
        </div>
      </section>
      <section className="quick-start">
        <div className="section-intro">
          <h2>Start with one action.</h2>
          <p>
            Choose a service operation that already supports idempotency and
            request-status lookup.
          </p>
        </div>
        <div className="principle-grid">
          <article>
            <span className="step-number">1</span>
            <h3>Describe the contract</h3>
            <p>
              Connect the submit, status, and resource-read operations. Specify
              the evidence that establishes success.
            </p>
          </article>
          <article>
            <span className="step-number">2</span>
            <h3>Publish the profile</h3>
            <p>
              Serve <code>/agentic.json</code> on your service or give its URL
              to a supporting client. Validate it with your OpenAPI document.
            </p>
          </article>
          <article>
            <span className="step-number">3</span>
            <h3>Test the interruption</h3>
            <p>
              Lose a response after a committed action. Reconcile the original
              request and verify the resulting resource.
            </p>
          </article>
        </div>
        <div className="doc-utilities">
          <Link href="/docs#quickstart">Full quick start →</Link>
          <Link href="/lab">Run the recovery lab →</Link>
        </div>
      </section>
      <section className="feature-grid" aria-label="What the profile provides">
        {features.map(([Icon, title, description]) => (
          <article key={title}>
            <Icon size={23} />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <section className="start-terminal">
        <div className="section-intro">
          <h2>Generate. Validate. Implement.</h2>
          <p>
            The repository includes local tools, schemas, and Node and Python
            reference clients.
          </p>
        </div>
        <CodeSample
          value={
            'git clone https://github.com/sam1siam/agentic.git\ncd agentic\nnpm ci\nnpm run init -- --origin https://your-service.example --out agentic.json\nnpm run validate -- agentic.json examples/tickets/openapi.json'
          }
        />
        <p className="small muted">
          Requires Node 24. The generator starts from the ticket contract; adapt
          it to your service before publishing. A package has not been published
          to npm.
        </p>
        <div className="doc-utilities">
          <Link href="/docs">Browse the documentation →</Link>
          <a href="https://github.com/sam1siam/agentic">View on GitHub ↗</a>
        </div>
      </section>
      <section className="bottom-callout">
        <div>
          <p className="eyebrow">Independent pilot cohort</p>
          <h2>Help put the proposal to the test.</h2>
          <p>
            Bring a client or a service. Compare it with your current workflow
            and publish what works, what breaks, and what should change.
          </p>
        </div>
        <Link href="/adopt" className="action primary">
          Join a pilot <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
