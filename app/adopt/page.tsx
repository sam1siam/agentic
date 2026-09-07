import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Download, Terminal } from 'lucide-react';
import report from '@/reports/benchmark.json';
import registry from '@/pilots/registry.json';
export const metadata: Metadata = {
  title: 'Independent pilots',
  alternates: {
    canonical: 'https://ruagentic.org/adopt/',
    types: { 'text/markdown': '/adopt/index.md' },
  },
};
export const dynamic = 'force-static';
export default function AdoptPage() {
  const loss = report.rows.find((r) => r.scenario === 'response-lost');
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Implementation / participation</p>
        <h1>
          Bring your implementation.
          <br />
          <span>Test the shared contract.</span>
        </h1>
        <p>
          Start with the ticket example, compare it with your current workflow,
          and tell us where a shared profile helps—or gets in the way.
        </p>
        <div className="actions">
          <a
            className="action primary"
            href="https://github.com/sam1siam/agentic/issues/new?template=pilot.yml"
          >
            Apply for a pilot <ArrowUpRight size={17} />
          </a>
          <a
            className="action secondary"
            href="https://github.com/sam1siam/agentic/archive/refs/heads/main.zip"
          >
            <Download size={17} />
            Download source
          </a>
        </div>
      </div>
      <div className="stats-strip" aria-label="Pilot program status">
        <div>
          <strong>{registry.confirmed_external_pilots.length}</strong>
          <span>Confirmed external pilots</span>
        </div>
        <div>
          <strong>
            {registry.verified_independent_implementations.length}
          </strong>
          <span>Verified independent implementations</span>
        </div>
        <div>
          <strong>Open</strong>
          <span>Enrollment for the first cohort</span>
        </div>
      </div>
      <section className="docs-banner" style={{ marginBottom: 35 }}>
        <h2>A small, two-week pilot</h2>
        <div className="doc-utilities"><Link href="/platform">Try the hosted sandbox and save evidence →</Link><Link href="/connect">Connect your own agent →</Link></div>
        <p>
          After your team agrees to participate, choose one sandbox action. Run
          the seven compatibility scenarios, compare with your existing
          workflow, and share redacted results. Source review and reproducible
          evidence come before an independent implementation is listed.
        </p>
        <div className="doc-utilities">
          <a href="/docs/PILOT-RUNNER.md">
            Connect your client to the runner →
          </a>
          <a href="/pilots/registry.json">Public evidence registry ↗</a>
          <a href="https://github.com/sam1siam/agentic/issues">
            Pilot coordination on GitHub ↗
          </a>
        </div>
      </section>
      <section className="two-col">
        <div className="panel">
          <p className="eyebrow">
            <Terminal size={14} /> Local starter
          </p>
          <h2>Run a real interrupted request.</h2>
          <p className="small">Node 24 · Python 3.11+ · npm</p>
          <pre className="code-block">
            {
              'git clone https://github.com/sam1siam/agentic.git\ncd agentic\nnpm ci\npython -m pip install -r reference/python/requirements.txt\nnpm test\npython reference/service/server.py --fault response-lost'
            }
          </pre>
          <p className="small">In a second terminal:</p>
          <pre className="code-block">
            {
              'npm run client -- http://127.0.0.1:4318\n# Repeat with the same ID to retrieve the saved receipt.'
            }
          </pre>
          <p className="small">
            The loopback service commits the ticket, then drops its first
            response. SQLite preserves the request and result. The client
            reconciles and verifies the original ticket.
          </p>
        </div>
        <div className="panel">
          <p className="eyebrow">What is available</p>
          <div className="resource-list">
            <a href="/docs/SPEC.md">
              <span>Normative specification</span>
              <span>↗</span>
            </a>
            <a href="/examples/tickets/agentic.json">
              <span>Copyable ticket profile</span>
              <span>↗</span>
            </a>
            <a href="/examples/tickets/openapi.json">
              <span>OpenAPI reference</span>
              <span>↗</span>
            </a>
            <Link href="/validate">
              <span>Profile and binding validator</span>
              <span>↗</span>
            </Link>
            <a href="/docs/CONFORMANCE.md">
              <span>Conformance method and limits</span>
              <span>↗</span>
            </a>
            <a href="/docs/PILOT-KIT.md">
              <span>Pilot kit and interview guide</span>
              <span>↗</span>
            </a>
            <a href="/docs/PILOT-RUNNER.md">
              <span>External-client compatibility runner</span>
              <span>↗</span>
            </a>
            <a href="/docs/GOVERNANCE.md">
              <span>Governance and change process</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>
      <section className="adopt-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reproducible comparison</p>
            <h2>One lost response. Four approaches.</h2>
          </div>
          <a className="text-link" href="/reports/benchmark.json">
            Full result data <ArrowUpRight size={16} />
          </a>
        </div>
        <p className="muted">
          Deterministic simulation, one run per strategy per scenario. These are
          project results, not production reliability estimates.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Tickets</th>
                <th>Duplicates</th>
                <th>Calls</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {loss?.results.map((r) => (
                <tr key={r.strategy}>
                  <td>
                    {r.strategy === 'existing-verification-workflow'
                      ? 'Existing verification workflow'
                      : r.strategy === 'agentic'
                        ? 'Agentic profile'
                        : r.strategy === 'idempotent'
                          ? 'Idempotent retry'
                          : 'Blind retry'}
                  </td>
                  <td>{r.tickets}</td>
                  <td>{r.duplicates}</td>
                  <td>{r.calls}</td>
                  <td>{r.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notice">
          Existing verification workflows can achieve the same result. The
          question for pilots is whether a shared profile reduces integration
          and maintenance effort across implementations.
        </div>
      </section>
      <section className="two-col">
        <article className="panel">
          <p className="eyebrow">For implementers</p>
          <h2>Bring an independent client.</h2>
          <p>
            Implement the smallest binding with your own code. Report the
            scenarios you pass, those you fail, and the fields you found
            unnecessary.
          </p>
          <a
            className="text-link"
            href="https://github.com/sam1siam/agentic/issues/new?template=implementation.yml"
          >
            Share an implementation <ArrowUpRight size={16} />
          </a>
        </article>
        <article className="panel">
          <p className="eyebrow">For service owners</p>
          <h2>Test one useful action.</h2>
          <p>
            Choose a record-creation operation with existing idempotency and
            status lookup. Compare Agentic with your current recovery flow.
          </p>
          <a
            className="text-link"
            href="https://github.com/sam1siam/agentic/issues/new?template=pilot.yml"
          >
            Propose a sandbox pilot <ArrowUpRight size={16} />
          </a>
        </article>
      </section>
      <section className="prose adopt-section">
        <h2>Earn adoption through evidence.</h2>
        <p>
          The first goals are five consumer interviews, five service interviews,
          and three to five pilots. A stable release requires two independently
          implemented consumers passing the same compatibility suite.
        </p>
        <p>
          These are targets. No interviews, pilots, independent adopters, or
          standards endorsements are claimed. The project’s two reference
          clients are a starting point for others to test.
        </p>
        <p>
          <a href="/docs/ROADMAP.md">90-day roadmap</a> ·{' '}
          <a href="/docs/PRIOR-ART.md">Prior work</a> ·{' '}
          <a href="/LICENSE.txt">Apache-2.0 license</a>
        </p>
      </section>
    </main>
  );
}
