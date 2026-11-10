/* THE LINE — a fish laid along a number line, for fractions.

   The nest's sibling, and it keeps the nest's rule: it knows nothing about
   any lesson. It shows one or two fish from 0 to 1, lets her slide cuts and
   plant a flag, and reports where they are. Whether that is RIGHT is the
   lesson's business.

   Everything snaps to 24ths, because every fraction Grade 3 allows (halves,
   thirds, quarters, sixths, eighths) lands exactly on one — but no tick marks
   are drawn. The only marks on the fish are the cuts she, or Ember, made.

   A flag reports "placed" only once she lets go of it. That is what lets the
   game show the true spot AFTER she has committed, and never while she is
   still dragging — feedback on accuracy, never hot-and-cold steering. */

const Line = (function () {

  const N = 24;               /* positions along the fish, 0..24 */
  const PAD = 0.1;            /* tail and head sit outside 0..1, this share each side */

  let host = null, cfg = null, listener = null;
  let lines = [];             /* { cuts:[], movable, flag:null|n, placed, el:{} } */
  let start = [];             /* what clear() goes back to */

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mk = (cls, parent) => {
    const d = document.createElement("div");
    d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  };

  /* A position along the fish, as a share of the line's own width. */
  const at = p => (PAD + (1 - 2 * PAD) * p / N) * 100 + "%";

  function posFromX(L, clientX) {
    const r = L.el.body.getBoundingClientRect ? L.el.body.getBoundingClientRect() : null;
    if (!r || !r.width) return null;
    const x0 = r.left + r.width * PAD, x1 = r.right - r.width * PAD;
    return Math.round(clamp((clientX - x0) / (x1 - x0), 0, 1) * N);
  }

  /* ---- drawing ------------------------------------------------------------ */

  const FISH =
    '<svg class="fish-art" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M1 3 L10 10 L1 17 Z" fill="#5aa9e6" stroke="#5b3a2e" stroke-width="1.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      '<rect x="10" y="3" width="80" height="14" rx="7" fill="#7ec3f0" stroke="#5b3a2e" stroke-width="1.6" vector-effect="non-scaling-stroke"/>' +
      '<path d="M90 3.4 Q99 4 99 10 Q99 16 90 16.6 Z" fill="#7ec3f0" stroke="#5b3a2e" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
    "</svg>" +
    '<span class="fish-eye"></span>';

  function paint() {
    lines.forEach((L, li) => {
      /* the pieces between cuts, shaded alternately so each one reads */
      const edges = [0].concat(L.cuts.slice().sort((a, b) => a - b), [N]);
      L.el.pieces.innerHTML = "";
      for (let i = 0; i < edges.length - 1; i++) {
        const pc = mk("piece" + (i % 2 ? " alt" : ""), L.el.pieces);
        pc.style.left = at(edges[i]);
        pc.style.width = ((1 - 2 * PAD) * (edges[i + 1] - edges[i]) / N * 100) + "%";
      }
      L.el.cuts.forEach((c, i) => {
        c.style.left = at(L.cuts[i]);
        c.className = "cut" + (L.movable ? " movable" : "");
      });
      if (L.el.flag) {
        L.el.flag.style.left = at(L.flag == null ? 0 : L.flag);
        L.el.flag.className = "flag" + (L.placed ? " placed" : "") + (L.flag == null ? " waiting" : "");
      }
      [["ghostCuts", "ghost-cut"], ["ghostFlags", "ghost-flag"], ["truth", "truth-flag"]].forEach(([k, cls]) => {
        (L.el[k] || []).forEach(g => g.remove && g.remove());
        L.el[k] = (L[k] || []).map(p => {
          const g = mk(cls, L.el.row);
          g.style.left = at(p);
          return g;
        });
      });
    });
  }

  function announce() {
    paint();
    if (listener) listener(api.report());
  }

  /* ---- touching it ------------------------------------------------------- */

  /* `jump`: the thing comes to her finger the moment she touches it, so a tap
     right beside a cut moves the cut there instead of doing nothing. */
  function draggable(node, L, onMove, onDrop, jump) {
    let held = false;
    node.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      ev.stopPropagation && ev.stopPropagation();
      held = true;
      try { node.setPointerCapture(ev.pointerId); } catch (e) {}
      node.classList.add("held");
      if (jump) { const p = posFromX(L, ev.clientX); if (p != null) onMove(p); }
    });
    node.addEventListener("pointermove", ev => {
      if (!held) return;
      const p = posFromX(L, ev.clientX);
      if (p != null) onMove(p);
    });
    const up = () => {
      if (!held) return;
      held = false;
      node.classList.remove("held");
      onDrop();
    };
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
  }

  function moveCut(L, i, p) {
    p = clamp(p, 1, N - 1);
    if (L.cuts[i] === p) return;
    L.cuts[i] = p;
    Ambience.stone();
    announce();
  }

  function moveFlag(L, p, placed) {
    p = clamp(p, 1, N);
    const changed = L.flag !== p || L.placed !== placed;
    L.flag = p;
    L.placed = placed;
    if (changed) { if (placed) Ambience.stone(); else Ambience.lift(); announce(); }
  }

  /* ---- the surface ------------------------------------------------------- */

  const api = {

    /* config: { lines: [{ cuts: [n...], movable: bool, flag: bool, label }] } */
    mount(el, config) {
      host = el;
      cfg = config;
      host.innerHTML = "";
      const box = mk("fishlines");
      start = JSON.parse(JSON.stringify(config.lines));
      lines = config.lines.map(spec => {
        const L = {
          cuts: (spec.cuts || []).slice(), movable: !!spec.movable,
          flag: spec.flag ? null : undefined, placed: false,
          ghostCuts: [], ghostFlags: [], truth: [], el: {}
        };
        const row = L.el.row = mk("fishline", box);
        if (spec.label) mk("fish-label", row).textContent = spec.label;
        const body = L.el.body = mk("fish", row);
        body.innerHTML = FISH;
        L.el.pieces = mk("pieces", body);
        mk("end zero", row).textContent = "0";
        mk("end one", row).textContent = "1";
        L.el.cuts = L.cuts.map((c, i) => {
          const cut = mk("cut", row);
          mk("handle", cut);
          if (L.movable) draggable(cut, L, p => moveCut(L, i, p), () => announce(), true);
          return cut;
        });
        if (spec.flag) {
          const f = L.el.flag = mk("flag", row);
          f.innerHTML = '<span class="pole"></span><span class="pennant"></span>';
          draggable(f, L, p => moveFlag(L, p, false), () => { if (L.flag != null) moveFlag(L, L.flag, true); });
        }
        /* A tap on the fish itself: plant the flag there, or bring the
           nearest cut to it. Easier than a drag for a small finger. */
        body.addEventListener("pointerdown", ev => {
          const p = posFromX(L, ev.clientX);
          if (p == null) return;
          if (spec.flag) { moveFlag(L, p, true); return; }
          if (L.movable && L.cuts.length) {
            let best = 0;
            L.cuts.forEach((c, i) => { if (Math.abs(c - p) < Math.abs(L.cuts[best] - p)) best = i; });
            moveCut(L, best, p);
          }
        });
        return L;
      });
      host.appendChild(box);
      announce();
    },

    report() {
      return {
        mode: "line",
        total: 0,
        lines: lines.map(L => ({
          cuts: L.cuts.slice().sort((a, b) => a - b),
          flag: L.flag == null ? null : L.flag,
          placed: !!L.placed
        }))
      };
    },

    clear() {
      if (!cfg) return;
      lines.forEach((L, i) => {
        L.cuts = (start[i].cuts || []).slice();
        L.flag = start[i].flag ? null : undefined;
        L.placed = false;
        L.truth = [];
      });
      announce();
    },

    /* Where a clue points: { cuts: [n...] } on the first fish, or
       { flags: [{ line, at }] }. null puts the glow out. */
    glow(spec) {
      lines.forEach(L => { L.ghostCuts = []; L.ghostFlags = []; });
      if (spec && spec.cuts && lines[0]) lines[0].ghostCuts = spec.cuts.slice();
      if (spec && spec.flags) spec.flags.forEach(f => { if (lines[f.line]) lines[f.line].ghostFlags.push(f.at); });
      paint();
    },

    /* The true spot, shown beside her flag once she has placed it. */
    truth(line, p) {
      if (!lines[line]) return;
      const want = p == null ? [] : [p];
      if (JSON.stringify(lines[line].truth) === JSON.stringify(want)) return;
      lines[line].truth = want;
      paint();
    },

    onChange(fn) { listener = fn; },
    N
  };

  return api;
})();
