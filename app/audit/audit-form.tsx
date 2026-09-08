'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveFile } from '../file-pair';
import type { AuditCheck } from '@/server/audit';
type Report = {
  observedAt: string;
  profileUrl: string;
  valid: boolean;
  limitation: string;
  checks: AuditCheck[];
  textIndex: { status: string };
  observations: {
    url: string;
    status?: number;
    contentType?: string;
    error?: string;
  }[];
};
async function call<T = unknown>(path: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/platform/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(55000),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok)
    throw new Error(
      data.error || 'The audit service is unavailable. Please try again.',
    );
  return data as T;
}
export default function AuditForm() {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  async function run() {
    if (busy) return;
    setBusy(true);
    setError('');
    setReport(null);
    try {
      const session = await fetch('/api/platform/session', {
        credentials: 'same-origin',
        signal: AbortSignal.timeout(10000),
      });
      if (session.status === 401) await call('session', {});
      else if (!session.ok)
        throw new Error('The audit service is unavailable. Please try again.');
      setReport(await call<Report>('audit', { url: value.trim() }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The audit could not finish. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  const failed =
    report?.checks.filter((check) => check.status === 'fail').length ?? 0;
  return (
    <main className="page wrap simple-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Audit</p>
        <h1>
          Check your <span>Agentic files.</span>
        </h1>
        <p>
          Enter a website or a full agentic.json URL. Check the JSON, its API
          operations, and whether agentic.txt matches.
        </p>
      </div>
      <form
        className="audit-form"
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <label className="field-label" htmlFor="audit-url">
          Website or JSON profile URL
        </label>
        <div className="audit-input-row">
          <Input
            id="audit-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yoursite.com"
            value={value}
            required
            maxLength={2048}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby="audit-help"
            onChange={(event) => {
              setValue(event.target.value);
              setError('');
              setReport(null);
            }}
          />
          <Button type="submit" disabled={busy || !value.trim()}>
            {busy ? 'Checking files…' : 'Run audit'}
          </Button>
        </div>
        <p id="audit-help" className="field-help">
          An origin checks /agentic.json. A URL ending in / checks that
          directory. Otherwise, paste the full JSON URL. Public HTTPS only; no
          query parameters.
        </p>
        <Button
          type="button"
          variant="link"
          disabled={busy}
          onClick={() => {
            setValue('https://ruagentic.org');
            setReport(null);
            setError('');
          }}
        >
          Use ruagentic.org as an example
        </Button>
      </form>
      <p className="audit-scope">
        This check only reads public files. It does not run an action or send
        credentials to the website being checked.
      </p>
      {busy && (
        <p role="status" className="notice">
          Reading the profile and its linked files. This may take up to 45
          seconds.
        </p>
      )}
      {error && (
        <div role="alert" className="inline-error">
          {error}
        </div>
      )}
      {report && (
        <section className="audit-results" aria-label="Audit results">
          <div className="section-head">
            <div>
              <p className="eyebrow">Audit result</p>
              <h2 role="status">
                {failed ? 'Some files need attention' : 'File checks passed'}
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                saveFile(
                  'agentic-audit.json',
                  JSON.stringify(report, null, 2) + '\n',
                  'application/json',
                )
              }
            >
              Download report
            </Button>
          </div>
          <p className="audit-target">{report.profileUrl}</p>
          <ul className="check-list">
            {report.checks.map((check) => (
              <li key={check.id} className={'check-row check-' + check.status}>
                <span className="check-status">
                  {check.status === 'pass'
                    ? 'Passed'
                    : check.status === 'warn'
                      ? 'Note'
                      : 'Fix'}
                </span>
                <div>
                  <h3>{check.label}</h3>
                  <p>{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="small muted">{report.limitation}</p>
          <details className="disclosure">
            <summary>Files checked and response details</summary>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>File URL</th>
                    <th>HTTP</th>
                    <th>Content type or error</th>
                  </tr>
                </thead>
                <tbody>
                  {report.observations.map((item) => (
                    <tr key={item.url}>
                      <td>{item.url}</td>
                      <td>{item.status ?? '—'}</td>
                      <td>
                        {item.error || item.contentType || 'Not provided'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">
              Checked {new Date(report.observedAt).toLocaleString()}. This is a
              point-in-time report.
            </p>
          </details>
        </section>
      )}
      <section className="simple-callout">
        <div>
          <h2>Need files first?</h2>
          <p>The generator creates both files from the same settings.</p>
        </div>
        <Link href="/generate" className="action secondary">
          Open the generator →
        </Link>
      </section>
      <div className="doc-utilities">
        <Link href="/validate">Validate a local file</Link>
        <Link href="/platform">Test request recovery</Link>
        <Link href="/connect">Use the audit through MCP</Link>
        <a href="/docs/AUDIT.md">How the audit works</a>
      </div>
      <p className="small muted">
        Audit reports are private to your browser session and retained for up to
        30 days. No account is required.
      </p>
    </main>
  );
}
