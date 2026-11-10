/* Her flash cards: do they ask only what she has built, without a clock, and
   bring back the right facts on the right days?

   The first half drives the card logic directly: families, the five boxes,
   which cards a lesson ends on. The second half walks the real page through
   the end of a lesson, including a miss, a reload, and the fractions lesson
   that has no facts of its own.

   Run: node test/cards.test.js        (no dependencies, no build) */

const { boot, read, sleep, text, answerOf, typeOnPad, playCards } = require("./page.js");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };
const tap = node => node.fire("pointerdown");
const cellAt = (p, cols, r, c) => p.box.children[r * cols + c];

(async () => {

/* ---- families ------------------------------------------------------------- */

{
  const { Cards } = boot("#l1").page;
  const m = Cards.ways({ op: "x", a: 3, b: 5 });
  ok(m.map(w => w.q + "=" + w.answer).join() === "3 × 5=15,5 × 3=15,15 ÷ 3=5,15 ÷ 5=3",
     "an array is one family asked four ways: " + m.map(w => w.q).join(", "));
  const a = Cards.ways({ op: "+", a: 7, b: 8 });
  ok(a.map(w => w.q + "=" + w.answer).join() === "7 + 8=15,8 + 7=15,15 − 7=8,15 − 8=7",
     "a bar is one family asked four ways: " + a.map(w => w.q).join(", "));
  ok(Cards.ways({ op: "x", a: 4, b: 4 }).length === 2, "a square has only two different ways, not four copies");
  ok(Cards.idOf({ op: "x", a: 8, b: 3 }) === Cards.idOf({ op: "x", a: 3, b: 8 }), "3 x 8 and 8 x 3 are one family");
  ok(m.every(w => answerOf(w.q) === w.answer) && a.every(w => answerOf(w.q) === w.answer), "and every answer is the true one");
  ok(Cards.addDays("2026-12-30", 3) === "2027-01-02", "days are counted across a month and a year");
}

/* ---- what each stage puts on her cards ------------------------------------ */

{
  const { Lessons, GRADE3, Cards } = boot("#l1").page;
  const built = { "g3-ragged-nest:0": [3, 4], "g3-fast-count:0": [4, 5], "g3-turn-it:0": [8, 3],
    "g3-the-rim:0": [3, 4], "g3-the-rim:1": [2, 5], "g3-break-it-apart:0": [6, 5], "g3-break-it-apart:1": [6, 7] };
  const got = {};
  GRADE3.lessons.forEach(l => l.stages.forEach((st, i) => {
    const key = l.id + ":" + i, d = built[key] || [0, 0];
    const rep = { shape: { ok: !!built[key], rows: d[0], cols: d[1], total: d[0] * d[1], r0: 0, c0: 0 }, lines: [] };
    got[key] = Lessons.facts(st, rep).map(f => f.op === "x" ? f.a + "x" + f.b : f.a + "+" + f.b).join(",");
  }));
  ok(got["g3-fast-count:0"] === "4x5", "4 rows of 5 puts 4 x 5 on her cards");
  ok(got["g3-the-rim:0"] === "4+3,2x7", "a 3 by 4 fence gives 4 + 3 and 2 x 7: " + got["g3-the-rim:0"]);
  ok(got["g3-the-rim:1"] === "5+2,2x7", "a 2 by 5 fence gives 5 + 2 and 2 x 7");
  ok(got["g3-break-it-apart:1"] === "6x7,30+12", "breaking 6 x 7 apart gives 6 x 7 and 30 + 12: " + got["g3-break-it-apart:1"]);
  ok(["g3-fair-shares:0", "g3-fair-shares:1", "g3-fair-shares:2"].every(k => got[k] === ""), "the fractions stages put nothing on her cards");
  ok(Lessons.facts(GRADE3.lessons[1].stages[0], { shape: { ok: false } }).length === 0, "nothing she has not finished building is a fact");
}

/* ---- the five boxes, and the calendar ------------------------------------- */

{
  const { Cards, Save } = boot("#l1").page;
  let day = "2026-11-10";
  Cards.setToday(() => day);

  ok(Cards.plan("lesson-a").length === 0, "with nothing built there are no cards at all");
  Cards.learn("lesson-a", [{ op: "x", a: 4, b: 5 }]);
  const first = Cards.plan("lesson-a");
  ok(first.length === 3 && new Set(first.map(c => c.way.q)).size === 3,
     "one family alone still makes three cards, each a different way: " + first.map(c => c.way.q).join(" | "));

  /* Right first time, four times running: it climbs the boxes. */
  const dues = [];
  for (let i = 0; i < 4; i++) { Cards.record("x:4:5", true); dues.push(Save.cards().facts["x:4:5"].due); }
  ok(dues.join() === "2026-11-11,2026-11-13,2026-11-17,2026-11-24", "a fact she knows returns after 1, 3, 7, then 14 days: " + dues.join());
  ok(Save.cards().facts["x:4:5"].box === 4, "and stops at the last box");

  /* A second lesson, the same day: 4 x 5 is not due, so it is left alone. */
  Cards.learn("lesson-b", [{ op: "x", a: 8, b: 3 }]);
  ok(Cards.plan("lesson-b").every(c => c.id === "x:3:8"), "a fact that is not due is not asked again the same day");

  /* A miss sends it back to come round in the very next run. */
  Cards.record("x:4:5", false);
  ok(Save.cards().facts["x:4:5"].box === 0 && Save.cards().facts["x:4:5"].due === day, "a miss sends a fact back to the first box, due at once");
  const next = Cards.plan("lesson-b");
  ok(next.length === 4 && next[3].id === "x:4:5", "so the next run brings it back, after the lesson's own three");

  /* Skipping a fortnight costs nothing: everything is simply due. */
  Cards.record("x:4:5", true); Cards.record("x:3:8", true);
  const before = JSON.stringify(Save.cards());
  day = "2026-11-30";
  ok(JSON.stringify(Save.cards()) === before, "a fortnight away changes nothing in her record");
  Cards.learn("lesson-c", [{ op: "+", a: 4, b: 3 }, { op: "x", a: 2, b: 7 }]);
  const late = Cards.plan("lesson-c");
  ok(late.length === 5 && late.filter(c => c.fact.lesson === "lesson-c").length === 3 && late.slice(3).map(c => c.id).sort().join() === "x:3:8,x:4:5",
     "after the gap: the lesson's three, then the two earlier facts now due: " + late.map(c => c.way.q).join(" | "));
  ok(late.length <= 5, "never more than five");

  /* The streak is this sitting's; only the best is kept. */
  Cards.newSitting();
  Cards.record("x:4:5", true); Cards.record("x:4:5", true); Cards.record("x:4:5", false); Cards.record("x:4:5", true);
  ok(Cards.streak() === 1 && Save.cards().best >= 4, "a miss ends the run of the sitting and never lowers her best (" + Save.cards().best + ")");

  /* Each time a family comes up it asks a different way. */
  const q1 = Cards.plan("lesson-a")[0].way.q;
  Cards.record("x:4:5", true);
  ok(Cards.plan("lesson-a")[0].way.q !== q1, "the same family asks a different way next time");
}

/* ---- the end of a lesson, on the real page --------------------------------- */

const phone = {};
{
  const p = boot("#l2", phone);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) tap(cellAt(p, 6, r, c));
  await sleep(700);
  [0, 1, 2, 3].forEach(r => tap(cellAt(p, 6, r, 2)));
  await sleep(2300);

  ok(p.$("cards").hidden === false && p.$("revealWrap").hidden === true, "the lesson's last sentence brings her cards");
  ok(p.$("cardPad").children.length === 12, "a number pad drawn by the game: nine digits, back, zero and Tell Ember");
  ok(p.$("cardCount").textContent === "1 of 3", "three cards for a lesson with one fact and nothing earlier");
  ok(/^(4 × 5|5 × 4|20 ÷ 4|20 ÷ 5)$/.test(p.$("cardQ").textContent), "from the 4 by 5 she just built: " + p.$("cardQ").textContent);
  ok(p.spoken[p.spoken.length - 1] === "4 times 5", "Ember reads the card aloud");
  ok(p.page.Save.den() === null, "no coins yet");

  /* Nothing happens on its own. */
  const q = p.$("cardQ").textContent;
  await sleep(1500);
  ok(p.$("cardQ").textContent === q && p.$("cards").hidden === false, "waiting changes nothing: no clock");

  /* A miss: her own picture comes out, and she answers from it. */
  typeOnPad(p.$, 19);
  ok(p.$("cardModel").hidden === false && (p.$("cardModel").innerHTML.match(/class="dotrow"/g) || []).length === 4,
     "a miss turns up her own model: 4 rows");
  ok((p.$("cardModel").innerHTML.match(/<i>/g) || []).length === 20, "of 5, twenty stones");
  ok(!/wrong|no\b|oops|incorrect/i.test(p.$("emberSays").innerHTML), "and nothing says she was wrong: " + p.$("emberSays").innerHTML);
  ok(p.$("cardQ").textContent === q, "the same card is still up");
  typeOnPad(p.$, 21);
  ok(text(p.$("cardModel").innerHTML).includes("4 × 5 = 20"), "a second miss puts the whole sentence under the picture");
  typeOnPad(p.$, 20);
  await sleep(600);
  ok(p.$("cardCount").textContent === "2 of 3", "then she goes on");
  ok(p.page.Save.cards().facts["x:4:5"].box === 0, "the missed fact is marked to come back soon");

  const rest = await playCards(p.$);
  ok(rest.length === 2 && new Set(rest.concat(q)).size === 3, "the other two cards ask it other ways: " + rest.join(" | "));
  ok(p.$("cards").hidden === true && p.$("surface").hidden === false, "and the nest comes back");
  ok(/what did I learn today/i.test(p.$("emberSays").innerHTML) && p.$("revealWrap").hidden === true, "for Ember's last question");
  ok(p.page.Save.den() === null && !p.page.Save.hasTaught("g3-fast-count"), "the lesson is not paid or counted yet");
  [0, 1, 2, 3].forEach(r => tap(cellAt(p, 6, r, 4)));
  await sleep(2300);
  ok(p.$("revealWrap").hidden === false, "then the reveal");
  ok(p.page.Save.den().paid.includes("g3-fast-count:0"), "and only now is it paid");
  ok(!/NY-3\./.test(p.$("revealBody").innerHTML), "the summary line she used to tap past is gone from the end of a lesson");
}

/* ---- her record survives a reload, and travels in her save code ------------ */

{
  const p = boot("#l6", phone);
  const kept = p.page.Save.cards();
  ok(Object.keys(kept.facts).join() === "x:4:5" && kept.facts["x:4:5"].model.kind === "array",
     "reopened: 4 x 5 is still on her cards, with the model she built");
  const code = p.page.Save.code();
  const other = boot("#l1", {});
  ok(other.page.Save.adopt(code) && JSON.stringify(other.page.Save.cards()) === JSON.stringify(kept),
     "and a save code carries her cards to another phone exactly");
  const bad = boot("#l1", { "nymath.ember.v1": JSON.stringify({ cards: { best: "x", facts: { "x:4:5": { op: "x", a: 4, b: 5, box: 99, due: "<b>" }, "evil": { op: "<script>" } } } }) });
  const c = bad.page.Save.cards();
  ok(c.best === 0 && Object.keys(c.facts).join() === "x:4:5" && c.facts["x:4:5"].box === 4 && c.facts["x:4:5"].due === "",
     "a malformed record is cleaned on the way in");

  /* ---- the fractions lesson ends on review cards alone -------------------- */

  const fish = p.page.GRADE3.lessons.find(l => l.id === "g3-fair-shares");
  ok(p.page.Cards.plan(fish.id).length === 3 && p.page.Cards.plan(fish.id).every(x => x.id === "x:4:5"),
     "lesson 6 has no facts of its own, so its run is earlier facts: three ways of 4 x 5");
  const blank = boot("#l6", {});
  ok(blank.page.Cards.plan(fish.id).length === 0, "and with nothing built yet it has no cards, and simply ends");
}

/* ---- no clock, anywhere in the cards ---------------------------------------- */

{
  const src = read("js/cards.js").replace(/\/\*[\s\S]*?\*\//g, "");
  ok(!/setInterval|countdown|timer|performance\.now|Date\.now/i.test(src), "the cards have no timer, countdown or stopwatch in them");
  ok(!/Math\.random/.test(src), "and nothing is left to chance");
  ok(!/payFor|coins/i.test(src), "and no card pays coins of its own");
}

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);

})();
