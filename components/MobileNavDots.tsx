'use client';

import { useEffect, useRef } from 'react';
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
import { consumeLastSwipeVelocity } from '@/lib/nav-gesture';

const HALF_PI = Math.PI / 2;

// Small, centered cluster (~15% of a mobile screen's width) near the top.
const CENTER_X_VW = 50;
const CENTER_Y_PX = 32;
const BASE_RADIUS = 26; // px — each dot's resting distance from center
const SWING = 14; // px — how far each dot breathes in/out along its own line
const BASE_ROTATION = -Math.PI / 4; // dots sit at NE/SE/SW/NW

// Swipe velocity (px/s) -> initial angular velocity (rad/s) for the spring.
const VELOCITY_TO_ANGULAR = 0.006;

/** Mobile-only replacement for the header's logo/nav: 4 dots that
 * reproduce the "circular motion illusion" — each dot only ever moves
 * back and forth along its own fixed straight line through a shared
 * center point (never orbits), but because all 4 share one animated
 * phase, the ensemble reads as a single point circling the center. A
 * swipe or dot tap advances that shared phase by a quarter turn per
 * page, using a spring (seeded with the swipe's actual velocity) so the
 * motion keeps spiraling and gradually decays to rest rather than
 * snapping to a fixed stop. Rendered as a position:fixed overlay mounted
 * in app/layout.tsx (outside PageTransition's animated wrapper — that
 * wrapper applies a CSS transform mid-slide, which would otherwise
 * re-anchor any fixed-position descendant to itself instead of the
 * viewport). */
export function MobileNavDots() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navIndexForPathname(pathname);
  const prevIndexRef = useRef(activeIndex);
  const theta = useMotionValue(0);

  useEffect(() => {
    const delta = shortestCyclicDelta(prevIndexRef.current, activeIndex);
    prevIndexRef.current = activeIndex;
    const target = theta.get() + delta * HALF_PI;

    if (prefersReducedMotion) {
      theta.set(target);
      return;
    }

    const swipeVelocity = consumeLastSwipeVelocity();
    animate(theta, target, {
      type: 'spring',
      velocity: -swipeVelocity * VELOCITY_TO_ANGULAR,
      stiffness: 30,
      damping: 4,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      <ul>
        {NAV_PAGES.map((page, i) => (
          <DotLink key={page.href} page={page} index={i} isActive={i === activeIndex} theta={theta} />
        ))}
      </ul>
    </nav>
  );
}

function DotLink({
  page,
  index,
  isActive,
  theta,
}: {
  page: NavPage;
  index: number;
  isActive: boolean;
  theta: MotionValue<number>;
}) {
  const alpha = index * HALF_PI + BASE_ROTATION;

  const x = useTransform(theta, (t) => {
    const r = BASE_RADIUS + SWING * Math.cos(t - alpha);
    return r * Math.cos(alpha) - 4;
  });
  const y = useTransform(theta, (t) => {
    const r = BASE_RADIUS + SWING * Math.cos(t - alpha);
    return r * Math.sin(alpha) - 4;
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
