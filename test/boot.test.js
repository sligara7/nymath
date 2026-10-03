/* Can she actually get in the front door — and through her first lesson?

   THIS TEST EXISTS BECAUSE OF A BUG THAT SHIPPED. Three functions behind the
   start button ("Go and meet her") were called and never defined; `node --check`
   passed, because an undefined function is only an error when something calls
   it. Every screenshot taken that day used a deep link (#l1, #quest) which
   skips the door — so every path was checked except the one every player
   takes, and the game was published dead on its first screen.

   So this one boots the real scripts, in the real order index.html loads them,
   against a shimmed DOM, and then walks: tap in, give a name, land in the
   first lesson, ask for clues, solve it, and go home to the den. No
   dependencies.

   Run: node test/boot.test.js */

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };

/* ---- a DOM just real enough --------------------------------------------- */

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
    /* What a finger does. */
    fire(t, ev) { (on[t] || []).forEach(fn => fn(ev || { preventDefault() {} })); return (on[t] || []).length; },
    listens: t => (on[t] || []).length
  };
  return e;
}

const byId = new Map();
/* Every id the real page declares, so a typo in index.html shows up here as a
   missing element rather than as silence in a browser. */
const IDS = [...read("index.html").matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
IDS.forEach(id => byId.set(id, makeEl(id)));

/* The build number index.html declares, so the boot log can be checked. */
const BUILD = (read("index.html").match(/<meta name="build" content="(\d+)">/) || [])[1] || "";

const store = {};
global.window = { addEventListener: () => {}, innerHeight: 740 };
global.location = { hash: "" };
global.document = {
  title: "",
  getElementById: id => byId.get(id) || null,
  querySelector: sel => (sel === 'meta[name="build"]' ? { content: BUILD } : null),
  createElement: () => makeEl()
};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};

/* ---- boot, in the order index.html loads them ---------------------------- */

const SRCS = [...read("index.html").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
ok(SRCS.length >= 7, "index.html loads the scripts (" + SRCS.length + " found)");

/* Every asset must carry a ?v= stamp. GitHub Pages sets its own cache headers
   and we cannot change them, so the URL is the only thing that can tell a
   browser the file moved — and a stale main.js is how this game shipped dead
   on its first screen once already. */
const ASSETS = [...read("index.html").matchAll(/(?:src|href)="((?:js|css|content)\/[^"]+)"/g)].map(m => m[1]);
ok(ASSETS.length > 0 && ASSETS.every(a => /\?v=\d+/.test(a)),
   "every local asset is cache-busted (" + ASSETS.filter(a => !/\?v=/.test(a)).join(", ") + ")");
const VERSIONS = new Set(ASSETS.map(a => a.split("?v=")[1]));
ok(VERSIONS.size === 1, "they all carry the SAME build number (" + [...VERSIONS].join(", ") + ")");

/* Strip the stamp to read them off disk. */
const ORDER = SRCS.map(f => f.split("?")[0]);

let bootError = null;
try {
  /* One scope, like a browser: each file's `const` must be visible to the next. */
  (0, eval)(ORDER.map(read).join("\n;\n") +
    /* ...and hand back what the coin checks below need to reach. */
    "\n;globalThis.__page = { Save, Den, GRADE3 };");
} catch (e) {
  bootError = e;
}
ok(!bootError, "the page boots without throwing" + (bootError ? " — " + bootError : ""));
if (bootError) { console.log("ok 0/" + checks + " — boot failed"); process.exit(1); }

const $ = id => byId.get(id);
const { Save, Den, GRADE3 } = globalThis.__page;

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {

/* ---- the door ------------------------------------------------------------ */

ok($("startBtn").listens("click") > 0, "the start button has a click handler at all");
ok($("doorArt").innerHTML.includes("<svg"), "Ember is drawn on the door");

/* THE BUG: this threw ReferenceError and the button did nothing. */
let clickError = null;
try { $("startBtn").fire("click"); } catch (e) { clickError = e; }
ok(!clickError, "tapping 'Go and meet her' does not throw" + (clickError ? " — " + clickError : ""));

ok($("door").hidden === true, "the door closes behind her");
ok($("naming").hidden === false, "Ember asks who she is");
ok($("namingArt").innerHTML.includes("<svg"), "Ember is drawn on the naming screen");

/* ---- she gives her name -------------------------------------------------- */

ok($("nameBtn").listens("click") > 0, "the name button has a click handler");

$("nameInput").value = "";
$("nameBtn").fire("click");
ok($("naming").hidden === false, "an empty name does not let her through");

$("nameInput").value = "Wren";
let nameError = null;
try { $("nameBtn").fire("click"); } catch (e) { nameError = e; }
ok(!nameError, "telling Ember her name does not throw" + (nameError ? " — " + nameError : ""));

ok($("naming").hidden === true, "the naming screen closes");
ok(document.title.includes("Wren"), "the game takes its title from her name: " + JSON.stringify(document.title));

/* ---- every session starts with teaching ---------------------------------

   The den is the celebration AFTER a lesson (short sessions; decorating at
   the end), so the door leads straight into her next lesson, and the house
   button is not there in the middle of one. */

ok(Save.den() === null, "she does not land in the den (it has not even been opened yet)");
ok($("scene").hidden === false && $("bar").hidden === false, "she lands in her lesson");
ok($("door").hidden === true, "the door is gone");
ok($("denBtn").hidden === true, "no way to the den from the middle of a lesson");

/* ---- and she is in the first lesson -------------------------------------- */

ok($("lessonName").textContent === "The first nest", "lesson one is loaded: " + JSON.stringify($("lessonName").textContent));
ok($("task").textContent.length > 10, "she has been given something to do");
ok($("emberSays").innerHTML.includes("nest"), "Ember has said her piece");
/* The cells live inside the nest box, which is the surface's only child. */
const nestBox = $("surface").children[0];
ok(!!nestBox && nestBox.children.length === 30,
   "the 5x6 lattice is on screen (" + (nestBox ? nestBox.children.length : 0) + " cells)");
ok(nestBox && nestBox.children.filter(c => c.className.includes("his")).length === 12,
   "twelve of them are Ember's own ragged stones");
ok($("readout").innerHTML.includes("not the same yet"), "the readout names her ragged rows");

/* ---- "Want a clue?" ------------------------------------------------------ */

const KEY1 = "g3-ragged-nest:0";
ok($("clueBtn").hidden === false && $("clueText").hidden === true, "a clue is offered, and none is shown until she asks");
$("clueBtn").fire("click");
ok($("clueText").hidden === false && $("clueText").innerHTML.length > 10, "the first clue is words: " + $("clueText").innerHTML);
ok(nestBox.children.filter(c => c.className.includes("glow")).length === 0, "and lights nothing up");
$("clueBtn").fire("click");
ok(nestBox.children.filter(c => c.className.includes("glow")).length === 2,
   "the second is a picture: the two empty hollows of the row to match glow");
ok($("clueBtn").textContent === "Another clue?", "the button offers one more");
$("clearBtn").fire("click");
ok(Save.struggleOf(KEY1)[0].clues === 2 && Save.struggleOf(KEY1)[0].restarts === 1,
   "two clues and one restart are written down quietly");

/* She solves it: two stray stones out, two into the gap — 3 rows of 4. */
[[2, 4], [3, 0], [1, 2], [1, 3]].forEach(([r, c]) => nestBox.children[r * 6 + c].fire("pointerdown"));
ok($("readout").innerHTML.includes("3</b> rows of <b>4"), "her nest reads 3 rows of 4");
ok($("clueBtn").hidden === true, "the clue button goes once it is solved");
await sleep(700);
ok($("revealWrap").hidden === false, "the reveal arrives");
ok(Save.struggleOf(KEY1)[0].solved && Save.struggleOf(KEY1)[0].level === "moderate",
   "solved after two clues is a moderate struggle: " + JSON.stringify(Save.struggleOf(KEY1)[0]));

/* ---- the den, as the celebration after a lesson -------------------------- */

ok($("revealNext").textContent === "Next lesson", "the reveal offers the next lesson");
ok($("revealDen").hidden === false, "and, at the end of a lesson, a visit to the den");
let denError = null;
try { $("revealDen").fire("click"); } catch (e) { denError = e; }
ok(!denError, "opening the den does not throw" + (denError ? " — " + denError : ""));
ok($("den").hidden === false && $("scene").hidden === true, "the den opens in place of the lesson");
ok($("keepTip").hidden === true, "no iPhone tip off an iPhone");
ok($("roomItems").children.length >= 2, "Ember and her cushion are in the room (" + $("roomItems").children.length + ")");
ok($("drawer").children.length > 0, "the drawer has things in it");
ok($("purseMini").innerHTML.includes("<b>15</b>"), "her coins: 12 to start, plus 2 silver 3 copper for teaching");

let backError = null;
try { $("denBack").fire("click"); } catch (e) { backError = e; }
ok(!backError, "leaving the den does not throw" + (backError ? " — " + backError : ""));
ok($("den").hidden === true && $("scene").hidden === false, "and the way back puts her in her lessons again");
ok($("lessonName").textContent === "The fast count", "at the NEXT lesson — her place moved on before the den");

/* ---- when three clues are not enough -------------------------------------- */

const KEY2 = "g3-fast-count:0";
$("clueBtn").fire("click"); $("clueBtn").fire("click"); $("clueBtn").fire("click");
const box2 = $("surface").children[0];
ok(box2.children.filter(c => c.className.includes("glow")).length === 20, "the third clue is the worked example: the whole 4 x 5 glows");
ok($("clueBtn").textContent === "Still stuck?", "after three, the button asks if she is still stuck");
$("clueBtn").fire("click");
ok($("stopWrap").hidden === false, "Ember stops, kindly");
ok(/tomorrow/.test($("stopSays").innerHTML) && $("stopSays").innerHTML.includes("Wren"), "and says they'll come back to it tomorrow");
ok(Save.struggleOf(KEY2)[0].level === "severe" && Save.isParked(KEY2), "it is a severe struggle, set aside until another day");
ok($("stopReview").hidden === false, "she is offered one she already knows");
$("stopReview").fire("click");
ok($("stopWrap").hidden === true && $("lessonName").textContent === "The first nest", "and it takes her there");
/* Anything that leads back to the hard one today meets the same kind stop. */
$("denBtn").fire("click");    /* the same path the reveal's den button takes */
$("denEarn").fire("click");
ok($("stopWrap").hidden === false, "today, the way back to the hard one is the kind stop again");
$("stopDen").fire("click");
ok($("den").hidden === false && $("stopWrap").hidden === true, "or she can go home to the den");
Save.get().parked = null;   /* tomorrow, for the checks below */

/* ---- "how do I get more coins?" ------------------------------------------

   The first thing she asked in the den. Two buttons answer it — the den's
   own, and Pip's when she cannot afford a thing — and both must land her in
   a lesson that PAYS, wherever she was when she asked. */

/* The house button is only shown at the end of the grade now, but its path
   (openDen) is the same one the reveal uses, so the checks below open the
   den through it. */
const openDen = () => $("denBtn").fire("click");

const tapShop = act => $("shop").fire("click", {
  target: { closest: () => ({ disabled: false, getAttribute: a => (a === "data-act" ? act : null) }) }
});

openDen();
ok($("denEarn").listens("click") > 0, "the den has a 'Get more coins' button");
let earnError = null;
try { $("denEarn").fire("click"); } catch (e) { earnError = e; }
ok(!earnError, "tapping 'Get more coins' does not throw" + (earnError ? " — " + earnError : ""));
ok($("den").hidden === true && $("scene").hidden === false, "it takes her out of the den into a lesson");
ok($("lessonName").textContent === "The fast count", "the first stage she has never been paid for (lesson one is paid)");

/* Something she cannot afford: 35 copper's worth against a 45-copper crown. */
openDen();
const tiles = $("drawer").children;
const crown = tiles.find(t => t.innerHTML.includes("Golden crown"));
ok(!!crown, "the golden crown is in the wardrobe");
crown.fire("click");
ok($("shopWrap").hidden === false, "tapping it opens Pip's shop");
ok($("shop").innerHTML.includes("needs 1 silver more"), "Pip says exactly how much more she needs (45 - 35 = 10)");
ok($("shop").innerHTML.includes("Teach Ember to earn more"), "and offers the way to earn it");
let teachError = null;
try { tapShop("teach"); } catch (e) { teachError = e; }
ok(!teachError, "tapping it does not throw" + (teachError ? " — " + teachError : ""));
ok($("shopWrap").hidden === true && $("den").hidden === true && $("scene").hidden === false,
   "the shop and the den close, and she is in a lesson");

/* Both buttons ask the same question, so they cannot disagree. Pay for the
   first two lessons and the answer moves on to the third. */
Save.den(d => { GRADE3.lessons.slice(0, 2).forEach(l => l.stages.forEach((s, k) => d.paid.push(l.id + ":" + k))); return d; });
const at = Den.nextToTeach();
ok(at.l === 2 && at.st === 0, "with lessons one and two paid, the next that pays is lesson three, stage one");
openDen();
$("denEarn").fire("click");
ok($("lessonName").textContent === GRADE3.lessons[2].name, "and that is where the button takes her");

/* Everything paid, quest watched: the end of the grade is not a lesson, so
   the button must not send her there. It sends her to teach it again. */
Save.den(d => { GRADE3.lessons.forEach(l => l.stages.forEach((s, k) => d.paid.push(l.id + ":" + k))); return d; });
Save.questDone();
const again = Den.nextToTeach();
ok(again.l === 0 && again.st === 0, "with everything paid, it is the first stage again, which still pays");
openDen();
$("denEarn").fire("click");
ok($("lessonName").textContent === "The first nest", "after the quest it still lands her in a lesson, not the end screen");
ok(Save.get().questDone === true, "and teaching again does not take the quest away from her");

/* ---- a save code carries her whole save, and never overwrites one ----------

   How her progress crosses into an iPhone home-screen app, whose storage
   starts empty. A code must come back exactly, must be refused by a phone
   that already has progress, and must not let anything malformed in. */

const code = Save.code();
ok(/^1\.[A-Za-z0-9_-]+$/.test(code), "a save code is versioned and URL-safe: " + code.slice(0, 16) + "...");
ok(Save.adopt(code) === false, "a phone with progress on it refuses a code");
ok(Save.isBlank() === false, "and this one does have progress");

const evalSave = () => (0, eval)(read("js/save.js") + ";Save");
const keep = store["nymath.ember.v1"];
delete store["nymath.ember.v1"];
const fresh = evalSave();
ok(fresh.isBlank(), "a fresh phone starts blank");
ok(fresh.adopt("not a code") === false && fresh.adopt("9." + code.slice(2)) === false,
   "garbage and unknown versions are refused");
ok(fresh.adopt(code) === true, "a blank phone takes the code in");
ok(fresh.get().name === "Wren" && JSON.stringify(fresh.get()) === JSON.stringify(Save.get()),
   "and gets back exactly the save that made it");
ok(JSON.parse(store["nymath.ember.v1"]).name === "Wren", "and keeps it");

const named = (n) => {
  const t = JSON.parse(JSON.stringify(Save.get())); t.name = n;
  const b = Buffer.from(JSON.stringify(t)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return "1." + b;
};
delete store["nymath.ember.v1"];
const fresh2 = evalSave();
ok(fresh2.adopt(named("<img src=x onerror=alert(1)>")) === true &&
   !/[<>=()]/.test(fresh2.get().name), "a name arriving in a code is cleaned like a typed one: " + JSON.stringify(fresh2.get().name));
const fresh3 = (delete store["nymath.ember.v1"], evalSave());
ok(fresh3.adopt(named("Zoë")) === true && fresh3.get().name === "Zoë", "and a name with an accent survives the trip");
store["nymath.ember.v1"] = keep;

/* ---- the name survives a reload ------------------------------------------ */

ok(JSON.parse(store["nymath.ember.v1"]).name === "Wren", "her name is remembered");
ok(!read("content/grade3.js").includes("Wren") && !read("index.html").includes("Wren"),
   "and her name is nowhere in the source");

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);

})();
