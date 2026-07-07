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

const TAU = 0.6; // decay time constant, s — how long the pulse takes to fade out
const SPIN_RATE = 5; // rad/s — how fast the shared rotation angle oscillates before settling
const ANGLE_KICK = 0.7; // rad — max additional angular swing at full kick strength
const DECORATIVE_PEAK = 22; // px — how far the bloom points reach out from the center at full kick strength
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how far even a very fast swipe can push things

// The rest arc IS 4 vertices of a regular 8-point wheel (45 degrees
// apart) centered on CENTER, radius R — not 4 arbitrary points that
// happen to sit near a center. The pulse rotates that whole wheel
// rigidly (every point keeps its exact 45-degree spacing from its
// neighbors at all times — nothing changes radius except the 4
// decorative points, which bloom out from 0 and back), rather than each
// point independently sweeping back and forth at its own pace. The 4
// real nav dots occupy the upper 4 vertices (a shallow arc across the
// banner); the 4 decorative ones sit at the mirrored lower 4 vertices,
// invisible (radius 0) at rest, and bloom outward — below the banner,
// into the page — as the wheel spins.
const CENTER = { x: 195, y: 26 };
const R = 28; // real dots' fixed radius from center
const REAL_ANGLES = [-Math.PI * (7 / 8), -Math.PI * (5 / 8), -Math.PI * (3 / 8), -Math.PI * (1 / 8)];
const DECORATIVE_ANGLES = [Math.PI * (1 / 8), Math.PI * (3 / 8), Math.PI * (5 / 8), Math.PI * (7 / 8)];

function polar(center: { x: number; y: number }, radius: number, angle: number) {
  return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
}

const REST = REAL_ANGLES.map((a) => polar(CENTER, R, a));

/** Mobile-only replacement for the header's logo/nav: 4 dots forming the
 * upper half of an 8-point wheel centered just below the banner. Every
 * swipe or tap triggers a decaying pulse that rigidly rotates the whole
 * wheel back and forth (so every dot keeps its exact 45-degree spacing
 * from its neighbors throughout — this is a real, literal spin, not an
 * emergent illusion from independently-timed points) while the 4
 * mirrored decorative points at the lower vertices bloom outward from
 * the center and back — then everything settles exactly back to rest.
 * The pulse's initial strength comes from the swipe's real velocity; a
 * plain tap gets a gentle default. Rendered as a position:fixed overlay
 * mounted in app/layout.tsx (outside PageTransition's animated wrapper —
 * that wrapper applies a CSS transform mid-slide, which would otherwise
 * re-anchor any fixed-position descendant to itself instead of the
 * viewport). */
export function MobileNavDots() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = navIndexForPathname(pathname);
  const prevPathnameRef = useRef(pathname);

  const elapsed = useMotionValue(0); // seconds since the current/last pulse began
  const kick = useMotionValue(0); // this pulse's strength (V0)
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
        {DECORATIVE_ANGLES.map((angle, i) => (
          <BloomDot key={`bloom-${i}`} angle={angle} elapsed={elapsed} kick={kick} />
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
  const angle = REAL_ANGLES[index];
  const rest = REST[index];

  const x = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return wheelPosition(t, v0, angle).x - rest.x - 4;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return wheelPosition(t, v0, angle).y - rest.y - 4;
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

/** A purely decorative point (no link, no tab stop) at one of the
 * mirrored lower vertices — invisible at rest (radius 0), blooming
 * outward as the wheel spins and back to invisible as it settles. */
function BloomDot({
  angle,
  elapsed,
  kick,
}: {
  angle: number;
  elapsed: MotionValue<number>;
  kick: MotionValue<number>;
}) {
  const x = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    const r = bloomRadius(t, v0);
    const spun = angle + wheelAngle(t, v0);
    return r * Math.cos(spun) - 3;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    const r = bloomRadius(t, v0);
    const spun = angle + wheelAngle(t, v0);
    return r * Math.sin(spun) - 3;
  });
  const opacity = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return Math.min(0.85, bloomRadius(t, v0) / DECORATIVE_PEAK);
  });

  return (
    <li className="mobile-nav-dot-slot" aria-hidden="true" style={{ left: CENTER.x, top: CENTER.y }}>
      <motion.div style={{ x, y, opacity }} className="mobile-nav-bloom-dot" />
    </li>
  );
}

/** The whole wheel's shared rotation offset: starts and ends at exactly
 * 0 (an impulse response — a decaying sinusoid seeded with real angular
 * velocity at t=0, proportional to the swipe's speed), so every point's
 * spacing relative to its neighbors is preserved throughout, and the
 * pattern always spins back to its exact rest orientation. */
function wheelAngle(t: number, v0: number) {
  if (v0 === 0 || t <= 0) return 0;
  return v0 * ANGLE_KICK * Math.exp(-t / TAU) * Math.sin(SPIN_RATE * t);
}

/** A real dot's absolute position: fixed radius R from CENTER, at its
 * own vertex angle plus the shared wheel rotation — a literal circular
 * arc around a fixed point, not an independent oscillation. */
function wheelPosition(t: number, v0: number, angle: number) {
  return polar(CENTER, R, angle + wheelAngle(t, v0));
}

/** 0 -> peak -> 0, peaking at t=TAU. */
function bloomRadius(t: number, v0: number) {
  if (v0 === 0 || t <= 0) return 0;
  return DECORATIVE_PEAK * (t / TAU) * Math.exp(1 - t / TAU);
}
