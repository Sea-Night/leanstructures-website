'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Rendered once in app/layout.tsx (outside the per-page transitioning
 * tree) so it never remounts on navigation — it derives everything it
 * needs (the transparent hero-nav styling, aria-current) from the route
 * itself rather than being re-supplied by each page. */
export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className={`site-header${isHome ? ' hero-nav' : ''}`}>
      <Link href="/" className="logo">
        <span className="logo-lean">LEAN</span>
        <span className="logo-structures">structures</span>
      </Link>
      <nav>
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
          Home
        </Link>
        <Link href="/projects" aria-current={pathname === '/projects' ? 'page' : undefined}>
          Projects
        </Link>
        <Link href="/articles" aria-current={pathname?.startsWith('/articles') ? 'page' : undefined}>
          Articles
        </Link>
        <Link href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined}>
          Contact
        </Link>
      </nav>
    </header>
  );
}
