import type { Project, ProjectImage } from '@/lib/projects';

export type PoolItem = {
  key: string;
  project: Project;
  image: ProjectImage;
};

/** Flattens every project's images into one photo pool. Projects with no
 * real images ("coming soon" placeholders) are excluded — they start
 * appearing automatically once real photos are added. */
export function buildPool(projects: Project[]): PoolItem[] {
  const pool: PoolItem[] = [];
  for (const project of projects) {
    if (project.status === 'coming-soon' || project.images.length === 0) continue;
    for (const image of project.images) {
      pool.push({ key: `${project.slug}:${image.src}`, project, image });
    }
  }
  return pool;
}

function fisherYatesShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type PoolState = {
  shuffled: PoolItem[];
  cursor: number;
};

export function initPoolState(all: PoolItem[], rng: () => number = Math.random): PoolState {
  return { shuffled: fisherYatesShuffle(all, rng), cursor: 0 };
}

/** Walks forward through one shuffled epoch of the pool with no repeats;
 * reshuffles and continues once exhausted, so pages stay distinct until
 * the whole pool has been shown, then start a fresh distinct run.
 *
 * Capped to `all.length` — a single page can never contain the same photo
 * twice, even if the caller asks for more tiles than there are photos
 * (items already placed in *this* page are skipped, not re-added, when a
 * reshuffle happens to resurface them). */
export function takePage(
  state: PoolState,
  n: number,
  all: PoolItem[],
  rng: () => number = Math.random
): { page: PoolItem[]; next: PoolState } {
  let { shuffled, cursor } = state;
  const page: PoolItem[] = [];
  const seenInPage = new Set<string>();
  const target = Math.min(n, all.length);

  let reshuffles = 0;
  while (page.length < target) {
    if (cursor >= shuffled.length) {
      shuffled = fisherYatesShuffle(all, rng);
      cursor = 0;
      reshuffles++;
      if (reshuffles > 2 && page.length === 0) break; // safety valve; shouldn't occur since target <= all.length
    }
    const item = shuffled[cursor++];
    if (seenInPage.has(item.key)) continue;
    page.push(item);
    seenInPage.add(item.key);
  }

  return { page, next: { shuffled, cursor } };
}
