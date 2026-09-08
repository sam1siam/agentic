'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Report = {
  id: string;
  kind: string;
  data: Record<string, any>;
  created_at: string;
  shared: boolean;
};
async function call(path: string, body?: unknown) {
  const response = await fetch('/api/platform/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    redirect: 'error',
  });
  const data = (await response.json()) as any;
  if (!response.ok) throw new Error(data.error ?? 'Request failed.');
  return data;
}
export default function PlatformConsole() {
  const [session, setSession] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [scenario, setScenario] = useState('response-lost'),
    [report, setReport] = useState<Record<string, any> | null>(null),
    [reports, setReports] = useState<Report[]>([]),
    [url, setUrl] = useState(
      'https://ruagentic.org/api/platform/service/agentic.json',
    ),
    [share, setShare] = useState(''),
    [token, setToken] = useState('');
  useEffect(() => {
    call('session')
      .then(() => {
        setSession(true);
        return call('reports');
      })
      .then((r) => setReports(r.reports))
      .catch(() => {});
    const key = new URLSearchParams(location.search).get('share');
    if (key)
      call('shared?token=' + encodeURIComponent(key))
        .then((r) => setReport({ id: r.id, ...r.data }))
        .catch((e) => setMessage(e.message));
  }, []);
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    setShare('');
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }
  async function ensureSession() {
    if (!session) {
      await call('session', {});
      setSession(true);
    }
  }
  async function run(path: string, body: unknown) {
    await ensureSession();
    setReport(await call(path, body));
    setReports((await call('reports')).reports);
  }
  function download(value: unknown) {
    const blob = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2) + '\n'], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = blob;
    a.download = 'agentic-report.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(blob), 1000);
  }
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Agentic / hosted tools</p>
        <h1>
          Test what <span>really happened.</span>
        </h1>
        <p>
          Run recovery checks over HTTP, audit a live profile, and inspect the
          evidence. Your sandbox and report history are isolated from other
          visitors.
        </p>
      </div>
      <div className="platform-toolbar">
        <span className="small muted">
          {session
            ? 'Private session active · history retained for 30 days'
            : 'A private session starts when you run a test.'}
        </span>
        <Link href="/connect">Connect an agent →</Link>
      </div>
      <Tabs defaultValue="sandbox" className="generator-tabs">
        <TabsList aria-label="Platform tool">
          <TabsTrigger value="sandbox">Recovery sandbox</TabsTrigger>
          <TabsTrigger value="audit">URL auditor</TabsTrigger>
          <TabsTrigger value="auth">Agent Auth</TabsTrigger>
          <TabsTrigger value="reports">Saved reports</TabsTrigger>
        </TabsList>
        <TabsContent value="sandbox">
          <section className="panel platform-panel">
            <h2>One request. A recoverable result.</h2>
            <p>
              Choose a failure, submit a synthetic ticket, and watch the client
              reconcile it against PostgreSQL. The restart case stops the client
              after submission; Resume starts a new request with the saved
              ledger.
            </p>
            <label className="field-label" htmlFor="scenario">
              Test scenario
            </label>
            <select
              id="scenario"
              className="platform-select"
              value={scenario}
              disabled={busy}
              onChange={(e) => setScenario(e.target.value)}
            >
              <option value="response-lost">Response fails after commit</option>
              <option value="restart-after-submit">
                Client stops after submission
              </option>
              <option value="normal">Normal completion</option>
              <option value="status-unavailable">
                Status endpoint unavailable
              </option>
              <option value="wrong-evidence">
                Resource evidence does not match
              </option>
              <option value="pending">Service reports pending</option>
            </select>
            <div className="actions">
              <Button
                disabled={busy}
                onClick={() => perform(() => run('run', { scenario }))}
              >
                {busy ? 'Working…' : 'Run recovery test'}
              </Button>
              <Button
                variant="outline"
                disabled={
                  busy ||
                  !session ||
                  !report?.requestId ||
                  report?.kind !== 'hosted-recovery'
                }
                onClick={() =>
                  perform(() =>
                    run('run', {
                      scenario: report?.scenario,
                      requestId: report?.requestId,
                      resume: true,
                    }),
                  )
                }
              >
                Resume saved request
              </Button>
            </div>
            <p className="small muted">
              Synthetic data only. A failed response uses HTTP 503 after commit.
              These are project-authored tests, not independent certification.
            </p>
          </section>
        </TabsContent>
        <TabsContent value="audit">
          <section className="panel platform-panel">
            <h2>Inspect a public action profile</h2>
            <p>
              Check its JSON, API operations, matching agentic.txt, optional
              llms.txt, and response headers. This audit makes GET requests and
              does not execute actions.
            </p>
            <label className="field-label" htmlFor="audit-url">
              Website or public HTTPS JSON URL
            </label>
            <Input
              id="audit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="actions">
              <Button
                disabled={busy || !url}
                onClick={() => perform(() => run('audit', { url }))}
              >
                {busy ? 'Auditing…' : 'Audit URL'}
              </Button>
            </div>
            <p className="small muted">
              Public HTTPS on port 443. Redirects and private networks are
              blocked. Maximum 64 KiB per profile and 256 KiB per OpenAPI file.
            </p>
          </section>
        </TabsContent>
        <TabsContent value="auth">
          <section className="panel platform-panel">
            <h2>A signed request with a real grant</h2>
            <p>
              This check discovers our live provider, registers a fresh
              autonomous agent, grants profile validation, executes it, revokes
              the agent, and checks that its signed token is rejected.
            </p>
            <div className="actions">
              <Button
                disabled={busy}
                onClick={() => perform(() => run('auth-check', {}))}
              >
                {busy ? 'Running protocol exchange…' : 'Verify Agent Auth'}
              </Button>
              <Link href="/connect#agent-auth">Use the client SDK →</Link>
            </div>
            <p className="small muted">
              Agent keys are temporary and stay on the server. Autonomous grants
              cover only validation and isolated synthetic testing. Human
              account delegation is not offered.
            </p>
          </section>
        </TabsContent>
        <TabsContent value="reports">
          <section className="panel platform-panel">
            <div className="section-head">
              <h2>Evidence history</h2>
              <Button
                variant="outline"
                disabled={busy || !session}
                onClick={() =>
                  perform(async () =>
                    setReports((await call('reports')).reports),
                  )
                }
              >
                Refresh
              </Button>
            </div>
            {reports.length === 0 ? (
              <p className="muted">Run a test to save your first report.</p>
            ) : (
              <div className="report-list">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    className="report-row"
                    onClick={() => {
                      setReport({ id: r.id, ...r.data });
                      setShare('');
                    }}
                  >
                    <span>
                      {r.kind}
                      <small>{new Date(r.created_at).toLocaleString()}</small>
                    </span>
                    <span>{r.shared ? 'Shared' : 'Private'} →</span>
                  </button>
                ))}
              </div>
            )}
            <p className="small muted">
              Reports expire after 30 days. Sharing requires an explicit action
              and creates a secret link. Losing or revoking this browser session
              removes access to its private history.
            </p>
          </section>
        </TabsContent>
      </Tabs>
      <p role="status" className="platform-status">
        {message}
      </p>
      {report && (
        <section className="example-section platform-result">
          <div className="section-head">
            <h2>
              {report.kind === 'hosted-recovery'
                ? (report.receipt?.outcome ?? 'Awaiting recovery')
                : report.kind === 'agent-auth-check'
                  ? report.revocationEnforced
                    ? 'Revocation verified'
                    : 'Review auth result'
                  : report.kind === 'public-site-discovery'
                    ? 'Generated Agentic files'
                    : report.valid
                      ? 'Profile checks passed'
                      : 'Audit result'}
            </h2>
            <span className="small muted">{report.observedAt}</span>
          </div>
          {report.kind === 'hosted-recovery' && (
            <div className="stats-strip">
              <div>
                <strong>{report.committedWrites}</strong>
                <span>committed writes</span>
              </div>
              <div>
                <strong>{report.resourcesCreated}</strong>
                <span>resources created</span>
              </div>
              <div>
                <strong>{report.statusReads}</strong>
                <span>status reads</span>
              </div>
            </div>
          )}
          {report.trace && (
            <ol className="platform-trace">
              {report.trace.map((t: any, i: number) => (
                <li key={i}>
                  <code>{t.kind}</code>
                  <span>{t.message}</span>
                </li>
              ))}
            </ol>
          )}
          <details>
            <summary>Inspect the complete JSON report</summary>
            <pre className="code-block" tabIndex={0}>
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
          <div className="actions">
            <Button variant="outline" onClick={() => download(report)}>
              Download report
            </Button>
            <Button
              variant="outline"
              disabled={busy || !session}
              onClick={() =>
                perform(async () => {
                  const r = await call('reports/' + report.id + '/share', {
                    enabled: true,
                  });
                  setShare(location.origin + '/platform/?share=' + r.token);
                })
              }
            >
              Create share link
            </Button>
            <Button
              variant="ghost"
              disabled={busy || !session}
              onClick={() =>
                perform(async () => {
                  await call('reports/' + report.id + '/share', {
                    enabled: false,
                  });
                  setShare('');
                  setMessage(
                    'Sharing disabled. Previous links no longer work.',
                  );
                })
              }
            >
              Disable sharing
            </Button>
          </div>
          {share && (
            <div className="notice">
              <label className="field-label" htmlFor="share-link">
                Anyone with this link can read this report until it expires or
                you disable sharing.
              </label>
              <Input id="share-link" readOnly value={share} />
            </div>
          )}
        </section>
      )}
      <section className="example-section">
        <h2>Connect your own client</h2>
        <p>
          Create a bearer token for the A2A agent and sandbox HTTP API.
          Exporting rotates the previous token. Keep it private.
        </p>
        <div className="actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              perform(async () => {
                await ensureSession();
                setToken((await call('session/token', {})).token);
              })
            }
          >
            Create session token
          </Button>
          <Button
            variant="ghost"
            disabled={busy || !session}
            onClick={() =>
              perform(async () => {
                await call('session/revoke', {});
                setSession(false);
                setToken('');
                setReports([]);
                setMessage('Session revoked. Exported tokens no longer work.');
              })
            }
          >
            Revoke session
          </Button>
        </div>
        {token && (
          <Input
            aria-label="Private session token"
            type="password"
            value={token}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        )}
        <div className="doc-utilities">
          <Link href="/connect">MCP, WebMCP, A2A and Agent Auth setup →</Link>
          <Link href="/adopt">Install tools and integrate →</Link>
        </div>
      </section>
    </main>
  );
}
