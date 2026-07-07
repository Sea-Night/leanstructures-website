'use client';

import { useEffect, useState } from 'react';

/** SSR-safe, same convention as components/bento/use-grid-dimensions.ts:
 * defaults to the safe (desktop) assumption until the first client-side
 * measurement, so an unmeasured client never captures a desktop mouse
 * drag as a swipe-to-navigate gesture. */
export function useIsMobile(query = '(max-width: 767px)') {
  const [state, setState] = useState({ isMobile: false, ready: false });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const compute = () => setState({ isMobile: mql.matches, ready: true });
    compute();
    mql.addEventListener('change', compute);
    return () => mql.removeEventListener('change', compute);
  }, [query]);

  return state;
}
