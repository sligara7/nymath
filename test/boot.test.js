/* Can she actually get in the front door?

   THIS TEST EXISTS BECAUSE OF A BUG THAT SHIPPED. Three functions behind the
   "Go and meet him" button were called and never defined; `node --check`
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

const store = {};
global.window = { addEventListener: () => {}, innerHeight: 740 };
global.location = { hash: "" };
global.document = {
  title: "",
  getElementById: id => byId.get(id) || null,
  createElement: () => makeEl()
};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};

/* ---- boot, in the order index.html loads them ---------------------------- */

const ORDER = [...read("index.html").matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
ok(ORDER.length >= 7, "index.html loads the scripts (" + ORDER.length + " found)");

let bootError = null;
try {
  /* One scope, like a browser: each file's `const` must be visible to the next. */
  (0, eval)(ORDER.map(read).join("\n;\n"));
} catch (e) {
  bootError = e;
}
ok(!bootError, "the page boots without throwing" + (bootError ? " — " + bootError : ""));
if (bootError) { console.log("ok 0/" + checks + " — boot failed"); process.exit(1); }

const $ = id => byId.get(id);

/* ---- the door ------------------------------------------------------------ */

ok($("startBtn").listens("click") > 0, "the start button has a click handler at all");
ok($("doorArt").innerHTML.includes("<svg"), "Ember is drawn on the door");

/* THE BUG: this threw ReferenceError and the button did nothing. */
let clickError = null;
try { $("startBtn").fire("click"); } catch (e) { clickError = e; }
ok(!clickError, "tapping 'Go and meet him' does not throw" + (clickError ? " — " + clickError : ""));

ok($("door").hidden === true, "the door closes behind her");
ok($("naming").hidden === false, "he asks who she is");
ok($("namingArt").innerHTML.includes("<svg"), "Ember is drawn on the naming screen");

/* ---- she gives her name -------------------------------------------------- */

ok($("nameBtn").listens("click") > 0, "the name button has a click handler");

$("nameInput").value = "";
$("nameBtn").fire("click");
ok($("naming").hidden === false, "an empty name does not let her through");

$("nameInput").value = "Ronie";
let nameError = null;
try { $("nameBtn").fire("click"); } catch (e) { nameError = e; }
ok(!nameError, "telling him her name does not throw" + (nameError ? " — " + nameError : ""));

ok($("naming").hidden === true, "the naming screen closes");
ok($("scene").hidden === false, "she lands in the scene");
ok($("bar").hidden === false, "the top bar appears");
ok(document.title.includes("Ronie"), "the game takes its title from her name: " + JSON.stringify(document.title));

/* ---- and she is in the first lesson -------------------------------------- */

ok($("lessonName").textContent === "The first nest", "lesson one is loaded: " + JSON.stringify($("lessonName").textContent));
ok($("task").textContent.length > 10, "she has been given something to do");
ok($("emberSays").innerHTML.includes("nest"), "Ember has said his piece");
/* The cells live inside the nest box, which is the surface's only child. */
const nestBox = $("surface").children[0];
ok(!!nestBox && nestBox.children.length === 30,
   "the 5x6 lattice is on screen (" + (nestBox ? nestBox.children.length : 0) + " cells)");
ok(nestBox && nestBox.children.filter(c => c.className.includes("his")).length === 12,
   "twelve of them are Ember's own ragged stones");
ok($("readout").innerHTML.includes("not the same yet"), "the readout names his ragged rows");

/* ---- the name survives a reload ------------------------------------------ */

ok(JSON.parse(store["nymath.ember.v1"]).name === "Ronie", "her name is remembered");
ok(!read("content/grade3.js").includes("Ronie") && !read("index.html").includes("Ronie"),
   "and her name is nowhere in the source");

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);
