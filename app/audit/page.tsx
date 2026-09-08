import AuditForm from './audit-form';
export const dynamic = 'force-static';
export const metadata = {
  title: 'Audit',
  description:
    'Check your Agentic files, their API links, and whether the text index matches the JSON.',
  alternates: {
    canonical: 'https://ruagentic.org/audit/',
    types: { 'text/markdown': '/audit/index.md' },
  },
};
export default function AuditPage() {
  return <AuditForm />;
}
