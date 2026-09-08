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
    default: 'Agentic — Make your website readable to agents',
    template: '%s · Agentic',
  },
  description:
    'Generate agentic.json and agentic.txt from your website’s public documentation, APIs, llms.txt, and agent connections. Publish the files and audit them on your domain.',
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
              <span>agentic</span>
            </Link>
            <nav aria-label="Main navigation">
              <Link href="/generate">Generate</Link>
              <Link href="/spec">Spec</Link>
              <Link href="/audit">Audit</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/about">About</Link>
              <a
                className="nav-github"
                href="https://github.com/sam1siam/agentic"
              >
                GitHub ↗
              </a>
            </nav>
          </header>
        </div>
        <div id="content" tabIndex={-1}>
          {children}
        </div>
        <footer className="site-footer wrap">
          <div>
            <Link href="/" className="footer-brand">
              agentic<span> / </span>ruagentic.org
            </Link>
            <p>Open files. Checkable results.</p>
          </div>
          <div className="footer-links">
            <a href="/agentic.txt">agentic.txt</a>
            <a href="/agentic.json">agentic.json</a>
            <Link href="/docs">Docs</Link>
            <Link href="/connect">Connect an agent</Link>
            <Link href="/platform">Recovery tools</Link>
            <a href="/llms.txt">llms.txt</a>
            <a href="/docs/CHANGELOG.md">Changelog</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
