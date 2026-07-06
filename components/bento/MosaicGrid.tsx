'use client';

import { useRef, useState } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
import type { Project } from '@/lib/projects';
import { useMosaicPage, type MosaicTile as MosaicTileData } from './use-mosaic-page';
import { useFloorScale } from './use-floor-scale';
import { MosaicTile } from './MosaicTile';
import { ExpandedProjectView } from './ExpandedProjectView';
import { GridArrows } from './GridArrows';

const FLOOR_WIDTH = 320;
const FLOOR_ROW_HEIGHT = 110;
const GAP = 8;

export function MosaicGrid({ projects }: { projects: Project[] }) {
  const { tiles, dims, next, prev, canPrev, pageNumber, poolSize } = useMosaicPage(projects);
  const scaleContainerRef = useRef<HTMLDivElement>(null);
  const scale = useFloorScale(scaleContainerRef, FLOOR_WIDTH);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [anchorSide, setAnchorSide] = useState<'left' | 'right'>('left');

  const selectedTile = tiles.find((t) => t.item.key === selectedKey) ?? null;

  function handleSelect(tile: MosaicTileData) {
    const tileCenterCol = tile.col + tile.w / 2;
    setAnchorSide(tileCenterCol < dims.cols / 2 ? 'left' : 'right');
    setSelectedKey(tile.item.key);
  }

  if (poolSize === 0) {
    return <p style={{ opacity: 0.6, fontSize: 14 }}>Add project photos to see them here.</p>;
  }

  const grid = (
    <LayoutGroup>
      <div
        role="group"
        aria-label={`Project photos, page ${pageNumber}`}
        style={
          dims.isFloor
            ? {
                display: 'grid',
                width: FLOOR_WIDTH,
                gridTemplateColumns: `repeat(${dims.cols}, 1fr)`,
                gridTemplateRows: `repeat(${dims.rows}, ${FLOOR_ROW_HEIGHT}px)`,
                gap: GAP,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
            : {
                display: 'grid',
                width: '100%',
                aspectRatio: `${dims.cols} / ${dims.rows}`,
                gridTemplateColumns: `repeat(${dims.cols}, 1fr)`,
                gridTemplateRows: `repeat(${dims.rows}, 1fr)`,
                gap: GAP,
              }
        }
      >
        {tiles.map((tile, i) => (
          <MosaicTile
            key={tile.item.key}
            tile={tile}
            dimmed={selectedKey !== null && selectedKey !== tile.item.key}
            priority={i < 3}
            onSelect={() => handleSelect(tile)}
          />
        ))}
      </div>
    </LayoutGroup>
  );

  return (
    <div>
      {dims.isFloor ? (
        <div
          ref={scaleContainerRef}
          style={{
            width: '100%',
            height: dims.rows * FLOOR_ROW_HEIGHT + (dims.rows - 1) * GAP,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: FLOOR_WIDTH * scale,
              height: (dims.rows * FLOOR_ROW_HEIGHT + (dims.rows - 1) * GAP) * scale,
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            {grid}
          </div>
        </div>
      ) : (
        grid
      )}

      <GridArrows onPrev={prev} onNext={next} canPrev={canPrev} />

      <span className="visually-hidden" role="status" aria-live="polite">
        Showing {tiles.length} project photos, page {pageNumber}
      </span>

      <AnimatePresence>
        {selectedTile && (
          <ExpandedProjectView
            item={selectedTile.item}
            anchorSide={anchorSide}
            isFloor={dims.isFloor}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
