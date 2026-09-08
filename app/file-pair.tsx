'use client';
import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { zipSync, strToU8 } from 'fflate';
import { Button } from '@/components/ui/button';
export function saveFile(
  name: string,
  contents: string | Uint8Array,
  type: string,
) {
  const data =
    typeof contents === 'string' ? contents : new Uint8Array(contents);
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function FilePair({
  files,
  disabled = false,
}: {
  files: { 'agentic.txt': string; 'agentic.json': string };
  disabled?: boolean;
}) {
  const [message, setMessage] = useState('');
  return (
    <section className="file-pair-section" aria-label="Agentic files">
      <div className="file-pair">
        {(['agentic.txt', 'agentic.json'] as const).map((name) => (
          <article className="file-card" key={name}>
            <div className="file-card-heading">
              <h2>{name}</h2>
              <div className="file-card-actions">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  aria-label={'Copy ' + name}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(files[name]);
                      setMessage(name + ' copied.');
                    } catch {
                      setMessage(
                        'Copy is unavailable. Select the file text or download it.',
                      );
                    }
                  }}
                >
                  <Copy size={14} />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  aria-label={'Download ' + name}
                  onClick={() => {
                    saveFile(
                      name,
                      files[name],
                      name.endsWith('.json')
                        ? 'application/json'
                        : 'text/plain;charset=utf-8',
                    );
                    setMessage(name + ' downloaded.');
                  }}
                >
                  <Download size={14} />
                  <span className="file-download-label">Download</span>
                </Button>
              </div>
            </div>
            <p className="file-purpose">
              {name === 'agentic.txt'
                ? 'A readable index, with a link to the JSON.'
                : 'Structured information for supporting agents and tools.'}
            </p>
            <pre tabIndex={0} aria-label={'Contents of ' + name}>
              <code>{files[name]}</code>
            </pre>
          </article>
        ))}
      </div>
      <div className="pair-toolbar">
        <Button
          disabled={disabled}
          onClick={() => {
            const archive = zipSync(
              Object.fromEntries(
                Object.entries(files).map(([name, value]) => [
                  name,
                  strToU8(value),
                ]),
              ),
            );
            saveFile('agentic-files.zip', archive, 'application/zip');
            setMessage('Downloaded both files in agentic-files.zip.');
          }}
        >
          <Download size={16} />
          Download both files
        </Button>
        <p className="small muted" role="status">
          {message ||
            'Generated together. Keep them together when you publish.'}
        </p>
      </div>
    </section>
  );
}
