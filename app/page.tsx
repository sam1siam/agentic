import Link from 'next/link';
import sample from '@/examples/tickets/agentic.json';
import { profileFiles } from '@/lib/action-index';
import FilePair from './file-pair';
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
      <section className="home-intro">
        <p className="eyebrow">An open file convention for AI agents</p>
        <h1>
          Help agents know
          <br />
          <span>what happened.</span>
        </h1>
        <p className="lead">
          <code>agentic.txt</code> lists the actions your service offers.{' '}
          <code>agentic.json</code> tells an agent how to check their results
          and recover when a response is lost.
        </p>
        <div className="actions">
          <Link className="action primary" href="/generate">
            Generate your files →
          </Link>
          <Link className="action secondary" href="/audit">
            Audit a website
          </Link>
        </div>
        <p className="micro">
          Open source · Works with your API · No central registry
        </p>
      </section>
      <section className="home-pair">
        <div className="section-head">
          <h2>Two files. One description of your action.</h2>
          <Link href="/spec">Format 1.0 →</Link>
        </div>
        <p className="muted">
          A complete support-ticket example. The generator helps you adapt it to
          your own API.
        </p>
        <FilePair files={profileFiles(sample)} />
      </section>
      <section className="simple-steps" aria-label="Get started">
        <article>
          <span className="step-number">01</span>
          <h2>Generate</h2>
          <p>
            Describe your action and connect its API operations. Download both
            files.
          </p>
          <Link href="/generate">Create files →</Link>
        </article>
        <article>
          <span className="step-number">02</span>
          <h2>Publish</h2>
          <p>
            Serve the files on your domain. Give their URL to a client that
            supports Agentic.
          </p>
          <Link href="/spec">Read the spec →</Link>
        </article>
        <article>
          <span className="step-number">03</span>
          <h2>Check</h2>
          <p>
            Audit the files and API links, then test recovery against your
            service.
          </p>
          <Link href="/audit">Run an audit →</Link>
        </article>
      </section>
      <section className="simple-callout">
        <div>
          <h2>Where does Agentic fit?</h2>
          <p>
            Keep your existing API, authentication, and agent tools. Agentic
            describes how to verify the result of an action.
          </p>
        </div>
        <Link className="action secondary" href="/compare">
          Compare the formats →
        </Link>
      </section>
    </main>
  );
}
