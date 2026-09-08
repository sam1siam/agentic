'use client';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Check, Copy, FileCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import sample from '@/examples/tickets/agentic.json';
import api from '@/examples/tickets/openapi.json';
import { validateAgenticDocument } from '@/lib/site-profile';
import { registerPageTool } from '@/lib/webmcp';
type Report = ReturnType<typeof validateAgenticDocument>;
/** Pure structural validation with the browser-side size limits. */
function runValidation(profileText: string, openapiText: string): Report {
  try {
    if (
      new TextEncoder().encode(profileText).length > 65536 ||
      new TextEncoder().encode(openapiText).length > 262144
    )
      throw new Error(
        'Profile limit: 64 KiB. OpenAPI document limit: 256 KiB.',
      );
    return validateAgenticDocument(
      JSON.parse(profileText),
      openapiText.trim() ? JSON.parse(openapiText) : undefined,
    );
  } catch (e) {
    return { valid: false, errors: [(e as Error).message], warnings: [] };
  }
}
export default function ProfileValidator() {
  const [text, setText] = useState(JSON.stringify(sample, null, 2)),
    [apiText, setApiText] = useState(JSON.stringify(api, null, 2)),
    [report, setReport] = useState<Report | null>(null),
    [copied, setCopied] = useState(false);
  // Only stable state setters are captured, so the page tool registers once.
  const validate = (profileText: string, openapiText: string) => {
    const result = runValidation(profileText, openapiText);
    flushSync(() => {
      setText(profileText);
      setApiText(openapiText);
      setReport(result);
    });
    return result;
  };
  useEffect(
    () =>
      registerPageTool({
        name: 'validate_agentic_profile',
        title: 'Validate an Agentic profile',
        description:
          'Check a pasted profile and optional OpenAPI document; display structural and binding results. Makes no network requests and invokes no operations.',
        inputSchema: {
          type: 'object',
          properties: {
            profile: { type: 'string', maxLength: 65536 },
            openapi: { type: 'string', maxLength: 262144 },
          },
          required: ['profile'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: (input) => {
          const value = input as { profile?: unknown; openapi?: unknown };
          if (
            !value ||
            typeof value.profile !== 'string' ||
            (value.openapi !== undefined &&
              typeof value.openapi !== 'string') ||
            Object.keys(value).some((k) => !['profile', 'openapi'].includes(k))
          )
            throw new Error('Expected profile text and optional OpenAPI text.');
          return validate(value.profile, (value.openapi as string) ?? '');
        },
      }),
    // eslint-style exhaustive deps are intentionally omitted: validate only
    // uses stable setters and a pure function.
    [],
  );
  const stale = () => setReport(null);
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Developer tools / structural validation</p>
        <h1>
          Are you <span>agentic?</span>
        </h1>
        <p>
          Check a site or action profile against its versioned schema. For
          action profiles, optionally check OpenAPI operation bindings.
          Everything stays in this browser.
        </p>
      </div>
      <div className="validator-grid">
        <section className="panel editor-panel">
          <Tabs defaultValue="profile">
            <div className="section-head">
              <TabsList variant="line">
                <TabsTrigger value="profile">agentic.json</TabsTrigger>
                <TabsTrigger value="api">openapi.json</TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                onClick={() => {
                  setText(JSON.stringify(sample, null, 2));
                  setApiText(JSON.stringify(api, null, 2));
                  stale();
                }}
              >
                <RotateCcw size={15} />
                Load example
              </Button>
            </div>
            <TabsContent value="profile">
              <label htmlFor="profile-json" className="sr-only">
                Agentic profile JSON
              </label>
              <Textarea
                id="profile-json"
                spellCheck={false}
                className="json-editor"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  stale();
                }}
              />
            </TabsContent>
            <TabsContent value="api">
              <label htmlFor="api-json" className="sr-only">
                Optional OpenAPI document JSON
              </label>
              <Textarea
                id="api-json"
                spellCheck={false}
                className="json-editor"
                value={apiText}
                onChange={(e) => {
                  setApiText(e.target.value);
                  stale();
                }}
              />
            </TabsContent>
          </Tabs>
          <div className="editor-actions">
            <Button
              className="run-button"
              onClick={() => validate(text, apiText)}
            >
              <FileCheck size={17} />
              Validate profile
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          </div>
        </section>
        <aside className="panel validation-result" aria-live="polite">
          <p className="eyebrow">Validation result</p>
          {report ? (
            <>
              <div
                className={
                  'validation-symbol ' +
                  (report.valid ? 'green' : 'warning-text')
                }
              >
                {report.valid ? '✓' : '×'}
              </div>
              <h2>
                {report.valid ? 'Structure checks out.' : 'Changes needed.'}
              </h2>
              <p>
                {report.valid
                  ? 'This profile passes the versioned schema and any supplied binding checks.'
                  : 'Resolve these errors, then validate again.'}
              </p>
              {report.errors.length > 0 && (
                <ul className="error-list">
                  {report.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
              {report.warnings.map((w, i) => (
                <p key={i} className="validation-warning">
                  {w}
                </p>
              ))}
            </>
          ) : (
            <>
              <div className="validation-symbol muted">⌁</div>
              <h2>Ready to check.</h2>
              <p>
                The ticket example is loaded. Edit it or paste your own profile,
                then run validation.
              </p>
            </>
          )}
          <div className="validation-links">
            <a href="/schemas/agentic-1.0.schema.json">
              Download JSON Schema ↗
            </a>
            <a href="/docs/SPEC.md">Read the specification ↗</a>
          </div>
        </aside>
      </div>
      <div className="notice">
        A valid profile is a declaration. Behavioral compatibility requires
        testing the service and client together. This tool does not verify
        endpoints, execute actions, grant authorization, or certify a service.
      </div>
    </main>
  );
}
