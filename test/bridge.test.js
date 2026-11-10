/* Can a lesson be passed without building the number sentence?

   THIS TEST EXISTS BECAUSE OF WHAT HER FATHER WATCHED. She built 3 rows of 5
   correctly, tapped straight past "3 x 5 = 15", and afterwards could not say
   what 3 x 5 is. The model was learned; the bridge from model to number was
   skipped. So building it right is no longer the end of a stage: Ember asks
   how she knew, and nothing moves on until she has tapped her own rows or
   sides into the sum.

   Each walk below boots the REAL page at one stage (by deep link, in a fresh
   context, in the order index.html loads the scripts), builds the answer the
   way a finger would, and then checks three things: the reveal stays away,
   the sentence she assembles is the true one, and only then does it arrive.

   Run: node test/bridge.test.js       (no dependencies, no build) */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const text = html => String(html).replace(/<[^>]+>/g, "");

/* What a card is asking, worked out here rather than read from the game. */
function answerOf(q) {
  const m = /^(\d+) (.) (\d+)$/.exec(q);
  const a = Number(m[1]), b = Number(m[3]);
  return { "×": a * b, "÷": a / b, "+": a + b, "−": a - b }[m[2]];
}
/* Type on the game's own number pad, the way a thumb would. */
function typeOnPad($, text) {
  const keys = $("cardPad").children;
  String(text).split("").forEach(ch => keys.find(k => k.textContent === ch).fire("click"));
  keys.find(k => k.textContent === "Tell Ember").fire("click");
}
/* Answer every card correctly; returns the questions that were asked. */
async function playCards($) {
  const asked = [];
  while (!$("cards").hidden && asked.length < 9) {
    const q = $("cardQ").textContent;
    asked.push(q);
    typeOnPad($, answerOf(q));
    await sleep(600);
  }
  return asked;
}

/* ---- a page, booted at one stage ---------------------------------------- */

function makeEl(id) {
  const on = {};
  const e = {
    id: id || "", _cls: "", _html: "", textContent: "", value: "",
    hidden: false, style: {}, children: [], clientWidth: 360,
    set className(v) { e._cls = v; }, get className() { return e._cls; },
    classList: {
      add: c => { if (!e._cls.split(" ").includes(c)) e._cls = (e._cls + " " + c).trim(); },
      remove: c => { e._cls = e._cls.split(" ").filter(x => x !== c).join(" "); },
      toggle: (c, force) => { force ? e.classList.add(c) : e.classList.remove(c); },
      contains: c => e._cls.split(" ").includes(c)
    },
    appendChild: c => { e.children.push(c); return c; },
    remove: () => {},
    addEventListener: (t, fn) => { (on[t] = on[t] || []).push(fn); },
    set innerHTML(v) { e._html = v; if (v === "") e.children = []; },
    get innerHTML() { return e._html; },
    fire(t, ev) { (on[t] || []).forEach(fn => fn(ev || { preventDefault() {} })); }
  };
  return e;
}

const HTML = read("index.html");
const ORDER = [...HTML.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1].split("?")[0]);
const SOURCE = ORDER.map(read).join("\n;\n") + "\n;globalThis.__page = { Save, Nest, Lessons, GRADE3, Ambience, Cards, Den };";

function boot(hash, muted) {
  const byId = new Map();
  [...HTML.matchAll(/\bid="([^"]+)"/g)].forEach(m => byId.set(m[1], makeEl(m[1])));
  const store = {};
  if (muted) store["nymath.ember.v1"] = JSON.stringify({ muted: true });
  const spoken = [];
  const ctx = {
    console: { log() {} }, setTimeout, clearTimeout,
    requestAnimationFrame: fn => setTimeout(fn, 0),
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    location: { hash },
    document: {
      title: "",
      getElementById: id => byId.get(id) || null,
      querySelector: () => null,
      createElement: () => makeEl()
    },
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    }
  };
  ctx.window = {
    addEventListener: () => {}, innerHeight: 740,
    speechSynthesis: { speak: u => spoken.push(u.text), cancel() {} }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  const $ = id => byId.get(id);
  $("revealWrap").hidden = true;      /* as the page starts; the shim cannot read the attribute */
  const box = $("surface").children[0];
  return { $, box, spoken, page: ctx.__page };
}

/* The nest box holds the cells first, row by row, then anything else. */
const cellAt = (p, cols, r, c) => p.box.children[r * cols + c];
const twigs = p => p.box.children.filter(c => c.className.split(" ")[0] === "twig");
const badges = p => p.box.children.filter(c => c.className.split(" ")[0] === "side-len");
const tap = node => node.fire("pointerdown");

(async () => {

/* ---- an array: 4 rows of 5 ------------------------------------------------ */

{
  const p = boot("#l2");
  /* A build that comes right should be FELT: a note per finished row, a
     bigger sound and Ember hopping when the build is whole, the biggest when
     the sentence is. The sounds are caught here; that they sound good is for
     a person with the phone in her hand. */
  const heard = [];
  ["count", "built", "learned"].forEach(k => { p.page.Ambience[k] = n => heard.push(k + (n ? ":" + n : "")); });
  ok(p.$("lessonName").textContent === "The fast count", "walk 1 opens on 4 rows of 5");
  ok(p.spoken.length === 0, "nothing is said before she has touched anything");

  /* Row by row, the way she would. */
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) tap(cellAt(p, 6, r, c));
    const want = [5, 10, 15, 20].slice(0, r + 1);
    ok(text(p.$("readout").innerHTML).startsWith(want.join("")),
       "after row " + (r + 1) + " the running total reads " + want.join(", "));
    ok(p.spoken[p.spoken.length - 1] === String(want[r]), "and Ember says \"" + want[r] + "\"");
    if (r < 3) ok(p.box.children.filter(c => c.className.includes("lit")).length === 5 * (r + 1),
       "with " + (r + 1) + " finished row(s) lit");
  }

  /* A row one stone short is not a finished row. */
  const q = boot("#l2");
  for (let c = 0; c < 4; c++) tap(cellAt(q, 6, 0, c));
  ok(!/class="chip/.test(q.$("readout").innerHTML) && q.spoken.length === 0, "four of five stones is not a finished row: no total, nothing said");

  ok(heard.join() === "count:1,count:2,count:3,count:4,built", "a note for each finished row, climbing, then the build's own sound: " + heard.join());
  ok(p.$("emberHolder").className.includes("hop"), "and Ember hops when the build comes right");
  await sleep(750);
  ok(!p.$("emberHolder").className.includes("hop"), "once, not on a loop");
  ok(p.$("revealWrap").hidden === true, "built right, and the reveal has NOT come");
  ok(/how did you/i.test(p.$("emberSays").innerHTML), "Ember asks how she knew");
  ok(p.$("task").textContent === "Tap each row of stones to drop its count into the sum.", "and the task says how to answer");

  /* THE FIRST WALK OF BUILD 10 FAILED HERE. The empty places in the sum look
     like where the answer goes, so that is what got tapped, and they did
     nothing at all: the action was on the rows and nothing on the screen
     said so. The check that passed knew where to tap. So: the place she
     acts must LOOK like it, a tap on the sum must be answered by pointing at
     the rows, and Ember must say the instruction, not only the question. */
  ok(p.box.children.filter(c => c.className.split(" ")[0] === "point-hint" && c.className.includes(" on")).length === 1,
     "a pointing hand sits on a row she has not tapped yet");
  ok(p.spoken.some(t => /tap each row of stones/i.test(t)), "Ember says HOW to answer aloud, not only the question");
  const saidBefore = p.spoken.length;
  p.$("readout").fire("pointerdown");
  ok(p.box.className.includes("nudge"), "tapping the empty sum is answered: the rows flash");
  ok(p.spoken.length === saidBefore + 1 && /tap a row of stones/i.test(p.spoken[p.spoken.length - 1]),
     "and Ember says where to tap: " + p.spoken[p.spoken.length - 1]);
  ok(text(p.$("readout").innerHTML) === "+++", "the sum itself is unchanged by that tap");

  [2, 0, 3].forEach(r => tap(cellAt(p, 6, r, 2)));
  ok(text(p.$("readout").innerHTML) === "5+5+5+", "three rows in, the sum reads 5 + 5 + 5 + (one place empty)");
  await sleep(2400);
  ok(p.$("revealWrap").hidden === true, "three of four rows: still no reveal, however long she waits");

  tap(cellAt(p, 6, 1, 4));
  ok(p.box.children.filter(c => c.className.split(" ")[0] === "point-hint" && c.className.includes(" on")).length === 0,
     "the pointing hand goes once every row is in");
  await sleep(700);
  ok(text(p.$("readout").innerHTML) === "5+5+5+54×5=20", "the sum folds into 4 × 5 = 20");
  ok(p.spoken[p.spoken.length - 1] === "5 plus 5 plus 5 plus 5. 4 times 5 equals 20", "and Ember says so");
  ok(heard[heard.length - 1] === "learned" && p.$("emberHolder").className.includes("hop"),
     "the biggest sound, and another hop, are kept for the finished sentence");
  ok(!p.page.Save.struggleOf("g3-fast-count:0")[0].solved, "not yet marked solved while the sentence is still being read");
  await sleep(1600);
  /* The end of the lesson: her cards, then the sentence once more. */
  ok(p.$("revealWrap").hidden === true && p.$("cards").hidden === false, "the last stage of a lesson goes on to her cards");
  await playCards(p.$);
  ok(/what did I learn today/i.test(p.$("emberSays").innerHTML), "then Ember asks what she learned today");
  [0, 1, 2, 3].forEach(r => tap(cellAt(p, 6, r, 0)));
  await sleep(2300);
  ok(p.$("revealWrap").hidden === false, "then, and only then, the reveal");
  ok(p.page.Save.struggleOf("g3-fast-count:0")[0].solved, "and it is solved");
  ok(text(p.$("revealBody").innerHTML).includes("4 × 5 = 20"), "the reveal carries the same sentence");
}

/* ---- the rim: 4 + 3 + 4 + 3 = 14 ------------------------------------------ */

{
  const p = boot("#l4.1");
  ok(p.$("lessonName").textContent === "The rim", "walk 2 opens on the rim");
  const T = twigs(p);            /* t0 b0 t1 b1 t2 b2 t3 b3, then l0 r0 l1 r1 l2 r2 */
  ok(T.length === 14, "fourteen twig slots round a 3 by 4 floor");
  const side = { t: [0, 2, 4, 6], b: [1, 3, 5, 7], l: [8, 10, 12], r: [9, 11, 13] };

  side.t.forEach(i => tap(T[i]));
  ok(text(p.$("readout").innerHTML).startsWith("4"), "the top laid: the running sum starts at 4");
  ok(badges(p).filter(b => b.className.includes(" on")).map(b => b.textContent).join() === "4", "and the top shows its length, 4");
  side.l.slice(0, 2).forEach(i => tap(T[i]));
  ok(badges(p).filter(b => b.className.includes(" on")).length === 1, "two of three twigs is not a finished side");
  tap(T[side.l[2]]);
  ok(text(p.$("readout").innerHTML).startsWith("47"), "the left side finished: 4, 7");
  ok(p.spoken.join() === "4,7", "Ember has said 4, then 7");
  side.b.forEach(i => tap(T[i]));
  side.r.forEach(i => tap(T[i]));
  ok(text(p.$("readout").innerHTML).startsWith("471114"), "all four: 4, 7, 11, 14");
  ok(p.spoken.join() === "4,7,11,14", "said aloud as each side was finished");

  await sleep(700);
  ok(p.$("revealWrap").hidden === true, "the fence is whole, and the reveal has NOT come");
  ok(/how many twigs/i.test(p.$("emberSays").innerHTML), "Ember asks how many twigs");

  tap(T[side.t[1]]);
  ok(twigs(p).filter(t => t.className.includes(" on")).length === 14, "tapping a side lifts no twig");
  tap(T[side.r[0]]); tap(T[side.b[3]]);
  await sleep(2400);
  ok(p.$("revealWrap").hidden === true, "three sides of four: still no reveal");
  tap(T[side.l[1]]);
  await sleep(700);
  ok(text(p.$("readout").innerHTML) === "4+3+4+3=14", "her sentence: 4 + 3 + 4 + 3 = 14");
  ok(p.spoken[p.spoken.length - 1] === "4 plus 3 plus 4 plus 3 equals 14", "said aloud");
  await sleep(1600);
  ok(p.$("revealWrap").hidden === false, "then the reveal");
}

/* ---- same rim, fewer stones: Ember walls it, she counts the sides ---------- */

{
  const p = boot("#l4.2");
  for (let r = 1; r < 3; r++) for (let c = 1; c < 6; c++) tap(cellAt(p, 7, r, c));
  ok(text(p.$("readout").innerHTML).includes("round the outside 14"), "walk 3: she builds 2 rows of 5, anywhere on the lattice");
  await sleep(700 + 14 * 60);
  ok(p.$("revealWrap").hidden === true, "no reveal yet");
  ok(twigs(p).length === 14 && twigs(p).every(t => t.className.includes(" on")), "Ember has laid 14 twigs round what she built");
  const T = twigs(p);            /* t0 b0 .. t4 b4, then l0 r0 l1 r1 */
  [T[0], T[10], T[1], T[11]].forEach(tap);
  await sleep(700);
  ok(text(p.$("readout").innerHTML) === "5+2+5+2=14", "her sentence is the rim: 5 + 2 + 5 + 2 = 14");
  await sleep(1600);
  const rimCards = await playCards(p.$);
  ok(rimCards.length >= 3 && rimCards.every(q => /^(5 \+ 2|2 \+ 5|7 − 2|7 − 5|2 × 7|7 × 2|14 ÷ 2|14 ÷ 7)$/.test(q)),
     "the fence gives its side pair and that pair doubled: " + rimCards.join(" | "));
  ok(twigs(p).length === 14, "her fence is still there for the last question, not laid a second time");
  [T[0], T[10], T[1], T[11]].forEach(tap);
  await sleep(2300);
  ok(p.$("revealWrap").hidden === false && text(p.$("revealBody").innerHTML).includes("only 10 inside"),
     "and the reveal adds that there are only 10 inside");
}

/* ---- breaking it apart: 30 + 12 = 42 --------------------------------------- */

{
  const p = boot("#l5.2");
  for (let r = 0; r < 6; r++) for (let c = 5; c < 7; c++) tap(cellAt(p, 7, r, c));
  await sleep(700);
  ok(p.$("revealWrap").hidden === true, "walk 4: 6 rows of 7 built, no reveal yet");
  ok(/altogether/i.test(p.$("emberSays").innerHTML), "Ember asks how many altogether");
  tap(cellAt(p, 7, 3, 2));
  ok(p.box.children.filter(c => c.className.includes("counted")).length === 30, "one tap counts the whole thirty she already had");
  tap(cellAt(p, 7, 0, 6));
  await sleep(700);
  ok(text(p.$("readout").innerHTML) === "30+12=42", "her sentence: 30 + 12 = 42");
  await sleep(1600);
  const apart = await playCards(p.$);
  ok(apart.some(q => /[×÷]/.test(q)) && apart.some(q => /[+−]/.test(q)),
     "breaking it apart gives both 6 x 7 and 30 + 12: " + apart.join(" | "));
  tap(cellAt(p, 7, 3, 2)); tap(cellAt(p, 7, 0, 6));
  await sleep(2300);
  ok(p.$("revealWrap").hidden === false, "then the reveal");
}

/* ---- muted means silent; fractions are untouched ---------------------------- */

{
  const p = boot("#l2", true);
  for (let c = 0; c < 5; c++) tap(cellAt(p, 6, 0, c));
  ok(text(p.$("readout").innerHTML).startsWith("5") && p.spoken.length === 0, "with sound off the total still shows, and Ember says nothing");

  const { Lessons, GRADE3 } = p.page;
  const fish = GRADE3.lessons.find(l => l.id === "g3-fair-shares");
  ok(fish.stages.every(s => Lessons.bridge(s, { shape: { ok: false }, lines: [] }) === null),
     "the fraction stages have no sentence step in this increment");
}

/* ---- every nest stage asks for a sentence that is TRUE ---------------------- */

{
  const { Lessons, GRADE3 } = boot("#l1").page;
  const shapes = {
    "g3-ragged-nest:0": [3, 4], "g3-fast-count:0": [4, 5], "g3-turn-it:0": [8, 3],
    "g3-the-rim:0": [3, 4], "g3-the-rim:1": [2, 5],
    "g3-break-it-apart:0": [6, 5], "g3-break-it-apart:1": [6, 7]
  };
  GRADE3.lessons.forEach(l => l.stages.forEach((st, i) => {
    const key = l.id + ":" + i;
    if (st.surface === "line") return;
    const [rows, cols] = shapes[key] || [];
    ok(!!rows, key + " has a shape to check against");
    if (!rows) return;
    const B = Lessons.bridge(st, { shape: { ok: true, rows, cols, total: rows * cols, r0: 0, c0: 0 } });
    ok(!!B, key + " asks her to show Ember the arithmetic");
    if (!B) return;
    const sum = B.parts.reduce((a, q) => a + q.value, 0);
    const want = B.kind === "sides" ? 2 * (rows + cols) : rows * cols;
    ok(sum === want, key + " (" + B.kind + "): " + B.parts.map(q => q.value).join(" + ") + " = " + want);
    ok(B.task.length < 70, key + " sentence task fits one line on a phone");
  }));
}

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);

})();
