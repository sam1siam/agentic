import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDownToLine, ArrowUpRight } from 'lucide-react';
import sample from '@/examples/tickets/agentic.json';
export const metadata: Metadata = {
  title: 'Specification · 0.1 draft',
  alternates: {
    canonical: 'https://ruagentic.org/spec/',
    types: { 'text/markdown': '/spec/index.md' },
  },
};
export const dynamic = 'force-static';
const fields = [
  ['agentic', 'The exact profile version.'],
  ['origin', 'The authoritative HTTPS service origin.'],
  ['submit / status / verify', 'Three operation IDs in your OpenAPI document.'],
  ['request', 'Idempotency key scope and tracking window.'],
  ['bindings', 'Request and resource path parameter names.'],
  [
    'evidence',
    'Resource identity, original request, state, and matching input.',
  ],
  ['recovery', 'Bounded checks and no automatic repeat writes.'],
];
export default function SpecPage() {
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Agentic Action Profile / 0.1.0-draft</p>
        <h1>
          A small contract.
          <br />
          <span>A checkable result.</span>
        </h1>
        <p>
          An experimental profile for tracking, reconciling, and verifying
          actions through existing OpenAPI operations.
        </p>
        <div className="actions">
          <a className="action primary" href="/docs/SPEC.md">
            <ArrowDownToLine size={17} />
            Normative draft
          </a>
          <a
            className="action secondary"
            href="/schemas/agentic-0.1.schema.json"
          >
            JSON Schema <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <div className="spec-layout">
        <aside className="spec-toc">
          <span className="eyebrow">On this page</span>
          <a href="#scope">01 / Scope</a>
          <a href="#profile">02 / The file</a>
          <a href="#lifecycle">03 / Lifecycle</a>
          <a href="#receipts">04 / Receipts</a>
          <a href="#boundaries">05 / Boundaries</a>
          <a href="#status">06 / Draft status</a>
        </aside>
        <article className="prose">
          <section id="scope">
            <h2>01 / One action, three operations.</h2>
            <p>
              A profile points to a submission operation, an authoritative
              request-status operation, and a resource read. The first binding
              supports one POST and two GET operations from an OpenAPI 3.1
              document.
            </p>
            <p>
              Agentic builds on existing techniques. Its proposed contribution
              is a consistent, testable set of rules that multiple clients can
              implement. It is not a new transport, a permission grant, or an
              exactly-once guarantee.
            </p>
          </section>
          <section id="profile">
            <h2>02 / The file.</h2>
            <p>
              Publish <code>agentic.json</code> or provide its URL directly to a
              supporting client. Use ordinary JSON and the versioned schema.
              Agents do not automatically discover or support this filename.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(([field, purpose]) => (
                    <tr key={field}>
                      <td className="mono">{field}</td>
                      <td>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <pre className="code-block">{JSON.stringify(sample, null, 2)}</pre>
            <p>
              <Link href="/validate">
                Check this example in the validator →
              </Link>
            </p>
          </section>
          <section id="lifecycle">
            <h2>03 / The action lifecycle.</h2>
            <ol>
              <li>
                Authorize the requested action using the host’s existing policy.
              </li>
              <li>
                Save the request ID and bind it to the origin, action, input,
                and profile snapshot before sending.
              </li>
              <li>Submit once. A lost response leaves the outcome unknown.</li>
              <li>
                Look up the original request. Use its resource ID to read the
                resulting record.
              </li>
              <li>
                Verify the resource ID, request ID, state, and required input
                evidence.
              </li>
              <li>
                Save a receipt. Preserve pending or unknown when completion
                cannot be verified.
              </li>
            </ol>
            <p>
              After restart, the saved request is reconciled without
              automatically submitting another write. Expired tracking requires
              a handoff.
            </p>
          </section>
          <section id="receipts">
            <h2>04 / Keep the evidence.</h2>
            <p>
              A receipt records the request, action, origin, outcome,
              observation time, and resulting resource. Successful receipts
              include the evidence source and checks performed.
            </p>
            <p>
              Receipts belong in the authorized client’s storage. They can
              contain sensitive information and do not belong in the public
              manifest. A receipt records an observation; it is not a signature
              or a guarantee that the service is honest.
            </p>
            <a href="/schemas/receipt-0.1.schema.json">Receipt schema ↗</a>
          </section>
          <section id="boundaries">
            <h2>05 / Explicit boundaries.</h2>
            <p>
              The service must actually implement atomic request tracking and
              deduplication. The client must enforce authorization, approved
              destinations, account isolation, timeouts, and response limits.
              The file cannot provide those controls on its own.
            </p>
            <p>
              This draft supports a narrow same-origin OpenAPI binding. General
              workflow programming, cross-origin execution, payments, identity,
              and automatic mutation retries are outside its scope.
            </p>
            <p>
              <a href="/docs/SECURITY.md">Operational limits</a> ·{' '}
              <a href="/docs/PRIOR-ART.md">Relationship to existing work</a>
            </p>
          </section>
          <section id="status">
            <h2>06 / A proposal to test.</h2>
            <p>
              The repository includes Node and Python reference clients, a
              loopback HTTP/SQLite service, and failure tests. Both clients
              share project authorship. Independent implementation and
              production adoption remain open goals.
            </p>
            <p>
              This page is a reading guide.{' '}
              <a href="/docs/SPEC.md">The normative draft</a> and versioned
              schemas define the actual requirements.
            </p>
            <Link href="/adopt">Help test the proposal →</Link>
          </section>
        </article>
      </div>
    </main>
  );
}
