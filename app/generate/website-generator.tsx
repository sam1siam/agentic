'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerPageTool } from '@/lib/webmcp';
import { type SiteProfile } from '@/lib/site-profile';
import { type Profile } from '@/lib/types';
import FilePair, { saveFile } from '../file-pair';
type Result = {
  origin: string;
  mode: 'site' | 'action';
  observedAt: string;
  profile: SiteProfile | Profile;
  files: {
    'agentic.txt': string;
    'agentic.json': string;
    'README.md': string;
    'LISTING.md': string;
  };
  sources: { kind: string; url: string; availability: string }[];
  observations: { url: string; status?: number; error?: string }[];
  notes: string[];
  limitation: string;
};
async function discover(url: string, signal: AbortSignal): Promise<Result> {
  const session = await fetch('/api/platform/session', {
    credentials: 'same-origin',
    signal,
  });
  if (session.status === 401) {
    const created = await fetch('/api/platform/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal,
    });
    if (!created.ok)
      throw new Error(
        'The generator could not start a session. Please try again.',
      );
  } else if (!session.ok)
    throw new Error('The generator is unavailable. Please try again.');
  const response = await fetch('/api/platform/discover', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal,
  });
  const result = (await response.json().catch(() => ({}))) as Result & {
    error?: string;
  };
  if (!response.ok)
    throw new Error(
      result.error ||
        'The website could not be read. Check the URL and try again.',
    );
  return result;
}
export default function WebsiteGenerator() {
  const [url, setUrl] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null),
    [elapsed, setElapsed] = useState(0);
  const active = useRef<AbortController | null>(null),
    heading = useRef<HTMLHeadingElement>(null);
  const run = useCallback(async (value: string) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const deadline = setTimeout(() => controller.abort(), 55000);
    setUrl(value);
    setBusy(true);
    setResult(null);
    setError('');
    setElapsed(0);
    try {
      const found = await discover(value.trim(), controller.signal);
      if (active.current === controller) setResult(found);
      return found;
    } catch (cause) {
      if (active.current === controller)
        setError(
          controller.signal.aborted
            ? 'The scan timed out. Try the direct documentation URL or scan again.'
            : cause instanceof Error
              ? cause.message
              : 'The scan could not finish.',
        );
      throw cause;
    } finally {
      clearTimeout(deadline);
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }, []);
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => () => active.current?.abort(), []);
  useEffect(() => {
    if (result) heading.current?.focus();
  }, [result]);
  useEffect(
    () =>
      registerPageTool({
        name: 'discover_agentic_site',
        title: 'Generate Agentic files from a website',
        description:
          'Read public website documentation, OpenAPI, llms.txt and advertised MCP links, then generate agentic.txt and agentic.json. Does not invoke tools or execute actions.',
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string', maxLength: 2048 } },
          required: ['url'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: (input) => {
          if (
            !input ||
            typeof input !== 'object' ||
            typeof (input as { url?: unknown }).url !== 'string'
          )
            throw new Error('Provide a website URL.');
          return run((input as { url: string }).url);
        },
      }),
    [run],
  );
  return (
    <section className="website-generator" aria-label="Generate from a website">
      <form
        className="audit-form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(url).catch(() => {});
        }}
      >
        <label className="field-label" htmlFor="generate-website">
          Your website
        </label>
        <div className="audit-input-row">
          <Input
            id="generate-website"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setResult(null);
              setError('');
            }}
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://yourwebsite.com"
            maxLength={2048}
            required
            disabled={busy}
            aria-describedby="website-help"
            aria-invalid={!!error}
          />
          <Button type="submit" disabled={busy || !url.trim()}>
            {busy ? 'Generating…' : 'Generate files'}
          </Button>
        </div>
        <p id="website-help" className="field-help">
          We read your public website, documentation, OpenAPI, llms.txt, and
          advertised agent connections. No API key or account needed.
        </p>
      </form>
      {busy && (
        <div className="scan-progress" role="status">
          <span className="scan-indicator" aria-hidden="true" />
          <div>
            <strong>Reading public sources and generating your files</strong>
            <p>
              <span aria-hidden="true">{elapsed}s elapsed. </span>The scan can
              take up to 45 seconds.
            </p>
          </div>
        </div>
      )}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {!result && !busy && !error && (
        <p className="audit-scope">
          The files use the information we find on your site. Public connection
          links are included; no tools or actions are run.
        </p>
      )}
      {result && (
        <div className="discovery-result">
          <h2 ref={heading} tabIndex={-1}>
            {result.mode === 'action'
              ? 'Your published action profile is ready.'
              : 'Your Agentic files are ready.'}
          </h2>
          <p className="audit-target">{result.origin}</p>
          <p className="muted">
            {result.mode === 'site'
              ? 'These files describe your public documentation, APIs, and agent connections. They do not claim request recovery behavior that your site has not published.'
              : 'We preserved your existing action contract and generated its TXT index, README, and listing text.'}
          </p>
          <div className="discovery-summary">
            {[
              'documentation',
              'openapi',
              'llms',
              'mcp',
              'a2a',
              'agent-auth',
            ].map((kind) => {
              const count = result.sources.filter(
                (source) => source.kind === kind,
              ).length;
              return count ? (
                <span key={kind}>
                  {kind === 'openapi'
                    ? 'OpenAPI'
                    : kind === 'llms'
                      ? 'llms.txt'
                      : kind === 'mcp'
                        ? 'MCP'
                        : kind === 'a2a'
                          ? 'A2A'
                          : kind === 'agent-auth'
                            ? 'Agent Auth'
                            : 'Docs'}{' '}
                  <strong>{count}</strong>
                </span>
              ) : null;
            })}
            {'apis' in result.profile && result.profile.apis.length > 0 && (
              <span>
                API operations{' '}
                <strong>
                  {result.profile.apis.reduce(
                    (total, api) => total + api.operations.length,
                    0,
                  )}
                </strong>
              </span>
            )}
          </div>
          {result.notes.length > 0 && (
            <div className="notice">
              <ul>
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          <FilePair files={result.files} />
          <details className="disclosure">
            <summary>Sources found · {result.sources.length}</summary>
            <p>
              “Read” means the public document was retrieved. “Linked” means a
              source advertised it; the connection was not tested.
            </p>
            <ul className="discovery-sources">
              {result.sources.map((source) => (
                <li key={source.kind + source.url}>
                  <span>
                    {source.kind} ·{' '}
                    {source.availability === 'retrieved' ? 'Read' : 'Linked'}
                  </span>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.url}
                  </a>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              onClick={() =>
                saveFile(
                  'agentic-discovery-report.json',
                  JSON.stringify(result, null, 2) + '\n',
                  'application/json',
                )
              }
            >
              Download discovery report
            </Button>
          </details>
          <details className="disclosure">
            <summary>Scan details</summary>
            <p>{result.limitation}</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {result.observations.map((item, i) => (
                    <tr key={i}>
                      <td>{item.url}</td>
                      <td>{item.error || item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
