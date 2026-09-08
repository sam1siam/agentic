import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import ipaddr from 'ipaddr.js';
import { validateProfile } from '../lib/validation.ts';
import { isSiteProfile } from '../lib/site-profile.ts';
import { auditSiteProfile } from './site-audit.ts';
import { matchesTextIndex } from '../lib/publication.ts';
import {
  normalizeReadmeUrl,
  auditReadme,
  publicationSummary,
} from './publication-audit.ts';

export function publicAddress(address: string) {
  if (!ipaddr.isValid(address)) return false;
  const ip = ipaddr.process(address);
  return ip.range() === 'unicast';
}
export function publicUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.hash ||
    (url.port && url.port !== '443')
  )
    throw new Error(
      'Use a public HTTPS URL on port 443 without credentials or a fragment.',
    );
  if (url.href.length > 2048) throw new Error('URL is too long.');
  return url;
}
export async function readPublic(
  value: string,
  limit = 262144,
  options: {
    redirects?: boolean;
    signal?: AbortSignal;
    accept?: string;
  } = {},
) {
  options.signal?.throwIfAborted();
  const url = publicUrl(value),
    hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = ipaddr.isValid(hostname)
    ? [
        {
          address: hostname,
          family: ipaddr.parse(hostname).kind() === 'ipv6' ? 6 : 4,
        },
      ]
    : await Promise.race([
        lookup(hostname, { all: true, verbatim: true }),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('DNS lookup exceeded 5 seconds.')),
            5000,
          );
          timer.unref();
        }),
      ]);
  if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
    throw new Error(
      'The hostname must resolve exclusively to public IP addresses.',
    );
  const pinned = addresses[0];
  options.signal?.throwIfAborted();
  return new Promise<{
    url: string;
    status: number;
    headers: Record<string, string | string[] | undefined>;
    text: string;
  }>((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: 'GET',
        agent: false,
        signal: options.signal,
        headers: {
          Accept: options.accept ?? 'application/json, text/plain;q=0.9',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Agentic-Auditor/1.1 (+https://ruagentic.org)',
        },
        lookup: ((_host: unknown, options: { all?: boolean }, callback: any) =>
          options.all
            ? callback(null, [pinned])
            : callback(null, pinned.address, pinned.family)) as any,
      },
      (res) => {
        if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400) {
          res.destroy();
          if (options.redirects) {
            resolve({
              url: url.href,
              status: res.statusCode!,
              headers: res.headers,
              text: '',
            });
            return;
          }
          reject(
            new Error('Redirects are not followed. Supply the final URL.'),
          );
          return;
        }
        if (
          res.headers['content-encoding'] &&
          res.headers['content-encoding'] !== 'identity'
        ) {
          res.destroy();
          reject(new Error('Compressed responses are not accepted.'));
          return;
        }
        let size = 0;
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > limit)
            req.destroy(new Error('Response exceeds the audit size limit.'));
          else chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            url: url.href,
            status: res.statusCode ?? 0,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    const deadline = setTimeout(
      () => req.destroy(new Error('Fetch exceeded 8 seconds.')),
      8000,
    );
    req.on('close', () => clearTimeout(deadline));
    req.on('error', reject);
    req.end();
  });
}

export type AuditCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  remedy?: string;
  helpUrl?: string;
};
export function normalizeAuditUrl(value: string) {
  const text = value.trim();
  if (!text) throw new Error('Enter a website or an Agentic JSON URL.');
  const url = publicUrl(
    /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : 'https://' + text,
  );
  if (url.search) throw new Error('Use a public URL without query parameters.');
  if (url.pathname.endsWith('/')) url.pathname += 'agentic.json';
  return url.href;
}
async function auditProfileUrl(
  profileUrl: string,
  reader: typeof readPublic = readPublic,
) {
  const url = publicUrl(normalizeAuditUrl(profileUrl));
  const observations: {
    url: string;
    status?: number;
    contentType?: string;
    bytes?: number;
    error?: string;
  }[] = [];
  const checks: AuditCheck[] = [];
  const errors: string[] = [];
  let structure: ReturnType<typeof validateProfile> | null = null;
  const bindings: {
    path: string;
    validation: ReturnType<typeof validateProfile> | null;
    error?: string;
  }[] = [];
  const textIndex: {
    url: string;
    required: false;
    status: 'matched' | 'mismatch' | 'missing' | 'unavailable' | 'skipped';
    errors: string[];
    version?: string;
  } = {
    url: new URL('agentic.txt', url).href,
    required: false,
    status: 'skipped',
    errors: [],
  };
  const message = (error: unknown) =>
    error instanceof Error ? error.message : 'The file could not be read.';
  const read = async (target: string, limit = 262144) => {
    try {
      const result = await reader(target, limit);
      observations.push({
        url: result.url,
        status: result.status,
        contentType: String(result.headers['content-type'] ?? ''),
        bytes: Buffer.byteLength(result.text),
      });
      return result;
    } catch (error) {
      observations.push({ url: target, error: message(error) });
      throw error;
    }
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
    observedAt: new Date().toISOString(),
    profileUrl: url.href,
    valid:
      !!structure?.valid &&
      !errors.length &&
      bindings.length > 0 &&
      bindings.every((binding) => binding.validation?.valid),
    structure,
    bindings,
    textIndex,
    checks,
    errors,
    observations: observations.sort((a, b) => a.url.localeCompare(b.url)),
    behavioralTesting: false,
    limitation:
      'This audit reads public files and checks their structure, links, and consistency. It does not execute an action or test your service’s runtime behavior.',
  });
  let profile: any;
  try {
    const fetched = await read(url.href, 65536);
    if (fetched.status !== 200)
      throw new Error(
        'agentic.json returned HTTP ' +
          fetched.status +
          '. Publish the file at this URL, then check again.',
      );
    try {
      profile = JSON.parse(fetched.text);
    } catch {
      throw new Error(
        'The response is not valid JSON. Make sure this URL serves agentic.json rather than a web page.',
      );
    }
    add(
      'json',
      'JSON file',
      'pass',
      'The file is reachable and contains valid JSON.',
    );
    if (
      String(fetched.headers['content-type'] ?? '')
        .split(';')[0]
        .trim()
        .toLowerCase() !== 'application/json'
    )
      add(
        'json-type',
        'JSON content type',
        'warn',
        'Serve agentic.json with Content-Type: application/json.',
      );
  } catch (error) {
    const detail = message(error);
    errors.push(detail);
    add('json', 'JSON file', 'fail', detail);
    return finish();
  }
  if (isSiteProfile(profile))
    return auditSiteProfile(profile, url, reader, observations, checks);
  structure = validateProfile(profile);
  add(
    'structure',
    'Profile structure',
    structure.valid ? 'pass' : 'fail',
    structure.valid
      ? 'The profile matches Agentic 1.0.'
      : structure.errors.join(' '),
  );
  if (!structure.valid) return finish();
  if (profile.origin !== url.origin) {
    const detail = 'The profile origin must match the domain serving the file.';
    errors.push(detail);
    add('origin', 'Service origin', 'fail', detail);
    return finish();
  }
  add(
    'origin',
    'Service origin',
    'pass',
    'The profile belongs to the domain serving it.',
  );
  const paths = [
    ...new Set<string>(
      profile.actions.map((action: { openapi: string }) => action.openapi),
    ),
  ];
  if (paths.length > 5) {
    const detail =
      'An audit supports up to five OpenAPI files. Reduce the number of documents or validate them locally.';
    errors.push(detail);
    add('bindings', 'OpenAPI links', 'fail', detail);
    return finish();
  }
  // Independent reads run together, bounded by the five-document limit.
  await Promise.all([
    ...paths.map(async (path) => {
      try {
        const apiUrl = new URL(path, url.origin);
        if (apiUrl.origin !== url.origin)
          throw new Error('OpenAPI files must be on the same service origin.');
        const fetched = await read(apiUrl.href);
        if (fetched.status !== 200)
          throw new Error('OpenAPI returned HTTP ' + fetched.status + '.');
        let api: unknown;
        try {
          api = JSON.parse(fetched.text);
        } catch {
          throw new Error('The OpenAPI file is not valid JSON.');
        }
        const subset = {
          ...profile,
          actions: profile.actions.filter(
            (action: { openapi: string }) => action.openapi === path,
          ),
        };
        const validation = validateProfile(subset, api);
        bindings.push({ path, validation });
        add(
          'api:' + path,
          'API operations · ' + path,
          validation.valid ? 'pass' : 'fail',
          validation.valid
            ? 'Create, status, and result operations match the profile.'
            : validation.errors.join(' '),
        );
      } catch (error) {
        const detail = message(error);
        bindings.push({ path, validation: null, error: detail });
        add('api:' + path, 'API operations · ' + path, 'fail', detail);
      }
    }),
    (async () => {
      try {
        const fetched = await read(textIndex.url, 65536);
        if (fetched.status === 404) {
          textIndex.status = 'missing';
          add(
            'txt',
            'Text index · optional',
            'warn',
            'agentic.txt is missing. Generate it from your JSON to publish both files.',
          );
          return;
        }
        if (fetched.status !== 200)
          throw new Error('agentic.txt returned HTTP ' + fetched.status + '.');
        const matches = matchesTextIndex(fetched.text, profile, url.href);
        textIndex.version = /^Agentic-Text: ([^\r\n]+)/m.exec(
          fetched.text,
        )?.[1];
        textIndex.status = matches ? 'matched' : 'mismatch';
        const detail = matches
          ? 'The action index matches the JSON profile.'
          : 'The text index differs from the JSON. Regenerate agentic.txt from this profile and publish both files together.';
        if (!matches) textIndex.errors.push(detail);
        add('txt', 'Text index · optional', matches ? 'pass' : 'fail', detail);
        if (
          String(fetched.headers['content-type'] ?? '')
            .split(';')[0]
            .trim()
            .toLowerCase() !== 'text/plain'
        )
          add(
            'txt-type',
            'Text content type',
            'warn',
            'Serve agentic.txt with Content-Type: text/plain; charset=utf-8.',
          );
      } catch (error) {
        textIndex.status = 'unavailable';
        textIndex.errors.push(message(error));
        add('txt', 'Text index · optional', 'warn', message(error));
      }
    })(),
    (async () => {
      try {
        await read(new URL('/llms.txt', url.origin).href, 65536);
      } catch {
        /* Optional documentation availability remains in observations. */
      }
    })(),
  ]);
  bindings.sort((a, b) => a.path.localeCompare(b.path));
  checks.sort((a, b) => {
    const rank = (id: string) =>
      id === 'json'
        ? 0
        : id === 'structure'
          ? 1
          : id === 'origin'
            ? 2
            : id.startsWith('api:')
              ? 3
              : id === 'txt'
                ? 4
                : 5;
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  });
  return finish();
}

export async function auditUrl(
  profileUrl: string,
  reader: typeof readPublic = readPublic,
  options: { readmeUrl?: string } = {},
) {
  const url = publicUrl(normalizeAuditUrl(profileUrl));
  const readmeUrl = options.readmeUrl
    ? normalizeReadmeUrl(options.readmeUrl)
    : undefined;
  const [core, readme] = await Promise.all([
    auditProfileUrl(url.href, reader),
    auditReadme(url, reader, readmeUrl),
  ]);
  // Availability still matters when an invalid/missing JSON prevented comparison.
  if (core.textIndex.status === 'skipped') {
    try {
      const response = await reader(core.textIndex.url, 65536);
      core.observations.push({
        url: core.textIndex.url,
        status: response.status,
        contentType: String(response.headers['content-type'] ?? ''),
        bytes: Buffer.byteLength(response.text),
      });
      core.textIndex.status = response.status === 404 ? 'missing' : 'skipped';
      core.checks.push({
        id: 'txt',
        label: 'Text index',
        status: 'warn',
        detail:
          response.status === 200
            ? 'agentic.txt is present. Fix the JSON before its consistency can be checked.'
            : response.status === 404
              ? 'agentic.txt is missing.'
              : 'agentic.txt returned HTTP ' + response.status + '.',
      });
    } catch (error) {
      core.textIndex.status = 'unavailable';
      core.observations.push({
        url: core.textIndex.url,
        error: error instanceof Error ? error.message : 'Read failed.',
      });
      core.checks.push({
        id: 'txt',
        label: 'Text index',
        status: 'warn',
        detail:
          'The text index could not be read. Fix the JSON and check the file URL again.',
      });
    }
  }
  const summary = publicationSummary(core, readme);
  return {
    ...core,
    reportVersion: '3',
    ...summary,
    readme,
    observations: [...core.observations, ...readme.observations].sort((a, b) =>
      a.url.localeCompare(b.url),
    ),
    limitation:
      core.limitation +
      ' README checks verify visible links, not every claim in its prose. Project references do not establish listing acceptance or endorsement.',
  };
}
