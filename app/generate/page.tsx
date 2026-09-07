import ProfileGenerator from './profile-generator';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Agent file generators',
  alternates: {
    canonical: 'https://ruagentic.org/generate/',
    types: { 'text/markdown': '/generate/index.md' },
  },
};
export default function GeneratePage() {
  return <ProfileGenerator />;
}
