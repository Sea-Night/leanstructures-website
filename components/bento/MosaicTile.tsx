'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import type { MosaicTile as MosaicTileData } from './use-mosaic-page';

type Props = {
  tile: MosaicTileData;
  dimmed: boolean;
  priority?: boolean;
  /** Total grid columns at the current breakpoint — needed to size `sizes`
   * correctly, since a tile can span multiple columns (up to 4x wider than
   * a naive per-breakpoint vw guess), which was causing next/image to
   * serve an under-sized, blurry-looking image for large tiles. */
  gridCols: number;
  onSelect: () => void;
};

const MAX_CONTAINER_PX = 1600;

export function MosaicTile({ tile, dimmed, priority, gridCols, onSelect }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [hasEntered, setHasEntered] = useState(false);
  const { item } = tile;

  const shareVw = Math.round((tile.w / gridCols) * 100);
  const sharePx = Math.round((tile.w / gridCols) * MAX_CONTAINER_PX);
  const sizes = `(min-width: ${MAX_CONTAINER_PX}px) ${sharePx}px, ${shareVw}vw`;

  return (
    <motion.button
      type="button"
      layoutId={`mosaic-photo-${item.key}`}
      onClick={onSelect}
      disabled={dimmed}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: dimmed ? 0.15 : 1, scale: 1 }}
      onAnimationComplete={() => setHasEntered(true)}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.55,
        delay: !hasEntered && !prefersReducedMotion ? tile.revealDelay : 0,
      }}
      style={{
        gridRow: `${tile.row + 1} / span ${tile.h}`,
        gridColumn: `${tile.col + 1} / span ${tile.w}`,
        pointerEvents: dimmed ? 'none' : 'auto',
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
      }}
      className="group relative block w-full h-full min-w-0 min-h-0 overflow-hidden rounded-sm bg-bg-mid text-left"
      aria-label={`${item.project.title}: ${item.image.alt}`}
    >
      <Image
        src={item.image.src}
        alt=""
        fill
        className="object-cover transition-[filter] duration-300 ease-out group-hover:blur-sm group-hover:brightness-[0.45] group-focus-visible:blur-sm group-focus-visible:brightness-[0.45]"
        sizes={sizes}
        priority={priority}
      />
      <span
        style={{ width: `${100 / tile.w}%`, height: `${100 / tile.h}%` }}
        className="absolute left-0 top-0 flex items-start justify-start overflow-hidden p-2 text-xs font-semibold leading-tight text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:text-sm"
      >
        {item.project.title}
      </span>
    </motion.button>
  );
}
