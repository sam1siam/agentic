import { buildActionIndex } from '../lib/action-index.ts';
import { validateSiteProfile, type SiteProfile } from '../lib/site-profile.ts';
import type { readPublic, AuditCheck } from './audit.ts';
type Observation = {
  url: string;
  status?: number;
  contentType?: string;
  bytes?: number;
  error?: string;
};
export async function auditSiteProfile(
  profile: SiteProfile,
  url: URL,
  reader: typeof readPublic,
  observations: Observation[],
  checks: AuditCheck[],
) {
  const structure = validateSiteProfile(profile),
    errors: string[] = [];
  const textIndex = {
    url: new URL('agentic.txt', url).href,
    required: false,
    status: 'skipped',
    errors: [] as string[],
  };
  const add = (
    id: string,
    label: string,
    status: AuditCheck['status'],
    detail: string,
  ) => checks.push({ id, label, status, detail });
  const finish = () => ({
    reportVersion: '2',
    kind: 'public-url-audit',
    profileType: 'site',
    observedAt: new Date().toISOString(),
    profileUrl: url.href,
    valid:
      structure.valid &&
      !errors.length &&
      !checks.some((check) => check.status === 'fail' && check.id !== 'txt'),
    structure,
    bindings: [],
    textIndex,
    checks,
    errors,
    observations: observations.sort((a, b) => a.url.localeCompare(b.url)),
    behavioralTesting: false,
    limitation:
      'This audit checks a descriptive site profile, selected public documents, and its matching TXT. It does not invoke advertised protocols or execute actions.',
  });
  add(
    'structure',
    'Site profile structure',
    structure.valid ? 'pass' : 'fail',
    structure.valid
      ? 'The file matches Agentic Site Profile 1.1.'
      : structure.errors.join(' '),
  );
  if (!structure.valid) return finish();
  if (profile.origin !== url.origin) {
    errors.push('The profile origin must match the domain serving the file.');
    add('origin', 'Service origin', 'fail', errors[0]);
    return finish();
  }
  add(
    'origin',
    'Service origin',
    'pass',
    'The profile belongs to the domain serving it.',
  );
  const read = async (target: string, limit: number) => {
    try {
      const result = await reader(target, limit);
      observations.push({
        url: target,
        status: result.status,
        contentType: String(result.headers['content-type'] ?? ''),
        bytes: Buffer.byteLength(result.text),
      });
      return result;
    } catch (error) {
      observations.push({
        url: target,
        error: error instanceof Error ? error.message : 'Read failed.',
      });
      throw error;
    }
  };
  const apiDocuments = new Set(profile.apis.map((api) => api.document));
  const documents = [
    ...new Map(
      profile.resources
        .filter(
          (resource) =>
            resource.availability === 'retrieved' &&
            resource.kind !== 'mcp' &&
            new URL(resource.url).origin === url.origin &&
            (resource.url !== url.href || apiDocuments.has(resource.url)),
        )
        .map((resource) => [resource.url, resource]),
    ).values(),
  ].sort(
    (a, b) =>
      (apiDocuments.has(b.url) ? 2 : Number(b.kind === 'openapi')) -
      (apiDocuments.has(a.url) ? 2 : Number(a.kind === 'openapi')),
  );
  const selected = documents.slice(0, 5);
  await Promise.all([
    ...selected.map(async (resource) => {
      try {
        const result = await read(resource.url, 1048576);
        if (result.status !== 200)
          throw new Error('The document returned HTTP ' + result.status + '.');
        if (apiDocuments.has(resource.url) || resource.kind === 'openapi') {
          const api = JSON.parse(result.text);
          if (
            !api?.paths ||
            typeof api.openapi !== 'string' ||
            !/^3\./.test(api.openapi)
          )
            throw new Error('The response is not an OpenAPI 3 document.');
          for (const item of profile.apis.filter(
            (item) => item.document === resource.url,
          ))
            for (const operation of item.operations) {
              const found =
                api.paths[operation.path]?.[operation.method.toLowerCase()];
              if (
                !found ||
                (operation.operationId &&
                  found.operationId !== operation.operationId)
              )
                throw new Error(
                  'An indexed API operation differs from the public OpenAPI document. Regenerate the files.',
                );
            }
        }
        add(
          'resource:' + resource.url,
          apiDocuments.has(resource.url) || resource.kind === 'openapi'
            ? 'OpenAPI operation index'
            : 'Public document',
          'pass',
          resource.url,
        );
      } catch (error) {
        add(
          'resource:' + resource.url,
          'Public document',
          'fail',
          resource.url +
            ': ' +
            (error instanceof Error ? error.message : 'Read failed.'),
        );
      }
    }),
    (async () => {
      try {
        const response = await read(textIndex.url, 65536);
        if (response.status === 404) {
          textIndex.status = 'missing';
          add(
            'txt',
            'Text index · optional',
            'warn',
            'Publish the matching agentic.txt to provide both files.',
          );
          return;
        }
        if (response.status !== 200)
          throw new Error('agentic.txt returned HTTP ' + response.status + '.');
        const matched = response.text === buildActionIndex(profile, url.href);
        textIndex.status = matched ? 'matched' : 'mismatch';
        add(
          'txt',
          'Text index · optional',
          matched ? 'pass' : 'fail',
          matched
            ? 'The text index matches the JSON.'
            : 'Regenerate agentic.txt from the current JSON.',
        );
        if (!matched)
          textIndex.errors.push('The text index differs from the JSON.');
      } catch (error) {
        textIndex.status = 'unavailable';
        textIndex.errors.push(
          error instanceof Error ? error.message : 'Read failed.',
        );
        add('txt', 'Text index · optional', 'warn', textIndex.errors[0]);
      }
    })(),
  ]);
  const untested = profile.resources.filter(
    (resource) =>
      resource.kind === 'mcp' ||
      new URL(resource.url).origin !== url.origin ||
      resource.availability === 'linked',
  ).length;
  if (untested)
    add(
      'linked',
      'Advertised connections',
      'warn',
      untested +
        ' linked or external resources were recorded without invoking their protocols.',
    );
  if (documents.length > selected.length)
    add(
      'limit',
      'Document sample',
      'warn',
      'Up to five same-origin documents are checked. Remaining links are present in the profile.',
    );
  checks.sort((a, b) => a.id.localeCompare(b.id));
  return finish();
}
