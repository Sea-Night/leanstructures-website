'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

type ParallaxLayerProps = {
  /** 0-1, how strongly the child drifts relative to scroll. */
  speed?: number;
  className?: string;
  children: ReactNode;
};

/**
 * Scroll-linked drift for a background/image layer, clipped by the parent.
 * Client-side successor to js/parallax.js — approximates the original's
 * distance-from-viewport-center offset using scroll progress across the
 * element's own viewport traversal, rather than per-frame rect math.
 */
export function ParallaxLayer({ speed = 0.2, className, children }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const travelPercent = speed * 15;
  const y = useTransform(scrollYProgress, [0, 1], [`${travelPercent}%`, `-${travelPercent}%`]);

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={`${className ?? ''} overflow-hidden`}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
