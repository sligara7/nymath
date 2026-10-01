/* Does the den's money add up, and is everything in the shop sound?

   The hoard is place value, so its arithmetic is checked exhaustively rather
   than by example: every amount a price can be, every break and every swap.
   Then the catalogue — every item drawable, priced and reachable — and the
   rules the owner chose: only teaching pays, and practising never costs her
   what she bought.

   Run: node test/den.test.js       (no dependencies, no build) */

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };

/* Files declare with const, which eval scopes away — so hand each one back. */
const Hoard  = (0, eval)(read("js/hoard.js") + ";Hoard");
const DEN    = (0, eval)(read("content/den.js") + ";DEN");
const GRADE3 = (0, eval)(read("content/grade3.js") + ";GRADE3");

/* ---- the hoard is place value ------------------------------------------- */

let roundTrip = true, fewest = true;
for (let n = 0; n <= 999; n++) {
  const c = Hoard.coins(n);
  if (Hoard.value(c) !== n) roundTrip = false;
  if (c.silver > 9 || c.copper > 9) fewest = false;
}
ok(roundTrip, "every amount 0-999 turns into coins and back unchanged");
ok(fewest, "and always in the fewest coins (never ten of one kind)");

ok(Hoard.value({ gold: 1, silver: 2, copper: 3 }) === 123, "1 gold 2 silver 3 copper is worth 123 copper");

const p = { gold: 1, silver: 0, copper: 4 };
const b1 = Hoard.breakOne(p, "gold");
ok(b1 && b1.gold === 0 && b1.silver === 10 && Hoard.value(b1) === Hoard.value(p), "breaking a gold gives ten silver and loses nothing");
const b2 = Hoard.breakOne(b1, "silver");
ok(b2 && b2.silver === 9 && b2.copper === 14 && Hoard.value(b2) === Hoard.value(p), "breaking a silver gives ten copper and loses nothing");
ok(Hoard.breakOne(p, "copper") === null, "a copper cannot be broken — it is the smallest coin");
ok(Hoard.breakOne({ gold: 0, silver: 0, copper: 5 }, "silver") === null, "you cannot break a silver you do not have");
const m1 = Hoard.makeOne(b2, "copper");
ok(m1 && m1.silver === 10 && m1.copper === 4 && Hoard.value(m1) === Hoard.value(p), "ten copper make a silver, nothing lost");
ok(Hoard.makeOne({ gold: 0, silver: 0, copper: 9 }, "copper") === null, "nine copper do not make a silver");
ok(Hoard.makeOne(p, "gold") === null, "there is nothing bigger than gold to make");
ok(p.gold === 1 && p.copper === 4, "breaking and swapping never change the purse they were given");

ok(Hoard.judge({ silver: 1, copper: 8 }, 18) === "exact", "1 silver 8 copper is exactly 18");
ok(Hoard.judge({ copper: 18 }, 18) === "exact", "so is 18 copper — value, not coin count, is what Pip checks");
ok(Hoard.judge({ silver: 2 }, 18) === "over", "2 silver for 18 is too much (Pip has no change)");
ok(Hoard.judge({ silver: 1, copper: 7 }, 18) === "short", "1 silver 7 copper for 18 is not enough");

ok(Hoard.words({ gold: 0, silver: 1, copper: 8 }) === "1 silver and 8 copper", "prices are said the way she would say them");
ok(Hoard.words({ gold: 2, silver: 0, copper: 5 }) === "2 gold and 5 copper", "a missing coin is skipped, not said as zero");
ok(Hoard.words({ gold: 1, silver: 2, copper: 3 }) === "1 gold, 2 silver and 3 copper", "three kinds read as a list");

/* Whatever coins she holds, if they are worth enough she can always make the
   exact price — by breaking down. So "too poor" is the ONLY way to be stuck. */
function canPayExactly(purse, price) {
  let q = Hoard.purse(purse);
  while (q.gold) q = Hoard.breakOne(q, "gold");
  while (q.silver) q = Hoard.breakOne(q, "silver");
  return q.copper >= price;
}
let alwaysPayable = true;
for (let i = 0; i < 2000; i++) {
  const purse = { gold: (Math.random() * 3) | 0, silver: (Math.random() * 12) | 0, copper: (Math.random() * 25) | 0 };
  const price = 1 + ((Math.random() * 80) | 0);
  if ((Hoard.value(purse) >= price) !== canPayExactly(purse, price)) alwaysPayable = false;
}
ok(alwaysPayable, "any purse worth the price can make it exactly, by breaking coins");

/* ---- the catalogue ------------------------------------------------------- */

const ids = DEN.items.map(it => it.id);
ok(new Set(ids).size === ids.length, "every item has its own id");
ok(DEN.items.every(it => ["wear", "room", "food"].includes(it.tab)), "every item sits in one of the three drawer tabs");
ok(DEN.items.every(it => Number.isInteger(it.price) && it.price > 0 && it.price < 100), "every price is a whole number of copper under a gold");
ok(DEN.items.every(it => typeof it.art === "string" && it.art.includes("<") && !/<script|on\w+=/i.test(it.art)),
   "every item has a drawing, and no drawing carries script");
ok(DEN.items.filter(it => it.tab === "wear").every(it => ["head", "face", "neck"].includes(it.slot) && /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/.test(it.box)),
   "every wearable says where on Ember it goes, and how to crop its icon");
ok(DEN.items.filter(it => it.tab !== "wear").every(it => /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/.test(it.view)), "every room thing and food has a view box");
ok(DEN.items.filter(it => it.tab === "room" && it.kind !== "wall").every(it => it.w > 0 && it.w <= 0.7), "every room thing says how wide it stands");
ok(DEN.items.filter(it => it.tab === "food").every(it => typeof it.line === "string" && it.line.length > 3), "Ember has something to say about every food");
ok(["head", "face", "neck"].every(s => DEN.items.some(it => it.slot === s)), "there is something to wear in every slot");
ok(DEN.start.owned.every(id => ids.includes(id)), "what she starts with is in the catalogue");
ok(Object.keys(DEN.start.placed).every(id => DEN.start.owned.includes(id)), "what starts in the room is something she owns");
ok(ids.includes(DEN.start.wall) && DEN.start.owned.includes(DEN.start.wall), "the starting wall is one she owns");

/* ---- what teaching pays -------------------------------------------------- */

const starter = Hoard.value(DEN.pays.starter);
const first = Hoard.value(DEN.pays.firstTime);
const again = Hoard.value(DEN.pays.again);
const stages = GRADE3.lessons.reduce((n, l) => n + l.stages.length, 0);
const cheapest = Math.min(...DEN.items.map(it => it.price));
const forSale = DEN.items.filter(it => !DEN.start.owned.includes(it.id) && it.tab !== "food");
const everything = forSale.reduce((n, it) => n + it.price, 0);

ok(starter >= cheapest, "on day one she can already buy something (" + starter + " ≥ " + cheapest + ")");
ok(first > again && again > 0, "teaching a stage pays more the first time, and still pays after");
ok(starter + stages * first < everything, "Grade 3 alone does not buy the whole shop — there is always a next thing to teach for (" +
   (starter + stages * first) + " < " + everything + ")");
ok(starter + stages * first >= 4 * cheapest, "but Grade 3 buys a real handful of things");
ok(!/quest/i.test(JSON.stringify(Object.keys(DEN.pays))), "nothing pays for watching the quest");

/* ---- the save: practising never costs her what she bought --------------- */

const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
const Save = (0, eval)(read("js/save.js") + ";Save");
Save.setName("Testy");
Save.den(() => ({ coins: { silver: 3, copper: 4 }, owned: ["cushion", "crown"], placed: { cushion: [20, 90] }, outfit: { head: "crown" }, pantry: { fish: 2 }, paid: ["g3-ragged-nest:0"], wall: "wall-pink" }));
Save.at(4, 1); Save.taught("g3-ragged-nest"); Save.questDone();
Save.reset();
const after = Save.get();
ok(after.lesson === 0 && after.stage === 0 && after.learned.length === 0 && !after.questDone, "teach-it-again starts the lessons over");
ok(after.name === "Testy", "but keeps her name");
const d = Save.den();
ok(d && d.coins.silver === 3 && d.coins.copper === 4, "and keeps her coins");
ok(d.owned.includes("crown") && d.outfit.head === "crown" && d.pantry.fish === 2 && d.placed.cushion, "and everything she bought, wore, stored and placed");
ok(d.paid.includes("g3-ragged-nest:0"), "and remembers which stages already paid the first-time rate");

/* A save from before the den existed reads cleanly, with no den yet. */
store["nymath.ember.v1"] = JSON.stringify({ lesson: 2, stage: 0, learned: ["a", "b"], name: "Old", muted: false, questDone: false });
const Save2 = (0, eval)(read("js/save.js") + ";Save");
ok(Save2.den() === null, "an old save has no den until it is opened — so it can be credited once");
ok(Save2.get().name === "Old", "and loses nothing it had");

/* ---- Ember wears it ------------------------------------------------------ */

global.document = { getElementById: () => null };
const Ember = (0, eval)(read("js/ember.js") + ";Ember");
const crown = DEN.items.find(it => it.id === "crown");
const host1 = {}, host2 = {};
Ember.dress({ head: crown.art });
Ember.draw(host1, "curious");
Ember.draw(host2, "curious");
ok(host1.innerHTML.includes(crown.art), "a crown bought in the den is on Ember wherever she is drawn");
const gid = h => (h.innerHTML.match(/id="([^"]+hide)"/) || [])[1];
ok(gid(host1) && gid(host1) !== gid(host2), "two drawings of her never share a gradient id");
Ember.dress({});
const host3 = {}; Ember.draw(host3, "curious");
ok(!host3.innerHTML.includes(crown.art), "and taking it off takes it off");

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);
