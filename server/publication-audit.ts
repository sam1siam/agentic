import { projectReferences } from '../lib/publication.ts';
import { siteUrl } from '../lib/site-profile.ts';
import type { AuditCheck, readPublic } from './audit.ts';

type Observation = {
  url: string;
  status?: number;
  contentType?: string;
  bytes?: number;
  error?: string;
};
export type ReadmeReport = {
  url: string;
  providedByUser: boolean;
  status: 'matched' | 'incomplete' | 'missing' | 'unavailable' | 'invalid';
  checks: AuditCheck[];
  observations: Observation[];
};
export function normalizeReadmeUrl(value: string) {
  const text = value.trim();
  if (!text)
    throw new Error(
      'Provide a public raw README.md URL, or leave it empty to check beside agentic.json.',
    );
  return siteUrl(
    /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : 'https://' + text,
  ).href;
}

/** Extract visible Markdown/HTML link destinations; never follow them. */
export function readmeLinks(source: string, base: string) {
  if (Buffer.byteLength(source) > 65536)
    throw new Error('README.md exceeds 64 KiB.');
  let fence = '';
  const visible = source
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(
      /<(script|style|pre|code|textarea|xmp|template)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi,
      '',
    )
    .split(/\r?\n/)
    .filter((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
          fence = '';
        return false;
      }
      return !fence && !/^(?: {4}|\t)/.test(line);
    })
    .join('\n')
    .replace(/`+[^`\n]*`+/g, '');
  const links = new Set<string>();
  const add = (target: string) => {
    try {
      const decoded = target.replace(/&amp;/g, '&').replace(/^<|>$/g, '');
      const url = new URL(decoded, base);
      if (url.protocol === 'https:' && !url.username && !url.password)
        links.add(url.href);
    } catch {}
  };
  // Consume complete attribute values so data-href and quoted text cannot impersonate href.
  const markdown = visible
    .replace(
      /<a\b(?:"[^"\n]{0,4096}"|'[^'\n]{0,4096}'|[^'">]){0,4096}>/gi,
      (tag) => {
        const attributes = tag.slice(2, -1);
        const token =
          /\s+([^\s=/>]+)(?:\s*=\s*(?:"([^"\n]*)"|'([^'\n]*)'|([^\s>]+)))?/gy;
        let match;
        let href: string | undefined;
        let hidden = false;
        while ((match = token.exec(attributes))) {
          const name = match[1].toLowerCase();
          if (name === 'href' && href === undefined)
            href = match[2] ?? match[3] ?? match[4] ?? '';
          if (name === 'hidden') hidden = true;
        }
        if (!hidden && href && href.length <= 2048) add(href);
        return '';
      },
    )
    .replace(/<[^>\n]{0,4096}>/g, (tag) => {
      return /^<https:\/\/[^<>\s]{1,2048}>$/.test(tag) ? tag : '';
    })
    .replace(/\\[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, ' ');
  // Every token is bounded; consume titles and images before looking for more links.
  const withoutImages = markdown.replace(
    /!\[[^\]\n]{0,300}\](?:\([^\n)]{0,2400}\)|\[[^\]\n]{0,160}\])?/g,
    '',
  );
  const withoutInline = withoutImages.replace(
    /\[[^\]\n]{0,300}\]\(\s*(<[^>\n]{1,2048}>|[^\s)\n]{1,2048})(?:\s+(?:"[^"\n]{0,2048}"|'[^'\n]{0,2048}'|\([^()\n]{0,2048}\)))?\s*\)/g,
    (_match, target: string) => {
      add(target);
      return '';
    },
  );
  const referenced = new Set<string>();
  const referenceBody = withoutInline.replace(
    /^ {0,3}\[[^\]\n]{1,160}\]:[^\n]*$/gm,
    '',
  );
  for (const match of referenceBody.matchAll(
    /(?<!!)\[([^\]\n]{1,160})\](?:\[([^\]\n]{0,160})\])?(?![:(])/g,
  ))
    referenced.add((match[2] || match[1]).toLowerCase());
  const defined = new Set<string>();
  for (const match of markdown.matchAll(
    /^ {0,3}\[([^\]\n]{1,160})\]:\s*(<[^>\n]{1,2048}>|\S{1,2048})/gm,
  )) {
    const label = match[1].toLowerCase();
    if (!defined.has(label) && referenced.has(label)) add(match[2]);
    defined.add(label);
  }
  for (const match of referenceBody.matchAll(/<https:\/\/[^<>\s]{1,2048}>/g))
    add(match[0]);
  return links;
}

export async function auditReadme(
  profileUrl: URL,
  reader: typeof readPublic,
  provided?: string,
): Promise<ReadmeReport> {
  const target = provided
    ? normalizeReadmeUrl(provided)
    : new URL('README.md', profileUrl).href;
  const result: ReadmeReport = {
    url: target,
    providedByUser: !!provided,
    status: 'unavailable',
    checks: [],
    observations: [],
  };
  const add = (
    id: string,
    label: string,
    status: AuditCheck['status'],
    detail: string,
    remedy?: string,
  ) =>
    result.checks.push({
      id,
      label,
      status,
      detail,
      ...(remedy ? { remedy } : {}),
      helpUrl: 'https://ruagentic.org/docs/PUBLICATION.md',
    });
  const read = async (url: string) => {
    try {
      const response = await reader(url, 65536);
      result.observations.push({
        url,
        status: response.status,
        contentType: String(response.headers['content-type'] ?? ''),
        bytes: Buffer.byteLength(response.text),
      });
      return response;
    } catch (error) {
      result.observations.push({
        url,
        error: error instanceof Error ? error.message : 'Read failed.',
      });
      throw error;
    }
  };
  let response;
  try {
    response = await read(target);
    if (response.status === 404 && !provided) {
      const fallback = new URL('readme.md', profileUrl).href;
      const alternate = await read(fallback);
      if (alternate.status !== 404) {
        response = alternate;
        result.url = fallback;
      }
    }
    if (response.status === 404) {
      result.status = 'missing';
      add(
        'readme',
        'README.md',
        'warn',
        'No public README.md was found beside the profile.',
        'Download README.md from the generator, merge it with your existing README, and publish it at ' +
          target +
          '. If it is hosted elsewhere, enter its raw Markdown URL in the audit form.',
      );
      return result;
    }
    if (response.status !== 200)
      throw new Error('README.md returned HTTP ' + response.status + '.');
    const contentType = String(response.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (
      contentType === 'text/html' ||
      /^\s*(?:<!doctype\s+html|<html\b)/i.test(response.text)
    ) {
      result.status = 'invalid';
      add(
        'readme',
        'README.md',
        'warn',
        'The URL returns an HTML page instead of raw README text.',
        'Serve README.md as text/markdown or text/plain. For a GitHub README, use its Raw URL rather than the repository page.',
      );
      return result;
    }
    if (response.text.trim().length < 20) {
      result.status = 'incomplete';
      add(
        'readme',
        'README.md',
        'warn',
        'The README is empty or too short to describe this publication.',
        'Generate README.md and merge its service description, file links, and project references into your README.',
      );
      return result;
    }
    add(
      'readme',
      'README.md',
      'pass',
      'Public README text is available at ' + result.url + '.',
    );
    const links = readmeLinks(response.text, result.url);
    for (const [id, label, expected] of [
      ['json', 'JSON profile', profileUrl.href],
      ['txt', 'TXT index', new URL('agentic.txt', profileUrl).href],
    ] as const) {
      const found = links.has(expected);
      const conflicting =
        !found &&
        [...links].some((href) =>
          new URL(href).pathname.endsWith(
            id === 'json' ? '/agentic.json' : '/agentic.txt',
          ),
        );
      add(
        'readme:' + id,
        'README ' + label + ' link',
        found ? 'pass' : conflicting ? 'fail' : 'warn',
        found
          ? 'The README links to ' + expected + '.'
          : conflicting
            ? 'The README links to a different ' +
              label.toLowerCase() +
              ' location.'
            : 'The README is missing a link to this ' +
              label.toLowerCase() +
              '.',
        found
          ? undefined
          : 'Add or correct a visible Markdown link: [' +
              (id === 'json' ? 'agentic.json' : 'agentic.txt') +
              '](' +
              expected +
              '). Links inside code examples do not count.',
      );
    }
    for (const reference of projectReferences) {
      const found = [...links].some(
        (href) => new URL(href).origin === reference.url,
      );
      add(
        'readme:' + reference.role,
        'README ' + reference.name + ' reference',
        found ? 'pass' : 'warn',
        found
          ? 'A visible link to ' + reference.url + ' is present.'
          : 'The README does not link to ' + reference.url + '.',
        found
          ? undefined
          : 'Add [' +
              reference.name +
              '](' +
              reference.url +
              ') with this description: ' +
              reference.description,
      );
    }
    if (/\.me$/i.test(new URL(result.url).pathname))
      add(
        'readme:filename',
        'README filename',
        'warn',
        'The supplied file uses the .me extension.',
        'Use README.md for Markdown documentation and update its public URL.',
      );
    result.status = result.checks.every((check) => check.status === 'pass')
      ? 'matched'
      : 'incomplete';
    return result;
  } catch (error) {
    add(
      'readme',
      'README.md',
      'warn',
      error instanceof Error ? error.message : 'README.md could not be read.',
      'Check that the raw README is public, uses HTTPS, stays within 64 KiB, and can be fetched without redirects or login. Retry or supply its final raw URL.',
    );
    return result;
  }
}

function remedyFor(check: AuditCheck, profileUrl: string) {
  if (check.id === 'json')
    return (
      'Generate agentic.json, publish it at ' +
      profileUrl +
      ' as application/json, and run the audit again. If the server is unavailable, restore public access first.'
    );
  if (check.id === 'structure')
    return 'Open the generator or local validator, correct the reported fields for the declared profile version, and publish the corrected JSON.';
  if (check.id === 'origin')
    return 'Set origin to the exact HTTPS origin serving this profile, or publish the profile on its declared origin. Regenerate the companion files.';
  if (check.id === 'txt')
    return 'Regenerate agentic.txt from the current JSON and exact profile URL, then publish it beside agentic.json. The generator includes the matching file.';
  if (
    check.id.startsWith('api:') ||
    check.id.startsWith('resource:') ||
    check.id === 'bindings'
  )
    return 'Open the reported public document URL, fix access or the mismatched operations, and regenerate the profile. Validate action bindings against the actual OpenAPI document.';
  if (check.id === 'limit')
    return 'Validate the remaining documents separately; this audit checks up to five linked API/document URLs.';
  if (check.id === 'linked')
    return 'Use the linked protocol documentation to test a connection separately under your own authorization. This file audit does not invoke it.';
  return check.detail;
}
export function publicationSummary(
  core: {
    valid: boolean;
    profileUrl: string;
    textIndex: { status: string };
    checks: AuditCheck[];
  },
  readme: ReadmeReport,
) {
  const checks = [...core.checks, ...readme.checks].map((check) => ({
    ...check,
    ...(check.status !== 'pass'
      ? {
          remedy: check.remedy ?? remedyFor(check, core.profileUrl),
          helpUrl: check.helpUrl ?? 'https://ruagentic.org/docs/PUBLICATION.md',
        }
      : {}),
  }));
  const issues = checks.filter(
    (check) => check.status !== 'pass' && check.id !== 'linked',
  );
  const failed = !core.valid || issues.some((check) => check.status === 'fail');
  const status = failed
    ? 'failed'
    : issues.length ||
        core.textIndex.status !== 'matched' ||
        readme.status !== 'matched'
      ? 'partial'
      : 'successful';
  return {
    checks,
    publication: {
      status,
      summary:
        status === 'successful'
          ? 'The JSON, TXT, and README checks passed.'
          : status === 'partial'
            ? 'The profile is usable, but its publication is incomplete. Follow the steps below.'
            : 'One or more checks failed. Correct the reported problems and run the audit again.',
      nextSteps: issues.map((check) => ({
        id: check.id,
        label: check.label,
        detail: check.detail,
        remedy: check.remedy!,
        helpUrl: check.helpUrl!,
      })),
      files: [
        {
          name: 'agentic.json',
          url: core.profileUrl,
          status: core.valid ? 'passed' : 'failed',
        },
        {
          name: 'agentic.txt',
          url: new URL('agentic.txt', core.profileUrl).href,
          status: core.textIndex.status,
        },
        { name: 'README.md', url: readme.url, status: readme.status },
      ],
    },
  };
}
