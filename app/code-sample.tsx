import { Fragment } from 'react';

export function CodeSample({
  value,
  className = '',
}: {
  value: unknown;
  className?: string;
}) {
  const json =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const chunks = json.split(
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null|\d+)\b)/g,
  );
  return (
    <pre
      className={'code-block ' + className}
      tabIndex={0}
      aria-label="Code example"
    >
      <code>
        {chunks.map((chunk, i) => {
          const kind = /^".*":\s*$/.test(chunk)
            ? 'code-key'
            : chunk.startsWith('"')
              ? 'code-string'
              : /^(true|false|null|\d+)$/.test(chunk)
                ? 'code-number'
                : '';
          return kind ? (
            <span key={i} className={kind}>
              {chunk}
            </span>
          ) : (
            <Fragment key={i}>{chunk}</Fragment>
          );
        })}
      </code>
    </pre>
  );
}
