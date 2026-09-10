'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/** UTC clock for the telemetry strip; the server renders a placeholder. */
export function UtcClock() {
  const [time, setTime] = useState('--:--:--');
  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().slice(11, 19));
    const timer = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, []);
  return (
    <time className="utc-clock" aria-label={`UTC time ${time}`}>
      UTC {time}
    </time>
  );
}

/** Main navigation with the current page marked. */
export function SiteNav({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  const pathname = usePathname() ?? '';
  return (
    <nav className="site-nav" aria-label="Main navigation">
      {items.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          aria-current={
            pathname === href || pathname.startsWith(href + '/')
              ? 'page'
              : undefined
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
