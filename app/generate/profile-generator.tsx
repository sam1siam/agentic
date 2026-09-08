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
import { profileFiles } from '@/lib/action-index';
import { zipSync, strToU8 } from 'fflate';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DocumentationGenerator from './documentation-generator';
import OpenapiImport from './openapi-import';

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
  const [file, setFile] = useState('agentic.json');
  const profile = buildProfile(settings);
  const report = validateProfile(profile);
  const json = JSON.stringify(profile, null, 2);
  const files = report.valid ? profileFiles(profile) : null;
  const selected =
    file === 'agentic.json' ? json : (files?.['agentic.txt'] ?? '');
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
            ? {
                profile: result,
                files: profileFiles(result),
                validation: checked,
              }
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
      new Blob([selected.endsWith('\n') ? selected : selected + '\n'], {
        type: file === 'agentic.json' ? 'application/json' : 'text/plain',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(file + ' downloaded. The JSON profile remains authoritative.');
  }
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Developer tools / generate</p>
        <h1>
          Generate your <span>agent files.</span>
        </h1>
        <p>
          Create an action profile or an optional documentation index. Edit,
          copy, and download locally. Your inputs stay in this browser.
        </p>
      </div>
      <Tabs defaultValue="profile" className="generator-tabs">
        <TabsList aria-label="Generator type">
          <TabsTrigger value="profile">Action profile</TabsTrigger>
          <TabsTrigger value="documentation">Documentation index</TabsTrigger>
          <TabsTrigger value="openapi">Import OpenAPI</TabsTrigger>
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
            <section className="generator-output">
              <div className="code-title">
                <span>Generated action files</span>
                <span>
                  {report.valid ? 'Structure valid' : 'Needs changes'}
                </span>
              </div>
              <Tabs value={file} onValueChange={setFile} className="file-tabs">
                <TabsList aria-label="Generated action file">
                  <TabsTrigger value="agentic.json">agentic.json</TabsTrigger>
                  <TabsTrigger value="agentic.txt">agentic.txt</TabsTrigger>
                </TabsList>
                <TabsContent value="agentic.json">
                  <pre
                    className="code-block"
                    tabIndex={0}
                    aria-label="Generated agentic.json"
                  >
                    {json}
                  </pre>
                </TabsContent>
                <TabsContent value="agentic.txt">
                  <pre
                    className="code-block"
                    tabIndex={0}
                    aria-label="Generated agentic.txt"
                  >
                    {files?.['agentic.txt'] ??
                      'Complete a valid profile to generate its action index.'}
                  </pre>
                </TabsContent>
              </Tabs>
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
                  Download {file === 'agentic.json' ? 'JSON' : 'TXT'}
                </Button>
                <Button
                  variant="outline"
                  disabled={!report.valid}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(selected);
                      setMessage('Copied to clipboard.');
                    } catch {
                      setMessage(
                        'Clipboard unavailable. Select the text above or use Download.',
                      );
                    }
                  }}
                >
                  <Copy size={16} />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  disabled={!files}
                  onClick={() => {
                    if (!files) return;
                    const zipped = zipSync(
                      Object.fromEntries(
                        Object.entries(files).map(([name, value]) => [
                          name,
                          strToU8(value),
                        ]),
                      ),
                    );
                    const url = URL.createObjectURL(
                      new Blob([new Uint8Array(zipped)], {
                        type: 'application/zip',
                      }),
                    );
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = 'agentic-files.zip';
                    anchor.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    setMessage('Downloaded agentic.json and agentic.txt.');
                  }}
                >
                  <Download size={16} />
                  Download both
                </Button>
              </div>
              <p className="small muted" role="status">
                {message}
              </p>
              <div className="notice">
                agentic.txt summarizes this JSON profile. Validate the JSON with
                your OpenAPI file, then run the service tests to check request
                tracking and recovery.
              </div>
              <div className="doc-utilities">
                <Link href="/validate">Open the validator →</Link>
                <Link href="/docs#quickstart">Implementation guide →</Link>
                <a href="/generate/index.md">Read as Markdown ↗</a>
                <a href="/docs/AGENTIC-TXT.md">About agentic.txt →</a>
              </div>
            </section>
          </div>
        </TabsContent>
        <TabsContent value="documentation">
          <DocumentationGenerator />
        </TabsContent>
        <TabsContent value="openapi">
          <OpenapiImport />
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
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MCP</td>
                <td>Public HTTP and local stdio tool servers</td>
                <td>
                  Specification, generation, validation, and read-only URL
                  audits.
                </td>
              </tr>
              <tr>
                <td>WebMCP</td>
                <td>Generator, validator, and lab page tools</td>
                <td>Requires a browser with a supported WebMCP API.</td>
              </tr>
              <tr>
                <td>A2A</td>
                <td>Hosted testing agent and persistent tasks</td>
                <td>A2A 1.0 JSON-RPC with private sandbox credentials.</td>
              </tr>
              <tr>
                <td>Agent Auth</td>
                <td>Registration, signed execution, grants, and revocation</td>
                <td>Autonomous validation and isolated synthetic testing.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="doc-utilities">
          <Link href="/connect">Connect protocols →</Link>
        </div>
      </section>
    </main>
  );
}
