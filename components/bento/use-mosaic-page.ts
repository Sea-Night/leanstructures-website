'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '@/lib/projects';
import { buildPool, initPoolState, takePage, type PoolItem, type PoolState } from '@/lib/bento-pool';
import { generateTilingWithBudget, type TileRect } from '@/lib/bento-tiling';
import { useGridDimensions } from './use-grid-dimensions';

export type MosaicTile = TileRect & { item: PoolItem; revealDelay: number };

type HistoryEntry = {
  rows: number;
  cols: number;
  tiles: MosaicTile[];
  poolStateAfter: PoolState;
};

const MAX_HISTORY = 20;

function assignRevealDelays(tiles: TileRect[], rng: () => number): MosaicTile['revealDelay'][] {
  // Random per-tile delay, independent of DOM/tab order (which stays row-major).
  const order = tiles.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const delays = new Array<number>(tiles.length);
  const STEP = 0.11;
  order.forEach((tileIndex, revealPosition) => {
    delays[tileIndex] = revealPosition * STEP;
  });
  return delays;
}

export function useMosaicPage(projects: Project[]) {
  const pool = useMemo(() => buildPool(projects), [projects]);
  const dims = useGridDimensions();

  const poolStateRef = useRef<PoolState | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const lastDimsKeyRef = useRef<string>('');

  const [tiles, setTiles] = useState<MosaicTile[]>([]);
  const [pageNumber, setPageNumber] = useState(0);

  function makeEntry(rows: number, cols: number): HistoryEntry {
    if (!poolStateRef.current) poolStateRef.current = initPoolState(pool);
    const budget = pool.length > 0 ? Math.min(pool.length, rows * cols) : 1;
    // Stable row-major order for DOM/tab order; reveal delay is assigned
    // separately below so the *visual* reveal sequence stays randomized.
    const tiling = generateTilingWithBudget(rows, cols, budget).sort(
      (a, b) => a.row - b.row || a.col - b.col
    );
    const { page, next } = takePage(poolStateRef.current, tiling.length, pool);
    poolStateRef.current = next;
    // Defensive: page should always match tiling.length (budget is capped
    // to pool size), but if an extreme edge case ever undershoots, drop
    // the excess tile rects rather than render an item-less tile.
    const usableTiling = tiling.slice(0, page.length);
    const delays = assignRevealDelays(usableTiling, Math.random);
    const entryTiles: MosaicTile[] = usableTiling.map((rect, i) => ({
      ...rect,
      item: page[i],
      revealDelay: delays[i],
    }));
    return { rows, cols, tiles: entryTiles, poolStateAfter: next };
  }

  useEffect(() => {
    if (!dims.ready || pool.length === 0) return;
    const dimsKey = `${dims.rows}x${dims.cols}`;
    if (dimsKey === lastDimsKeyRef.current && historyRef.current.length > 0) return;
    lastDimsKeyRef.current = dimsKey;

    const entry = makeEntry(dims.rows, dims.cols);
    historyRef.current = [entry];
    historyIndexRef.current = 0;
    setTiles(entry.tiles);
    setPageNumber(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.ready, dims.rows, dims.cols, pool.length]);

  function next() {
    if (pool.length === 0) return;
    const idx = historyIndexRef.current;
    if (idx < historyRef.current.length - 1) {
      historyIndexRef.current = idx + 1;
      setTiles(historyRef.current[historyIndexRef.current].tiles);
      setPageNumber(historyIndexRef.current + 1);
      return;
    }
    const entry = makeEntry(dims.rows, dims.cols);
    historyRef.current = [...historyRef.current, entry].slice(-MAX_HISTORY);
    historyIndexRef.current = historyRef.current.length - 1;
    setTiles(entry.tiles);
    setPageNumber(historyIndexRef.current + 1);
  }

  function prev() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setTiles(historyRef.current[historyIndexRef.current].tiles);
    setPageNumber(historyIndexRef.current + 1);
  }

  const canPrev = historyIndexRef.current > 0;

  return { tiles, dims, next, prev, canPrev, pageNumber, poolSize: pool.length };
}
