/* A page, booted at one stage, for tests that walk the real game.

   The real scripts, in the order index.html loads them, in a fresh context
   each time, against a DOM just real enough. Shared by the tests that need
   more than one boot. Not a test itself. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

function makeEl(id) {
  const on = {};
  const e = {
    id: id || "", _cls: "", _html: "", textContent: "", value: "",
    hidden: false, disabled: false, style: {}, children: [], clientWidth: 360,
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

/* The game reads the clock to know whether it is Ember's bedtime. A test
   must not depend on what time it happens to be run, so each page gets a
   clock of its own: mid-afternoon unless a test says otherwise. */
function clockAt(y, mo, d, h, mi) {
  const Real = Date, fixed = new Real(y, mo - 1, d, h, mi).getTime();
  return class extends Real {
    constructor(...a) { if (a.length) super(...a); else super(fixed); }
    static now() { return fixed; }
  };
}

const HTML = read("index.html");
const ORDER = [...HTML.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1].split("?")[0]);
const SOURCE = ORDER.map(read).join("\n;\n") +
  "\n;globalThis.__page = { Save, Nest, Lessons, GRADE3, Ambience, Cards, Den, Bedtime };";

/* `store` is the phone's storage: pass the same object to a second boot and
   it is the same phone, reopened. `when` is [hour, minute] on the page's
   clock; left out, it is three in the afternoon. */
function boot(hash, store, when) {
  const byId = new Map();
  [...HTML.matchAll(/\bid="([^"]+)"/g)].forEach(m => byId.set(m[1], makeEl(m[1])));
  /* Whatever index.html marks `hidden` starts hidden, as in a browser. */
  [...HTML.matchAll(/<[a-z]+\b[^>]*\bid="([^"]+)"[^>]*>/g)]
    .forEach(m => { if (/\shidden(\s|>|=)/.test(m[0])) byId.get(m[1]).hidden = true; });
  store = store || {};
  const spoken = [];
  const ctx = {
    console: { log() {} }, setTimeout, clearTimeout,
    Date: clockAt(2026, 11, 10, when ? when[0] : 15, when ? when[1] : 0),
    requestAnimationFrame: fn => setTimeout(fn, 0),
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    TextEncoder, TextDecoder, btoa, atob,
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
  return { $, box: $("surface").children[0], spoken, store, page: ctx.__page };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const text = html => String(html).replace(/<[^>]+>/g, "");

/* What a card is asking, worked out here rather than read from the game. */
function answerOf(q) {
  const m = /^(\d+) (.) (\d+)$/.exec(q);
  const a = Number(m[1]), b = Number(m[3]);
  return { "×": a * b, "÷": a / b, "+": a + b, "−": a - b }[m[2]];
}

/* Type on the game's own number pad, the way a thumb would. */
function typeOnPad($, t) {
  const keys = $("cardPad").children;
  String(t).split("").forEach(ch => keys.find(k => k.textContent === ch).fire("click"));
  keys.find(k => k.textContent === "Tell Ember").fire("click");
}

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

module.exports = { boot, read, sleep, text, answerOf, typeOnPad, playCards };
