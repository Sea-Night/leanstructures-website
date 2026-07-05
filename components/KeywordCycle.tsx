'use client';

import { useEffect, useRef } from 'react';

const KEYWORDS = [
  'Passivhaus',
  'AECB',
  'Green Oak',
  'CLT',
  'Straw Bale',
  'Rammed Earth',
  'Heritage',
  'Sculptures',
  'Moving Structures',
  'Low Carbon',
  'Hempcrete',
  'Structural Timber',
];

const ENTRY_LETTER_DURATION = 600;
const ENTRY_MAX_STAGGER = 280;
const EXIT_LETTER_DURATION = 350;
const EXIT_MAX_STAGGER = 160;
const HOLD_DURATION = 1800;
const OVERSHOOT = 0.35;

const OFFSET_MIN = 8;
const OFFSET_MAX = 18;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function easeOutBack(t: number, overshoot: number) {
  const c1 = overshoot;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeInBack(t: number, overshoot: number) {
  const c1 = overshoot;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

export function KeywordCycle() {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let queue: number[] = [];
    function refillQueue() {
      queue = KEYWORDS.map((_, i) => i);
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }
    function nextWord() {
      if (queue.length === 0) refillQueue();
      return KEYWORDS[queue.pop() as number];
    }

    let rafId: number | null = null;
    let cancelled = false;

    function buildLetterSpans(word: string) {
      container!.textContent = '';
      const spans: HTMLSpanElement[] = [];
      word.split('').forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'kc-letter';
        span.textContent = ch === ' ' ? ' ' : ch;
        container!.appendChild(span);
        spans.push(span);
      });
      return spans;
    }

    function assignStagger(spans: HTMLSpanElement[], maxStagger: number) {
      return spans.map((_, i) => {
        const base = (i / spans.length) * maxStagger;
        const jitter = (Math.random() - 0.5) * (maxStagger / spans.length) * 0.4;
        return Math.max(0, base + jitter);
      });
    }

    function assignOffsets(spans: HTMLSpanElement[]) {
      return spans.map(() => {
        const distance = rand(OFFSET_MIN, OFFSET_MAX);
        const angle = rand(-50, 50) * (Math.random() < 0.5 ? 1 : -1) - 90;
        const rad = (angle * Math.PI) / 180;
        return {
          x: Math.cos(rad) * distance * 0.4,
          y: Math.sin(rad) * distance,
        };
      });
    }

    function animateEntry(spans: HTMLSpanElement[], onDone: () => void) {
      const staggers = assignStagger(spans, ENTRY_MAX_STAGGER);
      const offsets = assignOffsets(spans);
      spans.forEach((span, i) => {
        span.style.opacity = '0';
        span.style.transform = `translate(${offsets[i].x}px, ${offsets[i].y}px)`;
      });

      const startTime = performance.now();
      const totalDuration = Math.max(...staggers) + ENTRY_LETTER_DURATION;

      function frame(now: number) {
        if (cancelled) return;
        const elapsed = now - startTime;
        spans.forEach((span, i) => {
          const localElapsed = elapsed - staggers[i];
          if (localElapsed <= 0) return;
          const t = Math.min(localElapsed / ENTRY_LETTER_DURATION, 1);
          const eased = easeOutBack(t, OVERSHOOT);
          const ox = offsets[i].x * (1 - eased);
          const oy = offsets[i].y * (1 - eased);
          span.style.opacity = String(Math.min(localElapsed / (ENTRY_LETTER_DURATION * 0.5), 1));
          span.style.transform = `translate(${ox}px, ${oy}px)`;
        });
        if (elapsed < totalDuration) {
          rafId = requestAnimationFrame(frame);
        } else {
          spans.forEach((span) => {
            span.style.opacity = '1';
            span.style.transform = 'translate(0px, 0px)';
          });
          onDone();
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    function animateExit(spans: HTMLSpanElement[], onDone: () => void) {
      const staggers = assignStagger(spans, EXIT_MAX_STAGGER);
      const offsets = assignOffsets(spans);

      const startTime = performance.now();
      const totalDuration = Math.max(...staggers) + EXIT_LETTER_DURATION;

      function frame(now: number) {
        if (cancelled) return;
        const elapsed = now - startTime;
        spans.forEach((span, i) => {
          const localElapsed = elapsed - staggers[i];
          if (localElapsed <= 0) return;
          const t = Math.min(localElapsed / EXIT_LETTER_DURATION, 1);
          const eased = easeInBack(t, OVERSHOOT);
          const ox = offsets[i].x * eased;
          const oy = offsets[i].y * eased;
          span.style.opacity = String(Math.max(1 - localElapsed / (EXIT_LETTER_DURATION * 0.7), 0));
          span.style.transform = `translate(${ox}px, ${oy}px)`;
        });
        if (elapsed < totalDuration) {
          rafId = requestAnimationFrame(frame);
        } else {
          onDone();
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    function cycle() {
      if (cancelled) return;
      const word = nextWord();
      const spans = buildLetterSpans(word);

      if (prefersReducedMotion) {
        spans.forEach((span) => {
          span.style.opacity = '1';
          span.style.transform = 'none';
        });
        setTimeout(() => {
          if (cancelled) return;
          cycle();
        }, HOLD_DURATION + ENTRY_LETTER_DURATION);
        return;
      }

      animateEntry(spans, () => {
        setTimeout(() => {
          if (cancelled) return;
          animateExit(spans, () => {
            if (cancelled) return;
            cycle();
          });
        }, HOLD_DURATION);
      });
    }

    cycle();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <h1
      ref={containerRef}
      id="keyword-cycle"
      className="keyword-cycle"
      aria-hidden="true"
    />
  );
}
