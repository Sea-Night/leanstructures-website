import type { BentoSize } from '@/lib/projects';

export const BENTO_SIZE_CLASSES: Record<BentoSize, string> = {
  small: 'col-span-1 row-span-1',
  wide: 'col-span-2 row-span-1',
  tall: 'col-span-1 row-span-2',
  large: 'col-span-2 row-span-2',
};

/** Applied to the tile the user has expanded. */
export const BENTO_ACTIVE_CLASS = 'col-span-2 row-span-3 md:col-span-4';

/** Applied to every other tile once one tile is active, so they shrink into a strip. */
export const BENTO_COLLAPSED_CLASS = 'col-span-1 row-span-1';
