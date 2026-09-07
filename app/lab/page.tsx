import type { Metadata } from 'next';
import { runComparison } from '@/lib/simulator';
import RecoveryLab from './recovery-lab';
export const metadata: Metadata = {
  title: 'Recovery lab',
  alternates: {
    canonical: 'https://ruagentic.org/lab/',
    types: { 'text/markdown': '/lab/index.md' },
  },
};
export const dynamic = 'force-static';
export default async function LabPage() {
  return <RecoveryLab initial={await runComparison('response-lost')} />;
}
