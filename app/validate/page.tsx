import type { Metadata } from 'next';
import ProfileValidator from './profile-validator';
export const metadata: Metadata = {
  title: 'Profile validator',
  description:
    'Check a site or action profile against its versioned schema, with optional OpenAPI binding checks, entirely in your browser.',
  alternates: {
    canonical: 'https://ruagentic.org/validate/',
    types: { 'text/markdown': '/validate/index.md' },
  },
};
export const dynamic = 'force-static';
export default function ValidatePage() {
  return <ProfileValidator />;
}
