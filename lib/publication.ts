import { buildActionIndex, profileFiles } from './action-index.ts';
import { isSiteProfile, type SiteProfile } from './site-profile.ts';
import type { Profile } from './types.ts';

export const projectReferences = [
  {
    role: 'specification',
    name: 'Agentic',
    url: 'https://ruagentic.org',
    description:
      'Agentic is the open file convention for describing websites, APIs, and agent connections, with specifications and tools for generation, validation, auditing, and action-result verification.',
  },
  {
    role: 'directory',
    name: 'RUAGENTIC',
    url: 'https://ruagentic.com',
    description:
      'RUAGENTIC is the official Agentic directory for agentic AI MCP servers and tools.',
  },
] as const;

/** TXT 1.2 adds project references without changing either JSON contract. */
export function buildPublicationIndex(
  profile: unknown,
  profileUrl?: string,
  allowLocal = false,
) {
  const canonical = buildActionIndex(profile, profileUrl, allowLocal);
  const result =
    canonical.replace(/^Agentic-Text: 1\.[01]$/m, 'Agentic-Text: 1.2') +
    '\n' +
    projectReferences
      .flatMap((reference) => [
        'Reference: ' +
          [reference.role, reference.name, reference.url]
            .map((value) => JSON.stringify(value))
            .join(' '),
        'Reference-Description: ' + JSON.stringify(reference.description),
        '',
      ])
      .join('\n');
  if (new TextEncoder().encode(result).length > 65536)
    throw new Error('Generated TXT exceeds 64 KiB. Shorten the profile.');
  return result;
}

export function matchesTextIndex(
  text: string,
  profile: unknown,
  profileUrl?: string,
  allowLocal = false,
) {
  return (
    text === buildActionIndex(profile, profileUrl, allowLocal) ||
    text === buildPublicationIndex(profile, profileUrl, allowLocal)
  );
}

function prose(value: string, limit = 600) {
  return value
    .replace(
      // oxlint-disable-next-line no-control-regex -- strips control, zero-width and bidi characters
      /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*{}[\]()!|#]/g, '\\$&');
}
function link(label: string, url: string) {
  return (
    '[' +
    prose(label, 200) +
    '](' +
    new URL(url).href.replace(/[()]/g, (character) =>
      encodeURIComponent(character).replace('(', '%28').replace(')', '%29'),
    ) +
    ')'
  );
}
function details(input: unknown, profileUrl?: string) {
  // This also validates the profile and its explicit publication URL.
  profileFiles(input, profileUrl);
  const profile = input as Profile | SiteProfile;
  const url = new URL(profileUrl ?? profile.origin + '/agentic.json');
  const site = isSiteProfile(profile);
  return {
    profile,
    url,
    site,
    name: site ? profile.name : new URL(profile.origin).hostname,
    description: site
      ? profile.description
      : 'Service actions with request tracking and result verification.',
    resources: site ? profile.resources : [],
    operations: site
      ? profile.apis.reduce((total, api) => total + api.operations.length, 0)
      : profile.actions.length,
  };
}
export function attributionMarkdown() {
  return projectReferences
    .map(
      (reference) =>
        '- **' +
        link(reference.name, reference.url) +
        '** — ' +
        reference.description,
    )
    .join('\n');
}
export function buildReadme(input: unknown, profileUrl?: string) {
  const { profile, url, site, name, description, resources, operations } =
    details(input, profileUrl);
  const selected = resources
    .filter(
      (resource) => resource.kind !== 'website' && resource.kind !== 'agentic',
    )
    .slice(0, 12);
  const result = [
    '# ' + prose(name, 160),
    '',
    prose(description),
    '',
    'Website: ' + link(profile.origin, profile.origin),
    '',
    '## Agentic files',
    '',
    '- ' +
      link('agentic.json', url.href) +
      ' — structured ' +
      (site ? 'site information' : 'action contract') +
      '.',
    '- ' +
      link('agentic.txt', new URL('agentic.txt', url).href) +
      ' — readable index with specification and directory references.',
    '',
    site
      ? `This Site Profile ${profile.agentic} indexes ${resources.length} public resources and ${operations} documented API operations. Resource records distinguish documents that were read from connections that were only advertised.`
      : `This Action Profile ${profile.agentic} describes ${operations} actions. Its service must implement the published request tracking, status lookup, and result-verification contract.`,
    '',
    '## Documentation and connections',
    '',
    ...selected.map(
      (resource) =>
        '- ' +
        link(resource.title ?? resource.kind, resource.url) +
        ' — ' +
        resource.kind +
        '; ' +
        (resource.availability === 'retrieved'
          ? 'document retrieved'
          : 'advertised link; connection not tested') +
        '.',
    ),
    ...(resources.length > selected.length
      ? ['', 'See agentic.json for the complete published resource index.']
      : []),
    ...(!site
      ? (profile as Profile).actions.map(
          (action) =>
            '- **' +
            prose(action.id, 80) +
            '** — ' +
            prose(action.description) +
            ' ' +
            link('OpenAPI', new URL(action.openapi, profile.origin).href),
        )
      : []),
    ...(site && !selected.length
      ? ['Use the website link above for the available public documentation.']
      : []),
    '',
    '## Publish and keep the files current',
    '',
    '1. Publish agentic.json and agentic.txt at the URLs above. Keep their filenames and profile location consistent.',
    '2. Merge the relevant sections of this README into your existing README.md. Keep project-specific installation, authentication, licensing, and usage instructions.',
    '3. Serve a public README.md beside the Agentic files, or give its public raw Markdown URL to the auditor. Use README.md, not README.me.',
    '4. Run ' +
      link('the Agentic audit', 'https://ruagentic.org/audit/') +
      ' and follow any reported fixes. Regenerate after your public documentation changes.',
    '',
    'Local tools (Node 24+):',
    '',
    '```sh',
    'npm install -g ruagentic@1.3.0',
    'agentic validate agentic.json',
    'agentic text agentic.json --check',
    '```',
    '',
    site
      ? 'The index is descriptive. Follow the linked API or protocol documentation for supported clients, transport, authentication, parameters, and responses. Do not infer idempotency or recovery guarantees from endpoint names.'
      : 'Also validate this action profile against its OpenAPI document and test service behavior. The files do not implement authorization, idempotency, or recovery by themselves.',
    '',
    '## Specification and directory',
    '',
    attributionMarkdown(),
    '',
    'These references identify the convention and its directory. Publishing these files does not submit a listing, certify the service, or establish an affiliation with another directory.',
    '',
    '## Directory listing text',
    '',
    'Use the accompanying LISTING.md for a reusable title, description, website, documentation, and advertised connection links. Review any directory-specific requirements before submitting.',
    '',
  ].join('\n');
  if (new TextEncoder().encode(result).length > 65536)
    throw new Error(
      'Generated README exceeds 64 KiB. Shorten the profile descriptions.',
    );
  return result;
}
export function buildListing(input: unknown, profileUrl?: string) {
  const { profile, url, site, name, description, resources, operations } =
    details(input, profileUrl);
  return [
    '# Listing information for ' + prose(name, 160),
    '',
    '## Title',
    '',
    prose(name, 160),
    '',
    '## Short description',
    '',
    prose(description, 240),
    '',
    '## Full description',
    '',
    prose(description),
    '',
    site
      ? `Publishes an Agentic site profile with ${resources.length} public resources and ${operations} documented API operations. The profile identifies public documents and advertised agent connections with source provenance.`
      : `Publishes an Agentic action contract for ${operations} service actions, including request-status lookup and result verification.`,
    '',
    '## Links',
    '',
    '- Website: ' + link(profile.origin, profile.origin),
    '- Agentic JSON: ' + link('agentic.json', url.href),
    '- Agentic TXT: ' + link('agentic.txt', new URL('agentic.txt', url).href),
    ...resources
      .filter((resource) =>
        ['documentation', 'openapi', 'mcp', 'a2a', 'agent-auth'].includes(
          resource.kind,
        ),
      )
      .slice(0, 12)
      .map(
        (resource) =>
          '- ' +
          prose(resource.kind) +
          ': ' +
          link(resource.title ?? resource.url, resource.url) +
          ' (' +
          (resource.availability === 'retrieved'
            ? 'document read'
            : 'advertised; not connection-tested') +
          ').',
      ),
    '',
    '## Agentic references',
    '',
    attributionMarkdown(),
    '',
    '## Complete before submitting',
    '',
    'Confirm the repository URL, license, owner/contact details, MCP transport, required credentials or OAuth, supported clients, installation steps, and working usage examples from your service documentation. These are not inferred from an endpoint link.',
    '',
    'This is portable listing copy for RUAGENTIC, Smithery, MCP Playground, or another directory. It is not a submitted listing or a provider-specific configuration file. Each directory sets its own requirements.',
    '',
  ].join('\n');
}
export function publicationFiles(profile: unknown, profileUrl?: string) {
  const files = {
    ...profileFiles(profile, profileUrl),
    'agentic.txt': buildPublicationIndex(profile, profileUrl),
    'README.md': buildReadme(profile, profileUrl),
    'LISTING.md': buildListing(profile, profileUrl),
  };
  for (const [name, content] of Object.entries(files))
    if (new TextEncoder().encode(content).length > 65536)
      throw new Error(
        'Generated ' + name + ' exceeds 64 KiB. Shorten the profile.',
      );
  return files;
}
