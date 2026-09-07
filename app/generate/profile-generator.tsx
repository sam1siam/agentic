'use client';
import { useEffect, useState } from 'react';
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
import { registerPageTool } from '@/lib/webmcp';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DiscoveryGenerator from './discovery-generator';

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
  useEffect(
    () =>
      registerPageTool({
        name: 'generate_agentic_profile',
        title: 'Generate an Agentic profile',
        description:
          'Generate a ticket-contract profile for an HTTPS origin. Returns JSON without downloading, submitting, or changing the page.',
        inputSchema: {
          type: 'object',
          properties: { origin: { type: 'string' } },
          required: ['origin'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: (input) => {
          if (
            !input ||
            typeof input !== 'object' ||
            typeof (input as { origin?: unknown }).origin !== 'string'
          )
            throw new Error('Provide an HTTPS origin.');
          const result = buildProfile({
            ...starterSettings,
            origin: (input as { origin: string }).origin,
          });
          const checked = validateProfile(result);
          return checked.valid
            ? { profile: result, validation: checked }
            : { validation: checked };
        },
      }),
    [],
  );
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
          Generate your <span>agent files.</span>
        </h1>
        <p>
          Create an action profile or companion discovery files. Edit, copy, and
          download locally. Your inputs stay in this browser.
        </p>
      </div>
      <Tabs defaultValue="profile" className="generator-tabs">
        <TabsList aria-label="Generator type">
          <TabsTrigger value="profile">Action profile</TabsTrigger>
          <TabsTrigger value="discovery">Discovery files</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
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
                implement the advertised tracking, status, and evidence
                behavior.
              </p>
              <div className="field-grid">{fields(basics)}</div>
              <h2 className="generator-subheading">Bindings and evidence</h2>
              <p className="small">
                JSON Pointers select values in the response. This starter
                matches one input field; add more in the JSON when your action
                needs them.
              </p>
              <div className="field-grid">{fields(evidence)}</div>
            </section>
            <section className="generator-preview">
              <div className="code-title">
                <span>agentic.json</span>
                <span>
                  {report.valid ? 'Structure valid' : 'Needs changes'}
                </span>
              </div>
              <pre
                className="code-block"
                tabIndex={0}
                aria-label="Generated agentic.json"
              >
                {json}
              </pre>
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
                Next, validate this profile with your OpenAPI file. Then run the
                service tests to check request tracking and recovery.
              </div>
              <div className="doc-utilities">
                <Link href="/validate">Open the validator →</Link>
                <Link href="/docs#quickstart">Implementation guide →</Link>
                <a href="/generate/index.md">Read as Markdown ↗</a>
              </div>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="discovery">
          <DiscoveryGenerator />
        </TabsContent>
      </Tabs>
      <section className="example-section" id="protocols">
        <h2>What is connected today?</h2>
        <p className="muted">
          Agentic describes request recovery. These protocols provide other
          parts of an agent integration.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Available here</th>
                <th>What remains</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MCP</td>
                <td>Runnable local tool server</td>
                <td>
                  Connect a host using the setup guide; no public MCP endpoint.
                </td>
              </tr>
              <tr>
                <td>WebMCP</td>
                <td>Generator, validator, and lab page tools</td>
                <td>Requires a browser with a supported WebMCP API.</td>
              </tr>
              <tr>
                <td>A2A</td>
                <td>AgentCard discovery declaration generator</td>
                <td>No hosted A2A agent or task transport.</td>
              </tr>
              <tr>
                <td>Agent Auth</td>
                <td>Discovery declaration generator and setup guide</td>
                <td>No identity, grant, approval, or revocation service.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="doc-utilities">
          <a href="/docs/PROTOCOLS.md">Connect protocols →</a>
        </div>
      </section>
    </main>
  );
}
