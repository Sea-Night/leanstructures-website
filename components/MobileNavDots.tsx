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

const TAU = 0.7; // decay time constant, s — how long the pulse takes to fade out
const SPIN_RATE = 2.4; // rad/s — rate the whole spoke pattern rotates at; the oscillation along each spoke runs at exactly 2x this (see sweepOffset), matching the fx/fy source's own theta vs. 2*phase ratio
const SWING = 20; // px — max sweep along each point's spoke around wherever it's currently orbiting
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how far even a very fast swipe can push the swing

// Fixed px positions (not vw): everything below needs to blend between a
// dot's own rest anchor and the shared center in one consistent
// coordinate space, which vw can't do without a resize-aware px
// conversion. Fine across the practical mobile width range this targets.
const REST = [
  { x: 131, y: 17 },
  { x: 172, y: 10 },
  { x: 211, y: 10 },
  { x: 250, y: 18 },
];
const CENTER = { x: 195, y: 18 };

// Each point's Cardan-circle spoke offset (a 2:1 hypocycloid — a small
// circle rolling inside one twice its radius — degenerates to a straight
// line through the center; see Tusi couple / Cardano's circles), stated
// as "i" the way the reference fx/fy formula does (phase = i, spanning
// 0..1). The 4 real nav dots sit at the midpoints between 5 evenly
// spaced decorative points, so all 9 form one evenly spaced fan.
const CORE_I = [0.125, 0.375, 0.625, 0.875];
const DECORATIVE_I = [0, 0.25, 0.5, 0.75, 1];

function iToAlpha(i: number) {
  return -Math.PI * i;
}

/** Mobile-only replacement for the header's logo/nav: 4 dots on a fixed
 * arc across the top of the banner. Every swipe or tap triggers a
 * decaying pulse: the 4 real dots drift in from their own arc slot to
 * join a shared center, where they orbit it — along with 5 decorative
 * points that bloom in alongside them — via the same rotating Cardan-
 * circle mechanism (the fx/fy hypocycloid from the reference animation).
 * As the pulse settles, the decorative points fade out and every real
 * dot drifts back to its own exact rest position. (An earlier version
 * had each real dot orbit only its own individual rest anchor rather
 * than the shared center the decorative points used — mathematically
 * identical motion, but visually the two groups never looked like part
 * of the same spin, since one set circled a shared point and the other
 * circled 4 different points scattered across the arc.) The pulse's
 * initial strength comes from the swipe's real velocity; a plain tap
 * gets a gentle default. Rendered as a position:fixed overlay mounted in
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
        {DECORATIVE_I.map((i) => (
          <BloomDot key={`bloom-${i}`} i={i} elapsed={elapsed} kick={kick} />
        ))}
        {NAV_PAGES.map((page, index) => (
          <DotLink
            key={page.href}
            page={page}
            index={index}
            isActive={index === activeIndex}
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
  const alpha = iToAlpha(CORE_I[index]);
  const rest = REST[index];

  const x = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return corePosition(t, v0, alpha, rest).x - rest.x - 4;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return corePosition(t, v0, alpha, rest).y - rest.y - 4;
  });

  return (
    <li className="mobile-nav-dot-slot" style={{ left: rest.x, top: rest.y }}>
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

/** A purely decorative point (no link, no tab stop) that blooms in
 * around the shared center and fades back out — it never needs to
 * "return home" since it's invisible at rest, only visible mid-pulse. */
function BloomDot({
  i,
  elapsed,
  kick,
}: {
  i: number;
  elapsed: MotionValue<number>;
  kick: MotionValue<number>;
}) {
  const alpha = iToAlpha(i);

  const x = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha, SWING).x - 3;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha, SWING).y - 3;
  });
  const opacity = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return Math.min(0.85, blendWeight(t, v0));
  });

  return (
    <li className="mobile-nav-dot-slot" aria-hidden="true" style={{ left: CENTER.x, top: CENTER.y }}>
      <motion.div style={{ x, y, opacity }} className="mobile-nav-bloom-dot" />
    </li>
  );
}

/** 0 -> 1 -> 0, peaking at t=TAU, scaled by how strong this pulse's kick
 * was (capped at 1 so even a very fast swipe can't pull a dot past the
 * shared center). Used both as the real dots' rest-anchor-to-center
 * blend factor and as the decorative points' opacity. */
function blendWeight(t: number, v0: number) {
  if (v0 === 0 || t <= 0) return 0;
  return Math.min(1, v0) * (t / TAU) * Math.exp(1 - t / TAU);
}

/** A real nav dot's absolute position at time t: blended from its own
 * rest anchor toward the shared center (peaking at t=TAU, back to the
 * rest anchor by the time the pulse settles) so that, at the pulse's
 * peak, it is genuinely orbiting the same center the decorative points
 * use — plus its own oscillation on top, exactly like a decorative
 * point. */
function corePosition(t: number, v0: number, alpha: number, rest: { x: number; y: number }) {
  const blend = blendWeight(t, v0);
  const orbit = sweepOffset(t, v0, alpha, SWING);
  return {
    x: rest.x + blend * (CENTER.x - rest.x) + orbit.x,
    y: rest.y + blend * (CENTER.y - rest.y) + orbit.y,
  };
}

/** A point's (x, y) offset from whatever center it's currently orbiting,
 * at time t, following the reference fx/fy hypocycloid: the spoke
 * direction rotates at SPIN_RATE (using the point's static alpha as its
 * fixed offset within the rotating frame), while the magnitude along
 * that spoke oscillates at exactly 2x SPIN_RATE — also phased by the
 * same static alpha, not by the rotating spoke angle itself. Bounded by
 * the same 0->1->0 envelope as blendWeight, so it's always exactly zero
 * at rest regardless of how far the pattern has spun. */
function sweepOffset(t: number, v0: number, alpha: number, swing: number) {
  const envelope = blendWeight(t, v0);
  if (envelope === 0) return { x: 0, y: 0 };
  const spokeAngle = alpha - SPIN_RATE * t;
  const r = envelope * swing * Math.cos(2 * SPIN_RATE * t - alpha);
  return { x: r * Math.cos(spokeAngle), y: r * Math.sin(spokeAngle) };
}
