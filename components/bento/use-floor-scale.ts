'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Below the grid's floor breakpoint, the layout stops restructuring and
 * instead scales down continuously to fit the viewport. */
export function useFloorScale(containerRef: RefObject<HTMLElement | null>, designWidth = 320): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? designWidth;
      setScale(Math.min(1, Math.max(0.5, width / designWidth)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, designWidth]);

  return scale;
}
