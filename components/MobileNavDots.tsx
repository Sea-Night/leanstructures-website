'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_PAGES, navIndexForPathname } from '@/lib/site-nav';

/** Mobile-only replacement for the header's logo/nav: a row of dots, one
 * per top-level page. Plain <Link>s (not router.push) so keyboard Tab/
 * Enter navigation and browser affordances (prefetch, open-in-new-tab)
 * work for free, and so direction detection can live centrally in
 * PageTransition rather than being duplicated into a click handler here. */
export function MobileNavDots() {
  const pathname = usePathname();
  const activeIndex = navIndexForPathname(pathname);

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      <ul>
        {NAV_PAGES.map((page, i) => (
          <li key={page.href}>
            <Link
              href={page.href}
              aria-current={i === activeIndex ? 'page' : undefined}
              aria-label={page.label}
              className="mobile-nav-dot"
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
