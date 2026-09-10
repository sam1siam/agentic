import type { Metadata } from 'next';
import PlatformConsole from './platform-console';
export const metadata: Metadata = {
  title: 'Testing platform',
  description:
    'Run recovery checks over HTTP, audit a live profile and inspect the evidence in a private sandbox session.',
  alternates: {
    canonical: 'https://ruagentic.org/platform/',
    types: { 'text/markdown': '/platform/index.md' },
  },
};
export const dynamic = 'force-static';
export default function Page() {
  return <PlatformConsole />;
}
