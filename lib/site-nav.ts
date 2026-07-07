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

/** Shortest signed step count between two page indices on the cyclic
 * 4-page nav (e.g. Contact(3) -> Home(0) is +1, not -3) — a real single
 * swipe is always +-1 in this metric, which is always the unique
 * shortest path, so this recovers the correct swipe direction even
 * across the wraparound. */
export function shortestCyclicDelta(from: number, to: number, length = NAV_PAGES.length): number {
  const raw = to - from;
  const candidates = [raw, raw - length, raw + length];
  return candidates.reduce((best, c) => (Math.abs(c) < Math.abs(best) ? c : best));
}
