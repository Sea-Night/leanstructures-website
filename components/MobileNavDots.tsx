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

const BASE_DURATION = 1.3; // s — how long one full sweep takes at a gentle default kick
const ROTATIONS = 1; // exactly one full cycle of theta, so every point always lands back at its exact start
const R = 30; // px — the fx/fy formula's own "r"; scales how far each point travels along its line
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how fast even a very fast swipe can drive things

// Direct translation of the reference Mathematica:
//   fx[θ,phase,r,k] := r(k-1)Cos[θ] + r Cos[(k-1)θ + 2·phase°]
//   fy[θ,phase,r,k] := r(k-1)Sin[θ] − r Sin[(k-1)θ + 2·phase°]
// with k=2 (Cardano's circles / a Tusi couple): a small circle rolling
// inside one twice its radius, which is the degenerate case where the
// traced curve is a straight line, not an arc. For a FIXED phase, as θ
// varies this point never leaves that one line — only its signed
// distance along it changes (a plain cosine wave) — the direction
// itself never rotates. It's the correlated timing across several
// different phases/lines, not any single point's own path, that makes
// the ensemble read as a circular pattern to a viewer.
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

// 8 phases spaced 22.5 degrees apart (so the doubled angle inside fx/fy
// is spaced 45 degrees apart, matching an 8-point pattern) — the 4 real
// nav dots take the even-indexed phases, the 4 decorative points the
// odd-indexed ones, interleaved exactly the way the reference's own
// phase list would place 8 points.
const REAL_PHASE_DEG = [0, 45, 90, 135];
const DECORATIVE_PHASE_DEG = [22.5, 67.5, 112.5, 157.5];

// Where the 4 real dots actually sit at rest — a shallow arc centered
// in the banner (independent of the fx/fy formula's own natural
// geometry; lineOffset is added on top of whichever rest point we pick).
const CENTER_Y = 24;
const REST_OFFSETS = [
  { x: -42, y: 9 },
  { x: -14, y: -3 },
  { x: 14, y: -3 },
  { x: 42, y: 9 },
];

/** "calc(50vw + 12px)" / "calc(50vw - 12px)" — never "+ -12px", which
 * some CSS parsers choke on. */
function centeredLeft(offsetPx: number) {
  const sign = offsetPx < 0 ? '-' : '+';
  return `calc(50vw ${sign} ${Math.abs(offsetPx)}px)`;
}

/** Mobile-only replacement for the header's logo/nav: 4 dots on a
 * shallow arc centered in the banner. Every swipe or tap drives a
 * single decelerating sweep of a shared "theta" parameter through
 * exactly one full cycle (fast at first, easing to a stop, like
 * something given a push and losing momentum to friction) — not a
 * back-and-forth oscillation, which can never complete a full cycle by
 * construction. Each dot's own motion is a straight line (the fx/fy
 * Cardano-circle formula above): its direction never changes, only its
 * position along that one fixed line does. 4 decorative points, sharing
 * the same theta but different phases, move along their own lines too
 * and fade in/out with how fast theta is currently changing — the
 * combined, correlated motion of all 8 is what reads as a circular
 * pattern, even though no individual point ever moves along a curve.
 * Every point always lands back exactly where it started. The sweep's
 * duration comes from the swipe's real velocity; a plain tap gets a
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

  const theta = useMotionValue(0);
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
        {DECORATIVE_PHASE_DEG.map((phase, i) => (
          <BloomDot key={`bloom-${i}`} phase={phase} theta={theta} thetaVelocity={thetaVelocity} />
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
  const phase = REAL_PHASE_DEG[index];
  const rest = REST_OFFSETS[index];

  const x = useTransform(theta, (t) => lineOffset(t, phase).x - 4);
  const y = useTransform(theta, (t) => lineOffset(t, phase).y - 4);

  return (
    <li className="mobile-nav-dot-slot" style={{ left: centeredLeft(rest.x), top: CENTER_Y + rest.y }}>
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

/** A purely decorative point (no link, no tab stop), resting invisibly
 * at the shared center and moving along its own fixed line — same
 * mechanism as the real dots — fading in only while theta is actively
 * changing fast. */
function BloomDot({
  phase,
  theta,
  thetaVelocity,
}: {
  phase: number;
  theta: MotionValue<number>;
  thetaVelocity: MotionValue<number>;
}) {
  const x = useTransform(theta, (t) => lineOffset(t, phase).x - 3);
  const y = useTransform(theta, (t) => lineOffset(t, phase).y - 3);
  const opacity = useTransform(thetaVelocity, (v) => Math.min(0.85, Math.abs(v) / 6));

  return (
    <li className="mobile-nav-dot-slot" aria-hidden="true" style={{ left: centeredLeft(0), top: CENTER_Y }}>
      <motion.div style={{ x, y, opacity }} className="mobile-nav-bloom-dot" />
    </li>
  );
}
