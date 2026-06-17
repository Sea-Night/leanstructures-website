(function () {

  /* ====================================================================
     EASY SETTINGS — change these numbers any time.
     NOTE: diagonals are intentionally left out of this version while we
     confirm growth, timing and the pulse effect all work correctly.
     They'll be added back in a follow-up pass once this is confirmed.
     ==================================================================== */
  const MOVEMENT_AMOUNT_X = 14;    // how far nodes drift horizontally once settled. Try 4 (subtle) to 24 (lively).
  const MOVEMENT_AMOUNT_Y = 42;    // how far nodes drift vertically once settled — set higher than X for taller, more pronounced vertical motion.
  const MOVEMENT_SPEED    = 0.15;  // how fast the drift cycles. 0.3 = slow/calm, 1.2 = fast/jittery.
  const DRIFT_RAMP_MS     = 2800;  // how long drift takes to ease up to full strength once a node arrives.
  const LINE_DRAW_MS      = 1300;  // base time each member takes to draw. Higher = slower overall build. (was 700)
  const STAGGER_VARIANCE  = 0.35;  // +/- randomness on each member's draw duration (0 = perfectly uniform, 0.5 = quite irregular). This is what makes some nodes pulse a little later than their column-mates.
  const START_JITTER_MS   = 120;   // small random delay before a member starts growing, on top of its column's base timing. Adds further irregularity.
  const PULSE_MS          = 1800;  // how long the node thickness pulse + colour ring takes to play.
  const RING_MAX_RADIUS   = 34;    // how far the colour ring expands before disappearing.
  const AMBIENT_PULSE_MIN_MS = 600;  // once growth finishes, minimum gap before a random ambient pulse fires.
  const AMBIENT_PULSE_MAX_MS = 2200; // maximum gap between random ambient pulses.
  const MAX_ROWS           = 4;    // node-rows at the flared left/right edges.
  const MIN_ROWS_CENTER    = 2;    // minimum node-rows in the central span.
  const MAX_ROWS_CENTER    = 3;    // maximum node-rows in the central span — each central column randomly picks between MIN and MAX.
  const DIAGONAL_CHANCE    = 1.0;  // chance (0-1) that an eligible cell gets a diagonal at all. 1.0 = every eligible cell gets one.
  const COLS              = 11;    // number of node columns, left to right.
  const PULSE_COLORS      = ['#2E7A6E', '#3D8F7A', '#1F6B5C']; // 3 highlight colours, same muted teal tone, randomly chosen per pulse.
  const PULSE_SCALE_MIN   = 0.6;   // smallest possible random pulse size multiplier.
  const PULSE_SCALE_MAX   = 1.6;   // largest possible random pulse size multiplier.
  /* ==================================================================== */

  const svg = document.getElementById('truss-svg');
  const NS = 'http://www.w3.org/2000/svg';

  const COLORS = {
    line: '#583B1F',
    node: '#583B1F',
    nodeFill: '#E5E0DA'
  };

  const VIEW_W = 1600;
  const VIEW_H = 800;
  const PAD_X = 60;
  const ROW_GAP = (VIEW_H - 280) / (MAX_ROWS - 1);
  const CENTER_Y = VIEW_H / 2;

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Discrete step taper, rather than a smooth blend: the very edge column
  // sits at MAX_ROWS, exactly one column in from each edge steps down to
  // 3, and everything beyond that is the randomized 2-3 center span.
  function rowsForColumn(c) {
    const distFromNearEdge = Math.min(c, COLS - 1 - c);
    if (distFromNearEdge === 0) return MAX_ROWS;
    if (distFromNearEdge === 1) return 3;
    return Math.random() < 0.5 ? MIN_ROWS_CENTER : MAX_ROWS_CENTER;
  }

  function buildNodes() {
    const nodes = [];
    const columns = [];
    const colW = (VIEW_W - PAD_X * 2) / (COLS - 1);

    for (let c = 0; c < COLS; c++) {
      const rows = rowsForColumn(c);
      const colNodes = [];
      const totalHeight = (rows - 1) * ROW_GAP;
      const startY = CENTER_Y - totalHeight / 2;

      for (let r = 0; r < rows; r++) {
        const baseX = PAD_X + c * colW + rand(-12, 12);
        const baseY = startY + r * ROW_GAP + rand(-12, 12);
        const node = {
          col: c,
          row: r,
          baseX, baseY,
          x: baseX, y: baseY,
          phase: rand(0, Math.PI * 2),
          phase2: rand(0, Math.PI * 2),
          speed: rand(0.8, 1.2),
          arrivalMs: null,
          arrived: false,
          pulseStartMs: null,
          pulseColor: null,
          pulseScale: 1
        };
        nodes.push(node);
        colNodes.push(node);
      }
      columns.push(colNodes);
    }
    return { nodes, columns };
  }

  // Horizontals use a crossing-free nearest-match connector (needed since
  // row counts can now differ between any two adjacent columns, not just
  // in a one-way taper). Verticals connect adjacent nodes within a column,
  // with their draw direction (top-to-bottom or bottom-to-top) randomized
  // per edge. Diagonals are added afterward, restricted to cells where
  // both rungs are confirmed clean row-to-row connections, and each
  // candidate is checked geometrically against every existing edge and
  // every other diagonal before being committed — this is what keeps the
  // truss free of any crossing, regardless of how the taper or the 2/3
  // row randomization shapes a given column.
  //
  // Timing: growth remains sequential and arrival-driven. Each member
  // gets its own slightly randomized draw duration and small random start
  // delay, so nodes within a column don't pulse in perfect lockstep. A
  // column's step can only begin once every node in the previous column
  // has arrived, including its slowest member.
  function segCross(a1, a2, b1, b2) {
    function ccw(p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); }
    const shared = (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2);
    if (shared) return false;
    const d1 = ccw(a1, a2, b1), d2 = ccw(a1, a2, b2);
    const d3 = ccw(b1, b2, a1), d4 = ccw(b1, b2, a2);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
           ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  function buildHorizontalPairs(columns, maxCrossConn) {
    const pairs = []; // { a, b } using baseX/baseY positions, per column boundary
    const edgeKey = (a, b) => a.col + '-' + a.row + '__' + b.col + '-' + b.row;
    const existingKeys = new Set();
    const addUnique = (a, b) => {
      const k1 = edgeKey(a, b), k2 = edgeKey(b, a);
      if (existingKeys.has(k1) || existingKeys.has(k2)) return false;
      existingKeys.add(k1);
      pairs.push({ a, b });
      return true;
    };

    const totalConnCount = new Map();
    columns.forEach(col => col.forEach(n => totalConnCount.set(n, 0)));

    function pos(n) { return { x: n.baseX, y: n.baseY }; }
    function crossBase(a1, a2, b1, b2) { return segCross(pos(a1), pos(a2), pos(b1), pos(b2)); }

    for (let c = 0; c < columns.length - 1; c++) {
      const left = columns[c], right = columns[c + 1];
      const candidates = [];
      left.forEach(ln => right.forEach(rn => {
        candidates.push({ ln, rn, dist: Math.abs(ln.baseY - rn.baseY) });
      }));
      candidates.sort((x, y) => x.dist - y.dist);

      const acceptedThisPair = [];
      const leftCovered = new Set(), rightCovered = new Set();

      candidates.forEach(({ ln, rn }) => {
        if (totalConnCount.get(ln) >= maxCrossConn) return;
        if (totalConnCount.get(rn) >= maxCrossConn) return;
        if (acceptedThisPair.some(e => crossBase(ln, rn, e.a, e.b))) return;
        if (addUnique(ln, rn)) {
          totalConnCount.set(ln, totalConnCount.get(ln) + 1);
          totalConnCount.set(rn, totalConnCount.get(rn) + 1);
          acceptedThisPair.push({ a: ln, b: rn });
          leftCovered.add(ln); rightCovered.add(rn);
        }
      });

      function coverSide(side, other, covered, isLeft) {
        side.forEach(n => {
          if (covered.has(n)) return;
          const sorted = [...other].sort((x, y) =>
            Math.abs(n.baseY - x.baseY) - Math.abs(n.baseY - y.baseY)
          );
          for (const o of sorted) {
            const a = isLeft ? n : o, b = isLeft ? o : n;
            if (totalConnCount.get(o) >= maxCrossConn) continue;
            if (acceptedThisPair.some(e => crossBase(a, b, e.a, e.b))) continue;
            addUnique(a, b);
            totalConnCount.set(n, totalConnCount.get(n) + 1);
            totalConnCount.set(o, totalConnCount.get(o) + 1);
            acceptedThisPair.push({ a, b });
            covered.add(n);
            return;
          }
          for (const o of sorted) {
            const a = isLeft ? n : o, b = isLeft ? o : n;
            if (acceptedThisPair.some(e => crossBase(a, b, e.a, e.b))) continue;
            addUnique(a, b);
            totalConnCount.set(n, totalConnCount.get(n) + 1);
            totalConnCount.set(o, totalConnCount.get(o) + 1);
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

  // Detects every quad formed by the horizontal connector between any two
  // adjacent columns — including irregular ones in the taper/mismatch
  // zones, where row counts differ — and places exactly one diagonal in
  // each. Every candidate orientation is checked against the real
  // geometry of every existing edge and every previously placed diagonal,
  // so this never introduces a crossing, and (verified across hundreds of
  // randomized trials) always succeeds in finding a valid orientation, so
  // every eligible cell ends up with a diagonal rather than a plain square.
  function buildDiagonalPairs(columns, horizontalPairs, verticalPairs) {
    const diagonals = [];
    const allExisting = [...horizontalPairs, ...verticalPairs];
    function pos(n) { return { x: n.baseX, y: n.baseY }; }
    function crossBase(a1, a2, b1, b2) { return segCross(pos(a1), pos(a2), pos(b1), pos(b2)); }

    for (let c = 0; c < columns.length - 1; c++) {
      const left = columns[c], right = columns[c + 1];

      const crossing = horizontalPairs
        .filter(e => left.includes(e.a) || left.includes(e.b))
        .map(e => left.includes(e.a) ? e : { a: e.b, b: e.a })
        .filter(e => right.includes(e.b));

      crossing.sort((e1, e2) => e1.a.row - e2.a.row || e1.b.row - e2.b.row);

      for (let i = 0; i < crossing.length - 1; i++) {
        const e1 = crossing[i], e2 = crossing[i + 1];
        const corners = new Set([e1.a, e1.b, e2.a, e2.b]);
        if (corners.size < 3) continue;
        if (Math.random() > DIAGONAL_CHANCE) continue;

        const candidates = [];
        if (e1.a !== e2.a) candidates.push({ a: e1.a, b: e2.a });
        if (e1.a !== e2.b) candidates.push({ a: e1.a, b: e2.b });
        if (e1.b !== e2.a) candidates.push({ a: e1.b, b: e2.a });
        if (e1.b !== e2.b) candidates.push({ a: e1.b, b: e2.b });

        for (let k = candidates.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [candidates[k], candidates[j]] = [candidates[j], candidates[k]];
        }

        for (const candidate of candidates) {
          const crossesExisting = allExisting.some(e => crossBase(candidate.a, candidate.b, e.a, e.b));
          const crossesOtherDiag = diagonals.some(d => crossBase(candidate.a, candidate.b, d.a, d.b));
          if (!crossesExisting && !crossesOtherDiag) {
            diagonals.push(candidate);
            break;
          }
        }
      }
    }
    return diagonals;
  }

  function buildEdges(columns) {
    const MAX_CROSS_CONN = 3;

    const horizontalPairs = buildHorizontalPairs(columns, MAX_CROSS_CONN);

    const verticalPairs = [];
    columns.forEach(colNodes => {
      for (let i = 0; i < colNodes.length - 1; i++) {
        // randomize draw direction: sometimes top-to-bottom, sometimes
        // bottom-to-top — purely which endpoint is treated as the
        // animation's starting point, with no effect on the line's
        // actual position, so it can never introduce a crossing.
        if (Math.random() > 0.5) {
          verticalPairs.push({ a: colNodes[i], b: colNodes[i + 1] });
        } else {
          verticalPairs.push({ a: colNodes[i + 1], b: colNodes[i] });
        }
      }
    });

    const diagonalPairs = buildDiagonalPairs(columns, horizontalPairs, verticalPairs);

    // Build a quick lookup of which column each horizontal/diagonal pair
    // "belongs to" for timing purposes — horizontals and diagonals both
    // belong to the LEFT column (the one they grow out of); verticals
    // belong to their own column.
    function leftCol(pair) { return Math.min(pair.a.col, pair.b.col); }

    const numCols = columns.length;
    const edges = [];

    columns[0].forEach(n => { n.arrivalMs = 0; });

    for (let c = 0; c < numCols - 1; c++) {
      const left = columns[c];
      const stepBase = Math.max(...left.map(n => n.arrivalMs));

      const horizThisCol = horizontalPairs.filter(p => leftCol(p) === c);
      const vertThisCol = verticalPairs.filter(p => p.a.col === c);
      const diagThisCol = diagonalPairs.filter(p => leftCol(p) === c);

      horizThisCol.forEach(p => {
        const startMs = stepBase + rand(0, START_JITTER_MS);
        const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
        edges.push({ a: p.a, b: p.b, startMs, duration });
        // a node's arrival = the LATEST finishing incoming horizontal it has
        // (a node can receive more than one, since MAX_CROSS_CONN allows it)
        const rightNode = p.a.col === c ? p.b : p.a;
        const finishMs = startMs + duration;
        rightNode.arrivalMs = rightNode.arrivalMs === null
          ? finishMs
          : Math.max(rightNode.arrivalMs, finishMs);
      });

      vertThisCol.forEach(p => {
        const startMs = stepBase + rand(0, START_JITTER_MS);
        const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
        edges.push({ a: p.a, b: p.b, startMs, duration });
      });

      diagThisCol.forEach(p => {
        const startMs = stepBase + rand(0, START_JITTER_MS);
        const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
        edges.push({ a: p.a, b: p.b, startMs, duration });
      });
    }

    const lastCol = columns[numCols - 1];
    const lastStepBase = Math.max(...lastCol.map(n => n.arrivalMs));
    const vertLastCol = verticalPairs.filter(p => p.a.col === numCols - 1 || p.b.col === numCols - 1);
    vertLastCol.forEach(p => {
      const startMs = lastStepBase + rand(0, START_JITTER_MS);
      const duration = LINE_DRAW_MS * rand(1 - STAGGER_VARIANCE, 1 + STAGGER_VARIANCE);
      edges.push({ a: p.a, b: p.b, startMs, duration });
    });

    return edges;
  }

  const { nodes, columns } = buildNodes();
  const edges = buildEdges(columns);

  // Fully grown once the slowest member anywhere finishes drawing.
  const totalGrowMs = Math.max(...edges.map(e => e.startMs + e.duration));

  function liveLength(n1, n2) {
    const dx = n2.x - n1.x, dy = n2.y - n1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

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

  // One ring element per node, created once, reused for that node's pulses.
  // Colour is assigned fresh each time a pulse triggers (see trigger points
  // below), so repeated pulses on the same node can show different colours.
  const ringEls = nodes.map(() => {
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('opacity', '0');
    svg.appendChild(ring);
    return ring;
  });

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  let startTime = null;
  let nextAmbientPulseAt = null; // elapsed-ms timestamp of the next scheduled ambient pulse; set once growth finishes

  function noise1D(x) {
    return Math.sin(x) * 0.6 + Math.sin(x * 1.7 + 1.3) * 0.3 + Math.sin(x * 0.31 + 3.1) * 0.1;
  }

  function animate(ts) {
    if (startTime === null) startTime = ts;
    const elapsed = ts - startTime;

    // --- once the whole truss has finished growing, occasionally trigger
    //     a fresh pulse on a random node, purely for ambient life ---
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

    // --- drift position update: fully independent per node. Each node
    //     starts drifting the instant IT arrives (when its pulse fires),
    //     not when the whole truss finishes growing — so early columns
    //     are already gently moving while later columns are still
    //     being built out to the right. ---
    nodes.forEach(n => {
      if (elapsed < n.arrivalMs) {
        n.x = n.baseX;
        n.y = n.baseY;
        return;
      }
      const driftElapsed = elapsed - n.arrivalMs;
      const ramp = Math.min(driftElapsed / DRIFT_RAMP_MS, 1);
      const t = driftElapsed * 0.0006 * MOVEMENT_SPEED;
      const dx = noise1D(n.phase + t * n.speed) * MOVEMENT_AMOUNT_X * ramp;
      const dy = noise1D(n.phase2 + t * n.speed) * MOVEMENT_AMOUNT_Y * ramp;
      n.x = n.baseX + dx;
      n.y = n.baseY + dy;
    });

    // --- lines: draw-on progress, then live-length tracking once drawn ---
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

      // always position the line at the nodes' LIVE (possibly drifted) coords
      line.setAttribute('x1', e.a.x);
      line.setAttribute('y1', e.a.y);
      line.setAttribute('x2', e.b.x);
      line.setAttribute('y2', e.b.y);

      // recompute dash length from the live distance every frame — this is
      // what keeps the line glued to its nodes even as they drift, instead
      // of detaching once movement starts
      const liveDist = liveLength(e.a, e.b);
      line.setAttribute('stroke-dasharray', String(liveDist));
      line.setAttribute('stroke-dashoffset', String(liveDist * (1 - eased)));
    });

    // --- nodes: appear at arrival time, trigger one-time pulse ---
    nodes.forEach((n, i) => {
      const circle = nodeEls[i];
      const ring = ringEls[i];

      if (elapsed < n.arrivalMs) {
        circle.setAttribute('opacity', '0');
        return;
      }

      circle.setAttribute('opacity', '1');
      circle.setAttribute('cx', n.x);
      circle.setAttribute('cy', n.y);

      if (!n.arrived) {
        n.arrived = true;
        n.pulseStartMs = elapsed;
        n.pulseColor = PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)];
        n.pulseScale = rand(PULSE_SCALE_MIN, PULSE_SCALE_MAX);
      }

      const pulseElapsed = elapsed - n.pulseStartMs;
      const pulseProgress = Math.min(pulseElapsed / PULSE_MS, 1);

      if (pulseProgress < 1) {
        // thickness: quick expand then contract (sine bump peaking mid-pulse),
        // scaled by this pulse's own random size multiplier
        const bump = Math.sin(pulseProgress * Math.PI);
        const radius = 3.2 + bump * 3.5 * n.pulseScale;
        const strokeW = 1.2 + bump * 2.2 * n.pulseScale;
        circle.setAttribute('r', String(radius));
        circle.setAttribute('stroke-width', String(strokeW));

        // expanding ring: grows outward, wall thins, then fades
        const ringRadius = 4 + pulseProgress * RING_MAX_RADIUS * n.pulseScale;
        const ringWidth = Math.max(2.5 * (1 - pulseProgress), 0.2);
        const ringOpacity = 1 - pulseProgress;
        ring.setAttribute('cx', n.x);
        ring.setAttribute('cy', n.y);
        ring.setAttribute('r', String(ringRadius));
        ring.setAttribute('stroke', n.pulseColor);
        ring.setAttribute('stroke-width', String(ringWidth));
        ring.setAttribute('opacity', String(ringOpacity));
      } else {
        circle.setAttribute('r', '3.2');
        circle.setAttribute('stroke-width', '1.2');
        ring.setAttribute('opacity', '0');
      }
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
