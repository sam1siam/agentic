import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
export const metadata: Metadata = {
  title: {
    default: 'Agentic — Actions need outcomes',
    template: '%s · Agentic',
  },
  description:
    'An experimental open convention for AI agents to verify actions and recover from interrupted requests. Read the draft, validate a profile, and run the recovery lab.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geistSans.variable + ' ' + geistMono.variable}>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <header className="site-header wrap">
          <Link className="wordmark" href="/" aria-label="Agentic home">
            <span className="brand-mark">a›</span>agentic
            <span className="draft-tag">DRAFT</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/spec">Specification</Link>
            <Link href="/lab">Recovery lab</Link>
            <Link href="/validate">Validator</Link>
            <Link href="/adopt">Get involved ↗</Link>
          </nav>
        </header>
        <div id="content">{children}</div>
        <footer className="site-footer wrap">
          <div>
            <Link href="/" className="footer-brand">
              agentic<span> / </span>ruagentic.org
            </Link>
            <p>Experimental proposal. Open for implementation and critique.</p>
          </div>
          <div className="footer-links">
            <a href="/docs/SPEC.md">Draft source</a>
            <a href="/docs/GOVERNANCE.md">Governance</a>
            <a href="/docs/PRIOR-ART.md">Prior work</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
