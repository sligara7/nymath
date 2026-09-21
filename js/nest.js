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
  let hisStones = new Set();  /* Ember's own attempt, so his look different */
  let keptStones = new Set(); /* carried over from a previous stage */
  let lockedStones = new Set();
  let rim = new Set();        /* twig slot ids */
  let cellEls = new Map(), twigEls = new Map();
  let listener = null;
  let doneRows = new Set();   /* rows already celebrated, so it fires once */

  const key = (r, c) => r + "," + c;

  function cellSize() {
    const wAvail = host.clientWidth || 320;
    const extra = cfg.mode === "rim" ? 1.4 : 0;   /* room for the rim slots */
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
    const pad = cfg.mode === "rim" ? Math.round(s * 0.7) : 0;

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
    twigEls.forEach((el, id) => {
      const side = id[0], i = Number(id.slice(1));
      const horiz = side === "t" || side === "b";
      el.style.width = (horiz ? tw : th) + "px";
      el.style.height = (horiz ? th : tw) + "px";
      const cx = pad + i * step + s / 2, cy = pad + i * step + s / 2;
      if (side === "t") { el.style.left = (cx - tw / 2) + "px"; el.style.top = Math.round(pad * 0.18) + "px"; }
      if (side === "b") { el.style.left = (cx - tw / 2) + "px"; el.style.top = (pad + cfg.rows * step - gap + Math.round(pad * 0.18)) + "px"; }
      if (side === "l") { el.style.top = (cy - tw / 2) + "px"; el.style.left = Math.round(pad * 0.18) + "px"; }
      if (side === "r") { el.style.top = (cy - tw / 2) + "px"; el.style.left = (pad + cfg.cols * step - gap + Math.round(pad * 0.18)) + "px"; }
    });
  }

  function paint() {
    cellEls.forEach((el, k) => {
      const on = stones.has(k);
      /* A stone Ember laid and she has not touched yet looks like HIS — so the
         board reads as his mess before she starts, and becomes hers as she
         moves it. One tap on a cell clears its `his` mark for good. */
      el.className = "cell" +
        (on ? " on" : "") +
        (hisStones.has(k) ? " his" : "") +
        (on && keptStones.has(k) ? " kept" : "");
    });
    twigEls.forEach((el, id) => { el.className = "twig" + (rim.has(id) ? " on" : ""); });
  }

  function announce() {
    paint();
    if (listener) listener(api.report());
  }

  function tapCell(k) {
    if (cfg.locked || lockedStones.has(k)) return;
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
    if (rim.has(id)) { rim.delete(id); Ambience.lift(); }
    else { rim.add(id); Ambience.stone(); }
    announce();
  }

  const api = {

    mount(el, config) {
      host = el;
      cfg = Object.assign({ rows: 5, cols: 5, mode: "floor", locked: false }, config);

      /* `carry` keeps what she built in the previous stage on the board and
         marks it, so she can see the two pieces of a broken-apart fact side
         by side (lesson 5). Anything else starts clean. */
      if (!cfg.carry) { stones = new Set(); keptStones = new Set(); }

      hisStones = new Set((cfg.his || []).map(p => key(p[0], p[1])));
      /* Ember's attempt IS on the board — she rearranges his stones rather
         than starting from nothing, which is what "fix it" has to mean. */
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

      host.innerHTML = "";
      box = document.createElement("div");
      box.className = "nest";
      cellEls = new Map(); twigEls = new Map();

      for (let r = 0; r < cfg.rows; r++) {
        for (let c = 0; c < cfg.cols; c++) {
          const k = key(r, c);
          const d = document.createElement("div");
          d.className = "cell";
          if (cfg.mode !== "rim") d.addEventListener("pointerdown", ev => { ev.preventDefault(); tapCell(k); });
          box.appendChild(d);
          cellEls.set(k, d);
        }
      }

      if (cfg.mode === "rim") {
        const slots = [];
        for (let c = 0; c < cfg.cols; c++) { slots.push("t" + c); slots.push("b" + c); }
        for (let r = 0; r < cfg.rows; r++) { slots.push("l" + r); slots.push("r" + r); }
        slots.forEach(id => {
          const d = document.createElement("div");
          d.className = "twig";
          d.addEventListener("pointerdown", ev => { ev.preventDefault(); tapTwig(id); });
          box.appendChild(d);
          twigEls.set(id, d);
        });
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

    report() {
      const sh = api.shape();
      return {
        shape: sh,
        total: stones.size,
        rowCounts: api.rowCounts(),
        rim: rim.size,
        rimNeeded: cfg && cfg.mode === "rim" ? 2 * (cfg.rows + cfg.cols) : 0,
        mode: cfg ? cfg.mode : "floor"
      };
    },

    clear() {
      if (!cfg) return;
      stones = new Set(); rim = new Set(); doneRows = new Set(); keptStones = new Set();
      if (cfg.fill) for (let r = 0; r < cfg.fill.rows; r++) for (let c = 0; c < cfg.fill.cols; c++) stones.add(key(r, c));
      hisStones = new Set((cfg.his || []).map(p => key(p[0], p[1])));
      hisStones.forEach(k => stones.add(k));
      announce();
    },

    onChange(fn) { listener = fn; },
    relayout: layout
  };

  window.addEventListener("resize", () => layout());
  window.addEventListener("orientationchange", () => setTimeout(layout, 120));

  return api;
})();
