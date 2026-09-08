import ProfileGenerator from './profile-generator';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Generate Agentic files',
  description:
    'Create agentic.txt and agentic.json together. Customize an action or import OpenAPI, then copy or download both files.',
  alternates: {
    canonical: 'https://ruagentic.org/generate/',
    types: { 'text/markdown': '/generate/index.md' },
  },
};
export default function GeneratePage() {
  return <ProfileGenerator />;
}
