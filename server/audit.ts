import { lookup } from 'node:dns/promises';
import { request as httpsRequest } from 'node:https';
import ipaddr from 'ipaddr.js';
import { validateProfile } from '../lib/validation.ts';

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
export async function readPublic(value: string, limit = 262144) {
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
        headers: {
          Accept: 'application/json, text/plain;q=0.9',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Agentic-Auditor/0.1 (+https://ruagentic.org)',
        },
        lookup: ((_host: unknown, options: { all?: boolean }, callback: any) =>
          options.all
            ? callback(null, [pinned])
            : callback(null, pinned.address, pinned.family)) as any,
      },
      (res) => {
        if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400) {
          res.resume();
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

export async function auditUrl(profileUrl: string) {
  const url = publicUrl(profileUrl);
  const observations: {
    url: string;
    status?: number;
    contentType?: string;
    bytes?: number;
    error?: string;
  }[] = [];
  const read = async (target: string, limit?: number) => {
    try {
      const result = await readPublic(target, limit);
      observations.push({
        url: result.url,
        status: result.status,
        contentType: String(result.headers['content-type'] ?? ''),
        bytes: Buffer.byteLength(result.text),
      });
      return result;
    } catch (error) {
      observations.push({
        url: target,
        error: error instanceof Error ? error.message : 'Fetch failed.',
      });
      throw error;
    }
  };
  const fetched = await read(url.href, 65536);
  if (fetched.status !== 200)
    throw new Error(`Profile returned HTTP ${fetched.status}.`);
  const profile = JSON.parse(fetched.text);
  const structure = validateProfile(profile);
  const bindings: {
    path: string;
    validation: ReturnType<typeof validateProfile>;
  }[] = [];
  if (structure.valid) {
    if (profile.origin !== url.origin)
      throw new Error('Profile origin must match the fetched origin.');
    const paths = [
      ...new Set<string>(
        profile.actions.map((a: { openapi: string }) => a.openapi),
      ),
    ];
    if (paths.length > 5)
      throw new Error('Hosted audits support at most five OpenAPI documents.');
    for (const path of paths) {
      const apiUrl = new URL(path, url.origin);
      if (apiUrl.origin !== url.origin)
        throw new Error('OpenAPI must stay on the profile origin.');
      const api = await read(apiUrl.href);
      if (api.status !== 200)
        throw new Error(`OpenAPI returned HTTP ${api.status}.`);
      const subset = {
        ...profile,
        actions: profile.actions.filter(
          (a: { openapi: string }) => a.openapi === path,
        ),
      };
      bindings.push({
        path,
        validation: validateProfile(subset, JSON.parse(api.text)),
      });
    }
  }
  try {
    await read(new URL('/llms.txt', url.origin).href, 65536);
  } catch {
    /* Optional documentation index failures remain visible. */
  }
  return {
    reportVersion: '1',
    kind: 'public-url-audit',
    observedAt: new Date().toISOString(),
    profileUrl: url.href,
    valid: structure.valid && bindings.every((b) => b.validation.valid),
    structure,
    bindings,
    observations,
    behavioralTesting: false,
    limitation:
      'Read-only structure, operation bindings, optional llms.txt availability and response headers. Service behavior and authorization were not tested.',
  };
}
