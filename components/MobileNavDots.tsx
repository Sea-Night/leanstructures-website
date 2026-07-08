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

const BASE_DURATION = 2.1; // s — how long one full sweep takes at a gentle default kick; long and heavy, so the sweep carries real momentum rather than snapping to a stop
const SWEEP_EASE: [number, number, number, number] = [0.45, 0.05, 0.55, 0.95]; // a smooth, symmetric ease-in-out — gentle ramp up, gentle ramp down, no sudden snap at either end (an earlier expo-style curve rose almost instantly then crawled for a long tail, which read as a jarring burst followed by dragging deceleration)
const ROTATIONS = 2; // at least 2 full cycles of theta — still always lands back at its exact start, since any whole number of cycles does
const R = 30; // px — the fx/fy formula's own "r"; scales how far each point travels along its line
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how fast even a very fast swipe can drive things

// Direct translation of the reference Mathematica:
//   fx[θ,phase,r,k] := r(k-1)Cos[θ] + r Cos[(k-1)θ + 2·phase°]
//   fy[θ,phase,r,k] := r(k-1)Sin[θ] − r Sin[(k-1)θ + 2·phase°]
// with k=2 (Cardano's circles / a Tusi couple): a small circle rolling
// inside one twice its radius, which is the degenerate case where the
// traced curve is a straight line, not an arc. Crucially, for ANY
// phase, this line passes through the same fixed point — the local
// origin (0,0) — which is exactly the shared "focal point" in the
// reference image. Each dot's rest position (theta=0) sits somewhere
// along its own line at a fixed distance from that focal point; only
// its signed distance along the line changes as theta moves, never its
// direction.
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

// 8 phases, 45 degrees apart in the doubled angle the formula actually
// uses (matching an 8-point pattern), chosen symmetrically around the
// focal point's vertical axis: the 4 real phases put the nav dots on a
// shallow arc above the focal point; the 4 decorative phases are their
// exact mirror image below it, into the page.
const REAL_PHASE_DEG = [11.25, 33.75, 56.25, 78.75];
const DECORATIVE_PHASE_DEG = [101.25, 123.75, 146.25, 168.75];

/** A dot's rest position (theta=0) in the formula's own local
 * coordinates, where (0,0) is the shared focal point every line passes
 * through. */
function rawRestPosition(phaseDeg: number) {
  return { x: fx(0, phaseDeg), y: fy(0, phaseDeg) };
}

/** Every rest position (real and decorative alike) lies exactly on one
 * circle of radius R — a quarter of each dot's own 4R travel distance —
 * centered at local (R, 0), a quarter-travel to one side of the focal
 * point. That circle's center, not the focal point and not an average
 * of the real dots alone, is what the whole structure is centered on. */
const CIRCLE_CENTER = { x: R, y: 0 };

const HEADER_CENTER_Y = 30; // where the apparent circle's center sits vertically in the banner

/** A dot's rest position shifted so the apparent circle's own center
 * lands exactly at (0,0) — i.e. at (50vw, HEADER_CENTER_Y) once placed
 * on screen. */
function restPosition(phaseDeg: number) {
  const raw = rawRestPosition(phaseDeg);
  return { x: raw.x - CIRCLE_CENTER.x, y: raw.y - CIRCLE_CENTER.y };
}

/** The straight line a given phase actually travels along, as theta
 * ranges over all reals: a fixed unit direction (half the phase angle)
 * and a signed extent along it of exactly 4R end to end, passing
 * through the shared focal point — used here to draw each dot's real,
 * computed path (not a guess) as a static line, for directly confirming
 * the motion is genuinely linear and that all 8 lines share one origin. */
function pathLine(phaseDeg: number) {
  const rest = restPosition(phaseDeg);
  const halfPhi = (phaseDeg * Math.PI) / 180;
  const dir = { x: Math.cos(halfPhi), y: -Math.sin(halfPhi) };
  const minScalar = 2 * R * (-1 - Math.cos(halfPhi));
  const maxScalar = 2 * R * (1 - Math.cos(halfPhi));
  const p1 = { x: rest.x + minScalar * dir.x, y: rest.y + minScalar * dir.y };
  const p2 = { x: rest.x + maxScalar * dir.x, y: rest.y + maxScalar * dir.y };
  const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const angleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  return { center, length, angleDeg };
}

/** "calc(50vw + 12px)" / "calc(50vw - 12px)" — never "+ -12px", which
 * some CSS parsers choke on. */
function centeredLeft(offsetPx: number) {
  const sign = offsetPx < 0 ? '-' : '+';
  return `calc(50vw ${sign} ${Math.abs(offsetPx)}px)`;
}

/** Mobile-only replacement for the header's logo/nav: 8 dots (4 real nav
 * links on a shallow arc above a shared focal point, 4 decorative ones
 * mirrored below it, into the page), each with its exact computed
 * straight-line path drawn as a black line, so the underlying motion is
 * directly checkable rather than taken on faith — all 8 lines pass
 * through that one shared focal point, matching the reference image.
 * Every swipe or tap drives a single decelerating sweep of a shared
 * "theta" parameter through exactly one full cycle (fast at first,
 * easing to a stop) — not a back-and-forth oscillation, which can never
 * complete a full cycle by construction. Each dot's own motion is a
 * straight line: its direction never changes, only its position along
 * that one fixed line does. It's the correlated timing across the 8
 * different phases/lines, not any single point's own path, that makes
 * the ensemble read as a circular pattern to a viewer. Every point
 * always lands back exactly where it started. Rendered as a
 * position:fixed overlay mounted in app/layout.tsx (outside
 * PageTransition's animated wrapper — that wrapper applies a CSS
 * transform mid-slide, which would otherwise re-anchor any fixed-
 * position descendant to itself instead of the viewport). */
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
      ease: SWEEP_EASE,
      onComplete: () => theta.set(0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav aria-label="Page navigation" className="mobile-nav-dots">
      {REAL_PHASE_DEG.map((phase, i) => (
        <PathLine key={`real-line-${i}`} phase={phase} />
      ))}
      {DECORATIVE_PHASE_DEG.map((phase, i) => (
        <PathLine key={`bloom-line-${i}`} phase={phase} />
      ))}
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

/** The static, exactly-computed straight line a dot travels along
 * (never animated — it's the same regardless of theta). */
function PathLine({ phase }: { phase: number }) {
  const { center, length, angleDeg } = pathLine(phase);
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: centeredLeft(center.x),
        top: HEADER_CENTER_Y + center.y,
        width: length,
        height: 1,
        background: '#000',
        transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
        pointerEvents: 'none',
      }}
    />
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

/** A decorative point (no link, no tab stop) — same mechanism as the
 * real dots, resting at its own exact position on the mirrored lower
 * arc, moving along its own fixed line. Always visible (not just during
 * motion) so its path is checkable at rest too. */
function BloomDot({
  phase,
  theta,
  thetaVelocity,
}: {
  phase: number;
  theta: MotionValue<number>;
  thetaVelocity: MotionValue<number>;
}) {
  const rest = restPosition(phase);

  const x = useTransform(theta, (t) => lineOffset(t, phase).x - 3);
  const y = useTransform(theta, (t) => lineOffset(t, phase).y - 3);
  const opacity = useTransform(thetaVelocity, (v) => Math.max(0.6, Math.min(0.85, Math.abs(v) / 6)));

  return (
    <li className="mobile-nav-dot-slot" aria-hidden="true" style={{ left: centeredLeft(rest.x), top: HEADER_CENTER_Y + rest.y }}>
      <motion.div style={{ x, y, opacity }} className="mobile-nav-bloom-dot" />
    </li>
  );
}
