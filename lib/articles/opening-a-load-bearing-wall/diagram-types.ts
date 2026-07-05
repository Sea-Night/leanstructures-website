/** Loose types for the hand-authored SVG stage data in diagram-data.json.
 *  This dataset is geometry (path `d` strings, bounding boxes, tags used
 *  by the render logic to identify specific elements) — treat it as an
 *  opaque asset, not something to hand-edit. */

export type PathEl = {
  d: string;
  mat: 'existing' | 'concrete' | 'steel' | 'load' | string;
  rt: string;
  rx?: number;
  bb: number[];
  dash?: string;
  front?: boolean;
  fillbg?: boolean;
  tag?: string;
};

export type StageOpening = {
  y: string | number;
  h: string | number;
  w: number;
  right: number;
};

export type Stage = {
  n: number;
  elements: PathEl[];
  infill: PathEl[];
  opening?: StageOpening;
  delta?: number;
  noErase?: boolean;
  noDraw?: boolean;
  reduceMode?: string;
  colLeft0?: number;
};

export type DiagramData = {
  viewBox: { x: number; y: number; w: number; h: number };
  persistent: Record<string, PathEl[]>;
  stages: Stage[];
  MM: number;
};
