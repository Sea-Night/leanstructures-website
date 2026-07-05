'use client';

import { useEffect, useRef } from 'react';

/* ====================================================================
   EASY SETTINGS — change these numbers any time.
   Ported 1:1 from the static site's js/truss-hero.js. Diagonals are
   intentionally left out of this version while growth, timing and the
   pulse effect are confirmed; they'll return in a follow-up pass.
   ==================================================================== */
const MOVEMENT_AMOUNT_X = 14;
const MOVEMENT_AMOUNT_Y = 42;
const MOVEMENT_SPEED = 0.15;
const DRIFT_RAMP_MS = 2800;
const LINE_DRAW_MS = 1300;
const STAGGER_VARIANCE = 0.35;
const START_JITTER_MS = 120;
const PULSE_MS = 1800;
const RING_MAX_RADIUS = 34;
const AMBIENT_PULSE_MIN_MS = 600;
const AMBIENT_PULSE_MAX_MS = 2200;
const MAX_ROWS = 4;
const MIN_ROWS_CENTER = 2;
const MAX_ROWS_CENTER = 3;
const DIAGONAL_CHANCE = 1.0;
const COLS = 11;
const PULSE_COLORS = ['#2E7A6E', '#3D8F7A', '#1F6B5C'];
const PULSE_SCALE_MIN = 0.6;
const PULSE_SCALE_MAX = 1.6;

const COLORS = { line: '#583B1F', node: '#583B1F', nodeFill: '#E5E0DA' };
const VIEW_W = 1600;
const VIEW_H = 800;
const PAD_X = 60;
const ROW_GAP = (VIEW_H - 280) / (MAX_ROWS - 1);
const CENTER_Y = VIEW_H / 2;

type Node = {
  col: number;
  row: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  phase: number;
  phase2: number;
  speed: number;
  arrivalMs: number | null;
  arrived: boolean;
  pulseStartMs: number | null;
  pulseColor: string | null;
  pulseScale: number;
};

type Pair = { a: Node; b: Node };
type Edge = Pair & { startMs: number; duration: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function rowsForColumn(c: number) {
  const distFromNearEdge = Math.min(c, COLS - 1 - c);
  if (distFromNearEdge === 0) return MAX_ROWS;
  if (distFromNearEdge === 1) return 3;
  return Math.random() < 0.5 ? MIN_ROWS_CENTER : MAX_ROWS_CENTER;
}

function buildNodes() {
  const nodes: Node[] = [];
  const columns: Node[][] = [];
  const colW = (VIEW_W - PAD_X * 2) / (COLS - 1);

  for (let c = 0; c < COLS; c++) {
    const rows = rowsForColumn(c);
    const colNodes: Node[] = [];
    const totalHeight = (rows - 1) * ROW_GAP;
    const startY = CENTER_Y - totalHeight / 2;

    for (let r = 0; r < rows; r++) {
      const baseX = PAD_X + c * colW + rand(-12, 12);
      const baseY = startY + r * ROW_GAP + rand(-12, 12);
      const node: Node = {
        col: c,
        row: r,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        phase: rand(0, Math.PI * 2),
        phase2: rand(0, Math.PI * 2),
        speed: rand(0.8, 1.2),
        arrivalMs: null,
        arrived: false,
        pulseStartMs: null,
        pulseColor: null,
        pulseScale: 1,
      };
      nodes.push(node);
      colNodes.push(node);
    }
    columns.push(colNodes);
  }
  return { nodes, columns };
}

function segCross(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number }
) {
  function ccw(p: typeof a1, q: typeof a1, r: typeof a1) {
    return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  }
  const shared = a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2;
  if (shared) return false;
  const d1 = ccw(a1, a2, b1),
    d2 = ccw(a1, a2, b2);
  const d3 = ccw(b1, b2, a1),
    d4 = ccw(b1, b2, a2);
  return (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0) ? ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)) : false;
}

function buildHorizontalPairs(columns: Node[][], maxCrossConn: number): Pair[] {
  const pairs: Pair[] = [];
  const edgeKey = (a: Node, b: Node) => a.col + '-' + a.row + '__' + b.col + '-' + b.row;
  const existingKeys = new Set<string>();
  const addUnique = (a: Node, b: Node) => {
    const k1 = edgeKey(a, b),
      k2 = edgeKey(b, a);
    if (existingKeys.has(k1) || existingKeys.has(k2)) return false;
    existingKeys.add(k1);
    pairs.push({ a, b });
    return true;
  };

  const totalConnCount = new Map<Node, number>();
  columns.forEach((col) => col.forEach((n) => totalConnCount.set(n, 0)));

  function pos(n: Node) {
    return { x: n.baseX, y: n.baseY };
  }
  function crossBase(a1: Node, a2: Node, b1: Node, b2: Node) {
    return segCross(pos(a1), pos(a2), pos(b1), pos(b2));
  }

  for (let c = 0; c < columns.length - 1; c++) {
    const left = columns[c],
      right = columns[c + 1];
    const candidates: { ln: Node; rn: Node; dist: number }[] = [];
    left.forEach((ln) =>
      right.forEach((rn) => {
        candidates.push({ ln, rn, dist: Math.abs(ln.baseY - rn.baseY) });
      })
    );
    candidates.sort((x, y) => x.dist - y.dist);

    const acceptedThisPair: Pair[] = [];
    const leftCovered = new Set<Node>(),
      rightCovered = new Set<Node>();

    candidates.forEach(({ ln, rn }) => {
      if ((totalConnCount.get(ln) ?? 0) >= maxCrossConn) return;
      if ((totalConnCount.get(rn) ?? 0) >= maxCrossConn) return;
      if (acceptedThisPair.some((e) => crossBase(ln, rn, e.a, e.b))) return;
      if (addUnique(ln, rn)) {
        totalConnCount.set(ln, (totalConnCount.get(ln) ?? 0) + 1);
        totalConnCount.set(rn, (totalConnCount.get(rn) ?? 0) + 1);
        acceptedThisPair.push({ a: ln, b: rn });
        leftCovered.add(ln);
        rightCovered.add(rn);
      }
    });

    function coverSide(side: Node[], other: Node[], covered: Set<Node>, isLeft: boolean) {
      side.forEach((n) => {
        if (covered.has(n)) return;
        const sorted = [...other].sort((x, y) => Math.abs(n.baseY - x.baseY) - Math.abs(n.baseY - y.baseY));
        for (const o of sorted) {
          const a = isLeft ? n : o,
            b = isLeft ? o : n;
          if ((totalConnCount.get(o) ?? 0) >= maxCrossConn) continue;
          if (acceptedThisPair.some((e) => crossBase(a, b, e.a, e.b))) continue;
          addUnique(a, b);
          totalConnCount.set(n, (totalConnCount.get(n) ?? 0) + 1);
          totalConnCount.set(o, (totalConnCount.get(o) ?? 0) + 1);
          acceptedThisPair.push({ a, b });
          covered.add(n);
          return;
        }
        for (const o of sorted) {
          const a = isLeft ? n : o,
            b = isLeft ? o : n;
          if (acceptedThisPair.some((e) => crossBase(a, b, e.a, e.b))) continue;
          addUnique(a, b);
          totalConnCount.set(n, (totalConnCount.get(n) ?? 0) + 1);
          totalConnCount.set(o, (totalConnCount.get(o) ?? 0) + 1);
          acceptedThisPair.push({ a, b });
          covered.add(n);
          return;
        }
        addUnique(isLeft ? n : sorted[0], isLeft ? sorted[0] : n);
        covered.add(n);
      });
    }

    coverSide(left, right, leftCovered, true);
    coverSide(right, left, rightCovered, false);
  }

  return pairs;
}

function buildDiagonalPairs(columns: Node[][], horizontalPairs: Pair[], verticalPairs: Pair[]): Pair[] {
  const diagonals: Pair[] = [];
  const allExisting = [...horizontalPairs, ...verticalPairs];
  function pos(n: Node) {
    return { x: n.baseX, y: n.baseY };
  }
  function crossBase(a1: Node, a2: Node, b1: Node, b2: Node) {
    return segCross(pos(a1), pos(a2), pos(b1), pos(b2));
  }

  for (let c = 0; c < columns.length - 1; c++) {
    const left = columns[c];

    const crossing = horizontalPairs
      .filter((e) => left.includes(e.a) || left.includes(e.b))
      .map((e) => (left.includes(e.a) ? e : { a: e.b, b: e.a }))
      .filter((e) => columns[c + 1].includes(e.b));

    crossing.sort((e1, e2) => e1.a.row - e2.a.row || e1.b.row - e2.b.row);

    for (let i = 0; i < crossing.length - 1; i++) {
      const e1 = crossing[i],
        e2 = crossing[i + 1];
      const corners = new Set([e1.a, e1.b, e2.a, e2.b]);
      if (corners.size < 3) continue;
      if (Math.random() > DIAGONAL_CHANCE) continue;

      const candidates: Pair[] = [];
      if (e1.a !== e2.a) candidates.push({ a: e1.a, b: e2.a });
      if (e1.a !== e2.b) candidates.push({ a: e1.a, b: e2.b });
      if (e1.b !== e2.a) candidates.push({ a: e1.b, b: e2.a });
      if (e1.b !== e2.b) candidates.push({ a: e1.b, b: e2.b });

      for (let k = candidates.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [candidates[k], candidates[j]] = [candidates[j], candidates[k]];
      }

      for (const candidate of candidates) {
        const crossesExisting = allExisting.some((e) => crossBase(candidate.a, candidate.b, e.a, e.b));
        const crossesOtherDiag = diagonals.some((d) => crossBase(candidate.a, candidate.b, d.a, d.b));
        if (!crossesExisting && !crossesOtherDiag) {
          diagonals.push(candidate);
          break;
        }
      }
    }
  }
  return diagonals;
}

function buildEdges(columns: Node[][]): Edge[] {
  const MAX_CROSS_CONN = 3;
  const horizontalPairs = buildHorizontalPairs(columns, MAX_CROSS_CONN);

  const verticalPairs: Pair[] = [];
  columns.forEach((colNodes) => {
    for (let i = 0; i < colNodes.length - 1; i++) {
      if (Math.random() > 0.5) {
        verticalPairs.push({ a: colNodes[i], b: colNodes[i + 1] });
      } else {
        verticalPairs.push({ a: colNodes[i + 1], b: colNodes[i] });
      }
    }
  });

  const diagonalPairs = buildDiagonalPairs(columns, horizontalPairs, verticalPairs);

  function leftCol(pair: Pair) {
    return Math.min(pair.a.col, pair.b.col);
  }

  const numCols = columns.length;
  const edges: Edge[] = [];

  columns[0].forEach((n) => {
    n.arrivalMs = 0;
  });

  for (let c = 0; c < numCols - 1; c++) {
    const left = columns[c];
    const stepBase = Math.max(...left.map((n) => n.arrivalMs as number));

    const horizThisCol = horizontalPairs.filter((p) => leftCol(p) === c);
    const vertThisCol = verticalPairs.filter((p) => p.a.col === c);
    const diagThisCol = diagonalPairs.filter((p) => leftCol(p) === c);

    horizThisCol.forEach((p) => {
      const startMs = stepBase + rand(0, START_JITTER_MS);
      const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
      edges.push({ a: p.a, b: p.b, startMs, duration });
      const rightNode = p.a.col === c ? p.b : p.a;
      const finishMs = startMs + duration;
      rightNode.arrivalMs = rightNode.arrivalMs === null ? finishMs : Math.max(rightNode.arrivalMs, finishMs);
    });

    vertThisCol.forEach((p) => {
      const startMs = stepBase + rand(0, START_JITTER_MS);
      const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
      edges.push({ a: p.a, b: p.b, startMs, duration });
    });

    diagThisCol.forEach((p) => {
      const startMs = stepBase + rand(0, START_JITTER_MS);
      const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
      edges.push({ a: p.a, b: p.b, startMs, duration });
    });
  }

  const lastCol = columns[numCols - 1];
  const lastStepBase = Math.max(...lastCol.map((n) => n.arrivalMs as number));
  const vertLastCol = verticalPairs.filter((p) => p.a.col === numCols - 1 || p.b.col === numCols - 1);
  vertLastCol.forEach((p) => {
    const startMs = lastStepBase + rand(0, START_JITTER_MS);
    const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
    edges.push({ a: p.a, b: p.b, startMs, duration });
  });

  return edges;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function noise1D(x: number) {
  return Math.sin(x) * 0.6 + Math.sin(x * 1.7 + 1.3) * 0.3 + Math.sin(x * 0.31 + 3.1) * 0.1;
}

function liveLength(n1: Node, n2: Node) {
  const dx = n2.x - n1.x,
    dy = n2.y - n1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function HeroTruss() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const NS = 'http://www.w3.org/2000/svg';
    let cancelled = false;
    let rafId: number;

    const { nodes, columns } = buildNodes();
    const edges = buildEdges(columns);
    const totalGrowMs = Math.max(...edges.map((e) => e.startMs + e.duration));

    const lineEls = edges.map(() => {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('stroke', COLORS.line);
      line.setAttribute('stroke-width', '1.4');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', '0');
      svg.appendChild(line);
      return line;
    });

    const nodeEls = nodes.map(() => {
      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('fill', COLORS.nodeFill);
      circle.setAttribute('stroke', COLORS.node);
      circle.setAttribute('opacity', '0');
      svg.appendChild(circle);
      return circle;
    });

    const ringEls = nodes.map(() => {
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('opacity', '0');
      svg.appendChild(ring);
      return ring;
    });

    let startTime: number | null = null;
    let nextAmbientPulseAt: number | null = null;

    function animate(ts: number) {
      if (cancelled) return;
      if (startTime === null) startTime = ts;
      const elapsed = ts - startTime;

      if (elapsed >= totalGrowMs) {
        if (nextAmbientPulseAt === null) {
          nextAmbientPulseAt = elapsed + rand(AMBIENT_PULSE_MIN_MS, AMBIENT_PULSE_MAX_MS);
        } else if (elapsed >= nextAmbientPulseAt) {
          const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
          randomNode.pulseStartMs = elapsed;
          randomNode.pulseColor = PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)];
          randomNode.pulseScale = rand(PULSE_SCALE_MIN, PULSE_SCALE_MAX);
          nextAmbientPulseAt = elapsed + rand(AMBIENT_PULSE_MIN_MS, AMBIENT_PULSE_MAX_MS);
        }
      }

      nodes.forEach((n) => {
        if (elapsed < (n.arrivalMs as number)) {
          n.x = n.baseX;
          n.y = n.baseY;
          return;
        }
        const driftElapsed = elapsed - (n.arrivalMs as number);
        const ramp = Math.min(driftElapsed / DRIFT_RAMP_MS, 1);
        const t = driftElapsed * 0.0006 * MOVEMENT_SPEED;
        const dx = noise1D(n.phase + t * n.speed) * MOVEMENT_AMOUNT_X * ramp;
        const dy = noise1D(n.phase2 + t * n.speed) * MOVEMENT_AMOUNT_Y * ramp;
        n.x = n.baseX + dx;
        n.y = n.baseY + dy;
      });

      edges.forEach((e, i) => {
        const line = lineEls[i];
        const waveStart = e.startMs;

        if (elapsed < waveStart) {
          line.setAttribute('opacity', '0');
          return;
        }

        line.setAttribute('opacity', '1');
        const drawProgress = Math.min((elapsed - waveStart) / e.duration, 1);
        const eased = easeInOutCubic(drawProgress);

        line.setAttribute('x1', String(e.a.x));
        line.setAttribute('y1', String(e.a.y));
        line.setAttribute('x2', String(e.b.x));
        line.setAttribute('y2', String(e.b.y));

        const liveDist = liveLength(e.a, e.b);
        line.setAttribute('stroke-dasharray', String(liveDist));
        line.setAttribute('stroke-dashoffset', String(liveDist * (1 - eased)));
      });

      nodes.forEach((n, i) => {
        const circle = nodeEls[i];
        const ring = ringEls[i];

        if (elapsed < (n.arrivalMs as number)) {
          circle.setAttribute('opacity', '0');
          return;
        }

        circle.setAttribute('opacity', '1');
        circle.setAttribute('cx', String(n.x));
        circle.setAttribute('cy', String(n.y));

        if (!n.arrived) {
          n.arrived = true;
          n.pulseStartMs = elapsed;
          n.pulseColor = PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)];
          n.pulseScale = rand(PULSE_SCALE_MIN, PULSE_SCALE_MAX);
        }

        const pulseElapsed = elapsed - (n.pulseStartMs as number);
        const pulseProgress = Math.min(pulseElapsed / PULSE_MS, 1);

        if (pulseProgress < 1) {
          const bump = Math.sin(pulseProgress * Math.PI);
          const radius = 3.2 + bump * 3.5 * n.pulseScale;
          const strokeW = 1.2 + bump * 2.2 * n.pulseScale;
          circle.setAttribute('r', String(radius));
          circle.setAttribute('stroke-width', String(strokeW));

          const ringRadius = 4 + pulseProgress * RING_MAX_RADIUS * n.pulseScale;
          const ringWidth = Math.max(2.5 * (1 - pulseProgress), 0.2);
          const ringOpacity = 1 - pulseProgress;
          ring.setAttribute('cx', String(n.x));
          ring.setAttribute('cy', String(n.y));
          ring.setAttribute('r', String(ringRadius));
          ring.setAttribute('stroke', n.pulseColor as string);
          ring.setAttribute('stroke-width', String(ringWidth));
          ring.setAttribute('opacity', String(ringOpacity));
        } else {
          circle.setAttribute('r', '3.2');
          circle.setAttribute('stroke-width', '1.2');
          ring.setAttribute('opacity', '0');
        }
      });

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lineEls.forEach((el) => el.remove());
      nodeEls.forEach((el) => el.remove());
      ringEls.forEach((el) => el.remove());
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1600 800"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    />
  );
}
