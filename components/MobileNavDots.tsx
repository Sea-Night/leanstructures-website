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
const SWING = 16; // px — max sweep along each real nav dot's spoke
const DECORATIVE_SWING = 28; // px — the bloom points sweep further, since they carry most of the "many points spinning" read
const VELOCITY_TO_KICK = 0.0012;
const DEFAULT_KICK = 1; // a tap has no swipe velocity, so give it a gentle default pulse
const MAX_KICK = 1.3; // caps how far even a very fast swipe can push the swing

// Fixed rest anchors — a shallow arc across the top of the banner. Every
// real nav dot always returns here exactly; the motion below is a
// purely decorative pulse layered on top, never a permanent displacement.
const REST_X_VW = [35, 45, 55, 65];
const REST_Y_PX = [22, 14, 14, 22];
const CENTER_X_VW = 50; // shared center the bloom points radiate from/to
const CENTER_Y_PX = 18;

// Each point's Cardan-circle spoke offset (a 2:1 hypocycloid — a small
// circle rolling inside one twice its radius — degenerates to a straight
// line through the center; see Tusi couple / Cardano's circles), stated
// as "i" the way the reference fx/fy formula does (phase = i, spanning
// 0..1). The 4 real nav dots sit at the midpoints between 5 evenly
// spaced decorative points, so all 9 form one evenly spaced fan — with
// only 4 dots visible at rest, the ensemble was too sparse to read as
// rotation at all; the decorative points fill it in exactly the way the
// reference's own (variable-count) "phases" list does, blooming in
// during the pulse and fading back out to leave just the 4 real dots.
const CORE_I = [0.125, 0.375, 0.625, 0.875];
const DECORATIVE_I = [0, 0.25, 0.5, 0.75, 1];

function iToAlpha(i: number) {
  return -Math.PI * i;
}

/** Mobile-only replacement for the header's logo/nav: 4 dots on a fixed
 * arc across the top of the banner. Every swipe or tap triggers a
 * decaying pulse: extra decorative points bloom in around a shared
 * center and, together with the 4 real dots, sweep along rotating
 * Cardan-circle spokes (the same fx/fy hypocycloid mechanism as the
 * reference animation) — then the decorative points fade out and every
 * real dot always settles back exactly where it started. The pulse's
 * initial strength comes from the swipe's real velocity; a plain tap
 * gets a gentle default. Rendered as a position:fixed overlay mounted
 * in app/layout.tsx (outside PageTransition's animated wrapper — that
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

  const x = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha, SWING).x - 4;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha, SWING).y - 4;
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
    return sweepOffset(t, v0, alpha, DECORATIVE_SWING).x - 3;
  });
  const y = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return sweepOffset(t, v0, alpha, DECORATIVE_SWING).y - 3;
  });
  const opacity = useTransform([elapsed, kick], (latest) => {
    const [t, v0] = latest as [number, number];
    return Math.min(0.85, bloomEnvelope(t, v0));
  });

  return (
    <li
      className="mobile-nav-dot-slot"
      aria-hidden="true"
      style={{ left: `${CENTER_X_VW}vw`, top: CENTER_Y_PX }}
    >
      <motion.div style={{ x, y, opacity }} className="mobile-nav-bloom-dot" />
    </li>
  );
}

/** Starts and ends at exactly 0, peaking at v0 when t=TAU. */
function bloomEnvelope(t: number, v0: number) {
  if (v0 === 0 || t <= 0) return 0;
  return v0 * (t / TAU) * Math.exp(1 - t / TAU);
}

/** A point's (x, y) offset from its rest anchor at time t, following the
 * reference fx/fy hypocycloid: the spoke direction rotates at SPIN_RATE
 * (using the point's static alpha as its fixed offset within the
 * rotating frame), while the magnitude along that spoke oscillates at
 * exactly 2x SPIN_RATE — also phased by the same static alpha, not by
 * the rotating spoke angle itself. An envelope that starts and ends at
 * exactly 0 guarantees every point always settles back to zero offset
 * regardless of how far the pattern has spun. */
function sweepOffset(t: number, v0: number, alpha: number, swing: number) {
  const envelope = bloomEnvelope(t, v0);
  if (envelope === 0) return { x: 0, y: 0 };
  const spokeAngle = alpha - SPIN_RATE * t;
  const r = envelope * swing * Math.cos(2 * SPIN_RATE * t - alpha);
  return { x: r * Math.cos(spokeAngle), y: r * Math.sin(spokeAngle) };
}
