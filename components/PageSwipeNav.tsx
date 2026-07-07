'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, type PanInfo } from 'motion/react';
import { NAV_PAGES, navIndexForPathname, isTopLevelNavPath } from '@/lib/site-nav';
import { useIsMobile } from '@/components/use-is-mobile';

const SWIPE_THRESHOLD = 60;

/** Mobile-only swipe-to-navigate between the 4 top-level pages. Reuses
 * the same onPanEnd + touch-pan-y idiom already proven in
 * components/bento/ExpandedProjectView.tsx, so the app has one swipe
 * pattern, not two. Only active on the exact top-level routes (not
 * article detail sub-pages, where horizontal swipe would be surprising
 * during reading and "back" means something different). */
export function PageSwipeNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useIsMobile();
  const navigatingRef = useRef(false);

  useEffect(() => {
    navigatingRef.current = false;
  }, [pathname]);

  function handlePanEnd(event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (!isMobile || navigatingRef.current) return;
    if (!isTopLevelNavPath(pathname)) return;

    const target = event.target;
    if (target instanceof Element && target.closest('[role="dialog"]') !== null) return;

    // Axis guard: don't misread a vertical scroll as a horizontal swipe.
    if (Math.abs(info.offset.x) <= Math.abs(info.offset.y)) return;
    if (Math.abs(info.offset.x) < SWIPE_THRESHOLD) return;

    const idx = navIndexForPathname(pathname);
    const len = NAV_PAGES.length;
    navigatingRef.current = true;
    if (info.offset.x < 0) {
      router.push(NAV_PAGES[(idx + 1) % len].href);
    } else {
      router.push(NAV_PAGES[(idx - 1 + len) % len].href);
    }
  }

  return (
    <motion.div
      className="flex flex-col touch-pan-y md:flex-1 md:min-h-0"
      onPanEnd={handlePanEnd}
    >
      {children}
    </motion.div>
  );
}
