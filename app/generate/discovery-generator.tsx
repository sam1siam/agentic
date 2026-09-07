'use client';
import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { buildDiscovery, discoveryDefaults } from '@/lib/discovery-generator';

const protocols = [
  ['mcp', 'MCP', 'A running Streamable HTTP tool server.', '/mcp'],
  ['webmcp', 'WebMCP', 'A page that registers browser tools.', '/tools/'],
  [
    'a2a',
    'A2A',
    'An AgentCard describing a running agent.',
    '/.well-known/agent-card.json',
  ],
  [
    'auth',
    'Agent Auth',
    'Discovery for an implemented Agent Auth service.',
    '/.well-known/agent-configuration',
  ],
] as const;
export default function DiscoveryGenerator() {
  const [settings, setSettings] = useState({ ...discoveryDefaults });
  const [enabled, setEnabled] = useState({
    mcp: false,
    webmcp: false,
    a2a: false,
    auth: false,
  });
  const [message, setMessage] = useState('');
  let files: Record<string, string> = {};
  let error = '';
  try {
    files = buildDiscovery({
      ...settings,
      ...Object.fromEntries(
        protocols.map(([key]) => [
          key,
          enabled[key] ? settings[key] || ' ' : '',
        ]),
      ),
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Check your settings.';
  }
  return (
    <div className="two-col">
      <section className="panel generator-form">
        <h2>Describe your service</h2>
        <p className="small">
          Create companion discovery files. Publish only the capabilities your
          service already provides.
        </p>
        <div className="field-grid">
          {(['name', 'origin', 'description'] as const).map((key) => (
            <div className="full-width" key={key}>
              <label className="field-label" htmlFor={'discovery-' + key}>
                {
                  {
                    name: 'Service name',
                    origin: 'Service origin',
                    description: 'Description',
                  }[key]
                }
              </label>
              <Input
                id={'discovery-' + key}
                value={settings[key]}
                onChange={(e) => {
                  setSettings({ ...settings, [key]: e.target.value });
                  setMessage('');
                }}
              />
            </div>
          ))}
        </div>
        <h2 className="generator-subheading">Optional protocols</h2>
        <div className="protocol-options">
          {protocols.map(([key, label, help, path]) => (
            <div className="protocol-option" key={key}>
              <label className="protocol-toggle" htmlFor={'enable-' + key}>
                <Checkbox
                  id={'enable-' + key}
                  checked={enabled[key]}
                  onCheckedChange={(checked) => {
                    setEnabled({ ...enabled, [key]: checked });
                    if (checked && !settings[key])
                      setSettings({
                        ...settings,
                        [key]: settings.origin + path,
                      });
                    setMessage('');
                  }}
                />
                <span>{label}</span>
              </label>
              <p className="field-help">{help}</p>
              {enabled[key] && (
                <div className="protocol-endpoint">
                  <label className="field-label" htmlFor={'endpoint-' + key}>
                    {label === 'A2A' ? 'AgentCard' : label} URL
                  </label>
                  <Input
                    id={'endpoint-' + key}
                    value={settings[key]}
                    onChange={(e) => {
                      setSettings({ ...settings, [key]: e.target.value });
                      setMessage('');
                    }}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="generator-preview">
        <h2 className="output-heading">Generated files</h2>
        {error ? (
          <p className="notice" role="alert">
            {error}
          </p>
        ) : (
          <Tabs defaultValue="agents.txt" className="file-tabs">
            <TabsList>
              {Object.keys(files).map((name) => (
                <TabsTrigger key={name} value={name}>
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(files).map(([name, value]) => (
              <TabsContent value={name} key={name}>
                <pre className="code-block" tabIndex={0} aria-label={name}>
                  {value}
                </pre>
                <div className="actions">
                  <Button
                    onClick={() => {
                      const url = URL.createObjectURL(
                        new Blob([value], {
                          type: name.endsWith('.json')
                            ? 'application/json'
                            : 'text/plain',
                        }),
                      );
                      const anchor = document.createElement('a');
                      anchor.href = url;
                      anchor.download = name;
                      anchor.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                      setMessage(name + ' downloaded.');
                    }}
                  >
                    <Download size={16} />
                    Download {name}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(value);
                        setMessage(name + ' copied.');
                      } catch {
                        setMessage(
                          'Clipboard unavailable. Use Download instead.',
                        );
                      }
                    }}
                  >
                    <Copy size={16} />
                    Copy
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
        <p className="small muted" role="status">
          {message}
        </p>
        <div className="notice">
          These files declare endpoints; they do not create servers or enable
          authentication. Check the URLs before publishing. The llms.txt starter
          assumes you will publish /docs/ and /agentic.json.
        </div>
        <div className="doc-utilities">
          <a href="/docs/PROTOCOLS.md">Protocol setup and status →</a>
          <a href="https://agents-txt.com/demo/generate/">
            agents.txt reference generator ↗
          </a>
        </div>
      </section>
    </div>
  );
}
