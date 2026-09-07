'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Copy, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildProfile,
  starterSettings,
  type StarterSettings,
} from '@/lib/profile-generator';
import { validateProfile } from '@/lib/validation';

const basics: [keyof StarterSettings, string][] = [
  ['origin', 'Service origin'],
  ['actionId', 'Action ID'],
  ['description', 'Action description'],
  ['openapi', 'OpenAPI path'],
  ['submit', 'Submit operation ID'],
  ['status', 'Status operation ID'],
  ['verify', 'Resource-read operation ID'],
  ['retentionSeconds', 'Tracking window (seconds)'],
];
const evidence: [keyof StarterSettings, string][] = [
  ['statusRequestId', 'Status path parameter'],
  ['verifyResourceId', 'Resource path parameter'],
  ['resourceIdPointer', 'Resource ID pointer'],
  ['requestIdPointer', 'Request ID pointer'],
  ['statePointer', 'Resource state pointer'],
  ['successValues', 'Successful states (comma-separated)'],
  ['inputPointer', 'Input evidence pointer'],
  ['resourcePointer', 'Matching resource pointer'],
];
export default function ProfileGenerator() {
  const [settings, setSettings] = useState({ ...starterSettings });
  const [message, setMessage] = useState('');
  const profile = buildProfile(settings);
  const report = validateProfile(profile);
  const json = JSON.stringify(profile, null, 2);
  function fields(items: typeof basics) {
    return items.map(([key, label]) => (
      <div key={key} className={key === 'description' ? 'full-width' : ''}>
        <label className="field-label" htmlFor={'generator-' + key}>
          {label}
        </label>
        <Input
          id={'generator-' + key}
          value={settings[key]}
          type={key === 'retentionSeconds' ? 'number' : 'text'}
          spellCheck={false}
          onChange={(e) => {
            setSettings({ ...settings, [key]: e.target.value });
            setMessage('');
          }}
        />
      </div>
    ));
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([json + '\n'], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'agentic.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      'Profile downloaded. Validate it with your service’s OpenAPI document next.',
    );
  }
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Developer tools / generate</p>
        <h1>
          Build your <span>agentic.json.</span>
        </h1>
        <p>
          Start from the ticket contract, adjust the bindings, and download a
          profile. Your inputs stay in this browser.
        </p>
      </div>
      <div className="two-col">
        <section className="panel generator-form">
          <div className="section-head">
            <h2>One action to start</h2>
            <Button
              variant="ghost"
              onClick={() => {
                setSettings({ ...starterSettings });
                setMessage('Starter restored.');
              }}
            >
              <RotateCcw size={15} />
              Reset
            </Button>
          </div>
          <p className="small">
            Use an HTTPS origin with no trailing slash. Your service must
            implement the advertised tracking, status, and evidence behavior.
          </p>
          <div className="field-grid">{fields(basics)}</div>
          <h2 style={{ marginTop: 30 }}>Bindings and evidence</h2>
          <p className="small">
            JSON Pointers select values in the response. This starter matches
            one input field; add more in the JSON when your action needs them.
          </p>
          <div className="field-grid">{fields(evidence)}</div>
        </section>
        <section className="generator-preview">
          <div className="code-title">
            <span>agentic.json</span>
            <span>{report.valid ? 'Structure valid' : 'Needs changes'}</span>
          </div>
          <pre className="code-block">{json}</pre>
          {!report.valid && (
            <ul className="error-list" aria-live="polite">
              {report.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
          <div className="actions">
            <Button disabled={!report.valid} onClick={download}>
              <Download size={16} />
              Download JSON
            </Button>
            <Button
              variant="outline"
              disabled={!report.valid}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(json);
                  setMessage('Copied to clipboard.');
                } catch {
                  setMessage(
                    'Clipboard unavailable. Select the JSON above or use Download JSON.',
                  );
                }
              }}
            >
              <Copy size={16} />
              Copy
            </Button>
          </div>
          <p className="small muted" role="status">
            {message}
          </p>
          <div className="notice">
            These checks cover the profile structure. Use the validator with
            your OpenAPI file to check operation bindings; test the service to
            confirm its behavior.
          </div>
          <div className="doc-utilities">
            <Link href="/validate">Open the validator →</Link>
            <Link href="/docs#quickstart">Implementation guide →</Link>
            <a href="/generate/index.md">Read as Markdown ↗</a>
          </div>
        </section>
      </div>
    </main>
  );
}
