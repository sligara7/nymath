/* Ember's dreams: does a nap bring a 10-piece jigsaw that fills in only as
   she answers her own cards, with no clock, nothing lost, no coins, and an
   end after two dreams?

   The first half drives the card and jigsaw logic directly. The second walks
   the real page: the den, a nap, a miss, waking Ember mid-dream, coming back
   to it on a reopened phone, two whole dreams, waking up happy, the dream
   book, and a nap that runs past 10:30 at night.

   Run: node test/dreams.test.js       (no dependencies, no build) */

const { boot, read, sleep, answerOf } = require("./page.js");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };
const KEY = "nymath.ember.v1";

/* One family she has built (4 rows of 5), and the save of a player in the
   middle of Grade 3 with a name. Facts are written the way js/cards.js keeps
   them. */
const fact = (op, a, b, more) => Object.assign({ op, a, b, lesson: "g3-fast-count", model: null, box: 1, due: "2026-11-10", seen: "2026-11-09", asked: 0 }, more || {});
const phone = (facts, extra) => ({ [KEY]: JSON.stringify(Object.assign({
  name: "Wren", lesson: 3, stage: 0, learned: ["g3-ragged-nest", "g3-fast-count", "g3-turn-it"],
  cards: { best: 0, facts: facts || {} }
}, extra || {})) });
const ONE = { "x:4:5": fact("x", 4, 5, { model: { kind: "array", rows: 4, cols: 5 } }) };

const pieces = p => (p.$("dreamFrame").innerHTML.match(/class="piece/g) || []).length;
const slots = p => (p.$("dreamFrame").innerHTML.match(/class="slot"/g) || []).length;
const shown = (p, id) => p.$(id).hidden === false;
const coins = p => JSON.stringify(p.page.Save.den() && p.page.Save.den().coins);

function answer(p, right) {
  const q = p.$("dreamQ").textContent;
  const keys = p.$("dreamPad").children;
  String(right ? answerOf(q) : answerOf(q) + 1).split("").forEach(ch => keys.find(k => k.textContent === ch).fire("click"));
  keys.find(k => k.textContent === "Tell Ember").fire("click");
  return q;
}
async function answerAll(p, n) {
  const asked = [];
  for (let i = 0; i < n && shown(p, "dreamCards"); i++) { asked.push(answer(p, true)); await sleep(40); }
  return asked;
}
/* Into the den, then a nap, then tucked in. */
function nap(p) {
  p.$("denBtn").fire("click");
  p.$("denBed").fire("click");
  p.$("nightA").fire("click");
}

(async () => {

/* ---- the cards a dream asks ------------------------------------------------- */

{
  const { Cards, Dreams } = boot("", phone({})).page;
  ok(Cards.dreamDeck(10).length === 0 && !Dreams.ready(), "with no facts built there is nothing to dream with");
}
{
  const { Cards, Dreams } = boot("", phone(ONE)).page;
  const d = Cards.dreamDeck(10);
  ok(Dreams.ready() && d.length === 10, "one family she has built is enough for a whole dream: " + d.length + " cards");
  ok(d.every((c, i) => i === 0 || c.way.q !== d[i - 1].way.q), "and never the same question twice in a row: " + d.map(c => c.way.q).join(", "));
  ok(new Set(d.map(c => c.way.q)).size === 4, "the family is asked all four ways");
  ok(d.every(c => answerOf(c.way.q) === c.way.answer), "every answer is the true one");
}
{
  const facts = {
    "x:3:8": fact("x", 3, 8, { box: 3, due: "2026-11-20", seen: "2026-11-01" }),   /* not due */
    "x:4:5": fact("x", 4, 5, { box: 2, due: "2026-11-10" }),                        /* due today */
    "+:2:5": fact("+", 2, 5, { box: 0, due: "2026-11-08" }),                        /* due, weakest */
    "x:2:6": fact("x", 2, 6, { box: 4, due: "2026-12-30", seen: "2026-10-01" })     /* not due, longest unseen */
  };
  const { Cards } = boot("", phone(facts)).page;
  const d = Cards.dreamDeck(10).map(c => c.id);
  ok(d.slice(0, 4).join() === "+:2:5,x:4:5,x:2:6,x:3:8", "due facts first, weakest first; then the rest, longest unseen first: " + d.slice(0, 4).join(", "));
}

/* ---- practice before a fact is due does not move it on ----------------------- */

{
  const facts = { "x:3:8": fact("x", 3, 8, { box: 3, due: "2026-11-20" }), "x:4:5": fact("x", 4, 5, { box: 2, due: "2026-11-10" }) };
  const { Cards, Save } = boot("", phone(facts)).page;
  Cards.record("x:3:8", true, true);
  let f = Save.cards().facts["x:3:8"];
  ok(f.box === 3 && f.due === "2026-11-20", "a dream card right before it is due leaves its box and day alone (box " + f.box + ", due " + f.due + ")");
  Cards.record("x:4:5", true, true);
  f = Save.cards().facts["x:4:5"];
  ok(f.box === 3 && f.due === "2026-11-17", "a dream card that is due counts, as on the lesson cards (box " + f.box + ", due " + f.due + ")");
  Cards.record("x:3:8", false, true);
  f = Save.cards().facts["x:3:8"];
  ok(f.box === 0 && f.due === "2026-11-10", "a dream card missed comes back sooner, due or not (box " + f.box + ", due " + f.due + ")");
}

/* ---- the jigsaw ------------------------------------------------------------- */

{
  const { Dreams } = boot("", phone(ONE)).page;
  ok(Dreams.PICTURES.length === 7 && Dreams.PIECES === 10 && Dreams.PER_NAP === 2, "seven pictures in the story, ten pieces each, two dreams a nap");
  const paths = Array.from({ length: 10 }, (_, i) => Dreams.piecePath(i));
  ok(paths.every(d => /^M[\d. ]+.* Z$/.test(d) && !/NaN|undefined/.test(d)), "every piece has a closed outline");
  ok(paths.every(d => /C/.test(d)), "and every piece has at least one knob, so it reads as a jigsaw");
  ok(paths[0].startsWith("M0 0 L50 0 L") && /L0 0 Z$/.test(paths[0]), "the outer edge of the picture is straight");
  const o = Dreams.orderOf(3);
  ok(o.slice().sort((a, b) => a - b).join() === "0,1,2,3,4,5,6,7,8,9" && o.join() === Dreams.orderOf(3).join(),
     "pieces go in in a shuffled order that is the same every time: " + o.join(","));
  ok(Dreams.PICTURES.every((pic, k) => { const s = Dreams.frameSvg(k, 10, -1); return s.includes("<svg") && !/NaN|undefined/.test(s); }),
     "all seven pictures draw");
  const names = Dreams.PICTURES.map(x => x.name).join(" | ");
  ok(/wings/i.test(names) && /hop/i.test(names) && /glide/i.test(names) && /mountains/i.test(names) && /castles/i.test(names) &&
     /prince and princess and their baby/i.test(names) && /sunset/i.test(names), "the story: " + names);
  const src = read("js/dreams.js").replace(/\/\*[\s\S]*?\*\//g, "");
  ok(!/setTimeout|setInterval|new Date|Date\.now|countdown/i.test(src), "nothing in a dream counts down or reads the clock");
  ok(!/payForStage|coins|Hoard/.test(src), "and nothing in a dream pays coins");
}

/* ---- a nap with no cards yet is just a nap ------------------------------------ */

{
  const p = boot("#l1", phone({}), null, { quick: true });
  nap(p);
  ok(shown(p, "night") && !shown(p, "dream") && p.$("nightA").textContent === "Wake Ember up",
     "with no cards yet, tucking Ember in is a plain nap, as before");
}

/* ---- a nap, a miss, waking her, and coming back --------------------------------- */

const store = phone(ONE);
{
  const p = boot("#l4.1", store, null, { quick: true });
  p.$("denBtn").fire("click");
  const before = coins(p);
  ok(shown(p, "den") && p.$("denBook").hidden, "in the den; no dream book yet");
  p.$("denBed").fire("click");
  ok(p.$("nightA").textContent === "Tuck Ember in", "she puts Ember down for a nap");
  p.$("nightA").fire("click");
  ok(shown(p, "dream") && !shown(p, "night") && !shown(p, "den"), "tucked in, Ember falls asleep and dreams");
  ok(slots(p) === 10 && pieces(p) === 0 && p.$("dreamPieces").textContent === "0 of 10 pieces", "a 10-piece jigsaw, every piece still to come");
  ok(shown(p, "dreamCards") && p.$("dreamQ").textContent.length > 0 && p.$("dreamPad").children.length === 12, "with one of her cards and the number pad");
  ok(p.$("dreamNext").textContent === "" && p.$("dreamDone").hidden, "nothing to move on to until the picture is done");

  answer(p, true); await sleep(40);
  ok(pieces(p) === 1 && p.$("dreamPieces").textContent === "1 of 10 pieces", "a card answered: a piece snaps in");
  ok(/class="piece new"/.test(p.$("dreamFrame").innerHTML), "and the new piece lands with a little movement");

  const q = answer(p, false); await sleep(40);
  ok(pieces(p) === 1 && /flipped/.test(p.$("dreamCard").className) && shown(p, "dreamModel") && p.$("dreamModel").innerHTML.includes("dotrow"),
     "a miss places nothing, and her own model comes up");
  ok(!/wrong|incorrect|oops/i.test(p.$("dreamSays").innerHTML), "and nothing is said about being wrong");
  ok(p.$("dreamQ").textContent === q, "the same card waits for her");
  answer(p, true); await sleep(40);
  ok(pieces(p) === 2, "read off her model, the answer still places the piece");
  answer(p, true); await sleep(40);
  answer(p, true); await sleep(40);
  ok(pieces(p) === 4 && p.page.Save.dreams().placed === 4, "four pieces in, and the save says so");

  p.$("dreamWake").fire("click");
  ok(!shown(p, "dream") && shown(p, "den"), "'Wake Ember up' mid-dream goes back to the den");
  ok(coins(p) === before, "no coins were paid or taken");
}
{
  /* The same phone, opened again later. */
  const p = boot("#l4.1", store, null, { quick: true });
  nap(p);
  ok(shown(p, "dream") && pieces(p) === 4 && p.$("dreamPieces").textContent === "4 of 10 pieces",
     "reopened: the dream she left is waiting, four pieces in");
  const before = coins(p);
  await answerAll(p, 6);
  ok(pieces(p) === 10 && slots(p) === 0, "six more cards, and the picture is whole");
  ok(shown(p, "dreamDone") && !shown(p, "dreamCards") && /her wings are growing/i.test(p.$("dreamCaption").innerHTML),
     "Ember dreamt the first picture of the story: " + p.$("dreamCaption").innerHTML);
  ok(p.page.Save.dreams().done === 1 && p.page.Save.dreams().placed === 0, "it is in her dream book the moment it is whole");
  ok(p.$("dreamNext").textContent === "Next dream" && p.$("dreamWake").hidden, "and the next dream comes when she says, not on a timer");

  p.$("dreamNext").fire("click");
  ok(shown(p, "dream") && pieces(p) === 0 && slots(p) === 10, "the next dream is a fresh jigsaw");
  await answerAll(p, 10);
  ok(/her first hop/i.test(p.$("dreamCaption").innerHTML), "the second picture: " + p.$("dreamCaption").innerHTML);
  ok(p.$("dreamNext").textContent === "Ember is waking up", "two dreams, and the nap is coming to its end");
  p.$("dreamNext").fire("click");
  ok(shown(p, "night") && !shown(p, "dream") && /dreamt I could FLY/.test(p.$("nightSays").innerHTML) && p.$("nightSays").innerHTML.includes("Wren"),
     "Ember wakes up happy: " + p.$("nightSays").innerHTML);
  ok(p.$("nightA").textContent === "Hello, sleepyhead!" && p.$("nightB").hidden, "one way on");
  p.$("nightA").fire("click");
  ok(shown(p, "den") && !p.$("denBook").hidden, "back in the den, and the dream book is there now");
  ok(coins(p) === before, "two whole dreams paid no coins");

  p.$("denBook").fire("click");
  const book = p.$("bookGrid").innerHTML;
  ok(shown(p, "bookWrap") && (book.match(/class="book-page"/g) || []).length === 2 && (book.match(/book-page empty/g) || []).length === 5,
     "the book: two pictures she dreamt, five empty frames still to come");
  ok(/Her wings are growing/.test(book) && /Her first hop/.test(book) && !/A first glide/.test(book), "named, in the order of the story");
  p.$("bookClose").fire("click");
  ok(!shown(p, "bookWrap") && shown(p, "den"), "and closes back to the den");

  const code = p.page.Save.code();
  const q = boot("", {}, null, { quick: true });
  ok(q.page.Save.adopt(code) && q.page.Save.dreams().done === 2, "her dreams travel in her save code");
}

/* ---- the story goes round, and the book stays full ---------------------------- */

{
  const p = boot("", phone(ONE, { dreams: { done: 7, placed: 0 } }), null, { quick: true });
  ok((p.page.Dreams.bookHtml().match(/class="book-page"/g) || []).length === 7, "after seven dreams the book is full");
  nap(p);
  await answerAll(p, 10);
  ok(/her wings are growing/i.test(p.$("dreamCaption").innerHTML) && (p.page.Dreams.bookHtml().match(/class="book-page"/g) || []).length === 7,
     "the eighth dream starts the story again, and the book stays as it was");
}

/* ---- a nap that runs past 10:30 at night -------------------------------------- */

{
  const p = boot("#l4.1", phone(ONE), [22, 20], { quick: true });
  nap(p);
  ok(shown(p, "dream"), "at 10:20 pm she can still nap Ember, and Ember dreams");
  await answerAll(p, 4);
  p.page.Bedtime.setNow(() => new Date(2026, 10, 10, 22, 31));
  await answerAll(p, 6);
  ok(pieces(p) === 10 && shown(p, "dreamDone"), "10:31 pm mid-dream: nothing interrupts her, and the picture is finished");
  p.$("dreamNext").fire("click");
  ok(shown(p, "night") && !shown(p, "dream") && /tuck me in/i.test(p.$("nightSays").innerHTML) && p.$("nightB").hidden,
     "at the break between dreams the night takes over: Ember asks to be tucked in");
  ok(p.page.Save.dreams().done === 1, "and the finished dream is kept");
}

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);

})();
