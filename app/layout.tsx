import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { BrandMark } from './brand';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
export const metadata: Metadata = {
  metadataBase: new URL('https://ruagentic.org'),
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
  title: {
    default: 'Agentic — A verifiable outcome for agent actions',
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
        <div className="header-shell">
          <header className="site-header wrap">
            <Link className="wordmark" href="/" aria-label="Agentic home">
              <BrandMark />
              <span>
                agentic<span className="extension">.json</span>
              </span>
            </Link>
            <nav aria-label="Main navigation">
              <Link href="/spec">Specification</Link>
              <Link href="/examples">Examples</Link>
              <Link href="/validate">Validator</Link>
              <Link href="/platform">Platform</Link>
              <Link href="/docs">Docs</Link>
              <Link href="/adopt">Get started</Link>
              <a
                className="nav-github"
                href="https://github.com/sam1siam/agentic"
              >
                GitHub ↗
              </a>
            </nav>
          </header>
        </div>
        <div id="content">{children}</div>
        <footer className="site-footer wrap">
          <div>
            <Link href="/" className="footer-brand">
              agentic<span> / </span>ruagentic.org
            </Link>
            <p>Experimental proposal. Open for implementation and critique.</p>
          </div>
          <div className="footer-links">
            <a href="/llms.txt">llms.txt</a>
            <a href="/docs/CHANGELOG.md">Changelog</a>
            <a href="/docs/GOVERNANCE.md">Governance</a>
            <a href="/docs/BRAND.md">Brand assets</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
