import Link from 'next/link';
import { CodeSample } from '../code-sample';
import profile from '@/examples/tickets/agentic.json';
import receipt from '@/examples/tickets/receipt.json';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Examples',
  alternates: {
    canonical: 'https://ruagentic.org/examples/',
    types: { 'text/markdown': '/examples/index.md' },
  },
};
export default function ExamplesPage() {
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Examples / one complete action</p>
        <h1>
          A ticket. An interruption.
          <br />
          <span>The original result.</span>
        </h1>
        <p>
          Follow the same request from its profile through the service contract
          to a verification receipt. All data below is illustrative.
        </p>
        <div className="actions">
          <Link className="action primary" href="/lab">
            Run the recovery lab →
          </Link>
          <Link className="action secondary" href="/generate">
            Customize this profile
          </Link>
        </div>
        <div className="doc-utilities">
          <a href="/examples/index.md">Read as Markdown ↗</a>
          <a href="/docs/QUICKSTART.md">Run the real HTTP example ↗</a>
        </div>
      </div>
      <section className="example-section">
        <h2>1. Describe the action</h2>
        <p className="muted">
          The profile connects three operations: create a ticket, check the
          request, and read the resulting ticket.
        </p>
        <CodeSample value={profile} />
        <div className="doc-utilities">
          <a href="/examples/tickets/agentic.json" download>
            Download agentic.json ↓
          </a>
          <Link href="/validate">Validate the profile →</Link>
        </div>
      </section>
      <section className="example-section">
        <h2>2. Bind three OpenAPI operations</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Operation</th>
                <th>Endpoint</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Submit</td>
                <td className="mono">createTicket</td>
                <td className="mono">POST /tickets</td>
              </tr>
              <tr>
                <td>Reconcile</td>
                <td className="mono">getRequestStatus</td>
                <td className="mono">GET /requests/&#123;requestId&#125;</td>
              </tr>
              <tr>
                <td>Verify</td>
                <td className="mono">getTicket</td>
                <td className="mono">GET /tickets/&#123;ticketId&#125;</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 18 }}>
          After submission, the client checks the request status and reads the
          ticket. It confirms that the ticket ID, request ID, state, and subject
          match before reporting success.
        </p>
        <div className="doc-utilities">
          <a href="/examples/tickets/openapi.json" download>
            Download openapi.json ↓
          </a>
          <a href="/docs/INTEGRATIONS.md">Adapt the binding →</a>
        </div>
      </section>
      <section className="example-section">
        <h2>3. Keep a receipt</h2>
        <p className="muted">
          This synthetic receipt demonstrates the format. It is not a record of
          a real customer action or an independent pilot.
        </p>
        <CodeSample value={receipt} />
        <div className="doc-utilities">
          <a href="/examples/tickets/receipt.json" download>
            Download example receipt ↓
          </a>
          <a href="/schemas/receipt-0.1.schema.json">Receipt schema ↗</a>
        </div>
      </section>
      <section className="docs-banner">
        <h2>Test your own implementation</h2>
        <p>
          Use the compatibility runner with an independently written client.
          Compare normal completion, response loss, unavailable status,
          mismatched evidence, pending work, and process restart.
        </p>
        <div className="doc-utilities">
          <a href="/docs/PILOT-RUNNER.md">Compatibility runner →</a>
          <Link href="/adopt">Pilot enrollment →</Link>
        </div>
      </section>
    </main>
  );
}
