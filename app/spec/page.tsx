import Link from 'next/link';
import sample from '@/examples/site/agentic.json';
import { publicationFiles } from '@/lib/publication';
import FilePair from '../file-pair';
import JsonLd, { techArticleJsonLd } from '../json-ld';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Specification',
  description:
    'Agentic site profiles, action contracts, and matching JSON and TXT files.',
  alternates: {
    canonical: 'https://ruagentic.org/spec/',
    types: { 'text/markdown': '/spec/index.md' },
  },
};
export default function SpecPage() {
  return (
    <main className="page wrap simple-page">
      <JsonLd
        data={techArticleJsonLd({
          path: '/spec/',
          headline: 'The Agentic file format',
          description:
            'Agentic site profiles, action contracts, and matching JSON and TXT files.',
        })}
      />
      <div className="page-heading compact-heading">
        <p className="eyebrow">Specification · Site 1.1 / Action 1.0</p>
        <h1>
          The Agentic <span>file format.</span>
        </h1>
        <p>
          Describe your website’s documentation, APIs, and agent connections.
          Add an action contract when your service supports request tracking and
          result verification.
        </p>
        <div className="doc-utilities">
          <a href="/docs/SITE-PROFILE.md">Site specification →</a>
          <a href="/schemas/site-1.1.schema.json">Site JSON Schema →</a>
          <a href="/docs/SPEC.md">Action specification →</a>
        </div>
      </div>
      <nav className="spec-toc" aria-label="On this page">
        <a href="#files">1. Files</a>
        <a href="#site">2. Site fields</a>
        <a href="#actions">3. Action contracts</a>
        <a href="#publish">4. Publishing</a>
        <a href="#example">5. Example</a>
        <a href="#compatibility">6. Compatibility</a>
      </nav>
      <section id="files" className="reading-section">
        <h2>1. Two files, one source of truth</h2>
        <p>
          <code>agentic.json</code> contains structured information.{' '}
          <code>agentic.txt</code> is a readable index generated from that JSON.
          It links back to the JSON and never overrides it.
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
                <td>One versioned site profile or action contract.</td>
                <td>application/json</td>
              </tr>
              <tr>
                <td>agentic.txt</td>
                <td>Profile URL, version, origin, and a generated index.</td>
                <td>text/plain; charset=utf-8</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section id="site" className="reading-section">
        <h2>2. Site Profile 1.1</h2>
        <p>
          The website generator creates this profile from public sources. A
          website can use it even when it has no API.
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
                ['agentic / type', 'Version 1.1.0 and type site.'],
                ['origin', 'The website’s canonical HTTPS origin.'],
                ['name / description', 'The public site name and description.'],
                [
                  'resources',
                  'Documentation, llms.txt, OpenAPI, MCP, A2A, Agent Auth, or existing Agentic links.',
                ],
                [
                  'resources[].source / availability',
                  'Where the link was found and whether the document was read or only linked.',
                ],
                [
                  'apis',
                  'OpenAPI document URLs with an index of documented methods, paths, and operation IDs when present.',
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
          Up to 40 resources and five API indexes are supported. Files stay
          within 64 KiB. API descriptions remain authoritative for parameters,
          authentication, servers, and responses. A linked MCP endpoint is
          advertised information; the scanner does not invoke its tools.
        </p>
        <p>
          The <a href="/docs/SITE-PROFILE.md">full site specification</a>{' '}
          defines exact fields, limits, TXT 1.1, and discovery rules.
        </p>
      </section>
      <section id="actions" className="reading-section">
        <h2>3. Action Profile 1.0</h2>
        <p>
          An action profile describes how to submit once, look up the original
          request, and verify the resulting resource. Its JSON declares{' '}
          <code>agentic: 1.0.0</code> and an <code>actions</code> array. Each
          action binds three operations in an OpenAPI 3.1 document.
        </p>
        <ol className="plain-steps">
          <li>
            <strong>Save the request.</strong> Keep its ID, input, and original
            contract before sending.
          </li>
          <li>
            <strong>Submit once.</strong> Send the request with its idempotency
            key.
          </li>
          <li>
            <strong>Check the original request.</strong> Recover from a lost
            response without automatically repeating the write.
          </li>
          <li>
            <strong>Verify the result.</strong> Check resource IDs, state, and
            matching input values before recording success.
          </li>
        </ol>
        <p>
          Your service must implement durable request tracking, idempotency,
          reliable status, and result reads. The generator preserves an existing
          action contract. It does not infer these guarantees from website text
          or API names.
        </p>
        <div className="doc-utilities">
          <a href="/docs/SPEC.md">Action requirements →</a>
          <a href="/schemas/agentic-1.0.schema.json">Action schema →</a>
          <a href="/docs/AGENTIC-TXT.md">Legacy action TXT 1.0 →</a>
          <Link href="/examples">Action example →</Link>
        </div>
      </section>
      <section id="publish" className="reading-section">
        <h2>4. Publish the pair</h2>
        <p>
          Serve UTF-8 files at <code>/agentic.json</code> and{' '}
          <code>/agentic.txt</code>, usually from your site’s public folder.
          Publish both together. When updating an existing profile at another
          path, preserve that location and the TXT file’s <code>Profile:</code>{' '}
          URL, or regenerate TXT for the new location.
        </p>
        <p>
          Current generators declare <code>Agentic-Text: 1.2</code> for both
          JSON profiles, adding descriptions and links for Agentic and
          RUAGENTIC. Legacy TXT 1.0 and 1.1 remain accepted. No TXT format
          grants authorization. Supporting agents must enforce their own network
          and credential policies.
        </p>
        <div className="doc-utilities">
          <a href="/docs/PUBLICATION.md">
            TXT 1.2, README, and listing guide →
          </a>
          <Link href="/generate">Generate publication files →</Link>
          <Link href="/audit">Audit published files →</Link>
        </div>
      </section>
      <section id="example" className="reading-section">
        <h2>5. A site profile example</h2>
        <p>
          This example uses a placeholder domain. Generate your own pair from
          your website’s public sources.
        </p>
        <FilePair files={publicationFiles(sample)} />
      </section>
      <section id="compatibility" className="reading-section">
        <h2>6. Versions and compatibility</h2>
        <p>
          Tools 1.3.0 support Site Profile 1.1.0 and Action Profile 1.0.0.
          Existing action contracts, receipts, and TXT 1.0 remain unchanged. The
          action executor rejects site profiles; the linked API or protocol
          provides its own execution contract.
        </p>
        <p>
          Regenerate files when your documentation changes. The public audit
          checks file structure and selected linked documents; test any runtime
          guarantees against your service.
        </p>
        <div className="doc-utilities">
          <Link href="/adopt">Install the tools →</Link>
          <a href="/docs/INTEGRATIONS.md">Action integration →</a>
          <a href="/schemas/receipt-1.0.schema.json">Receipt schema →</a>
          <Link href="/compare">Compare formats →</Link>
        </div>
      </section>
    </main>
  );
}
