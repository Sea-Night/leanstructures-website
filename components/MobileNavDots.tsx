'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { NAV_PAGES, navIndexForPathname, shortestCyclicDelta, type NavPage } from '@/lib/site-nav';
import { hypocycloidPoint } from '@/lib/hypocycloid';

const HALF_PI = Math.PI / 2;
const R = 70; // astroid radius driving the mid-swing bulge, px
const NUM_SLOTS = 4;

// 4 fixed on-screen rest slots, arced across the header (right ~60%,
// leaving room for the shrunk logo at top-left). Every dot always sits
// in one of these; navigation rotates *which* dot occupies which slot.
const SLOTS = [
  { x: 150, y: 26 },
  { x: 220, y: 14 },
  { x: 290, y: 14 },
  { x: 360, y: 26 },
];

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

/** A point on the hypocycloid's connecting arc between two (possibly
 * non-adjacent) cusps, "detrended" so it's exactly (0,0) at p=0 and p=1 —
 * the raw curve's own endpoints are distinct cusps, so we subtract the
 * straight-line component between them and are left with a pure bulge to
 * layer on top of a plain lerp between two fixed screen slots. This is
 * what guarantees a dot always lands exactly on a slot at rest, at any
 * step size, while still sweeping along the curve's natural shape. */
function bulge(p: number, totalAngle: number) {
  const h = (t: number) => hypocycloidPoint(t * totalAngle, R);
  const h0 = h(0);
  const h1 = h(1);
  const cur = h(p);
  return {
    x: cur.x - (h0.x + p * (h1.x - h0.x)),
    y: cur.y - (h0.y + p * (h1.y - h0.y)),
  };
}

type AnimRef = MutableRefObject<{ from: number; delta: number }>;

/** Mobile-only replacement for the header's logo/nav: 4 dots arced across
 * the top. Rendered as a position:fixed overlay mounted in app/layout.tsx
 * (outside PageTransition's animated wrapper — that wrapper applies a CSS
 * transform mid-slide, which would otherwise re-anchor any fixed-position
 * descendant to itself instead of the viewport). A swipe or dot tap
 * rotates every dot by one (or more) slots along a shared hypocycloid
 * bulge, landing exactly back on the arc every time — including across
 * the Contact<->Home wraparound, which is just another slot rotation. */
export function MobileNavDots() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navIndexForPathname(pathname);
  const prevIndexRef = useRef(activeIndex);
  const shiftRef = useRef(0); // accumulated slot rotation once settled (integer)
  const animRef: AnimRef = useRef({ from: 0, delta: 0 });
  const p = useMotionValue(1); // 0..1 progress through the current rotation

  useEffect(() => {
    const delta = shortestCyclicDelta(prevIndexRef.current, activeIndex);
    prevIndexRef.current = activeIndex;
    animRef.current = { from: shiftRef.current, delta };

    if (prefersReducedMotion) {
      shiftRef.current += delta;
      p.set(1);
    } else {
      p.set(0);
      animate(p, 1, {
        duration: 0.6,
        ease: 'easeInOut',
        onComplete: () => {
          shiftRef.current += delta;
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      <ul>
        {NAV_PAGES.map((page, i) => (
          <DotLink
            key={page.href}
            page={page}
            index={i}
            isActive={i === activeIndex}
            p={p}
            animRef={animRef}
          />
        ))}
      </ul>
    </nav>
  );
}

function DotLink({
  page,
  index,
  isActive,
  p,
  animRef,
}: {
  page: NavPage;
  index: number;
  isActive: boolean;
  p: MotionValue<number>;
  animRef: AnimRef;
}) {
  const x = useTransform(p, (progress) => {
    const { from, delta } = animRef.current;
    const start = SLOTS[mod(index + from, NUM_SLOTS)];
    const end = SLOTS[mod(index + from + delta, NUM_SLOTS)];
    return start.x + progress * (end.x - start.x) + bulge(progress, delta * HALF_PI).x;
  });
  const y = useTransform(p, (progress) => {
    const { from, delta } = animRef.current;
    const start = SLOTS[mod(index + from, NUM_SLOTS)];
    const end = SLOTS[mod(index + from + delta, NUM_SLOTS)];
    return start.y + progress * (end.y - start.y) + bulge(progress, delta * HALF_PI).y;
  });

  return (
    <li className="mobile-nav-dot-slot">
      <motion.div style={{ x, y }}>
        <Link
          href={page.href}
          aria-current={isActive ? 'page' : undefined}
          aria-label={page.label}
          className="mobile-nav-dot"
        />
      </motion.div>
    </li>
  );
}
