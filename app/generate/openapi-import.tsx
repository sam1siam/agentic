'use client';
import { useState } from 'react';
import { zipSync, strToU8 } from 'fflate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  importBundle,
  listOperations,
  starterSettings,
} from '@/lib/openapi-import';

export default function OpenapiImport() {
  const [text, setText] = useState(''),
    [settings, setSettings] = useState({ ...starterSettings }),
    [message, setMessage] = useState('');
  let operations: ReturnType<typeof listOperations> = [],
    bundle: ReturnType<typeof importBundle> | undefined,
    error = '';
  try {
    if (text) {
      const api = JSON.parse(text);
      operations = listOperations(api);
      bundle = importBundle(api, settings);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Invalid JSON.';
  }
  const fields = [
    ['origin', 'Service origin'],
    ['actionId', 'Action ID'],
    ['openapi', 'OpenAPI serving path'],
    ['resourceIdPointer', 'Resource ID pointer'],
    ['requestIdPointer', 'Request ID pointer'],
    ['statePointer', 'State pointer'],
    ['successValues', 'Successful states'],
    ['inputPointer', 'Input evidence pointer'],
    ['resourcePointer', 'Matching resource pointer'],
    ['retentionSeconds', 'Tracking window (seconds)'],
  ] as const;
  return (
    <div className="two-col">
      <section className="panel generator-form">
        <h2>Import your OpenAPI document</h2>
        <p className="small">
          Choose the write, status lookup, and resource read. Confirm the
          evidence fields against your API. Files stay in this browser.
        </p>
        <label className="field-label" htmlFor="openapi-upload">
          OpenAPI 3.1 JSON file
        </label>
        <Input
          id="openapi-upload"
          type="file"
          accept=".json,application/json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 262144) {
              setMessage('Use a file smaller than 256 KiB.');
              return;
            }
            setText(await file.text());
            setMessage('Document imported. Select the three operations below.');
          }}
        />
        <label className="field-label" htmlFor="openapi-source">
          Or paste JSON
        </label>
        <Textarea
          id="openapi-source"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 262144))}
          rows={8}
          spellCheck={false}
          placeholder={'{"openapi":"3.1.0","paths":{...}}'}
        />
        {error && (
          <p role="alert" className="error-list">
            {error}
          </p>
        )}
        <div className="field-grid">
          {(['submit', 'status', 'verify'] as const).map((key) => (
            <div key={key} className="full-width">
              <label className="field-label" htmlFor={'operation-' + key}>
                {key === 'submit'
                  ? 'Submit once (POST)'
                  : key === 'status'
                    ? 'Look up the request (GET)'
                    : 'Read the resource (GET)'}
              </label>
              <select
                className="platform-select"
                id={'operation-' + key}
                value={settings[key]}
                onChange={(e) => {
                  const chosen = operations.find(
                    (o) => o.id === e.target.value,
                  );
                  setSettings({
                    ...settings,
                    [key]: e.target.value,
                    ...(key === 'status' && chosen?.parameters.length === 1
                      ? { statusRequestId: chosen.parameters[0] }
                      : {}),
                    ...(key === 'verify' && chosen?.parameters.length === 1
                      ? { verifyResourceId: chosen.parameters[0] }
                      : {}),
                  });
                }}
              >
                <option value="">Select an operation</option>
                {operations
                  .filter(
                    (o) => o.method === (key === 'submit' ? 'POST' : 'GET'),
                  )
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} · {o.path}
                    </option>
                  ))}
              </select>
            </div>
          ))}
          {fields.map(([key, label]) => (
            <div key={key}>
              <label className="field-label" htmlFor={'import-' + key}>
                {label}
              </label>
              <Input
                id={'import-' + key}
                value={settings[key]}
                onChange={(e) =>
                  setSettings({ ...settings, [key]: e.target.value })
                }
              />
            </div>
          ))}
        </div>
      </section>
      <section className="generator-preview">
        <div className="code-title">
          <span>Starter bundle</span>
          <span>
            {bundle?.validation.valid ? 'Bindings valid' : 'Review required'}
          </span>
        </div>
        <pre className="code-block" tabIndex={0}>
          {bundle
            ? JSON.stringify(bundle.profile, null, 2)
            : 'Import an OpenAPI document to begin.'}
        </pre>
        {bundle && !bundle.validation.valid && (
          <ul className="error-list">
            {bundle.validation.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <div className="actions">
          <Button
            disabled={!bundle?.validation.valid}
            onClick={() => {
              if (!bundle) return;
              const zipped = zipSync(
                Object.fromEntries(
                  Object.entries(bundle.files).map(([name, value]) => [
                    name,
                    strToU8(value),
                  ]),
                ),
              );
              const url = URL.createObjectURL(
                new Blob([new Uint8Array(zipped)], { type: 'application/zip' }),
              );
              const a = document.createElement('a');
              a.href = url;
              a.download = 'agentic-starter.zip';
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setMessage(
                'Downloaded agentic.json, openapi.json and the implementation checklist.',
              );
            }}
          >
            Download starter ZIP
          </Button>
        </div>
        <p role="status" className="small muted">
          {message}
        </p>
        <div className="notice">
          Import binds existing operations. Your service still needs to
          implement the advertised tracking window, status contract, and
          evidence behavior.
        </div>
      </section>
    </div>
  );
}
