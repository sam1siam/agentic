import type { Metadata } from 'next';
import PlatformConsole from './platform-console';
export const metadata: Metadata = {
  title: 'Testing platform',
  alternates: {
    canonical: 'https://ruagentic.org/platform/',
    types: { 'text/markdown': '/platform/index.md' },
  },
};
export const dynamic = 'force-static';
export default function Page() {
  return <PlatformConsole />;
}
