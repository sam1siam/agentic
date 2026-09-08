import ProfileGenerator from './profile-generator';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Generate Agentic files',
  description:
    'Enter your website URL. Scan public documentation, APIs, llms.txt, and agent connections to generate agentic.json and agentic.txt automatically.',
  alternates: {
    canonical: 'https://ruagentic.org/generate/',
    types: { 'text/markdown': '/generate/index.md' },
  },
};
export default function GeneratePage() {
  return <ProfileGenerator />;
}
