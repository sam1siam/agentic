import ProfileGenerator from './profile-generator';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Profile generator',
  alternates: {
    canonical: 'https://ruagentic.org/generate/',
    types: { 'text/markdown': '/generate/index.md' },
  },
};
export default function GeneratePage() {
  return <ProfileGenerator />;
}
