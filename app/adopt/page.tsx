import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CodeSample } from '../code-sample';

export const metadata: Metadata = {
  title: 'Get started',
  alternates: {
    canonical: 'https://ruagentic.org/adopt/',
    types: { 'text/markdown': '/adopt/index.md' },
  },
};
export const dynamic = 'force-static';
const release =
  'https://github.com/sam1siam/agentic/releases/tag/v1.0.0';
const cli =
  'https://github.com/sam1siam/agentic/releases/download/v1.0.0/ruagentic-1.0.0.tgz';

export default function AdoptPage() {
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Get started / build with Agentic</p>
        <h1>
          Put Agentic <span>to work.</span>
        </h1>
        <p>
          Generate an action profile, connect an agent, or install the tools.
          Everything is available to use without enrollment.
        </p>
        <div className="actions">
          <Link className="action primary" href="/generate">
            Generate your files →
          </Link>
          <Link className="action secondary" href="/connect">
            Connect an agent →
          </Link>
        </div>
      </div>
      <section className="two-col">
        <article className="panel">
          <h2>Create your action profile</h2>
          <p>
            Import your OpenAPI document or start from the ticket example. Bind
            submission, request-status lookup, and resource verification, then
            download your files.
          </p>
          <div className="actions">
            <Link className="action primary" href="/generate">
              Open the generator →
            </Link>
            <Link className="action secondary" href="/validate">
              Validate a profile →
            </Link>
          </div>
        </article>
        <article className="panel">
          <h2>Use the hosted tools</h2>
          <p>
            Audit a public profile, run a synthetic recovery check, and save or
            share the result. The connection guide covers MCP, WebMCP, A2A, and
            Agent Auth.
          </p>
          <div className="actions">
            <Link className="action primary" href="/platform">
              Open the platform →
            </Link>
            <Link className="action secondary" href="/connect">
              Connection guide →
            </Link>
          </div>
        </article>
      </section>
      <section className="example-section" id="install">
        <h2>Install the CLI</h2>
        <p>
          Requires Node 24. Install the versioned npm package, then
          generate and validate a profile.
        </p>
        <CodeSample
          value={`npm install -g ruagentic@1.0.0
agentic init --origin https://your-service.example
agentic text agentic.json
agentic validate agentic.json openapi.json`}
        />
        <p className="notice">
          The initializer creates a ticket-contract starter. Adapt it to your
          service and provide its OpenAPI document before validating.
        </p>
        <div className="doc-utilities">
          <a href="https://github.com/sam1siam/agentic/releases/tag/v1.0.0">
            Release notes ↗
          </a>
          <a href={cli}>Download CLI ↓</a>
          <a href={release}>Release files and checksums ↗</a>
          <a href="/docs/GETTING-STARTED.md">Read as Markdown ↗</a>
        </div>
      </section>
      <section className="example-section">
        <h2>Check profiles in GitHub Actions</h2>
        <p>
          Add this step after checking out your repository. Validation checks
          your profile and its OpenAPI operation bindings.
        </p>
        <CodeSample
          value={`- uses: sam1siam/agentic@v1.0.0
  with:
    profile: agentic.json
    openapi: openapi.json`}
        />
        <div className="doc-utilities">
          <a href="https://github.com/sam1siam/agentic/blob/main/action.yml">
            Action reference ↗
          </a>
          <a href="https://github.com/sam1siam/agentic/releases/download/v1.0.0/agentic-adoption-skill.zip">
            Download the agent skill ↓
          </a>
        </div>
      </section>
      <section className="example-section">
        <h2>Connect your own service</h2>
        <p>
          Your service supplies durable request tracking, idempotency, and
          authoritative status and resource reads. Your agent host authorizes
          calls and keeps the original request identity across restarts.
        </p>
        <div className="doc-utilities">
          <a href="/docs/INTEGRATIONS.md">Integration guide →</a>
          <a href="/docs/QUICKSTART.md">Run the local HTTP example →</a>
          <a href="/docs/COMPATIBILITY.md">Test your client →</a>
        </div>
      </section>
      <section className="example-section">
        <h2>Contribute when you have something to share</h2>
        <p>
          Report a bug, suggest a focused improvement, or share an
          implementation. You can use the specification and tools without
          joining a program.
        </p>
        <div className="actions">
          <a
            className="action primary"
            href="https://github.com/sam1siam/agentic/issues/new/choose"
          >
            Open an issue <ArrowUpRight size={16} />
          </a>
          <a
            className="action secondary"
            href="https://github.com/sam1siam/agentic/blob/main/CONTRIBUTING.md"
          >
            Contribution guide ↗
          </a>
        </div>
      </section>
      <div className="notice">
        Agentic 1.0.0 is the stable specification and tool release. Pin
        versions and review the service requirements before
        integrating it. The hosted recovery service uses synthetic data.
      </div>
    </main>
  );
}
