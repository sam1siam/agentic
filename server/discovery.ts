import { readPublic } from './audit.ts';
import { validateProfile } from '../lib/validation.ts';
import { publicationFiles } from '../lib/publication.ts';
import {
  siteUrl,
  validateSiteProfile,
  type SiteProfile,
  type SiteResource,
  type ResourceKind,
  type SiteOperation,
} from '../lib/site-profile.ts';
import type { Profile } from '../lib/types.ts';

type ReadResult = Awaited<ReturnType<typeof readPublic>>;
type Candidate = {
  url: string;
  kind: ResourceKind;
  source: string;
  linked: boolean;
  title?: string;
};
export type DiscoveryObservation = {
  url: string;
  status?: number;
  kind?: ResourceKind;
  bytes?: number;
  error?: string;
};
const MAX_REQUESTS = 22,
  MAX_BYTES = 8 * 1024 * 1024,
  PAGE_LIMIT = 1024 * 1024;
const methods = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
] as const;
export function normalizeWebsiteUrl(value: string) {
  const input = value.trim();
  if (!input) throw new Error('Enter your website URL.');
  return siteUrl(
    /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : 'https://' + input,
  ).href;
}
export function discoveryRedirectAllowed(from: string, to: string) {
  const a = siteUrl(from),
    b = siteUrl(to);
  return (
    a.origin === b.origin ||
    a.hostname.replace(/^www\./, '') === b.hostname.replace(/^www\./, '')
  );
}
function clean(value: string, limit: number) {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => {
      const n =
        code[0].toLowerCase() === 'x'
          ? parseInt(code.slice(1), 16)
          : Number(code);
      return n >= 32 && n <= 0x10ffff ? String.fromCodePoint(n) : ' ';
    })
    .replace(/<[^<>]{0,8192}>/g, ' ')
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}
function attributes(tag: string) {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(
    /(?:^|\s)([\w:-]{1,80})\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
  ))
    result[match[1].toLowerCase()] = clean(
      match[2] ?? match[3] ?? match[4],
      2048,
    );
  return result;
}
function parsePage(text: string) {
  const lower = text.toLowerCase(),
    links: { url: string; title: string }[] = [],
    visible: string[] = [];
  let position = 0,
    title = '',
    description = '',
    inTitle = false;
  // One forward pass: malformed/unclosed markup cannot trigger repeated scans.
  while (position < text.length) {
    const begin = text.indexOf('<', position),
      stop = begin < 0 ? text.length : begin;
    const segment = text.slice(position, stop);
    visible.push(segment);
    if (inTitle && title.length < 160)
      title += clean(segment, 160 - title.length);
    if (begin < 0) break;
    const end = text.indexOf('>', begin + 1);
    if (end < 0) {
      visible.push(text.slice(begin));
      break;
    }
    const raw = text.slice(begin + 1, Math.min(end, begin + 8192)),
      tag = raw.match(/^\s*(\/?)([a-z][\w:-]{0,50})/i);
    position = end + 1;
    if (!tag) continue;
    const name = tag[2].toLowerCase(),
      closing = !!tag[1];
    if (!closing && (name === 'script' || name === 'style')) {
      const close = lower.indexOf('</' + name, position);
      if (close < 0) break;
      const closeEnd = text.indexOf('>', close);
      position = closeEnd < 0 ? text.length : closeEnd + 1;
      continue;
    }
    if (name === 'title') inTitle = !closing;
    if (closing) {
      visible.push('\n');
      continue;
    }
    const attr = attributes(raw.slice(tag[0].length));
    if (
      name === 'meta' &&
      !description &&
      /^(description|og:description)$/i.test(
        attr.name ?? attr.property ?? '',
      ) &&
      attr.content
    )
      description = clean(attr.content, 600);
    if (
      links.length < 1000 &&
      attr.href &&
      (name === 'a' ||
        (name === 'link' &&
          /alternate|describedby|service-desc/.test(attr.rel ?? '')))
    ) {
      const next = text.indexOf('<', position);
      links.push({
        url: attr.href,
        title:
          attr.title ??
          clean(
            text.slice(
              position,
              Math.min(next < 0 ? text.length : next, position + 200),
            ),
            160,
          ),
      });
    }
  }
  const plain = visible.join(' ');
  let offset = 0;
  while (links.length < 1000) {
    const marker = plain.indexOf('](', offset);
    if (marker < 0) break;
    const finish = plain.indexOf(')', marker + 2);
    if (finish < 0) break;
    const windowStart = Math.max(0, marker - 200),
      relativeBegin = plain.slice(windowStart, marker).lastIndexOf('[');
    const begin = relativeBegin < 0 ? -1 : windowStart + relativeBegin;
    offset = finish + 1;
    if (begin < 0 || marker - begin > 200 || finish - marker > 2049) continue;
    links.push({
      url: clean(plain.slice(marker + 2, finish).split(/\s/)[0], 2048),
      title: clean(plain.slice(begin + 1, marker), 160),
    });
  }
  for (const match of plain.matchAll(/https:\/\/[^\s<>"'`\\)\]}]+/g)) {
    if (links.length >= 1000) break;
    links.push({
      url: clean(match[0].replace(/[.,;]+$/, ''), 2048),
      title: '',
    });
  }
  return { links, title: clean(title, 160), description };
}
function classify(url: URL, title = ''): ResourceKind | undefined {
  const path = url.pathname.toLowerCase();
  if (/(?:^|\/)agentic\.json$/.test(path)) return 'agentic';
  if (/\/llms(?:-full)?\.txt$/.test(path)) return 'llms';
  if (/agent-card\.json$/.test(path)) return 'a2a';
  if (/\/\.well-known\/agent-configuration$/.test(path)) return 'agent-auth';
  if (
    /(?:^|\/)mcp(?:\/|$)/.test(path) &&
    !/\/(docs|guides?|reference)\//.test(path)
  )
    return 'mcp';
  if (/(?:openapi|swagger)[^/]*\.(?:json|ya?ml)$/.test(path)) return 'openapi';
  if (
    /\/(docs?|developers?|reference|guides?|api-docs)(?:\/|$)|\.(?:md|txt)$/.test(
      path,
    ) ||
    /^(?:api documentation|documentation|developer docs)$/i.test(title)
  )
    return 'documentation';
}
function linkedUrl(value: string, base: string) {
  try {
    const url = new URL(value, base);
    url.hash = '';
    return siteUrl(url.href);
  } catch {
    return undefined;
  }
}
export async function discoverWebsite(
  input: string,
  reader: typeof readPublic = readPublic,
) {
  const requestedUrl = normalizeWebsiteUrl(input);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error('The scan reached its time limit.')),
    40000,
  );
  timer.unref();
  const observations: DiscoveryObservation[] = [],
    notes: string[] = [],
    resources = new Map<string, SiteResource>();
  const queue: Candidate[] = [],
    queued = new Set<string>(),
    fetched = new Map<string, ReadResult>();
  const apis = new Map<
    string,
    { document: string; openapi: string; operations: SiteOperation[] }
  >();
  let requests = 0,
    bytes = 0,
    budgetUsed = 0,
    reservedBytes = 0,
    origin = new URL(requestedUrl).origin;
  let name = new URL(origin).hostname,
    description = '',
    existing: Profile | undefined,
    existingUrl = '',
    preferredProfileUrl = '';
  let limitedResources = false,
    limitedApis = false;
  function resource(item: SiteResource) {
    const key = item.kind + ':' + item.url,
      old = resources.get(key);
    if (old?.availability === 'retrieved' && item.availability === 'linked')
      return;
    if (resources.size >= 40 && !old && item.availability === 'retrieved') {
      const replace =
        [...resources.entries()].find(
          ([, value]) => value.availability === 'linked',
        ) ??
        [...resources.entries()].find(
          ([, value]) => value.kind === 'documentation',
        );
      if (replace) {
        resources.delete(replace[0]);
        limitedResources = true;
      }
    }
    if (resources.size < 40 || old) resources.set(key, item);
    else limitedResources = true;
  }
  function enqueue(candidate: Candidate) {
    if (candidate.linked)
      resource({
        kind: candidate.kind,
        url: candidate.url,
        source: candidate.source,
        availability: 'linked',
        ...(candidate.title ? { title: candidate.title } : {}),
      });
    // Protocol endpoints and cross-origin references are described, never called.
    if (
      candidate.kind === 'mcp' ||
      new URL(candidate.url).origin !== origin ||
      queued.has(candidate.url) ||
      queue.length >= 50
    )
      return;
    queued.add(candidate.url);
    queue.push(candidate);
  }
  async function read(candidate: Candidate): Promise<ReadResult> {
    let target = candidate.url;
    for (let hop = 0; hop < 4; hop++) {
      if (
        controller.signal.aborted ||
        requests >= MAX_REQUESTS ||
        budgetUsed >= MAX_BYTES
      )
        throw new Error('The scan reached its public-page limit.');
      requests++;
      const limit = Math.min(
        PAGE_LIMIT,
        MAX_BYTES - budgetUsed - reservedBytes,
      );
      if (limit <= 0)
        throw new Error('The scan reached its public-page limit.');
      reservedBytes += limit;
      let received = false;
      try {
        const result = await reader(target, limit, {
          redirects: true,
          signal: controller.signal,
          accept: 'text/html, application/json, text/plain;q=0.9',
        });
        received = true;
        bytes += Buffer.byteLength(result.text);
        budgetUsed += Buffer.byteLength(result.text);
        observations.push({
          url: target,
          status: result.status,
          kind: candidate.kind,
          bytes: Buffer.byteLength(result.text),
        });
        if (result.status >= 300 && result.status < 400) {
          const location = result.headers.location;
          if (typeof location !== 'string')
            throw new Error('Redirect has no destination.');
          const next = new URL(location, target).href;
          if (!discoveryRedirectAllowed(target, next))
            throw new Error(
              'The site redirects to another domain. Enter its final public URL.',
            );
          target = next;
          continue;
        }
        fetched.set(result.url, result);
        return result;
      } catch (error) {
        // A rejected response may already have consumed its full body allowance.
        if (!received) budgetUsed += limit;
        const message =
          error instanceof Error
            ? error.message
            : 'This source could not be read.';
        if (
          observations.at(-1)?.url !== target ||
          observations.at(-1)?.status !== undefined
        )
          observations.push({
            url: target,
            error: message,
            kind: candidate.kind,
          });
        throw error;
      } finally {
        reservedBytes -= limit;
      }
    }
    throw new Error('Too many redirects. Enter the final website URL.');
  }
  function process(result: ReadResult, candidate: Candidate, first = false) {
    if (result.status !== 200) return;
    const type = String(result.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    let json: any;
    try {
      json = JSON.parse(result.text);
    } catch {
      /* HTML and text are expected discovery sources. */
    }
    let kind = candidate.kind;
    if (
      json?.agentic === '1.0.0' ||
      (json?.agentic === '1.1.0' && json?.type === 'site')
    )
      kind = 'agentic';
    const isApi =
      json &&
      typeof json.openapi === 'string' &&
      /^3\./.test(json.openapi) &&
      json.paths &&
      typeof json.paths === 'object';
    if (isApi) {
      kind = 'openapi';
      const operations: SiteOperation[] = [];
      for (const [path, item] of Object.entries(json.paths) as [
        string,
        any,
      ][]) {
        if (
          !path.startsWith('/') ||
          path.startsWith('//') ||
          /[?#\\]/.test(path) ||
          path.length > 512
        )
          continue;
        for (const method of methods)
          if (item?.[method] && typeof item[method] === 'object') {
            if (operations.length >= 160) {
              limitedApis = true;
              continue;
            }
            const operation = item[method];
            operations.push({
              method: method.toUpperCase() as SiteOperation['method'],
              path,
              ...(typeof operation.operationId === 'string' &&
              operation.operationId.length > 0 &&
              operation.operationId.length <= 160
                ? { operationId: operation.operationId }
                : {}),
              ...(typeof operation.summary === 'string' &&
              clean(operation.summary, 240)
                ? { summary: clean(operation.summary, 240) }
                : {}),
            });
          }
      }
      if (apis.size < 5)
        apis.set(result.url, {
          document: result.url,
          openapi: json.openapi.slice(0, 32),
          operations,
        });
      else limitedApis = true;
      if (
        typeof json.info?.title === 'string' &&
        name === new URL(origin).hostname
      )
        name = clean(json.info.title, 160) || name;
    } else if (kind === 'openapi') return;
    if (kind === 'agentic') {
      if (
        json?.agentic === '1.0.0' &&
        json.origin === origin &&
        validateProfile(json).valid
      ) {
        if (first) preferredProfileUrl = result.url;
        if (
          !existing ||
          result.url === preferredProfileUrl ||
          (result.url === origin + '/agentic.json' &&
            existingUrl !== preferredProfileUrl)
        ) {
          existing = json;
          existingUrl = result.url;
        }
        for (const action of (json as Profile).actions)
          enqueue({
            url: new URL(action.openapi, origin).href,
            kind: 'openapi',
            source: result.url,
            linked: true,
          });
      } else if (!json || !validateSiteProfile(json).valid) return;
    }
    if (
      kind === 'a2a' &&
      (typeof json?.name !== 'string' || !Array.isArray(json?.skills))
    )
      return;
    if (
      kind === 'agent-auth' &&
      (typeof json?.issuer !== 'string' ||
        !json?.endpoints ||
        typeof json.endpoints !== 'object')
    )
      return;
    if (kind === 'llms' && (type === 'text/html' || /^\s*</.test(result.text)))
      return;
    const page = parsePage(result.text);
    const title = page.title || candidate.title || '';
    if (first) {
      if (title)
        name =
          title
            .split(/\s[|—]\s/)[0]
            .trim()
            .slice(0, 160) || name;
      description = page.description;
      if (!description && typeof json?.info?.description === 'string')
        description = clean(json.info.description, 600);
    }
    resource({
      kind,
      url: result.url,
      source: candidate.linked ? candidate.source : result.url,
      availability: 'retrieved',
      ...(title ? { title } : {}),
    });
    if (kind === 'openapi' || kind === 'agentic') return;
    for (const link of page.links) {
      const url = linkedUrl(link.url, result.url);
      if (!url) continue;
      const linkKind = classify(url, link.title);
      if (linkKind)
        enqueue({
          url: url.href,
          kind: linkKind,
          source: result.url,
          linked: true,
          ...(link.title ? { title: link.title } : {}),
        });
    }
    if (typeof result.headers.link === 'string')
      for (const match of result.headers.link.matchAll(/<([^>]+)>/g)) {
        const url = linkedUrl(match[1], result.url);
        if (url) {
          const linkKind = classify(url);
          if (linkKind)
            enqueue({
              url: url.href,
              kind: linkKind,
              source: result.url,
              linked: true,
            });
        }
      }
  }
  try {
    const initial = {
      url: requestedUrl,
      kind: 'website' as const,
      source: requestedUrl,
      linked: false,
    };
    const home = await read(initial);
    if (home.status !== 200)
      throw new Error(
        'The website returned HTTP ' +
          home.status +
          '. Enter a publicly accessible website or documentation URL.',
      );
    const contentType = String(
      home.headers['content-type'] ?? '',
    ).toLowerCase();
    if (!/text\/|json/.test(contentType) && !/^\s*[<{#]/.test(home.text))
      throw new Error('The URL did not return a readable website or document.');
    origin = new URL(home.url).origin;
    queued.add(home.url);
    process(home, initial, true);
    for (const [path, kind] of [
      ['/agentic.json', 'agentic'],
      ['/llms.txt', 'llms'],
      ['/api/openapi.json', 'openapi'],
      ['/openapi.json', 'openapi'],
      ['/docs', 'documentation'],
      ['/.well-known/agent-card.json', 'a2a'],
      ['/.well-known/agent-configuration', 'agent-auth'],
    ] as [string, ResourceKind][])
      enqueue({ url: origin + path, kind, source: home.url, linked: false });
    const priority = (kind: ResourceKind) =>
      [
        'agentic',
        'openapi',
        'llms',
        'documentation',
        'a2a',
        'agent-auth',
      ].indexOf(kind);
    while (
      queue.length &&
      requests < MAX_REQUESTS &&
      budgetUsed < MAX_BYTES &&
      !controller.signal.aborted
    ) {
      queue.sort((a, b) => priority(a.kind) - priority(b.kind));
      const batch = queue.splice(0, Math.min(5, MAX_REQUESTS - requests));
      const results = await Promise.allSettled(
        batch.map((candidate) => read(candidate)),
      );
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') process(result.value, batch[index]);
      });
    }
    if (queue.length || controller.signal.aborted || budgetUsed >= MAX_BYTES)
      notes.push(
        'The scan reached its limit. The files include the sources read successfully; additional pages may exist.',
      );
    if (limitedResources)
      notes.push(
        'The files include up to forty discovered resources. Additional links remain in the source documents.',
      );
    if (limitedApis)
      notes.push(
        'The files index up to five OpenAPI documents and 160 operations per document. Additional operations remain in the linked API descriptions.',
      );
    if (!apis.size)
      notes.push(
        'No public OpenAPI document was found. Published documentation and connection links are included.',
      );
    let profile: SiteProfile | Profile;
    if (existing) {
      profile = existing;
      for (const path of new Set(
        existing.actions.map((action) => action.openapi),
      )) {
        const source = fetched.get(new URL(path, origin).href);
        let valid = false;
        try {
          valid =
            !!source &&
            validateProfile(
              {
                ...existing,
                actions: existing.actions.filter(
                  (action) => action.openapi === path,
                ),
              },
              JSON.parse(source.text),
            ).valid;
        } catch {}
        if (!valid)
          notes.push(
            'The existing action profile was preserved, but API binding checks could not be completed for ' +
              path +
              '.',
          );
      }
    } else {
      profile = {
        $schema: 'https://ruagentic.org/schemas/site-1.1.schema.json',
        agentic: '1.1.0',
        type: 'site',
        origin,
        name,
        description:
          description ||
          'Public documentation and API resources for ' + name + '.',
        resources: [...resources.values()].sort(
          (a, b) => a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url),
        ),
        apis: [...apis.values()]
          .filter((api) =>
            [...resources.values()].some(
              (resource) =>
                resource.kind === 'openapi' &&
                resource.url === api.document &&
                resource.availability === 'retrieved',
            ),
          )
          .sort((a, b) => a.document.localeCompare(b.document)),
      };
      // Retain source links when the optional operation index reaches the file-size limit.
      while (
        Buffer.byteLength(JSON.stringify(profile, null, 2)) > 60000 &&
        profile.apis.some((api) => api.operations.length)
      ) {
        profile.apis
          .reduce((a, b) => (a.operations.length > b.operations.length ? a : b))
          .operations.pop();
        if (
          !notes.includes(
            'The operation list was shortened to keep the files compact. Full API details remain at the linked OpenAPI documents.',
          )
        )
          notes.push(
            'The operation list was shortened to keep the files compact. Full API details remain at the linked OpenAPI documents.',
          );
      }
      while (
        Buffer.byteLength(JSON.stringify(profile, null, 2)) > 60000 &&
        profile.resources.length > 1
      ) {
        let index = profile.resources.findLastIndex(
          (resource) => resource.availability === 'linked',
        );
        if (index < 0)
          index = profile.resources.findLastIndex(
            (resource) => resource.kind !== 'website',
          );
        if (index < 0) index = profile.resources.length - 1;
        const [removed] = profile.resources.splice(index, 1);
        profile.apis = profile.apis.filter(
          (api) => api.document !== removed.url || removed.kind !== 'openapi',
        );
        if (
          !notes.includes(
            'Some long source links were omitted to keep the profile below 64 KiB.',
          )
        )
          notes.push(
            'Some long source links were omitted to keep the profile below 64 KiB.',
          );
      }
      const validation = validateSiteProfile(profile);
      if (!validation.valid) throw new Error(validation.errors.join(' '));
    }
    const files = publicationFiles(profile, existing ? existingUrl : undefined);
    if (Object.values(files).some((text) => Buffer.byteLength(text) > 65536))
      throw new Error(
        'A generated file exceeds the 64 KiB limit. Reduce the profile size before generating its publication files.',
      );
    return {
      reportVersion: '1',
      kind: 'public-site-discovery',
      requestedUrl,
      origin,
      observedAt: new Date().toISOString(),
      mode: existing ? 'action' : 'site',
      profile,
      files,
      sources: [...resources.values()],
      observations,
      notes,
      requests,
      bytes,
      budgetUsed,
      limitation:
        'Discovery reads public documents and records advertised connections. It does not execute actions, invoke MCP tools, or establish runtime guarantees.',
    };
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
