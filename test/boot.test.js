/* Can she actually get in the front door?

   THIS TEST EXISTS BECAUSE OF A BUG THAT SHIPPED. Three functions behind the
   start button ("Go and meet her") were called and never defined; `node --check`
   passed, because an undefined function is only an error when something calls
   it. Every screenshot taken that day used a deep link (#l1, #quest) which
   skips the door — so every path was checked except the one every player
   takes, and the game was published dead on its first screen.

   So this one boots the real scripts, in the real order index.html loads them,
   against a shimmed DOM, and then walks: tap in, give a name, land in the
   first lesson. No dependencies.

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
ok($("scene").hidden === false, "she lands in the scene");
ok($("bar").hidden === false, "the top bar appears");
ok(document.title.includes("Wren"), "the game takes its title from her name: " + JSON.stringify(document.title));

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

/* ---- the way home to Ember's den ------------------------------------------ */

ok($("denBtn").hidden === false, "the way home to Ember's den is on the lesson screen");
let denError = null;
try { $("denBtn").fire("click"); } catch (e) { denError = e; }
ok(!denError, "opening the den does not throw" + (denError ? " — " + denError : ""));
ok($("den").hidden === false && $("scene").hidden === true, "the den opens in place of the lesson");
ok($("roomItems").children.length >= 2, "Ember and her cushion are in the room (" + $("roomItems").children.length + ")");
ok($("drawer").children.length > 0, "the drawer has things in it");
ok($("purseMini").innerHTML.includes("<b>12</b>"), "she starts with a few coins to spend");

let backError = null;
try { $("denBack").fire("click"); } catch (e) { backError = e; }
ok(!backError, "leaving the den does not throw" + (backError ? " — " + backError : ""));
ok($("den").hidden === true && $("scene").hidden === false, "and the way back puts her in her lesson again");
ok($("lessonName").textContent === "The first nest", "the same lesson she left");

/* ---- "how do I get more coins?" ------------------------------------------

   The first thing she asked in the den. Two buttons answer it — the den's
   own, and Pip's when she cannot afford a thing — and both must land her in
   a lesson that PAYS, wherever she was when she asked. */

const tapShop = act => $("shop").fire("click", {
  target: { closest: () => ({ disabled: false, getAttribute: a => (a === "data-act" ? act : null) }) }
});

$("denBtn").fire("click");
ok($("denEarn").listens("click") > 0, "the den has a 'Get more coins' button");
let earnError = null;
try { $("denEarn").fire("click"); } catch (e) { earnError = e; }
ok(!earnError, "tapping 'Get more coins' does not throw" + (earnError ? " — " + earnError : ""));
ok($("den").hidden === true && $("scene").hidden === false, "it takes her out of the den into a lesson");
ok($("lessonName").textContent === "The first nest", "the first stage she has never been paid for");

/* Something she cannot afford: 12 copper against a 45-copper crown. */
$("denBtn").fire("click");
const tiles = $("drawer").children;
const crown = tiles.find(t => t.innerHTML.includes("Golden crown"));
ok(!!crown, "the golden crown is in the wardrobe");
crown.fire("click");
ok($("shopWrap").hidden === false, "tapping it opens Pip's shop");
ok($("shop").innerHTML.includes("3 silver and 3 copper"), "Pip says exactly how much more she needs (45 - 12 = 33)");
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
$("denBtn").fire("click");
$("denEarn").fire("click");
ok($("lessonName").textContent === GRADE3.lessons[2].name, "and that is where the button takes her");

/* Everything paid, quest watched: the end of the grade is not a lesson, so
   the button must not send her there. It sends her to teach it again. */
Save.den(d => { GRADE3.lessons.forEach(l => l.stages.forEach((s, k) => d.paid.push(l.id + ":" + k))); return d; });
Save.questDone();
const again = Den.nextToTeach();
ok(again.l === 0 && again.st === 0, "with everything paid, it is the first stage again, which still pays");
$("denBtn").fire("click");
$("denEarn").fire("click");
ok($("lessonName").textContent === "The first nest", "after the quest it still lands her in a lesson, not the end screen");
ok(Save.get().questDone === true, "and teaching again does not take the quest away from her");

/* ---- the name survives a reload ------------------------------------------ */

ok(JSON.parse(store["nymath.ember.v1"]).name === "Wren", "her name is remembered");
ok(!read("content/grade3.js").includes("Wren") && !read("index.html").includes("Wren"),
   "and her name is nowhere in the source");

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);
