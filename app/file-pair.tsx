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
  files: {
    'agentic.txt': string;
    'agentic.json': string;
    'README.md'?: string;
    'LISTING.md'?: string;
  };
  disabled?: boolean;
}) {
  const [message, setMessage] = useState('');
  const names = (
    ['agentic.txt', 'agentic.json', 'README.md', 'LISTING.md'] as const
  ).filter((name) => typeof files[name] === 'string');
  const descriptions = {
    'agentic.txt': files['agentic.txt'].includes('Agentic-Text: 1.2')
      ? 'A readable index with Agentic specification and RUAGENTIC directory references.'
      : 'A readable index generated from the JSON profile.',
    'agentic.json': 'Structured information for supporting agents and tools.',
    'README.md':
      'Ready-to-use service documentation, publication instructions, and both project references. Merge it into your existing README.',
    'LISTING.md':
      'Reusable title, descriptions, and links for directory listings. Review provider-specific requirements before submitting.',
  };
  return (
    <section className="file-pair-section" aria-label="Agentic files">
      <div className="file-pair">
        {names.map((name) => (
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
                      await navigator.clipboard.writeText(files[name]!);
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
                      files[name]!,
                      name.endsWith('.json')
                        ? 'application/json'
                        : name.endsWith('.md')
                          ? 'text/markdown;charset=utf-8'
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
            <p className="file-purpose">{descriptions[name]}</p>
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
                names.map((name) => [name, strToU8(files[name]!)]),
              ),
            );
            saveFile('agentic-files.zip', archive, 'application/zip');
            setMessage(
              'Downloaded ' + names.join(', ') + ' in agentic-files.zip.',
            );
          }}
        >
          <Download size={16} />
          {names.length > 2
            ? 'Download publication files'
            : 'Download both files'}
        </Button>
        <p className="small muted" role="status">
          {message ||
            (names.length > 2
              ? 'Includes JSON, TXT, README.md, and listing text. Review the README before merging it.'
              : 'Generated together. Keep them together when you publish.')}
        </p>
      </div>
    </section>
  );
}
