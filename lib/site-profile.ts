import compiled from './generated/site.js';
import ipaddr from 'ipaddr.js';
import { safeOrigin, validateProfile } from './validation.ts';

export type ResourceKind =
  | 'website'
  | 'documentation'
  | 'llms'
  | 'openapi'
  | 'mcp'
  | 'a2a'
  | 'agent-auth'
  | 'agentic';
export type SiteResource = {
  kind: ResourceKind;
  url: string;
  source: string;
  availability: 'retrieved' | 'linked';
  title?: string;
};
export type SiteOperation = {
  method:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'TRACE';
  path: string;
  operationId?: string;
  summary?: string;
};
export type SiteProfile = {
  $schema?: string;
  agentic: '1.1.0';
  type: 'site';
  origin: string;
  name: string;
  description: string;
  resources: SiteResource[];
  apis: { document: string; openapi: string; operations: SiteOperation[] }[];
};
export function isSiteProfile(value: unknown): value is SiteProfile {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { type?: unknown }).type === 'site'
  );
}
export function siteUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.port && url.port !== '443') ||
    url.href.length > 2048
  )
    throw new Error(
      'Site links must be public HTTPS URLs without credentials, query parameters, fragments, or alternate ports.',
    );
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    (ipaddr.isValid(host) && ipaddr.process(host).range() !== 'unicast')
  )
    throw new Error('Site links must not point to local or private addresses.');
  return url;
}
export function validateSiteProfile(value: unknown) {
  const validate = compiled as unknown as ((value: unknown) => boolean) & {
    errors?: { instancePath?: string; message?: string }[];
  };
  const errors: string[] = [];
  if (!validate(value))
    return {
      valid: false,
      errors: (validate.errors ?? []).map(
        (error) => (error.instancePath || '/') + ' ' + error.message,
      ),
      warnings: [] as string[],
    };
  const profile = value as SiteProfile;
  try {
    safeOrigin(profile.origin);
    siteUrl(profile.origin);
    if (
      !profile.resources.some(
        (resource) => resource.availability === 'retrieved',
      )
    )
      throw new Error(
        'A site profile must include at least one retrieved public source.',
      );
    const urls = new Set<string>();
    for (const resource of profile.resources) {
      siteUrl(resource.url);
      siteUrl(resource.source);
      const key = resource.kind + ':' + resource.url;
      if (urls.has(key))
        throw new Error('Resource URLs must be unique within each kind.');
      urls.add(key);
    }
    for (const api of profile.apis) {
      siteUrl(api.document);
      if (
        !profile.resources.some(
          (resource) =>
            resource.kind === 'openapi' &&
            resource.url === api.document &&
            resource.availability === 'retrieved',
        )
      )
        throw new Error(
          'Every API must reference a retrieved OpenAPI resource.',
        );
      const operations = new Set<string>();
      for (const operation of api.operations) {
        if (
          !operation.path.startsWith('/') ||
          operation.path.startsWith('//') ||
          /[?#\\]/.test(operation.path)
        )
          throw new Error(
            'API paths must be root-relative paths without queries or fragments.',
          );
        const key = operation.method + ' ' + operation.path;
        if (operations.has(key))
          throw new Error('API method/path pairs must be unique.');
        operations.add(key);
      }
    }
    if (new TextEncoder().encode(JSON.stringify(profile)).length > 65536)
      throw new Error('Site profile exceeds 64 KiB.');
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : 'Invalid site profile.',
    );
  }
  return {
    valid: !errors.length,
    errors,
    warnings: [
      'A site profile describes public resources. It does not authorize or define action execution; linked protocols keep their own contracts.',
    ],
  };
}
export function validateAgenticDocument(
  value: unknown,
  api?: unknown,
  allowLocal = false,
) {
  return isSiteProfile(value)
    ? validateSiteProfile(value)
    : validateProfile(value, api, allowLocal);
}
