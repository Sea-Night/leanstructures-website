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
const STAGE_HEIGHT = 'clamp(360px, 62vh, 760px)';

export function MosaicGrid({ projects }: { projects: Project[] }) {
  const { tiles, dims, next, prev, canPrev, pageNumber, poolSize } = useMosaicPage(projects);
  const scaleContainerRef = useRef<HTMLDivElement>(null);
  const scale = useFloorScale(scaleContainerRef, FLOOR_WIDTH);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectedTile = tiles.find((t) => t.item.key === selectedKey) ?? null;

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
                height: STAGE_HEIGHT,
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
            onSelect={() => setSelectedKey(tile.item.key)}
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
          <ExpandedProjectView item={selectedTile.item} onClose={() => setSelectedKey(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
