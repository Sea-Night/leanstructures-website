/** Random rectangle tiling for the project mosaic (components/bento/MosaicGrid.tsx).
 *
 * Recursive guillotine/BSP splitting: every split cuts a region into two
 * strictly smaller, non-empty pieces along one axis, so the result
 * structurally cannot overlap or leave a gap — no backtracking needed. */

export type TileRect = { row: number; col: number; w: number; h: number };

export type TilingOptions = {
  maxTileW?: number;
  maxTileH?: number;
  rng?: () => number;
  /** 1 = full size variety (default tuning). 0 = always stop as soon as a
   * region is small enough to qualify, minimizing tile count (used by
   * generateTilingWithBudget to guarantee a fit for a small photo pool). */
  stopBias?: number;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function stopChance(w: number, h: number, maxTileW: number, maxTileH: number, stopBias: number) {
  const area = w * h;
  const maxArea = maxTileW * maxTileH;
  const base = clamp(0.85 - (area / maxArea) * 0.5, 0.3, 0.7);
  // Interpolate toward "always stop" (1) as stopBias -> 0.
  return base + (1 - base) * (1 - stopBias);
}

function biasedCut(size: number, max: number, rng: () => number) {
  if (size > max * 2) {
    return clamp(max + Math.round((rng() - 0.5) * 2), 1, size - 1);
  }
  return clamp(Math.round(size * (0.3 + rng() * 0.4)), 1, size - 1);
}

export function generateTiling(rows: number, cols: number, opts: TilingOptions = {}): TileRect[] {
  const { maxTileW = 4, maxTileH = 4, rng = Math.random, stopBias = 1 } = opts;
  const leaves: TileRect[] = [];

  function split(row: number, col: number, w: number, h: number) {
    const canSplitW = w >= 2;
    const canSplitH = h >= 2;
    const mustSplitW = w > maxTileW && canSplitW;
    const mustSplitH = h > maxTileH && canSplitH;

    if (!canSplitW && !canSplitH) {
      leaves.push({ row, col, w, h });
      return;
    }

    if (!mustSplitW && !mustSplitH && rng() < stopChance(w, h, maxTileW, maxTileH, stopBias)) {
      leaves.push({ row, col, w, h });
      return;
    }

    let axis: 'w' | 'h';
    if (mustSplitW && mustSplitH) axis = rng() < 0.5 ? 'w' : 'h';
    else if (mustSplitW) axis = 'w';
    else if (mustSplitH) axis = 'h';
    else axis = canSplitW && canSplitH ? (rng() < 0.5 ? 'w' : 'h') : canSplitW ? 'w' : 'h';

    if (axis === 'w') {
      const cut = biasedCut(w, maxTileW, rng);
      split(row, col, cut, h);
      split(row, col + cut, w - cut, h);
    } else {
      const cut = biasedCut(h, maxTileH, rng);
      split(row, col, w, cut);
      split(row + cut, col, w, h - cut);
    }
  }

  split(0, 0, cols, rows);

  if (process.env.NODE_ENV !== 'production') assertValidTiling(rows, cols, leaves);

  return leaves;
}

/** Retries with progressively lower stopBias (fewer/larger tiles) so a
 * fresh partition never demands more photos than a thin pool has
 * available. The last attempt (stopBias 0) minimizes tile count to
 * roughly ceil(rows*cols / (maxTileW*maxTileH)), which is always at or
 * below maxTiles for any sane budget — so this is guaranteed to find a
 * fit, not just "closest effort." */
export function generateTilingWithBudget(
  rows: number,
  cols: number,
  maxTiles: number,
  opts: TilingOptions = {},
  attempts = 8
): TileRect[] {
  let best: TileRect[] | null = null;
  for (let i = 0; i < attempts; i++) {
    const stopBias = attempts > 1 ? 1 - i / (attempts - 1) : 1;
    const candidate = generateTiling(rows, cols, { ...opts, stopBias });
    if (candidate.length <= maxTiles) return candidate;
    if (!best || candidate.length < best.length) best = candidate;
  }
  return best as TileRect[];
}

/** Throws if `tiles` doesn't exactly cover the rows×cols grid with no
 * overlaps and no gaps. Dev-only invariant check (also run automatically
 * inside generateTiling outside production). */
export function assertValidTiling(rows: number, cols: number, tiles: TileRect[]) {
  const grid: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false));
  for (const t of tiles) {
    for (let r = t.row; r < t.row + t.h; r++) {
      for (let c = t.col; c < t.col + t.w; c++) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
          throw new Error(`Tile out of bounds: ${JSON.stringify(t)} in ${rows}x${cols}`);
        }
        if (grid[r][c]) {
          throw new Error(`Overlap at (${r},${c}) from tile ${JSON.stringify(t)}`);
        }
        grid[r][c] = true;
      }
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) throw new Error(`Gap at (${r},${c}) in ${rows}x${cols}`);
    }
  }
}
