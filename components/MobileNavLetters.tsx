'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { NAV_PAGES, navIndexForPathname } from '@/lib/site-nav';

const LETTERS = ['H', 'P', 'A', 'C'];

// Same rose <-> teal loop as ArchitectLink elsewhere on the site, so the
// two "slow color fade" moments in the app read as one house style.
const PULSE_COLORS = ['#C0596A', '#2E7A6E', '#C0596A'];

/** Mobile-only replacement for the header's text nav: 4 single-letter
 * links (Home/Projects/Articles/Contact). The current page's letter
 * slowly scales and fades between the brand's rose and teal accents —
 * the same idiom ArchitectLink already uses elsewhere — while the
 * other three sit at a plain, static ink color. */
export function MobileNavLetters() {
  const pathname = usePathname();
  const activeIndex = navIndexForPathname(pathname);
  const prefersReducedMotion = useReducedMotion();

  return (
    <nav aria-label="Page navigation" className="mobile-nav-letters">
      {NAV_PAGES.map((page, i) => {
        const isActive = i === activeIndex;
        const pulsing = isActive && !prefersReducedMotion;

        return (
          <Link
            key={page.href}
            href={page.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={page.label}
            className="mobile-nav-letter"
          >
            <motion.span
              animate={
                pulsing
                  ? { scale: [1, 1.18, 1], color: PULSE_COLORS }
                  : { scale: 1, color: isActive ? 'var(--accent-rose)' : 'var(--ink)' }
              }
              transition={pulsing ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
              style={{ display: 'inline-block' }}
            >
              {LETTERS[i]}
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}
