'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate, useReducedMotion, type MotionValue } from 'motion/react';
import { NAV_PAGES, navIndexForPathname, type NavPage } from '@/lib/site-nav';
import { consumeLastSwipeVelocity } from '@/lib/nav-gesture';

const BASE_DURATION = 2.94; // s — how long one full sweep takes at a gentle default kick (40% slower than the previous 2.1s)
const INERTIA_DECAY = 4.2; // how quickly the "friction" eats the initial velocity — see inertiaEase below
const ROTATIONS = 2; // at least 2 full cycles of theta — still always lands back at its exact start, since any whole number of cycles does
const R = 33; // px — the fx/fy formula's own "r"; scales how far each point travels along its line
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how fast even a very fast swipe can drive things

// Direct translation of the reference Mathematica:
//   fx[θ,phase,r,k] := r(k-1)Cos[θ] + r Cos[(k-1)θ + 2·phase°]
//   fy[θ,phase,r,k] := r(k-1)Sin[θ] − r Sin[(k-1)θ + 2·phase°]
// with k=2 (Cardano's circles / a Tusi couple): a small circle rolling
// inside one twice its radius, which is the degenerate case where the
// traced curve is a straight line, not an arc. Each dot's own motion is
// a straight line: its direction never changes, only its position along
// that one fixed line does.
const K = 2;
function fx(theta: number, phaseDeg: number) {
  const phi = (phaseDeg * Math.PI) / 90; // = 2 * phaseDeg in radians
  return R * (K - 1) * Math.cos(theta) + R * Math.cos((K - 1) * theta + phi);
}
function fy(theta: number, phaseDeg: number) {
  const phi = (phaseDeg * Math.PI) / 90;
  return R * (K - 1) * Math.sin(theta) - R * Math.sin((K - 1) * theta + phi);
}
/** Offset from this phase's own theta=0 position — exactly (0,0) at
 * theta=0 and at every multiple of 2*pi, regardless of phase, so a
 * point always returns to wherever we choose to display it at rest. */
function lineOffset(theta: number, phaseDeg: number) {
  return { x: fx(theta, phaseDeg) - fx(0, phaseDeg), y: fy(theta, phaseDeg) - fy(0, phaseDeg) };
}

/** The actual shape of something heavy given a shove and left to
 * friction: velocity is highest the instant it's released and decays
 * exponentially from there (v(t) = v0*e^-kt) — not a designed "ease"
 * curve. Integrating that velocity gives position p(t) proportional to
 * (1 - e^-kt), which is what this returns, normalized so it still hits
 * exactly 0 at t=0 and exactly 1 at t=1 (so Framer's fixed-duration
 * tween lands on the exact target every time, unlike a true unbounded
 * physics sim). */
function inertiaEase(t: number) {
  return (1 - Math.exp(-INERTIA_DECAY * t)) / (1 - Math.exp(-INERTIA_DECAY));
}

// 4 phases, 45 degrees apart in the doubled angle the formula actually
// uses, on a shallow arc above the focal point.
const REAL_PHASE_DEG = [11.25, 33.75, 56.25, 78.75];

/** A dot's rest position (theta=0) in the formula's own local
 * coordinates, where (0,0) is the shared focal point every line passes
 * through. */
function rawRestPosition(phaseDeg: number) {
  return { x: fx(0, phaseDeg), y: fy(0, phaseDeg) };
}

/** The centroid of the 4 nav dots' own rest positions — the whole
 * structure is centered in the banner around THIS point. */
const REAL_CENTROID = REAL_PHASE_DEG.reduce(
  (sum, p) => {
    const pos = rawRestPosition(p);
    return { x: sum.x + pos.x / REAL_PHASE_DEG.length, y: sum.y + pos.y / REAL_PHASE_DEG.length };
  },
  { x: 0, y: 0 }
);

const HEADER_CENTER_Y = 30; // where the dots' centroid sits vertically in the banner

/** A dot's rest position shifted so the dots' own centroid lands
 * exactly at (0,0) — i.e. at (50vw, HEADER_CENTER_Y) once placed on
 * screen. */
function restPosition(phaseDeg: number) {
  const raw = rawRestPosition(phaseDeg);
  return { x: raw.x - REAL_CENTROID.x, y: raw.y - REAL_CENTROID.y };
}

/** "calc(50vw + 12px)" / "calc(50vw - 12px)" — never "+ -12px", which
 * some CSS parsers choke on. */
function centeredLeft(offsetPx: number) {
  const sign = offsetPx < 0 ? '-' : '+';
  return `calc(50vw ${sign} ${Math.abs(offsetPx)}px)`;
}

/** Mobile-only replacement for the header's logo/nav: 4 dots on a
 * shallow arc centered in the banner. Every swipe or tap drives a
 * single decelerating sweep of a shared "theta" parameter through at
 * least 2 full cycles — a genuine physical shove-and-friction decay
 * (see inertiaEase), not a designed ease curve. Each dot's own motion
 * is a straight line (the fx/fy Cardano-circle formula above): its
 * direction never changes, only its position along that one fixed line
 * does. Every point always lands back exactly where it started.
 * Rendered as a position:fixed overlay mounted in app/layout.tsx
 * (outside PageTransition's animated wrapper — that wrapper applies a
 * CSS transform mid-slide, which would otherwise re-anchor any fixed-
 * position descendant to itself instead of the viewport). */
export function MobileNavDots() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navIndexForPathname(pathname);
  const prevPathnameRef = useRef(pathname);

  const theta = useMotionValue(0);

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
      ease: inertiaEase,
      onComplete: () => theta.set(0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      <ul>
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
  const phase = REAL_PHASE_DEG[index];
  const rest = restPosition(phase);

  const x = useTransform(theta, (t) => lineOffset(t, phase).x - 4);
  const y = useTransform(theta, (t) => lineOffset(t, phase).y - 4);

  return (
    <li className="mobile-nav-dot-slot" style={{ left: centeredLeft(rest.x), top: HEADER_CENTER_Y + rest.y }}>
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
