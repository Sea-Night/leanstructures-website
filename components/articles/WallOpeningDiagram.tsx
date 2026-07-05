'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import diagramDataJson from '@/lib/articles/opening-a-load-bearing-wall/diagram-data.json';
import type { DiagramData, PathEl } from '@/lib/articles/opening-a-load-bearing-wall/diagram-types';

const DATA = diagramDataJson as unknown as DiagramData;

type PathNode = SVGPathElement & {
  _line?: boolean;
  _dash?: boolean;
  _len?: number;
  _e?: PathEl;
  _carry?: boolean;
};

export type WallOpeningNote = {
  in: number;
  out: number;
  content: ReactNode;
};

const CAP: [string, string, string][] = [
  ['Stage 1', 'Existing house', 'A 6 m terrace house: one ground-floor door and window in the load-bearing wall.'],
  ['Stage 2', 'First opening', 'A small window opening with a flat lintel; floor and masonry loads bear onto it.'],
  ['Stage 3', 'Deep lintel', 'A deeper lintel on 150 mm bearings; the old window is bricked up as the opening grows.'],
  ['Stage 4', 'Steel beam', 'A steel beam on padstones spans further; the brick infill is consumed as it opens.'],
  ['Stage 5', 'Foundation overload', 'Concentrated load now exceeds the existing foundation by 10% — shown by the envelope.'],
  ['Stage 6', 'Goalpost frame', 'A steel goalpost on new pad footings spreads the load to ground.'],
  ['Stage 7', 'Picture frame', "Where pad footings aren't viable, a steel picture frame over a basement (dashed)."],
  ['Stage 8', 'Tall opening', 'A full-height entrance: the door is bricked up, the frame and opening extend.'],
  ['Stage 9', 'Moment frame', 'Plate moment connections — too little rear wall remains to resist wind load.'],
  ['Stage 10', 'Terrace', "Neighbours either side: you can't rely on them. The frame carries everything."],
  ['Stage 11', 'Full-width opening', 'The wall is fully opened across its width.'],
];

const SW_WEIGHTS = [1, 1, 1, 1.6, 1, 1, 1, 1, 1.2, 3.6, 1.2];

/** Ported 1:1 from articles/opening-a-load-bearing-wall.html's two inline
 * scripts — a hand-built, scroll-pinned SVG diagram engine (11 stages) plus
 * cross-fading narrative notes. Kept imperative/DOM-based (like the original)
 * rather than rewritten declaratively: this is precisely-tuned geometry and
 * timing that's safer to preserve verbatim than to redesign. The original's
 * "TEMPORARY timing readout" debug counter is intentionally dropped — its
 * own comment marked it for removal before publishing. */
export function WallOpeningDiagram({ notes }: { notes: WallOpeningNote[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const noteRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const sw = sectionRef.current;
    const svg = svgRef.current;
    if (!sw || !svg) return;

    const NS = 'http://www.w3.org/2000/svg';
    const vb = DATA.viewBox;
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const LW = 0.45;
    const COL: Record<string, string> = {
      existing: 'var(--sw-existing)',
      concrete: 'var(--sw-concrete)',
      steel: 'var(--sw-steel)',
      load: 'var(--sw-load)',
    };
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const ease = (t: number) => {
      t = clamp(t, 0, 1);
      return t * t * t * (t * (t * 6 - 15) + 10);
    };

    const s = SW_WEIGHTS.reduce((a, b) => a + b, 0);
    const SW_B = (() => {
      const b = [0];
      let c = 0;
      for (const w of SW_WEIGHTS) {
        c += w;
        b.push(c / s);
      }
      return b;
    })();
    function stageAt(g: number): [number, number] {
      g = clamp(g, 0, 1);
      let i = 0;
      while (i < 10 && g >= SW_B[i + 1]) i++;
      const w = SW_B[i + 1] - SW_B[i];
      return [i, clamp(w > 0 ? (g - SW_B[i]) / w : 0, 0, 1)];
    }
    const loadOpacity = (p: number, e: PathEl & { _lp?: boolean; _ln?: boolean; _wind?: boolean }) => {
      const lp = e._lp,
        ln = e._ln,
        withOpen = e.tag === '0088aa' || e.tag === '4400aa';
      if (p < 0.1) return lp ? 1 : 0;
      if (p < 0.16) return lp ? 1 : (p - 0.1) / 0.06;
      if (e._wind) return 1;
      if (withOpen) {
        if (p < 0.82) return 1;
        return ln ? 1 : Math.max(0, 1 - (p - 0.82) / 0.08);
      }
      if (p < 0.52) return 1;
      if (p < 0.6) return ln ? 1 : 1 - (p - 0.52) / 0.08;
      return ln ? 1 : 0;
    };

    const defs = document.createElementNS(NS, 'defs');
    const pat = document.createElementNS(NS, 'pattern');
    pat.setAttribute('id', 'swHatch');
    pat.setAttribute('width', '2.4');
    pat.setAttribute('height', '2.4');
    pat.setAttribute('patternUnits', 'userSpaceOnUse');
    pat.setAttribute('patternTransform', 'rotate(45)');
    const pl = document.createElementNS(NS, 'line');
    pl.setAttribute('x1', '0');
    pl.setAttribute('y1', '0');
    pl.setAttribute('x2', '0');
    pl.setAttribute('y2', '2.4');
    pl.setAttribute('stroke', 'var(--sw-existing)');
    pl.setAttribute('stroke-width', '0.3');
    pat.appendChild(pl);
    defs.appendChild(pat);
    svg.appendChild(defs);

    const gBack = document.createElementNS(NS, 'g');
    const gPersist = document.createElementNS(NS, 'g');
    const gInfill = document.createElementNS(NS, 'g');
    const gMask = document.createElementNS(NS, 'g');
    const gOpen = document.createElementNS(NS, 'g');
    const gFront = document.createElementNS(NS, 'g');
    const gStage = document.createElementNS(NS, 'g');
    svg.append(gBack, gPersist, gInfill, gMask, gOpen, gFront, gStage);

    const voidRect = document.createElementNS(NS, 'rect') as SVGRectElement;
    voidRect.setAttribute('fill', 'var(--sw-bg)');
    voidRect.setAttribute('stroke', 'none');
    gOpen.appendChild(voidRect);
    const maskRect = document.createElementNS(NS, 'rect') as SVGRectElement;
    maskRect.setAttribute('fill', 'var(--sw-bg)');
    maskRect.setAttribute('stroke', 'none');
    gMask.appendChild(maskRect);

    function fillFor(e: PathEl) {
      if (e.rt === 'infill') return 'url(#swHatch)';
      if (e.rt === 'load') return 'var(--sw-load)';
      if (e.fillbg) return 'var(--sw-bg)';
      if (e.rt === 'padstone') return 'var(--sw-bg)';
      return 'none';
    }
    function mkPath(e: PathEl): PathNode {
      const n = document.createElementNS(NS, 'path') as PathNode;
      n.setAttribute('d', e.d);
      n.setAttribute('fill', fillFor(e));
      n.setAttribute('stroke', e.rt === 'opening' ? 'none' : COL[e.mat]);
      n.setAttribute('stroke-width', String(LW));
      if (e.rt === 'load') n.setAttribute('fill-opacity', '0.10');
      if (e.dash) n.setAttribute('stroke-dasharray', e.dash);
      n._line = e.rt === 'line';
      n._dash = !!e.dash;
      n._e = e;
      return n;
    }

    const persist: Record<string, PathNode[]> = {};
    for (const k of ['base', 'door', 'window', 'terrace']) {
      persist[k] = [];
      (DATA.persistent[k] || []).forEach((e) => {
        const n = mkPath(e);
        (e.front ? gFront : gPersist).appendChild(n);
        persist[k].push(n);
      });
    }

    type StageNode = {
      sg: SVGGElement;
      ig: SVGGElement;
      bk: SVGGElement;
      struct: PathNode[];
      inf: PathNode[];
      info: DiagramData['stages'][number];
      infL: number;
      infR: number;
      infY: number;
      infH: number;
    };
    function e_h(st: DiagramData['stages'][number]) {
      return st.opening ? Number(st.opening.h) : 40;
    }

    const stageNodes: StageNode[] = [];
    DATA.stages.forEach((st) => {
      const sg = document.createElementNS(NS, 'g') as SVGGElement;
      sg.style.display = 'none';
      gStage.appendChild(sg);
      const ig = document.createElementNS(NS, 'g') as SVGGElement;
      gInfill.appendChild(ig);
      ig.style.display = 'none';
      const bk = document.createElementNS(NS, 'g') as SVGGElement;
      bk.style.display = 'none';
      gBack.appendChild(bk);
      const struct: PathNode[] = [];
      st.elements.forEach((e) => {
        const n = mkPath(e);
        if (e.tag === '0000ff') bk.appendChild(n);
        else if (e.fillbg) sg.insertBefore(n, sg.firstChild);
        else sg.appendChild(n);
        struct.push(n);
      });
      const inf: PathNode[] = [];
      let il = 1e9,
        ir = -1e9,
        iy = 1e9,
        ih = 0;
      st.infill.forEach((e) => {
        const n = mkPath(e);
        ig.appendChild(n);
        inf.push(n);
        il = Math.min(il, e.bb[0]);
        ir = Math.max(ir, e.bb[2]);
        iy = Math.min(iy, e.bb[1]);
        ih = Math.max(ih, e.bb[3] - e.bb[1]);
      });
      stageNodes.push({ sg, ig, bk, struct, inf, info: st, infL: il, infR: ir, infY: iy, infH: Math.max(ih, e_h(st)) });
    });

    function stageHasTag(idx: number, tag: string) {
      const s = DATA.stages[idx];
      return !!(s && s.elements.some((e) => e.tag === tag));
    }
    DATA.stages.forEach((st, idx) => {
      st.elements.forEach((e: PathEl & { _lp?: boolean; _ln?: boolean; _wind?: boolean }) => {
        if (e.rt === 'load') {
          const cont = e.tag === '0088aa' || e.tag === '4400aa';
          e._lp = cont && stageHasTag(idx - 1, e.tag as string);
          e._ln = (cont && stageHasTag(idx + 1, e.tag as string)) || st.n === 5;
          e._wind = st.n === 9;
        } else {
          e._lp = false;
          e._ln = false;
          e._wind = false;
        }
      });
    });

    const windCarry: PathNode[] = [];
    (function () {
      const s9 = stageNodes[8],
        s10 = stageNodes[9];
      if (s9 && s10) {
        s9.struct.forEach((n) => {
          if (n._e && n._e.rt === 'load' && (n._e as PathEl & { _wind?: boolean })._wind) {
            const c = n.cloneNode(true) as PathNode;
            c._e = n._e;
            c._carry = true;
            s10.sg.appendChild(c);
            windCarry.push(c);
          }
        });
      }
    })();

    function measure(n: PathNode) {
      if (n._line && !n._dash) {
        try {
          n._len = n.getTotalLength();
        } catch {
          n._len = 0;
        }
      }
    }
    Object.values(persist)
      .flat()
      .forEach(measure);
    stageNodes.forEach((s) => {
      s.struct.forEach(measure);
    });

    let winR = -1e9;
    (DATA.persistent.window || []).forEach((e) => {
      winR = Math.max(winR, e.bb[2]);
    });
    const winThresh = winR + 220 / DATA.MM;
    const houseL = Math.min(...(DATA.persistent.base || []).map((e) => e.bb[0]));

    function reveal(n: PathNode, t: number) {
      t = clamp(t, 0, 1);
      if (n._line && !n._dash) {
        const L = n._len || 0;
        n.setAttribute('stroke-dasharray', L.toFixed(2));
        n.setAttribute('stroke-dashoffset', (L * (1 - t)).toFixed(2));
        n.style.opacity = t <= 0.001 ? '0' : '1';
      } else {
        n.style.opacity = String(t);
      }
    }
    function solid(n: PathNode) {
      if (n._line && !n._dash) {
        n.removeAttribute('stroke-dasharray');
        n.removeAttribute('stroke-dashoffset');
      }
      n.style.opacity = '1';
    }
    function resetMotion(n: PathNode) {
      n.removeAttribute('transform');
      if (n._e && (n._e.tag === '442178' || n._e.tag === '0088aa')) n.setAttribute('d', n._e.d);
    }
    function warp(d: string, delta: number, rx?: number) {
      if (!delta) return d;
      return d.replace(/([ML])\s+(-?[\d.]+),(-?[\d.]+)/g, (m, c, xs, ys) => {
        let x = parseFloat(xs);
        if (x < (rx ?? 0) - 0.01) x -= delta;
        return c + ' ' + x.toFixed(2) + ',' + ys;
      });
    }
    function applyMotion(n: PathNode, e: PathEl, actDelta: number) {
      if (e.tag === 'ff00ff') {
        n.setAttribute('transform', `translate(${(-actDelta).toFixed(2)},0)`);
      } else if (e.tag === '442178' || e.tag === '0088aa') {
        n.setAttribute('d', warp(e.d, actDelta, e.rx));
      }
    }

    function render(g: number) {
      const [i, p] = stageAt(g);
      const sN = i + 1;
      const S = stageNodes[i],
        st = S.info;
      const drawP = clamp(p / 0.1, 0, 1);
      const wS = sN === 10 ? 0.74 : 0.4,
        wSpan = sN === 10 ? 0.16 : 0.42;
      const actP = ease(clamp((p - wS) / wSpan, 0, 1));
      const eraseP = sN === 11 || st.noErase ? 0 : clamp((p - 0.9) / 0.1, 0, 1);
      const delta = (st.delta || 0) * actP;
      const curW = st.opening ? st.opening.w + delta : 0;
      const right = st.opening ? st.opening.right : 0;
      const openL = right - curW;

      if (st.opening) {
        voidRect.style.display = '';
        voidRect.setAttribute('x', openL.toFixed(2));
        voidRect.setAttribute('y', String(st.opening.y));
        voidRect.setAttribute('width', Math.max(curW, 0.1).toFixed(2));
        voidRect.setAttribute('height', String(st.opening.h));
        voidRect.style.opacity = String(sN === 2 ? drawP : 1);
        const ol = sN >= 2 && sN <= 5;
        voidRect.setAttribute('stroke', ol ? 'var(--sw-existing)' : 'none');
        voidRect.setAttribute('stroke-width', ol ? String(LW) : '0');
      } else {
        voidRect.style.display = 'none';
      }

      let baseT = sN < 10 ? 1 : sN === 10 ? 1 - drawP : 0;
      if (sN === 1) baseT = drawP;
      persist.base.forEach((n) => reveal(n, baseT));

      let doorT: number;
      if (sN === 1) doorT = drawP;
      else if (sN < 8) doorT = 1;
      else if (sN === 8) {
        const beamLeft = (st.colLeft0 || 0) - delta;
        const t0 = houseL + 2300 / DATA.MM;
        const span = 300 / DATA.MM;
        doorT = 1 - clamp((t0 - beamLeft) / span, 0, 1);
      } else doorT = 0;
      persist.door.forEach((n) => reveal(n, doorT));

      let winT: number;
      if (sN === 1) winT = drawP;
      else if (sN <= 2) winT = 1;
      else if (sN === 3) winT = clamp((openL - (winThresh - 8)) / 8, 0, 1);
      else winT = 0;
      persist.window.forEach((n) => reveal(n, winT));

      const terrT = sN < 10 ? 0 : sN === 10 ? drawP : 1;
      persist.terrace.forEach((n) => reveal(n, terrT));

      stageNodes.forEach((s, k) => {
        const on = k === i;
        s.sg.style.display = on ? '' : 'none';
        s.ig.style.display = on ? '' : 'none';
        s.bk.style.display = on ? '' : 'none';
      });
      windCarry.forEach((c) => {
        if (i === 9) {
          c.style.display = '';
          c.style.opacity = (1 - drawP).toFixed(3);
        } else {
          c.style.display = 'none';
        }
      });

      S.struct.forEach((n) => {
        const e = n._e as PathEl & { _wind?: boolean };
        if (!e) return;
        resetMotion(n);
        if (e.rt === 'load') {
          n.style.opacity = loadOpacity(p, e).toFixed(3);
          if (p >= 0.4) {
            if (e.tag === '0088aa') {
              n.setAttribute('d', warp(e.d, delta, e.rx));
            } else if (e.tag === '4400aa') {
              const w0 = Math.max(e.bb[2] - e.bb[0], 0.01),
                sx = (w0 + delta) / w0;
              n.setAttribute(
                'transform',
                `translate(${e.bb[2]} ${e.bb[3]}) scale(${sx.toFixed(4)}) translate(${-e.bb[2]} ${-e.bb[3]})`
              );
            }
          }
          return;
        }
        if (eraseP > 0) {
          applyMotion(n, e, delta);
          solid(n);
          n.style.opacity = String(1 - eraseP);
        } else if (p < 0.1 && !st.noDraw) {
          reveal(n, drawP);
        } else {
          solid(n);
          if (p >= 0.4) applyMotion(n, e, delta);
        }
      });

      let infT: number;
      if (sN === 3) infT = 1 - winT;
      else if (sN === 8) infT = 1 - doorT;
      else infT = st.infill.length ? (eraseP > 0 ? 1 - eraseP : 1) : 0;
      S.inf.forEach((n) => {
        n.style.opacity = String(infT);
      });
      if (S.inf.length) {
        const consume = st.reduceMode === 'column' && st.colLeft0 != null ? st.colLeft0 - delta : openL;
        const mL = Math.max(consume, S.infL - 0.5),
          mR = S.infR + 0.5;
        if (mR > mL) {
          maskRect.style.display = '';
          maskRect.setAttribute('x', mL.toFixed(2));
          maskRect.setAttribute('y', (S.infY - 1).toFixed(2));
          maskRect.setAttribute('width', (mR - mL).toFixed(2));
          maskRect.setAttribute('height', (S.infH + 2).toFixed(2));
          maskRect.style.opacity = String(infT);
        } else {
          maskRect.style.display = 'none';
        }
      } else {
        maskRect.style.display = 'none';
      }

      if (numRef.current) numRef.current.textContent = CAP[i][0];
      if (titleRef.current) titleRef.current.textContent = CAP[i][1];
      if (descRef.current) descRef.current.textContent = CAP[i][2];
      if (barRef.current) barRef.current.style.width = (g * 100).toFixed(1) + '%';
    }

    const STIFF = 8.0;
    function targetG() {
      const r = sw!.getBoundingClientRect();
      const travel = sw!.offsetHeight - window.innerHeight;
      return travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
    }
    let gT = targetG(),
      gPos = gT,
      gVel = 0,
      last = 0,
      running = false;
    let diagramRafId = 0;
    function frame(now: number) {
      let dt = (now - last) / 1000;
      last = now;
      if (!(dt > 0) || dt > 0.05) dt = 0.05;
      gT = targetG();
      const w = STIFF,
        f = 1 + 2 * dt * w,
        oo = w * w,
        dtoo = dt * oo,
        det = 1 / (f + dt * dtoo);
      gPos = (gPos * f + gVel * dt + gT * dt * dtoo) * det;
      gVel = (gVel + (gT - gPos) * dtoo) * det;
      render(gPos);
      if (Math.abs(gT - gPos) > 2e-4 || Math.abs(gVel) > 2e-4) {
        diagramRafId = requestAnimationFrame(frame);
      } else {
        gPos = gT;
        gVel = 0;
        render(gPos);
        running = false;
      }
    }
    function kick() {
      if (running) return;
      running = true;
      last = performance.now();
      diagramRafId = requestAnimationFrame(frame);
    }
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    render(gPos);

    // ---- pinned notes: cross-fade by scroll progress g ----
    const FADE = 0.02;
    const T = notes.map((n) => [n.in, n.out] as [number, number]);
    function gNow() {
      const travel = sw!.offsetHeight - window.innerHeight;
      if (travel <= 0) return 0;
      return clamp(-sw!.getBoundingClientRect().top / travel, 0, 1);
    }
    let noteTicking = false;
    let noteRafId = 0;
    function paintNotes() {
      noteTicking = false;
      const g = gNow();
      noteRefs.current.forEach((el, k) => {
        if (!el) return;
        const [a, b] = T[k];
        let o = 0;
        if (g >= a && g <= b) {
          o = 1;
          if (g < a + FADE && a > 0.001) o = (g - a) / FADE;
          else if (g > b - FADE && b < 0.999) o = (b - g) / FADE;
        }
        el.style.opacity = o.toFixed(3);
      });
    }
    function onNoteScroll() {
      if (!noteTicking) {
        noteTicking = true;
        noteRafId = requestAnimationFrame(paintNotes);
      }
    }
    window.addEventListener('scroll', onNoteScroll, { passive: true });
    window.addEventListener('resize', paintNotes);
    paintNotes();

    return () => {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      window.removeEventListener('scroll', onNoteScroll);
      window.removeEventListener('resize', paintNotes);
      cancelAnimationFrame(diagramRafId);
      cancelAnimationFrame(noteRafId);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
    };
  }, [notes]);

  return (
    <section
      ref={sectionRef}
      className="scrolly"
      id="sw"
      aria-label="An opening growing in a load-bearing wall, stage by stage"
    >
      <h2 className="visually-hidden">How an opening grows in a load-bearing wall, stage by stage</h2>
      <div className="scrolly__pin">
        <div className="scrolly__graphic">
          <div className="sw__progress">
            <i ref={barRef as never} id="swBar" />
          </div>
          <div className="sw__legend">
            <span>
              <i style={{ borderColor: 'var(--sw-concrete)' }} />
              Concrete
            </span>
            <span>
              <i style={{ borderColor: 'var(--sw-steel)' }} />
              Steel
            </span>
            <span>
              <i style={{ borderColor: '#6E5C45' }} />
              Existing
            </span>
          </div>
          <svg
            ref={svgRef}
            className="sw__svg"
            id="swSvg"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Forming an opening in a load-bearing wall"
          />
          <div className="sw__cap">
            <span className="sw__num" ref={numRef} />
            <span className="sw__title" ref={titleRef} />
            <p className="sw__desc" ref={descRef} />
          </div>
        </div>
        <div className="scrolly__notes">
          {notes.map((note, i) => (
            <div
              key={i}
              ref={(el) => {
                noteRefs.current[i] = el;
              }}
              className="note"
            >
              {note.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
