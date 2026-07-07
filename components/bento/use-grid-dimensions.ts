'use client';

import { useEffect, useState } from 'react';

export type GridDims = { rows: number; cols: number; isFloor: boolean; ready: boolean };

const TIERS: { query: string; rows: number; cols: number }[] = [
  { query: '(min-width: 1536px)', rows: 5, cols: 7 },
  { query: '(min-width: 1280px)', rows: 5, cols: 6 },
  { query: '(min-width: 1024px)', rows: 4, cols: 5 },
  { query: '(min-width: 768px)', rows: 4, cols: 4 },
  { query: '(min-width: 640px)', rows: 3, cols: 3 },
  { query: '(min-width: 400px)', rows: 3, cols: 2 },
];
// Below 400px (most phones in portrait): stop trading columns for width and
// instead grow rows to use the length of a scrollable mobile page, at full
// tile size — never fewer than 2 cols x 3 rows.
const FLOOR = { rows: 6, cols: 2 };

/** SSR-safe: `ready` stays false until the first client-side measurement,
 * so callers can defer randomized layout work until then and avoid a
 * flash of the wrong breakpoint. */
export function useGridDimensions(): GridDims {
  const [dims, setDims] = useState<GridDims>({ ...FLOOR, isFloor: true, ready: false });

  useEffect(() => {
    const mqls = TIERS.map((t) => window.matchMedia(t.query));

    function compute() {
      for (let i = 0; i < TIERS.length; i++) {
        if (mqls[i].matches) {
          setDims({ rows: TIERS[i].rows, cols: TIERS[i].cols, isFloor: false, ready: true });
          return;
        }
      }
      setDims({ ...FLOOR, isFloor: true, ready: true });
    }

    compute();
    mqls.forEach((mql) => mql.addEventListener('change', compute));
    return () => {
      mqls.forEach((mql) => mql.removeEventListener('change', compute));
    };
  }, []);

  return dims;
}
