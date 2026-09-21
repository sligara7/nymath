/* Can every lesson actually be finished, and does Ember's own attempt fail?

   This runs the REAL nest and the REAL rules against a shimmed DOM rather
   than a reimplementation of them, because the bug worth catching here is a
   lesson whose target cannot be built on the lattice it was given — and a
   second copy of the logic would agree with itself and miss it.

   Run: node test/lessons.test.js       (no dependencies, no build) */

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

/* ---- the smallest DOM that nest.js will accept ------------------------- */

function makeEl() {
  const e = {
    style: {}, children: [], _cls: "",
    clientWidth: 360,
    set className(v) { e._cls = v; }, get className() { return e._cls; },
    classList: {
      add: c => { if (!e._cls.split(" ").includes(c)) e._cls = (e._cls + " " + c).trim(); },
      toggle: (c, on) => { on ? e.classList.add(c) : 0; },
      contains: c => e._cls.split(" ").includes(c)
    },
    appendChild: c => { e.children.push(c); return c; },
    addEventListener: () => {},
    set innerHTML(v) { if (v === "") e.children = []; },
    get innerHTML() { return ""; }
  };
  return e;
}

global.window = { addEventListener: () => {}, innerHeight: 740 };
global.document = { createElement: makeEl };
global.Ambience = { stone(){}, lift(){}, row(){}, learned(){}, wake(){}, setMuted(){} };

function load(f) { (0, eval)(fs.readFileSync(path.join(root, f), "utf8") + "\n;"); }

/* Files declare with const, which eval scopes away — so hand each one back. */
const GRADE3 = (0, eval)(fs.readFileSync(path.join(root, "content/grade3.js"), "utf8") + ";GRADE3");
const Nest    = (0, eval)(fs.readFileSync(path.join(root, "js/nest.js"), "utf8") + ";Nest");
const Lessons = (0, eval)(fs.readFileSync(path.join(root, "js/lessons.js"), "utf8") + ";Lessons");

/* ---- helpers ----------------------------------------------------------- */

let fails = 0, checks = 0;
function ok(cond, what) {
  checks++;
  if (!cond) { fails++; console.log("  FAIL  " + what); }
}

function mount(stage) {
  const host = makeEl();
  Nest.mount(host, {
    rows: stage.grid.rows, cols: stage.grid.cols,
    mode: stage.mode || "floor", his: stage.his, fill: stage.fill,
    locked: !!stage.locked, carry: !!stage.carry
  });
  return host;
}

function rect(rows, cols, r0, c0) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([(r0 || 0) + r, (c0 || 0) + c]);
  return out;
}

/* ---- the rules, driven directly on reports ------------------------------ */

function reportFor(cells, latticeRows, latticeCols, rimCount, rimNeeded) {
  const set = new Set(cells.map(p => p[0] + "," + p[1]));
  let r0 = 99, c0 = 99, r1 = -1, c1 = -1;
  set.forEach(k => {
    const [r, c] = k.split(",").map(Number);
    if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c;
  });
  const rows = set.size ? r1 - r0 + 1 : 0, cols = set.size ? c1 - c0 + 1 : 0;
  const counts = new Map();
  set.forEach(k => { const r = Number(k.split(",")[0]); counts.set(r, (counts.get(r) || 0) + 1); });
  return {
    shape: { ok: !!set.size && set.size === rows * cols, rows, cols, total: set.size },
    total: set.size,
    rowCounts: [...counts.keys()].sort((a, b) => a - b).map(r => counts.get(r)),
    rim: rimCount || 0, rimNeeded: rimNeeded || 0
  };
}

/* Confirm the shim's report agrees with the real nest, so the rest of this
   file is testing the real thing and not a lookalike. */
(function agree() {
  const st = GRADE3.lessons[0].stages[0];
  mount(st);
  const real = Nest.report();
  const mine = reportFor(st.his, st.grid.rows, st.grid.cols);
  ok(real.total === mine.total, "nest and reference agree on total (" + real.total + " vs " + mine.total + ")");
  ok(real.shape.ok === mine.shape.ok, "nest and reference agree on solidity");
  ok(real.rowCounts.join() === mine.rowCounts.join(),
     "nest and reference agree on row counts (" + real.rowCounts + " vs " + mine.rowCounts + ")");
})();

/* ---- every stage: solvable, and not solved by accident ----------------- */

/* The intended solution for each stage, written out independently of the
   content file — if these two ever disagree, that is the bug. */
const SOLUTIONS = {
  "g3-ragged-nest:0":     { cells: rect(3, 4) },
  "g3-fast-count:0":      { cells: rect(4, 5) },
  "g3-turn-it:0":         { cells: rect(8, 3) },
  "g3-the-rim:0":         { cells: rect(3, 4), rim: 14, rimNeeded: 14 },
  "g3-the-rim:1":         { cells: rect(2, 5) },
  "g3-break-it-apart:0":  { cells: rect(6, 5) },
  "g3-break-it-apart:1":  { cells: rect(6, 7) }
};

GRADE3.lessons.forEach(lesson => {
  lesson.stages.forEach((stage, i) => {
    const key = lesson.id + ":" + i;
    const sol = SOLUTIONS[key];
    ok(!!sol, key + " has a written-out solution");
    if (!sol) return;

    /* 1. it fits on the lattice she is given */
    const maxR = Math.max(...sol.cells.map(p => p[0])) + 1;
    const maxC = Math.max(...sol.cells.map(p => p[1])) + 1;
    ok(maxR <= stage.grid.rows && maxC <= stage.grid.cols,
       key + " solution " + maxR + "x" + maxC + " fits lattice " + stage.grid.rows + "x" + stage.grid.cols);

    /* 2. the rule accepts it */
    const rep = reportFor(sol.cells, stage.grid.rows, stage.grid.cols, sol.rim, sol.rimNeeded);
    ok(Lessons.passes(stage.check, rep), key + " intended solution passes " + stage.check.rule);

    /* 3. an empty nest does not */
    const empty = reportFor([], stage.grid.rows, stage.grid.cols, 0, sol.rimNeeded || 0);
    ok(!Lessons.passes(stage.check, empty), key + " empty nest does not pass");

    /* 4. the reveal has no template holes left in it */
    if (stage.reveal) {
      const s = Lessons.fill(stage.reveal.sentence, rep) + Lessons.fill(stage.reveal.said, rep);
      ok(!/\{\w+\}/.test(s), key + " reveal has no unfilled {placeholders}");
    }
  });
});

/* ---- Ember's own attempt must be wrong --------------------------------- */

(function embersAttempt() {
  const st = GRADE3.lessons[0].stages[0];
  const rep = reportFor(st.his, st.grid.rows, st.grid.cols);
  ok(rep.total === 12, "Ember laid 12 stones (he thinks 11, or 13)");
  ok(!Lessons.passes(st.check, rep), "Ember's ragged nest does NOT pass — she has something to fix");
  ok(rep.rowCounts.length > 1 && new Set(rep.rowCounts).size > 1,
     "his rows are genuinely unequal: " + rep.rowCounts.join(", "));
})();

/* ---- the free-choice lesson really is free ----------------------------- */

(function freeChoice() {
  const st = GRADE3.lessons[0].stages[0];
  [[3, 4], [4, 3], [2, 6]].forEach(([r, c]) => {
    ok(Lessons.passes(st.check, reportFor(rect(r, c))), "12 stones as " + r + "x" + c + " is accepted");
  });
  /* A single line of 12 is a rectangle but not an array worth the name. */
  ok(!Lessons.passes(st.check, reportFor(rect(1, 12))), "a single row of 12 is not accepted as equal rows");
  ok(!Lessons.passes(st.check, reportFor(rect(3, 3))), "9 stones is not accepted — he had 12");
})();

/* ---- the perimeter lesson is the standard's own question ---------------- */

(function perimeter() {
  const st = GRADE3.lessons[3].stages[1];
  ok(Lessons.passes(st.check, reportFor(rect(2, 5))), "2x5: rim 14, floor 10 — accepted");
  ok(Lessons.passes(st.check, reportFor(rect(1, 6))), "1x6: rim 14, floor 6 — accepted");
  ok(!Lessons.passes(st.check, reportFor(rect(3, 4))), "3x4 is the SAME nest (rim 14, floor 12) — rejected");
  ok(!Lessons.passes(st.check, reportFor(rect(2, 4))), "2x4 has a different rim (12) — rejected");
})();

/* ---- content hygiene ---------------------------------------------------- */

GRADE3.lessons.forEach(l => {
  ok(/^NY-3\./.test(l.standards[0]), l.id + " names a NY-3 standard");
  l.stages.forEach((s, i) => {
    ok(!!Lessons.RULES[s.check.rule], l.id + ":" + i + " uses a rule that exists (" + s.check.rule + ")");
    ok(s.task.length < 70, l.id + ":" + i + " task fits one line on a phone");
  });
});

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);
