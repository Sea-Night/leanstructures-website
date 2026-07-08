'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useVelocity,
  useTransform,
  animate,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { NAV_PAGES, navIndexForPathname, type NavPage } from '@/lib/site-nav';
import { consumeLastSwipeVelocity } from '@/lib/nav-gesture';

const BASE_DURATION = 1.3; // s — how long one full rotation takes at a gentle default kick
const ROTATIONS = 1; // exactly one full turn, so the wheel always lands back at its exact start
const R = 34; // px — fixed radius of every point from the shared center; big enough to clearly break out past the header's own boundary during the spin
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how fast even a very fast swipe can spin things

// The rest arc IS 4 vertices of a regular 8-point wheel (45 degrees
// apart, fixed radius R), centered horizontally in the banner. A pulse
// rigidly rotates the whole wheel — a single decelerating spin of
// exactly one full turn (not a back-and-forth oscillation, which never
// read as real rotation no matter how large) — so every point keeps its
// exact 45-degree spacing from its neighbors at all times, and always
// lands back exactly on its own starting vertex. The 4 real nav dots
// occupy the upper 4 vertices; the 4 mirrored lower vertices are
// decorative points, always present in the wheel but faded to invisible
// at rest, brightening while the wheel is spinning fast and fading again
// as it slows to a stop.
const CENTER_Y = 25; // vertically centered in the ~50px mobile header
const REAL_ANGLES = [-Math.PI * (7 / 8), -Math.PI * (5 / 8), -Math.PI * (3 / 8), -Math.PI * (1 / 8)];
const DECORATIVE_ANGLES = [Math.PI * (1 / 8), Math.PI * (3 / 8), Math.PI * (5 / 8), Math.PI * (7 / 8)];

/** "calc(50vw + 12px)" / "calc(50vw - 12px)" — never "+ -12px", which
 * some CSS parsers choke on. */
function centeredLeft(offsetPx: number) {
  const sign = offsetPx < 0 ? '-' : '+';
  return `calc(50vw ${sign} ${Math.abs(offsetPx)}px)`;
}

/** Mobile-only replacement for the header's logo/nav: 4 dots forming the
 * upper half of an 8-point wheel centered in the banner. Every swipe or
 * tap spins the whole wheel rigidly through exactly one full turn — a
 * single decelerating sweep (fast at first, easing to a stop, like a
 * wheel given a push and losing momentum to friction), not a back-and-
 * forth wobble — so it reads as a real, continuous spin rather than a
 * jiggle, while always landing every dot back on its own exact starting
 * position. The mirrored lower 4 vertices are decorative points, always
 * part of the same rigid wheel but only visible while it's spinning
 * fast. The spin's duration comes from the swipe's real velocity (a
 * faster swipe completes its one turn quicker); a plain tap gets a
 * gentle default pace. Rendered as a position:fixed overlay mounted in
 * app/layout.tsx (outside PageTransition's animated wrapper — that
 * wrapper applies a CSS transform mid-slide, which would otherwise
 * re-anchor any fixed-position descendant to itself instead of the
 * viewport). */
export function MobileNavDots() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navIndexForPathname(pathname);
  const prevPathnameRef = useRef(pathname);

  const theta = useMotionValue(0); // shared wheel rotation, radians
  const thetaVelocity = useVelocity(theta);

  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;
    if (prefersReducedMotion) return;

    const swipeVelocity = consumeLastSwipeVelocity();
    const v0 =
      swipeVelocity !== 0 ? Math.min(Math.abs(swipeVelocity) * VELOCITY_TO_KICK, MAX_KICK) : DEFAULT_KICK;
    const direction = swipeVelocity !== 0 ? -Math.sign(swipeVelocity) : 1;
    const duration = BASE_DURATION / v0;

    theta.set(0);
    animate(theta, direction * 2 * Math.PI * ROTATIONS, {
      duration,
      ease: 'easeOut',
      onComplete: () => theta.set(0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      <ul>
        {DECORATIVE_ANGLES.map((angle, i) => (
          <BloomDot key={`bloom-${i}`} angle={angle} theta={theta} thetaVelocity={thetaVelocity} />
        ))}
        {NAV_PAGES.map((page, index) => (
          <DotLink key={page.href} page={page} index={index} isActive={index === activeIndex} theta={theta} />
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
  const angle = REAL_ANGLES[index];

  const x = useTransform(theta, (t) => R * (Math.cos(angle + t) - Math.cos(angle)) - 4);
  const y = useTransform(theta, (t) => R * (Math.sin(angle + t) - Math.sin(angle)) - 4);

  return (
    <li
      className="mobile-nav-dot-slot"
      style={{ left: centeredLeft(R * Math.cos(angle)), top: CENTER_Y + R * Math.sin(angle) }}
    >
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

/** A purely decorative point (no link, no tab stop) — permanently part
 * of the rigid wheel at the same fixed radius as the real dots, just
 * faded to invisible except while the wheel is actively spinning fast. */
function BloomDot({
  angle,
  theta,
  thetaVelocity,
}: {
  angle: number;
  theta: MotionValue<number>;
  thetaVelocity: MotionValue<number>;
}) {
  const x = useTransform(theta, (t) => R * (Math.cos(angle + t) - Math.cos(angle)) - 4);
  const y = useTransform(theta, (t) => R * (Math.sin(angle + t) - Math.sin(angle)) - 4);
  const opacity = useTransform(thetaVelocity, (v) => Math.min(0.85, Math.abs(v) / 6));

  return (
    <li
      className="mobile-nav-dot-slot"
      aria-hidden="true"
      style={{ left: centeredLeft(R * Math.cos(angle)), top: CENTER_Y + R * Math.sin(angle) }}
    >
      <motion.div style={{ x, y, opacity }} className="mobile-nav-bloom-dot" />
    </li>
  );
}
