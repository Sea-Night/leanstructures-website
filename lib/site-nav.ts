/** Single source of truth for the site's 4 top-level pages — Header, the
 * mobile nav dots, the swipe handler, and the page transition all read
 * from this so direction/position logic never has to be duplicated. */

export type NavPage = { href: string; label: string };

export const NAV_PAGES: NavPage[] = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/articles', label: 'Articles' },
  { href: '/contact', label: 'Contact' },
];

/** Exact match first; falls back to a prefix match (e.g. an article
 * detail page at /articles/[slug] still highlights the Articles page)
 * without enabling swipe-nav there — callers check the exact route
 * separately when that distinction matters. */
export function navIndexForPathname(pathname: string | null): number {
  if (!pathname) return 0;
  const exact = NAV_PAGES.findIndex((p) => p.href === pathname);
  if (exact !== -1) return exact;
  const prefixed = NAV_PAGES.findIndex((p) => p.href !== '/' && pathname.startsWith(p.href));
  return prefixed !== -1 ? prefixed : 0;
}

export function isTopLevelNavPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return NAV_PAGES.some((p) => p.href === pathname);
}
