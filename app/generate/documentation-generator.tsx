'use client';
import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildDocumentation,
  documentationDefaults,
} from '@/lib/documentation-generator';

export default function DocumentationGenerator() {
  const [settings, setSettings] = useState({ ...documentationDefaults });
  const [message, setMessage] = useState('');
  let value = '';
  let error = '';
  try {
    value = buildDocumentation(settings)['llms.txt'];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Check your settings.';
  }
  return (
    <div className="two-col">
      <section className="panel generator-form">
        <h2>Describe your service</h2>
        <p className="small">
          Create an optional llms.txt index linking to your documentation and
          Agentic profile.
        </p>
        <div className="field-grid">
          {(['name', 'origin', 'description'] as const).map((key) => (
            <div className="full-width" key={key}>
              <label className="field-label" htmlFor={'documentation-' + key}>
                {
                  {
                    name: 'Service name',
                    origin: 'Service origin',
                    description: 'Description',
                  }[key]
                }
              </label>
              <Input
                id={'documentation-' + key}
                value={settings[key]}
                onChange={(e) => {
                  setSettings({ ...settings, [key]: e.target.value });
                  setMessage('');
                }}
              />
            </div>
          ))}
        </div>
      </section>
      <section className="generator-preview">
        <h2 className="output-heading">llms.txt</h2>
        {error ? (
          <p className="notice" role="alert">
            {error}
          </p>
        ) : (
          <>
            <pre className="code-block" tabIndex={0} aria-label="llms.txt">
              {value}
            </pre>
            <div className="actions">
              <Button
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([value], { type: 'text/plain' }),
                  );
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = 'llms.txt';
                  anchor.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setMessage('llms.txt downloaded.');
                }}
              >
                <Download size={16} />
                Download llms.txt
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(value);
                    setMessage('llms.txt copied.');
                  } catch {
                    setMessage('Clipboard unavailable. Use Download instead.');
                  }
                }}
              >
                <Copy size={16} />
                Copy
              </Button>
            </div>
          </>
        )}
        <p className="small muted" role="status">
          {message}
        </p>
        <div className="notice">
          This starter assumes /docs/ and /agentic.json exist on your service.
          Edit the links to match your published files. A documentation index
          does not enable protocols or grant permission to execute actions.
        </div>
        <div className="doc-utilities">
          <a href="/docs/GENERATOR.md">Generator guide →</a>
          <a href="/connect/">Protocol connections →</a>
        </div>
      </section>
    </div>
  );
}
