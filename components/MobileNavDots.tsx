'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationFrame,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { NAV_PAGES, navIndexForPathname, type NavPage } from '@/lib/site-nav';
import { consumeLastSwipeVelocity } from '@/lib/nav-gesture';

const TAU = 0.5; // decay time constant, s — how long the pulse takes to fade out
const OMEGA = 14; // rad/s — how fast each dot oscillates along its (rotating) spoke
const ROT_RATE = OMEGA / 2; // rad/s — the whole spoke pattern also rotates, at half the oscillation rate (matching the fx/fy source's own 2:1 ratio between its "2 phase" and "theta" terms) — this is what makes it read as a spinning wheel rather than 4 dots wobbling on fixed lines
const SWING = 36; // px — max sweep along each dot's spoke; needs real travel distance for the phase offsets between dots to read as rotation rather than a jitter
const VELOCITY_TO_KICK = 0.002;
const DEFAULT_KICK = 1.1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.6; // caps how far even a very fast swipe can push the swing

// Fixed rest anchors — a shallow arc across the top of the banner. Every
// dot always returns here exactly; the motion below is a purely
// decorative pulse layered on top, never a permanent displacement.
const REST_X_VW = [35, 45, 55, 65];
const REST_Y_PX = [22, 14, 14, 22];

// Each dot's Cardan-circle spoke offset (a 2:1 hypocycloid — a small
// circle rolling inside one twice its radius — degenerates to a straight
// line through the center; see Tusi couple / Cardano's circles). Fanned
// 45 degrees apart at rest; during a pulse the whole fan rotates together
// (see ROT_RATE) while each dot also oscillates along its own line.
const ALPHA = [
  -Math.PI * (7 / 8),
  -Math.PI * (5 / 8),
  -Math.PI * (3 / 8),
  -Math.PI * (1 / 8),
];

/** Mobile-only replacement for the header's logo/nav: 4 dots on a fixed
 * arc across the top of the banner. Every swipe or tap triggers a
 * decaying spiral pulse — each dot sweeps out and back along its own
 * straight spoke (a genuine Cardan-circle/hypocycloid path), timed so
 * the ensemble reads as a single point orbiting the arc — then always
 * settles back exactly where it started. The pulse's initial strength
 * comes from the swipe's real velocity; a plain tap gets a gentle
 * default. Rendered as a position:fixed overlay mounted in
 * app/layout.tsx (outside PageTransition's animated wrapper — that
 * wrapper applies a CSS transform mid-slide, which would otherwise
 * re-anchor any fixed-position descendant to itself instead of the
 * viewport). */
export function MobileNavDots() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navIndexForPathname(pathname);
  const prevPathnameRef = useRef(pathname);

  const elapsed = useMotionValue(0); // seconds since the current/last pulse began
  const kick = useMotionValue(0); // this pulse's initial strength (V0)
  const navStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    if (prefersReducedMotion) {
      kick.set(0);
      navStartRef.current = null;
      return;
    }

    const swipeVelocity = consumeLastSwipeVelocity();
    const v0 =
      swipeVelocity !== 0 ? Math.min(Math.abs(swipeVelocity) * VELOCITY_TO_KICK, MAX_KICK) : DEFAULT_KICK;
    kick.set(v0);
    navStartRef.current = performance.now();
    elapsed.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useAnimationFrame(() => {
    if (navStartRef.current === null) return;
    const t = (performance.now() - navStartRef.current) / 1000;
    if (t > TAU * 6) {
      navStartRef.current = null;
      elapsed.set(0);
      return;
    }
    elapsed.set(t);
  });

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      <ul>
        {NAV_PAGES.map((page, i) => (
          <DotLink
            key={page.href}
            page={page}
            index={i}
            isActive={i === activeIndex}
            elapsed={elapsed}
            kick={kick}
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
  elapsed,
  kick,
}: {
  page: NavPage;
  index: number;
  isActive: boolean;
  elapsed: MotionValue<number>;
  kick: MotionValue<number>;
}) {
  const alpha = ALPHA[index];

  const x = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha).x - 4;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha).y - 4;
  });

  return (
    <li
      className="mobile-nav-dot-slot"
      style={{ left: `${REST_X_VW[index]}vw`, top: REST_Y_PX[index] }}
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

/** A dot's (x, y) offset from its rest anchor at time t. The spoke
 * direction itself rotates (spokeAngle), while the dot also oscillates
 * back and forth along that rotating line (r) — the same combination
 * used in the reference fx/fy hypocycloid animation, where the "2*phase"
 * term (here, the oscillation) advances twice as fast as the "theta"
 * term (here, the spoke's own rotation). An envelope that starts and
 * ends at exactly 0 (peak normalized to v0 at t=TAU) guarantees every
 * dot always settles back to its exact rest position regardless of how
 * far the spoke pattern has rotated. */
function sweepOffset(t: number, v0: number, alpha: number) {
  if (v0 === 0 || t <= 0) return { x: 0, y: 0 };
  const envelope = v0 * (t / TAU) * Math.exp(1 - t / TAU);
  const spokeAngle = alpha - ROT_RATE * t;
  const r = envelope * SWING * Math.cos(OMEGA * t - spokeAngle);
  return { x: r * Math.cos(spokeAngle), y: r * Math.sin(spokeAngle) };
}
