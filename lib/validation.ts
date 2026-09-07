import compiled from './generated/agentic.js';
import receiptCompiled from './generated/receipt.js';
import type { Profile, Operation, Json } from './types.ts';
const validator = compiled as unknown as ((value: unknown) => boolean) & {
  errors?: { instancePath?: string; message?: string; params?: unknown }[];
};

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error('Expected a JSON value.');
    return encoded;
  }
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return (
    '{' +
    Object.keys(value)
      .sort()
      .map(
        (key) =>
          JSON.stringify(key) +
          ':' +
          canonical((value as Record<string, unknown>)[key]),
      )
      .join(',') +
    '}'
  );
}
export function pointer(value: unknown, path: string): unknown {
  let current: unknown = value;
  for (const token of path
    .slice(1)
    .split('/')
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !Object.hasOwn(current, token)
    )
      return undefined;
    current = (current as Record<string, unknown>)[token];
  }
  return current;
}
export function safeOrigin(value: string, allowLocal = false): string {
  const u = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
  if (
    u.origin !== value ||
    u.username ||
    u.password ||
    (u.protocol !== 'https:' &&
      !(allowLocal && local && u.protocol === 'http:'))
  )
    throw new Error(
      'Use a canonical HTTPS origin. HTTP is allowed only for explicit loopback development.',
    );
  return u.origin;
}
export function safePath(path: string): void {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\\\\?#%]/.test(path) ||
    path.split('/').some((s) => s === '.' || s === '..')
  )
    throw new Error(
      'Paths must be same-origin root-relative paths without traversal, queries, fragments, backslashes, or escapes.',
    );
}
export function operation(document: unknown, id: string): Operation {
  const doc = document as {
    openapi?: string;
    paths?: Record<string, Record<string, unknown>>;
    servers?: unknown[];
  };
  if (
    !doc ||
    typeof doc.openapi !== 'string' ||
    !doc.openapi.startsWith('3.1.') ||
    !doc.paths
  )
    throw new Error(
      'The initial binding requires OpenAPI 3.1 with inline operations.',
    );
  if (doc.servers?.length)
    throw new Error('The initial binding does not allow server overrides.');
  const matches: Operation[] = [];
  for (const [path, item] of Object.entries(doc.paths)) {
    for (const method of ['get', 'post']) {
      const raw = item[method] as
        | {
            operationId?: string;
            parameters?: Operation['parameters'];
            servers?: unknown[];
            requestBody?: { content?: Record<string, unknown> };
          }
        | undefined;
      if (raw?.operationId === id) {
        safePath(path);
        if (item.parameters || raw.servers?.length || item.servers)
          throw new Error(
            'Use inline operation parameters and no server overrides.',
          );
        matches.push({
          method: method.toUpperCase() as 'GET' | 'POST',
          path,
          parameters: raw.parameters,
          jsonBody: Boolean(raw.requestBody?.content?.['application/json']),
        });
      }
    }
  }
  if (matches.length !== 1)
    throw new Error('Operation ' + id + ' must resolve exactly once.');
  return matches[0];
}
export function validateProfile(
  value: unknown,
  document?: unknown,
  allowLocal = false,
): { valid: boolean; errors: string[]; warnings: string[] } {
  if (!validator(value))
    return {
      valid: false,
      errors: (validator.errors ?? []).map(
        (e) =>
          (e.instancePath || '/') +
          ' ' +
          e.message +
          ' ' +
          JSON.stringify(e.params),
      ),
      warnings: [],
    };
  const p = value as Profile;
  const errors: string[] = [];
  try {
    safeOrigin(p.origin, allowLocal);
  } catch (e) {
    errors.push((e as Error).message);
  }
  if (new Set(p.actions.map((a) => a.id)).size !== p.actions.length)
    errors.push('Action IDs must be unique.');
  for (const a of p.actions) {
    try {
      safePath(a.openapi);
      if (new Set([a.submit, a.status, a.verify]).size !== 3)
        throw new Error(
          'Submit, status, and verification must be distinct operations.',
        );
      if (document !== undefined) {
        const submit = operation(document, a.submit),
          status = operation(document, a.status),
          verify = operation(document, a.verify);
        if (submit.method !== 'POST' || /[{}]/.test(submit.path))
          throw new Error('Submit must be a POST without path parameters.');
        if (!submit.jsonBody)
          throw new Error(
            'Submit must declare an application/json request body.',
          );
        if (
          !submit.parameters?.some(
            (p) =>
              p.in === 'header' &&
              p.name.toLowerCase() === a.request.header.toLowerCase() &&
              p.required,
          )
        )
          throw new Error(
            'Submit must declare the required Idempotency-Key header.',
          );
        for (const [op, name] of [
          [status, a.bindings.statusRequestId],
          [verify, a.bindings.verifyResourceId],
        ] as const) {
          if (
            op.method !== 'GET' ||
            op.path.match(/\{[^}]+\}/g)?.join() !== '{' + name + '}' ||
            !op.parameters?.some(
              (p) => p.name === name && p.in === 'path' && p.required,
            )
          )
            throw new Error(
              'Read operations must bind exactly one declared required path parameter.',
            );
        }
      }
    } catch (e) {
      errors.push(a.id + ': ' + (e as Error).message);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings: [
      'Structural validity is not proof of service behavior, authorization, or compatibility.',
      ...(document === undefined
        ? [
            'OpenAPI bindings were not checked. Supply the document for binding validation.',
          ]
        : []),
    ],
  };
}
export function assertProfile(
  value: unknown,
  document: unknown,
  allowLocal = false,
): asserts value is Profile {
  const result = validateProfile(value, document, allowLocal);
  if (!result.valid) throw new Error(result.errors.join('\n'));
}
export function validateReceipt(value: unknown): boolean {
  return Boolean(receiptCompiled(value));
}
export function assertInput(
  value: unknown,
): asserts value is Record<string, Json> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Input must be a JSON object.');
  if (new TextEncoder().encode(canonical(value)).length > 16384)
    throw new Error('Input exceeds the 16 KiB reference-client limit.');
}
