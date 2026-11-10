/* THE NEST — the thing she touches.

   It knows nothing about any lesson. It shows a lattice, it reports what she
   has laid on it, and that is all; whether what she built is RIGHT is the
   lesson's business, not the nest's. That separation is why the same surface
   can hold a fraction bar and a protractor in later grades without the game
   forking into three games.

   Sized off the viewport every time, never off pixels. The phone she will
   actually hold is not the one this was written on. */

const Nest = (function () {

  const GAP_RATIO = 0.16;     /* gap as a fraction of a cell */
  const MAX_CELL = 54;
  const MIN_CELL = 26;        /* below this a fingertip cannot pick one cell */

  let host = null, box = null, cfg = null;
  let stones = new Set();     /* "r,c" she has laid */
  let hisStones = new Set();  /* Ember's own attempt, so hers look different */
  let keptStones = new Set(); /* carried over from a previous stage */
  let lockedStones = new Set();
  let rim = new Set();        /* twig slot ids */
  let cellEls = new Map(), twigEls = new Map();
  /* Where the rim runs. Usually the whole lattice, but during the quest Ember
     walls whatever she actually built, which may sit anywhere on it. */
  let rimRect = null;
  let listener = null;
  let doneRows = new Set();   /* rows already celebrated, so it fires once */
  /* Where a clue is pointing: hollows and twig slots that glow. A glow only
     ever shows WHERE; she still lays every stone herself. */
  let glowCells = new Set(), glowTwigs = new Set();
  /* The model counting as she builds: stones in rows the lesson says are
     finished, and the sides of the rim in the order she finished them. Which
     rows count is the lesson's business; the nest only lights what it is told. */
  let litCells = new Set();
  let sideOrder = [];         /* "t" | "r" | "b" | "l", oldest first */
  let sideEls = new Map();    /* the little length badge beside each side */
  let rimTappable = false;
  /* After she has built it, Ember asks how she knew, and she answers by
     tapping PARTS of her own model: rows, sides, or blocks. While that is
     going on a tap picks a part instead of moving a stone. */
  let asking = null;          /* [{ id, cells:Set, twigs:Set }] */
  let picked = new Set();
  let onPick = null;
  let frozen = false;
  /* A pointing hand on the next part to tap. The sum under the nest looks
     like where the answer goes, and on the first walk of this that is what
     got tapped; the hand says the answer starts HERE, on her own stones. */
  let hintEl = null;

  const key = (r, c) => r + "," + c;

  function cellSize() {
    const wAvail = host.clientWidth || 320;
    const extra = (cfg.mode === "rim" || cfg.willRim) ? 1.4 : 0;
    const byW = (wAvail / (cfg.cols + extra)) / (1 + GAP_RATIO);
    const hAvail = Math.max(180, window.innerHeight * 0.40);
    const byH = (hAvail / (cfg.rows + extra)) / (1 + GAP_RATIO);
    return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(Math.min(byW, byH))));
  }

  function layout() {
    if (!cfg) return;
    const s = cellSize();
    const gap = Math.round(s * GAP_RATIO);
    const step = s + gap;
    /* Room for the rim is reserved from the start even when the rim comes
       later, so the shelf does not jump sideways the moment Ember walls it. */
    const pad = (cfg.mode === "rim" || cfg.willRim) ? Math.round(s * 0.7) : 0;

    box.style.width = (cfg.cols * step - gap + pad * 2) + "px";
    box.style.height = (cfg.rows * step - gap + pad * 2) + "px";

    cellEls.forEach((el, k) => {
      const [r, c] = k.split(",").map(Number);
      el.style.left = (pad + c * step) + "px";
      el.style.top = (pad + r * step) + "px";
      el.style.width = s + "px";
      el.style.height = s + "px";
    });

    const tw = Math.round(s * 0.62), th = Math.round(s * 0.26);
    const R = rimRect;
    if (R) twigEls.forEach((el, id) => {
      const side = id[0], i = Number(id.slice(1));
      const horiz = side === "t" || side === "b";
      el.style.width = (horiz ? tw : th) + "px";
      el.style.height = (horiz ? th : tw) + "px";
      const cx = pad + (R.c0 + i) * step + s / 2;
      const cy = pad + (R.r0 + i) * step + s / 2;
      const inset = Math.round(pad * 0.18);
      const top0 = pad + R.r0 * step - Math.round(pad * 0.62);
      const bot0 = pad + (R.r0 + R.rows) * step - gap + inset;
      const left0 = pad + R.c0 * step - Math.round(pad * 0.62);
      const right0 = pad + (R.c0 + R.cols) * step - gap + inset;
      if (side === "t") { el.style.left = (cx - tw / 2) + "px"; el.style.top = top0 + "px"; }
      if (side === "b") { el.style.left = (cx - tw / 2) + "px"; el.style.top = bot0 + "px"; }
      if (side === "l") { el.style.top = (cy - tw / 2) + "px"; el.style.left = left0 + "px"; }
      if (side === "r") { el.style.top = (cy - tw / 2) + "px"; el.style.left = right0 + "px"; }
    });

    /* A badge outside the middle of each side, for its length. */
    if (R) sideEls.forEach((el, side) => {
      const b = Math.max(20, Math.round(s * 0.5));
      const out = Math.round(pad * 0.62) + b + 2;
      const midX = pad + R.c0 * step + (R.cols * step - gap) / 2;
      const midY = pad + R.r0 * step + (R.rows * step - gap) / 2;
      const x0 = pad + R.c0 * step, x1 = pad + (R.c0 + R.cols) * step - gap;
      const y0 = pad + R.r0 * step, y1 = pad + (R.r0 + R.rows) * step - gap;
      el.style.width = b + "px"; el.style.height = b + "px";
      el.style.lineHeight = b + "px"; el.style.fontSize = Math.round(b * 0.62) + "px";
      if (side === "t") { el.style.left = (midX - b / 2) + "px"; el.style.top = (y0 - out) + "px"; }
      if (side === "b") { el.style.left = (midX - b / 2) + "px"; el.style.top = (y1 + out - b) + "px"; }
      if (side === "l") { el.style.top = (midY - b / 2) + "px"; el.style.left = (x0 - out) + "px"; }
      if (side === "r") { el.style.top = (midY - b / 2) + "px"; el.style.left = (x1 + out - b) + "px"; }
    });
  }

  const sideLen = side => (rimRect ? (side === "t" || side === "b" ? rimRect.cols : rimRect.rows) : 0);

  function sideFull(side) {
    const n = sideLen(side);
    if (!n) return false;
    for (let i = 0; i < n; i++) if (!rim.has(side + i)) return false;
    return true;
  }

  /* Keep the order she finished the sides in, so the running sum only ever
     grows at its end: 4, then 4 + 3, never reshuffled under her. */
  function tallySides() {
    sideOrder = sideOrder.filter(sideFull);
    ["t", "r", "b", "l"].forEach(sd => { if (sideFull(sd) && !sideOrder.includes(sd)) sideOrder.push(sd); });
  }

  const partOf = (k, isTwig) =>
    (asking || []).find(p => (isTwig ? p.twigs : p.cells).has(k)) || null;

  function paint() {
    cellEls.forEach((el, k) => {
      const on = stones.has(k);
      /* A stone Ember laid and the player has not touched yet looks like
         EMBER'S — so the board reads as Ember's mess before the player starts,
         and becomes the player's as she moves it. One tap on a cell clears its
         `his` mark for good (the name is older than Ember being a girl). */
      const part = asking ? partOf(k, false) : null;
      el.className = "cell" +
        (on ? " on" : "") +
        (hisStones.has(k) ? " his" : "") +
        (on && keptStones.has(k) ? " kept" : "") +
        (!on && glowCells.has(k) ? " glow" : "") +
        (on && litCells.has(k) ? " lit" : "") +
        (part ? (picked.has(part.id) ? " counted" : " ask") : "");
    });
    twigEls.forEach((el, id) => {
      const part = asking ? partOf(id, true) : null;
      el.className = "twig" + (rim.has(id) ? " on" : "") +
        (!rim.has(id) && glowTwigs.has(id) ? " glow" : "") +
        (part ? (picked.has(part.id) ? " counted" : " ask") : "");
    });
    placeHint();
    sideEls.forEach((el, side) => {
      const part = asking ? (asking.find(p => p.side === side) || null) : null;
      const show = part ? picked.has(part.id) : sideOrder.includes(side);
      el.textContent = String(sideLen(side));
      el.className = "side-len" + (show ? " on" : "");
    });
  }

  /* The hand sits on the middle of the first part she has not tapped. */
  function placeHint() {
    if (!hintEl) return;
    const next = asking && onPick ? asking.find(p => !picked.has(p.id)) : null;
    const node = next ? (cellEls.get(next.anchor) || twigEls.get(next.anchor)) : null;
    if (!node) { hintEl.className = "point-hint"; return; }
    const px = v => parseFloat(v) || 0;
    const size = Math.max(26, Math.round(cellSize() * 0.7));
    hintEl.style.width = size + "px";
    hintEl.style.height = size + "px";
    hintEl.style.fontSize = Math.round(size * 0.82) + "px";
    hintEl.style.lineHeight = size + "px";
    hintEl.style.left = (px(node.style.left) + px(node.style.width) / 2 - size / 2) + "px";
    hintEl.style.top = (px(node.style.top) + px(node.style.height) * 0.45) + "px";
    hintEl.className = "point-hint on";
  }

  /* She tapped something while Ember is asking: it stands for its whole part. */
  function pick(k, isTwig, node) {
    const part = partOf(k, isTwig);
    if (!part || picked.has(part.id)) return;
    picked.add(part.id);
    Ambience.stone();
    paint();
    let at = null;
    try {
      const b = node.getBoundingClientRect();
      at = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    } catch (e) {}
    if (onPick) onPick(part.id, at);
  }

  function announce() {
    paint();
    if (listener) listener(api.report());
  }

  function tapCell(k) {
    if (asking) { pick(k, false, cellEls.get(k)); return; }
    if (frozen || cfg.locked || lockedStones.has(k)) return;
    if (stones.has(k)) { stones.delete(k); Ambience.lift(); }
    else { stones.add(k); Ambience.stone(); }
    hisStones.delete(k);

    /* A completed row gets its own small sound — the reward for the pattern
       arrives while she is still building, not at the end. */
    const sh = api.shape();
    if (sh.ok) {
      const tag = sh.rows + "x" + sh.cols;
      if (!doneRows.has(tag) && sh.cols > 1 && sh.rows > 1) { doneRows.add(tag); Ambience.row(); }
    }
    announce();
  }

  function tapTwig(id) {
    if (asking) { pick(id, true, twigEls.get(id)); return; }
    if (frozen || !rimTappable) return;
    if (rim.has(id)) { rim.delete(id); Ambience.lift(); }
    else { rim.add(id); Ambience.stone(); }
    tallySides();
    announce();
  }

  /* Build the twig slots round a rectangle. Interactive in the rim lesson;
     inert during the quest, where Ember lays them herself. */
  function makeRim(rect, interactive) {
    rimRect = rect;
    rimTappable = !!interactive;
    sideOrder = [];
    twigEls.forEach(el => el.remove ? el.remove() : 0);
    sideEls.forEach(el => el.remove ? el.remove() : 0);
    twigEls = new Map();
    sideEls = new Map();
    const ids = [];
    for (let c = 0; c < rect.cols; c++) { ids.push("t" + c); ids.push("b" + c); }
    for (let r = 0; r < rect.rows; r++) { ids.push("l" + r); ids.push("r" + r); }
    ids.forEach(id => {
      const d = document.createElement("div");
      d.className = "twig";
      /* Always listening: twigs Ember laid herself cannot be moved, but they
         can still be tapped when she asks how long each side is. */
      d.addEventListener("pointerdown", ev => { ev.preventDefault(); tapTwig(id); });
      box.appendChild(d);
      twigEls.set(id, d);
    });
    ["t", "r", "b", "l"].forEach(side => {
      const d = document.createElement("div");
      d.className = "side-len";
      box.appendChild(d);
      sideEls.set(side, d);
    });
    layout();
  }

  /* A default written as `ms or 55` turns a deliberate zero into 55, which is
     how the quest's instant replay came out animated anyway. Zero is a real
     answer here, so the default is chosen on null rather than on falsiness. */
  const pace = (ms, dflt) => (ms == null ? dflt : ms);
  const sleep = ms => new Promise(r => (ms > 0 ? setTimeout(r, ms) : r()));

  const api = {

    mount(el, config) {
      host = el;
      cfg = Object.assign({ rows: 5, cols: 5, mode: "floor", locked: false }, config);

      /* `carry` keeps what she built in the previous stage on the board and
         marks it, so she can see the two pieces of a broken-apart fact side
         by side (lesson 5). Anything else starts clean. */
      if (!cfg.carry) { stones = new Set(); keptStones = new Set(); }

      hisStones = new Set((cfg.his || []).map(p => key(p[0], p[1])));
      /* Ember's attempt IS on the board — the player rearranges Ember's stones
         rather than starting from nothing, which is what "fix it" has to mean. */
      hisStones.forEach(k => stones.add(k));

      lockedStones = new Set();
      if (cfg.fill) {
        for (let r = 0; r < cfg.fill.rows; r++)
          for (let c = 0; c < cfg.fill.cols; c++) { stones.add(key(r, c)); if (cfg.locked) lockedStones.add(key(r, c)); }
      }

      /* Marked AFTER the fill, so a carry stage reads the same whether she
         built the previous one or dropped straight in by deep link: either
         way the stones already on the board are the part Ember knew. */
      if (cfg.carry) keptStones = new Set(stones);

      rim = new Set();
      doneRows = new Set();
      glowCells = new Set(); glowTwigs = new Set();
      litCells = new Set(); sideOrder = []; sideEls = new Map();
      asking = null; picked = new Set(); onPick = null; frozen = false;
      hintEl = null;

      host.innerHTML = "";
      box = document.createElement("div");
      box.className = "nest";
      cellEls = new Map(); twigEls = new Map();

      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const k = key(r, c);
          const d = document.createElement("div");
          d.className = "cell";
          if (cfg.mode !== "rim" && !cfg.passive) d.addEventListener("pointerdown", ev => { ev.preventDefault(); tapCell(k); });
          box.appendChild(d);
          cellEls.set(k, d);
        }
      }

      rimRect = null;
      if (cfg.mode === "rim") {
        const f = cfg.fill || { rows: cfg.rows, cols: cfg.cols };
        makeRim({ r0: 0, c0: 0, rows: f.rows, cols: f.cols }, !cfg.passive);
      }

      host.appendChild(box);
      layout();
      announce();
    },

    /* The bounding box of what she has laid, and whether it is solid.
       A rectangle ANYWHERE on the lattice counts — insisting she start in the
       corner would be the game marking her wrong for something that is not
       mathematics. */
    shape() {
      if (!stones.size) return { ok: false, rows: 0, cols: 0, total: 0 };
      let r0 = 99, c0 = 99, r1 = -1, c1 = -1;
      stones.forEach(k => {
        const [r, c] = k.split(",").map(Number);
        if (r < r0) r0 = r; if (r > r1) r1 = r;
        if (c < c0) c0 = c; if (c > c1) c1 = c;
      });
      const rows = r1 - r0 + 1, cols = c1 - c0 + 1;
      const solid = stones.size === rows * cols;
      return { ok: solid, rows, cols, total: stones.size, r0, c0 };
    },

    /* What every row holds, top to bottom — used to tell her that the rows
       are not equal YET, which is a different message from being wrong. */
    rowCounts() {
      const m = new Map();
      stones.forEach(k => { const r = Number(k.split(",")[0]); m.set(r, (m.get(r) || 0) + 1); });
      return [...m.keys()].sort((a, b) => a - b).map(r => m.get(r));
    },

    /* Every row that has stones, top to bottom: where it starts, how many,
       and whether they sit side by side with no hole. */
    rows() {
      const m = new Map();
      stones.forEach(k => {
        const [r, c] = k.split(",").map(Number);
        if (!m.has(r)) m.set(r, []);
        m.get(r).push(c);
      });
      return [...m.keys()].sort((a, b) => a - b).map(r => {
        const cs = m.get(r), c0 = Math.min(...cs), c1 = Math.max(...cs);
        return { r, c0, n: cs.length, solid: c1 - c0 + 1 === cs.length };
      });
    },

    report() {
      const sh = api.shape();
      return {
        shape: sh,
        total: stones.size,
        rowCounts: api.rowCounts(),
        rows: api.rows(),
        rim: rim.size,
        rimNeeded: rimRect ? 2 * (rimRect.rows + rimRect.cols) : 0,
        /* Finished sides of the rim, in the order she finished them. */
        sides: sideOrder.map(sd => ({ id: sd, len: sideLen(sd) })),
        mode: cfg ? cfg.mode : "floor"
      };
    },

    clear() {
      if (!cfg) return;
      stones = new Set(); rim = new Set(); doneRows = new Set(); keptStones = new Set();
      litCells = new Set(); sideOrder = [];
      if (cfg.fill) for (let r = 0; r < cfg.fill.rows; r++) for (let c = 0; c < cfg.fill.cols; c++) stones.add(key(r, c));
      hisStones = new Set((cfg.his || []).map(p => key(p[0], p[1])));
      hisStones.forEach(k => stones.add(k));
      announce();
    },

    /* ---- what Ember does when she goes alone ----------------------------
       The player is watching, not tapping, so these lay stones one at a time on a
       timer. Each returns a promise, which is what lets a quest beat say
       "build this, then speak". */

    async lay(rows, cols, ms) {
      const want = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) want.push(key(r, c));
      for (const k of want) {
        if (!stones.has(k)) { stones.add(k); Ambience.stone(); announce(); await sleep(pace(ms, 55)); }
      }
      announce();
    },

    /* Turning the shelf: every stone at (r,c) moves to (c,r). The point the player
       taught Ember is that nothing is lost doing it, so nothing is. */
    async turnIt(ms) {
      const before = [...stones];
      stones = new Set();
      announce();
      await sleep(pace(ms, 180));
      for (const k of before) {
        const [r, c] = k.split(",").map(Number);
        stones.add(key(c, r));
        Ambience.stone();
        announce();
        await sleep(pace(ms, 40));
      }
      announce();
    },

    async layRim(ms) {
      const sh = api.shape();
      if (!sh.ok) return;
      makeRim({ r0: sh.r0, c0: sh.c0, rows: sh.rows, cols: sh.cols }, false);
      const ids = [...twigEls.keys()];
      for (const id of ids) {
        rim.add(id); Ambience.stone(); announce(); await sleep(pace(ms, 45));
      }
      announce();
    },

    /* Light up where a clue points: { r0, c0, rows, cols } for hollows, or
       { twigs: "top" | "all" } for the rim. null puts the glow out. */
    glow(spec) {
      glowCells = new Set(); glowTwigs = new Set();
      if (spec && spec.twigs) {
        twigEls.forEach((el, id) => { if (spec.twigs === "all" || id[0] === spec.twigs[0]) glowTwigs.add(id); });
      } else if (spec) {
        const r0 = spec.r0 || 0, c0 = spec.c0 || 0;
        for (let r = r0; r < r0 + spec.rows; r++) for (let c = c0; c < c0 + spec.cols; c++) glowCells.add(key(r, c));
      }
      paint();
    },

    /* Light the stones in these rows: the model counting as she builds. */
    lightRows(rowList) {
      const want = new Set(rowList || []);
      litCells = new Set();
      stones.forEach(k => { if (want.has(Number(k.split(",")[0]))) litCells.add(k); });
      paint();
    },

    /* What she built is finished; nothing moves from here on. */
    freeze() { frozen = true; },

    /* Ember asks how she knew. Each part is { id } plus EITHER
       rect: { r0, c0, rows, cols } (stones) OR side: "t" | "r" | "b" | "l"
       (the twigs along one side of the rim). A tap anywhere on a part picks
       the whole part, once, and calls back with its id and where on the
       screen it was tapped. */
    ask(parts, fn) {
      frozen = true;
      litCells = new Set();
      glowCells = new Set(); glowTwigs = new Set();
      picked = new Set();
      onPick = fn;
      asking = parts.map(p => {
        const cells = new Set(), twigs = new Set();
        if (p.rect) {
          for (let r = p.rect.r0; r < p.rect.r0 + p.rect.rows; r++)
            for (let c = p.rect.c0; c < p.rect.c0 + p.rect.cols; c++) cells.add(key(r, c));
        }
        if (p.side) twigEls.forEach((el, id) => { if (id[0] === p.side) twigs.add(id); });
        /* Where the pointing hand rests: the middle of the part's top row,
           or the middle twig of a side. */
        const ids = [...twigs];
        const anchor = p.rect ? key(p.rect.r0, p.rect.c0 + Math.floor((p.rect.cols - 1) / 2))
          : ids[Math.floor((ids.length - 1) / 2)];
        return { id: p.id, side: p.side || null, cells, twigs, anchor };
      });
      hintEl = document.createElement("div");
      hintEl.className = "point-hint";
      hintEl.textContent = "👆";
      box.appendChild(hintEl);
      paint();
    },

    endAsk() { onPick = null; paint(); },

    /* She tapped somewhere that is not a part (the empty sum, usually):
       every part still waiting flashes, so the eye goes to the stones. */
    nudge() {
      if (!asking || !onPick || !box) return;
      box.classList.add("nudge");
      setTimeout(() => { if (box) box.classList.remove("nudge"); }, 900);
    },

    onChange(fn) { listener = fn; },
    relayout: layout
  };

  window.addEventListener("resize", () => layout());
  window.addEventListener("orientationchange", () => setTimeout(layout, 120));

  return api;
})();
