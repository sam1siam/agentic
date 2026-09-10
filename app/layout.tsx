import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { BrandMark } from './brand';
import { SiteNav, UtcClock } from './clock';
const ui = Instrument_Sans({ variable: '--font-ui', subsets: ['latin'] });
const code = JetBrains_Mono({ variable: '--font-code', subsets: ['latin'] });
export const metadata: Metadata = {
  metadataBase: new URL('https://ruagentic.org'),
  applicationName: 'Agentic',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
  title: {
    default: 'Agentic — Make your website readable to agents',
    template: '%s · Agentic',
  },
  description:
    'Generate agentic.json, agentic.txt, README, and listing text from your website’s public documentation, APIs, llms.txt, and agent connections. Publish the files and audit them on your domain.',
  // Titles and descriptions are inherited per page; one site image serves
  // every page of the static export.
  openGraph: {
    type: 'website',
    siteName: 'Agentic',
    locale: 'en_US',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Agentic — make your website readable to agents',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#05080c' };
const navigation = [
  ['Generate', '/generate'],
  ['Spec', '/spec'],
  ['Audit', '/audit'],
  ['Compare', '/compare'],
  ['Docs', '/docs'],
  ['About', '/about'],
] as const;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={ui.variable + ' ' + code.variable}>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div className="telemetry-strip">
          <span className="telemetry-live">
            <i className="live-dot" aria-hidden="true" />
            OPEN CONVENTION
          </span>
          <span>
            SITE PROFILE <b>1.1</b>
          </span>
          <span>
            ACTION PROFILE <b>1.0</b>
          </span>
          <span>
            TOOLS <b>1.3.0</b>
          </span>
          <span className="telemetry-gap" />
          <UtcClock />
          <a className="telemetry-accent" href="/docs/CHANGELOG.md">
            CHANGELOG
          </a>
        </div>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Agentic home">
            <BrandMark />
            AGENTIC<span className="brand-label">ORG</span>
          </Link>
          <SiteNav items={navigation} />
          <div className="header-actions">
            <a
              className="header-link"
              href="https://github.com/sam1siam/agentic"
            >
              GitHub ↗
            </a>
            <Link href="/generate" className="button primary">
              Generate files →
            </Link>
          </div>
        </header>
        <div id="content" className="site-main" tabIndex={-1}>
          <div className="light-field" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          {children}
        </div>
        <footer className="site-footer">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="brand">
                <BrandMark />
                AGENTIC<span className="brand-label">ORG</span>
              </Link>
              <p>Open files. Checkable results.</p>
              <code className="footer-command">
                <span className="prompt">$</span>
                curl ruagentic.org/agentic.json
              </code>
            </div>
            <div className="footer-column">
              <h2>Files</h2>
              <a href="/agentic.txt">agentic.txt</a>
              <a href="/agentic.json">agentic.json</a>
              <a href="/llms.txt">llms.txt</a>
            </div>
            <div className="footer-column">
              <h2>Use</h2>
              <Link href="/generate">Generate</Link>
              <Link href="/audit">Audit</Link>
              <Link href="/validate">Validate</Link>
              <Link href="/platform">Recovery tools</Link>
              <Link href="/lab">Recovery lab</Link>
            </div>
            <div className="footer-column">
              <h2>Project</h2>
              <Link href="/docs">Docs</Link>
              <Link href="/spec">Specification</Link>
              <Link href="/connect">Connect an agent</Link>
              <Link href="/about">About</Link>
              <a href="/docs/CHANGELOG.md">Changelog</a>
              <a href="https://github.com/sam1siam/agentic">GitHub</a>
            </div>
          </div>
          <div className="footer-bottom">
            <b>AGENTIC</b>
            <span>RUAGENTIC.ORG</span>
            <span>APACHE-2.0</span>
            <span className="telemetry-gap" />
            <a href="https://ruagentic.com">DIRECTORY · RUAGENTIC.COM</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
