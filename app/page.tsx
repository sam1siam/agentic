import Link from 'next/link';
import sample from '@/examples/site/agentic.json';
import { publicationFiles } from '@/lib/publication';
import FilePair from './file-pair';
import JsonLd, { organizationJsonLd, websiteJsonLd } from './json-ld';
export const dynamic = 'force-static';
export const metadata = {
  alternates: {
    canonical: 'https://ruagentic.org/',
    types: { 'text/markdown': '/index.md' },
  },
};
export default function Home() {
  return (
    <main className="wrap simple-home">
      <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
      <section className="home-intro">
        <p className="eyebrow">An open file convention for AI agents</p>
        <h1>
          Make your website <br />
          <span>readable to agents.</span>
        </h1>
        <p className="lead">
          Enter your URL. We find your public docs, APIs, llms.txt, and agent
          connections, then generate <code>agentic.json</code> and{' '}
          <code>agentic.txt</code> for you.
        </p>
        <div className="actions">
          <Link className="action primary" href="/generate">
            Generate your files →
          </Link>
          <Link className="action secondary" href="/audit">
            Audit published files
          </Link>
        </div>
        <p className="micro">
          Open source · No account needed · Publish on your own domain
        </p>
      </section>
      <section className="home-pair">
        <div className="section-head">
          <h2>Your Agentic publication files.</h2>
          <Link href="/spec">Read the format →</Link>
        </div>
        <p className="muted">
          JSON holds the structured information. TXT is its readable index.
          README and listing text help you publish and describe them. This small
          example uses a placeholder domain; the generator uses your public
          sources.
        </p>
        <FilePair files={publicationFiles(sample)} />
      </section>
      <section className="simple-steps" aria-label="Get started">
        <article>
          <span className="step-number">01</span>
          <h2>Generate</h2>
          <p>
            Enter your website URL. Review the sources found and download the
            four publication files.
          </p>
          <Link href="/generate">Create files →</Link>
        </article>
        <article>
          <span className="step-number">02</span>
          <h2>Publish</h2>
          <p>
            Publish agentic.json and agentic.txt on your domain, merge the
            README, and give the file URL to a supporting agent.
          </p>
          <Link href="/spec">Publishing guide →</Link>
        </article>
        <article>
          <span className="step-number">03</span>
          <h2>Check</h2>
          <p>
            Audit the published files, their document links, and the matching
            text index and README.
          </p>
          <Link href="/audit">Run an audit →</Link>
        </article>
      </section>
      <section className="simple-callout">
        <div>
          <h2>Need to verify an action’s result?</h2>
          <p>
            Agentic also defines an action contract for request tracking and
            recovery after a lost response. Connect it to the behavior your API
            implements.
          </p>
        </div>
        <Link className="action secondary" href="/spec#actions">
          Action contracts →
        </Link>
      </section>
    </main>
  );
}
