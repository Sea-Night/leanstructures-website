'use client';

import { useState } from 'react';
import { LayoutGroup, AnimatePresence } from 'motion/react';
import type { Project } from '@/lib/projects';
import { useMosaicPage, type MosaicTile as MosaicTileData } from './use-mosaic-page';
import { useIsMobile } from '@/components/use-is-mobile';
import { MosaicTile } from './MosaicTile';
import { ExpandedProjectView } from './ExpandedProjectView';
import { GridArrows } from './GridArrows';

// On mobile (any tier, not just the floor), tiles render at this fixed
// comfortable height and the grid simply gets taller — the page scrolls
// to show it all. On mobile the ancestor chain (PageSwipeNav/PageTransition/
// .stage) is natural-height, not viewport-filling, so a percentage-height
// grid would have nothing definite to resolve against and collapse.
const MOBILE_ROW_HEIGHT = 140;
const GAP = 8;

export function MosaicGrid({ projects }: { projects: Project[] }) {
  const { tiles, dims, next, prev, canPrev, pageNumber, poolSize } = useMosaicPage(projects);
  const { isMobile } = useIsMobile();
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
          isMobile
            ? {
                display: 'grid',
                width: '100%',
                gridTemplateColumns: `repeat(${dims.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${dims.rows}, ${MOBILE_ROW_HEIGHT}px)`,
                gap: GAP,
              }
            : {
                display: 'grid',
                width: '100%',
                height: '100%',
                gridTemplateColumns: `repeat(${dims.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${dims.rows}, minmax(0, 1fr))`,
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
            gridCols={dims.cols}
            onSelect={() => setSelectedKey(tile.item.key)}
          />
        ))}
      </div>
    </LayoutGroup>
  );

  return (
    <div className="flex flex-col md:flex-1 md:min-h-0">
      {isMobile ? (
        <div style={{ width: '100%', height: dims.rows * MOBILE_ROW_HEIGHT + (dims.rows - 1) * GAP }}>
          {grid}
        </div>
      ) : (
        <div className="min-h-0 flex-1">{grid}</div>
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
