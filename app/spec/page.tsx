import Link from 'next/link';
import sample from '@/examples/tickets/agentic.json';
import { profileFiles } from '@/lib/action-index';
import FilePair from '../file-pair';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Specification',
  description:
    'Agentic 1.0: file format, API bindings, request recovery, and verified results.',
  alternates: {
    canonical: 'https://ruagentic.org/spec/',
    types: { 'text/markdown': '/spec/index.md' },
  },
};
export default function SpecPage() {
  return (
    <main className="page wrap simple-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Specification · 1.0</p>
        <h1>
          The Agentic <span>file format.</span>
        </h1>
        <p>
          Describe an action, keep its request identity, and check the result
          before reporting success.
        </p>
        <div className="doc-utilities">
          <a href="/docs/SPEC.md">Full specification →</a>
          <a href="/schemas/agentic-1.0.schema.json">JSON Schema →</a>
          <a href="/docs/AGENTIC-TXT.md">TXT format →</a>
        </div>
      </div>
      <nav className="spec-toc" aria-label="On this page">
        <a href="#files">1. Files</a>
        <a href="#profile">2. JSON fields</a>
        <a href="#flow">3. Action flow</a>
        <a href="#publish">4. Publishing</a>
        <a href="#example">5. Example</a>
        <a href="#requirements">6. Implementation</a>
      </nav>
      <section id="files" className="reading-section">
        <h2>1. Two files, one source of truth</h2>
        <p>
          <code>agentic.json</code> is the action contract. A supporting client
          reads it to find the right API operations and decide what evidence to
          check. <code>agentic.txt</code> is an optional index generated from
          that JSON.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Contains</th>
                <th>Content type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>agentic.json</td>
                <td>
                  Version, service origin, actions, API links, result checks,
                  and recovery limits.
                </td>
                <td>application/json</td>
              </tr>
              <tr>
                <td>agentic.txt</td>
                <td>
                  JSON profile URL, version, origin, action IDs, and short
                  descriptions.
                </td>
                <td>text/plain; charset=utf-8</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section id="profile" className="reading-section">
        <h2>2. What goes in the JSON?</h2>
        <p>
          A profile names your service and between one and 32 actions. Each
          action links to three operations in an OpenAPI 3.1 document.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['agentic', 'The profile version: 1.0.0.'],
                ['origin', 'Your service’s HTTPS origin.'],
                [
                  'actions[].id / description',
                  'A stable action name and a short explanation.',
                ],
                [
                  'actions[].openapi',
                  'A path to the OpenAPI document on the same service.',
                ],
                [
                  'actions[].submit / actions[].status / actions[].verify',
                  'The operation IDs for creating the action, checking its request, and reading its result.',
                ],
                [
                  'actions[].request / actions[].bindings',
                  'How request IDs are tracked and placed in the API URLs.',
                ],
                [
                  'actions[].evidence',
                  'The fields that connect the result to the original request and input.',
                ],
                [
                  'actions[].recovery',
                  'Bounded status checks, timeouts, and no automatic repeat write.',
                ],
              ].map(([field, detail]) => (
                <tr key={field}>
                  <td>
                    <code>{field}</code>
                  </td>
                  <td>{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The <a href="/docs/SPEC.md">full specification</a> defines required
          fields, limits, and exact validation rules.
        </p>
      </section>
      <section id="flow" className="reading-section">
        <h2>3. How an action is checked</h2>
        <ol className="plain-steps">
          <li>
            <strong>Save the request.</strong> Keep its ID, input, and original
            contract before sending.
          </li>
          <li>
            <strong>Submit once.</strong> Send the action with its idempotency
            key.
          </li>
          <li>
            <strong>Look up the same request.</strong> If the response is lost,
            check status without repeating the write.
          </li>
          <li>
            <strong>Verify the result.</strong> Check the resource’s IDs, state,
            and relevant input values.
          </li>
          <li>
            <strong>Record the outcome.</strong> Save a receipt. If the result
            cannot be verified, keep it pending or unknown.
          </li>
        </ol>
      </section>
      <section id="publish" className="reading-section">
        <h2>4. Publish the pair</h2>
        <p>
          Serve UTF-8 files at <code>/agentic.json</code> and{' '}
          <code>/agentic.txt</code>, normally from your site’s public folder.
          Update the JSON first, regenerate TXT, and publish both together. Pass
          the profile URL to your Agentic-compatible client.
        </p>
        <p>
          The TXT file declares <code>Agentic-Text: 1.0</code> and a{' '}
          <code>Profile:</code> URL on the same origin. Action IDs and
          descriptions are quoted strings. The TXT file never overrides the JSON
          or grants permission to execute actions.
        </p>
        <div className="doc-utilities">
          <Link href="/generate">Generate both files →</Link>
          <Link href="/audit">Audit published files →</Link>
        </div>
      </section>
      <section id="example" className="reading-section">
        <h2>5. A complete example</h2>
        <p>
          This support-ticket profile shows the required fields. Replace the
          example origin and operations with your service’s values.
        </p>
        <FilePair files={profileFiles(sample)} />
      </section>
      <section id="requirements" className="reading-section">
        <h2>6. What the service and client must do</h2>
        <p>
          Your service must track requests durably, prevent duplicate effects
          for the same request, and provide reliable status and resource reads.
          Your client must enforce authorization, preserve request identity, and
          check the evidence. Files describe these rules; the implementation
          enforces them.
        </p>
        <p>
          All action operations stay on the declared origin. Clients reject
          execution redirects and keep credentials, ledgers, and private
          receipts out of public files.
        </p>
        <div className="doc-utilities">
          <a href="/docs/INTEGRATIONS.md">Implementation guide →</a>
          <a href="/docs/MIGRATION.md">Version migration →</a>
          <a href="/schemas/receipt-1.0.schema.json">Receipt schema →</a>
          <Link href="/compare">Compare formats →</Link>
        </div>
      </section>
    </main>
  );
}
