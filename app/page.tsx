import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Radio,
  RotateCcw,
} from 'lucide-react';

export default function Home() {
  return (
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> An open proposal · 0.1 draft
          </p>
          <h1>
            Actions need
            <br />
            <span>outcomes.</span>
          </h1>
          <p className="lead">
            Give AI agents a clear way to verify their work and recover when a
            request goes quiet.
          </p>
          <div className="actions">
            <Link className="action primary" href="/lab">
              Try the recovery lab <ArrowUpRight size={18} />
            </Link>
            <Link className="action secondary" href="/spec">
              Read the draft <ArrowRight size={18} />
            </Link>
          </div>
          <p className="micro">
            One small file. Existing APIs. Observable results.
          </p>
        </div>
        <div
          className="signal-panel"
          aria-label="An interrupted action can be reconciled and verified"
        >
          <div className="panel-bar">
            <span>AGENTIC / ACTION TRACE</span>
            <span>ILLUSTRATED FLOW</span>
          </div>
          <div className="trace-step">
            <span className="trace-number">01</span>
            <div>
              <strong>Submit the action</strong>
              <p>Persist a request ID before sending.</p>
            </div>
            <Radio size={19} />
          </div>
          <div className="trace-break">
            × &nbsp; Response lost. Outcome unknown.
          </div>
          <div className="trace-step">
            <span className="trace-number">02</span>
            <div>
              <strong>Recover the original result</strong>
              <p>Ask the service what happened.</p>
            </div>
            <RotateCcw size={19} />
          </div>
          <div className="trace-step">
            <span className="trace-number">03</span>
            <div>
              <strong>Verify the outcome</strong>
              <p>Check the resource. Keep the evidence.</p>
            </div>
            <Check size={19} />
          </div>
          <div className="trace-receipt">
            <span>OUTCOME</span>
            <strong>
              verified <Check size={16} />
            </strong>
            <code>request → resource → evidence</code>
          </div>
        </div>
      </section>
      <section className="principles wrap">
        <p className="eyebrow">The idea in three rules</p>
        <div className="principle-grid">
          <article>
            <span className="index">/ 01</span>
            <h2>Keep the request.</h2>
            <p>
              An interrupted connection should not erase what an agent already
              attempted.
            </p>
          </article>
          <article>
            <span className="index">/ 02</span>
            <h2>Check the result.</h2>
            <p>
              Use an authoritative status check and observable evidence before
              reporting completion.
            </p>
          </article>
          <article>
            <span className="index">/ 03</span>
            <h2>Respect the unknown.</h2>
            <p>
              When the result cannot be resolved, preserve uncertainty and hand
              off.
            </p>
          </article>
        </div>
      </section>
      <section className="bottom-callout wrap">
        <div>
          <p className="eyebrow">Built to work with what exists</p>
          <h2>A profile for reliable actions.</h2>
          <p>
            Agentic references your OpenAPI operations. The draft adds shared
            recovery rules and a portable receipt. Existing authentication and
            authorization still apply.
          </p>
        </div>
        <Link href="/adopt" className="text-link">
          Explore the starter kit <ArrowUpRight size={19} />
        </Link>
      </section>
    </main>
  );
}
