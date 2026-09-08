'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import FilePair from '../file-pair';
import OpenapiImport from './openapi-import';
import DocumentationGenerator from './documentation-generator';
import WebsiteGenerator from './website-generator';
const apiFields: [keyof StarterSettings, string, string][] = [
  ['openapi', 'OpenAPI file path', 'For example, /openapi.json'],
  [
    'submit',
    'Create action · operation ID',
    'The POST operation that performs the action.',
  ],
  [
    'status',
    'Check request · operation ID',
    'The GET operation that looks up the original request.',
  ],
  [
    'verify',
    'Read result · operation ID',
    'The GET operation that returns the created resource.',
  ],
  [
    'retentionSeconds',
    'Request tracking · seconds',
    'How long your service remembers a request ID.',
  ],
  [
    'statusRequestId',
    'Request ID parameter',
    'The parameter in your request-status URL.',
  ],
  [
    'verifyResourceId',
    'Resource ID parameter',
    'The parameter in your resource URL.',
  ],
  ['resourceIdPointer', 'Resource ID field', 'JSON Pointer, for example /id.'],
  [
    'requestIdPointer',
    'Original request ID field',
    'JSON Pointer, for example /request_id.',
  ],
  ['statePointer', 'Result status field', 'JSON Pointer, for example /status.'],
  [
    'successValues',
    'Successful status values',
    'Separate multiple values with commas.',
  ],
  [
    'inputPointer',
    'Input field to match',
    'JSON Pointer, for example /subject.',
  ],
  [
    'resourcePointer',
    'Matching result field',
    'JSON Pointer, for example /subject.',
  ],
];
export default function ProfileGenerator() {
  const [settings, setSettings] = useState({ ...starterSettings });
  const [mode, setMode] = useState<'setup' | 'import'>('setup');
  const profile = buildProfile(settings);
  const validation = validateProfile(profile);
  const files = validation.valid
    ? profileFiles(profile)
    : {
        'agentic.json': JSON.stringify(profile, null, 2) + '\n',
        'agentic.txt':
          'Complete the required settings to generate your action index.\n',
      };
  useEffect(
    () =>
      registerPageTool({
        name: 'generate_agentic_profile',
        title: 'Create an action-profile template',
        description:
          'Create agentic.txt and agentic.json for an HTTPS service. Returns files without uploading data or calling the service.',
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
            throw new Error('Provide an HTTPS service URL.');
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
  function field(key: keyof StarterSettings, label: string, help?: string) {
    const invalid =
      key === 'origin' &&
      !validation.valid &&
      validation.errors.some((error) => /origin/i.test(error));
    return (
      <div key={key} className={key === 'description' ? 'full-width' : ''}>
        <label className="field-label" htmlFor={'generator-' + key}>
          {label}
        </label>
        <Input
          id={'generator-' + key}
          value={settings[key]}
          type={key === 'retentionSeconds' ? 'number' : 'text'}
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={
            [
              help ? 'help-' + key : '',
              !validation.valid ? 'generator-errors' : '',
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              [key]: event.target.value,
            }))
          }
        />
        {help && (
          <p id={'help-' + key} className="field-help">
            {help}
          </p>
        )}
      </div>
    );
  }
  return (
    <main className="page wrap simple-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">Generate</p>
        <h1>
          Generate files for <span>your website.</span>
        </h1>
        <p>
          Enter your website. We find its public docs, APIs, and agent
          connections, then create agentic.txt and agentic.json for you.
        </p>
      </div>
      <WebsiteGenerator />
      <details className="disclosure advanced-generator">
        <summary>
          Advanced: configure an action or import OpenAPI yourself
        </summary>
        <p>
          Use these tools when you are implementing an action recovery contract.
          The example values belong to a support-ticket API; changing its URL
          does not configure your service.
        </p>
        <div className="mode-controls" aria-label="Generation method">
          <Button
            variant={mode === 'setup' ? 'default' : 'outline'}
            aria-pressed={mode === 'setup'}
            onClick={() => setMode('setup')}
          >
            Start from an example
          </Button>
          <Button
            variant={mode === 'import' ? 'default' : 'outline'}
            aria-pressed={mode === 'import'}
            onClick={() => setMode('import')}
          >
            Import OpenAPI
          </Button>
        </div>
        {mode === 'import' ? (
          <OpenapiImport />
        ) : (
          <>
            <section className="setup-section">
              <div className="section-head">
                <h2>1. Describe your action</h2>
                <Button
                  variant="ghost"
                  onClick={() => setSettings({ ...starterSettings })}
                >
                  Reset example
                </Button>
              </div>
              <p className="muted">
                This example creates a support ticket. Replace the details with
                your service’s values.
              </p>
              <div className="field-grid">
                {field(
                  'origin',
                  'Service URL',
                  'Use an HTTPS origin, such as https://api.yoursite.com. A trailing slash is accepted.',
                )}
                {field(
                  'actionId',
                  'Action ID',
                  'A short name such as create-ticket or create-order.',
                )}
                {field('description', 'What does the action do?')}
              </div>
              <details className="disclosure">
                <summary>API settings · operations and result fields</summary>
                <p>
                  Match these values to your OpenAPI 3.1 file. Agents need an
                  operation to perform the action, one to check the request, and
                  one to read the result.
                </p>
                <div className="field-grid">
                  {apiFields.map(([key, label, help]) =>
                    field(key, label, help),
                  )}
                </div>
              </details>
            </section>
            <section className="output-section">
              <h2>2. Download both files</h2>
              {!validation.valid && (
                <div
                  id="generator-errors"
                  className="inline-error"
                  role="alert"
                >
                  <p>Check these settings before downloading:</p>
                  <ul>
                    {validation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <FilePair files={files} disabled={!validation.valid} />
            </section>
          </>
        )}
      </details>
      <section className="publish-guide">
        <h2>Publish your files</h2>
        <p>
          Place both files in your site’s public folder, or serve them from your
          API. They should be available at <code>/agentic.txt</code> and{' '}
          <code>/agentic.json</code>. Review the discovered links, publish both
          files together, and audit the published JSON. Run the generator again
          when your documentation changes. For an existing profile at another
          path, preserve its location and the TXT file’s Profile URL, or
          regenerate TXT for your intended destination.
        </p>
        <div className="doc-utilities">
          <Link href="/audit">Audit your published files →</Link>
          <Link href="/spec">Read the format →</Link>
          <Link href="/validate">Validate a file →</Link>
        </div>
      </section>
      <details className="disclosure optional-index">
        <summary>Optional: create an llms.txt documentation index</summary>
        <DocumentationGenerator />
      </details>
    </main>
  );
}
