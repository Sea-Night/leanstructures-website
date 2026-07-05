'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type HeaderProps = {
  /** Pass "hero-nav" on the homepage so the header floats transparently over the hero. */
  variant?: 'default' | 'hero-nav';
};

export function Header({ variant = 'default' }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className={`site-header${variant === 'hero-nav' ? ' hero-nav' : ''}`}>
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
        <Link href="/#contact">Contact</Link>
      </nav>
    </header>
  );
}
