'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { NAV_PAGES, navIndexForPathname, shortestCyclicDelta } from '@/lib/site-nav';

/** Directional slide on route change (forward = slide in from the right,
 * back = slide in from the left). Direction is derived once, centrally,
 * from the NAV_PAGES index before/after a pathname change — so swipe,
 * a dot tap, and a plain header <Link> all animate consistently without
 * threading a "direction" value through however navigation happened. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const idx = navIndexForPathname(pathname);
  const prevIndexRef = useRef(idx);
  const direction = Math.sign(shortestCyclicDelta(prevIndexRef.current, idx)) || 1;

  useEffect(() => {
    prevIndexRef.current = idx;
  }, [idx]);

  const pageLabel = NAV_PAGES[idx]?.label ?? '';

  return (
    <>
      <span className="visually-hidden" role="status" aria-live="polite">
        {pageLabel}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={prefersReducedMotion ? false : { x: direction * 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { x: direction * -40, opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
          className="flex flex-col md:flex-1 md:min-h-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
