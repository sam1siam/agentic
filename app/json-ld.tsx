/** JSON-LD for the convention site: the organisation, the website and the
 *  reference pages. Only public, verifiable facts are emitted. */
const site = 'https://ruagentic.org';

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': site + '/#organization',
  name: 'Agentic',
  url: site + '/',
  logo: site + '/icon-512.png',
  sameAs: ['https://github.com/sam1siam/agentic', 'https://ruagentic.com/'],
};

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': site + '/#website',
  name: 'Agentic',
  url: site + '/',
  description:
    'An open file convention for making websites readable to AI agents: agentic.json, agentic.txt, a generator and an auditor.',
  publisher: { '@id': site + '/#organization' },
};

/** A reference page such as the specification or the documentation index. */
export function techArticleJsonLd(input: {
  path: string;
  headline: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.headline,
    description: input.description,
    url: site + input.path,
    inLanguage: 'en',
    isPartOf: { '@id': site + '/#website' },
    publisher: { '@id': site + '/#organization' },
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
  };
}

export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll('<', '\u003c'),
      }}
    />
  );
}
