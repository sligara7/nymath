/* Does her save survive the move to an iPhone home screen?

   An iPhone home-screen app gets storage of its own, empty. js/keep.js
   carries her save across in the address (#save=...). This walks the phones
   it has to work on — iPhone Safari, the home-screen app, an iPad that says
   it is a Mac, and a phone that is not an iPhone at all — by booting the real
   save.js and keep.js fresh for each, the way a page load would.

   What it cannot check is the one step only an iPhone can: that Share > Add
   to Home Screen keeps the # part of the address. That is checked on her
   phone.

   Run: node test/keep.test.js       (no dependencies, no build) */

const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_AS_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";

/* One phone, one page load. `store` is that phone's storage for this site. */
function load({ ua, platform = "", touch = 0, standalone = false, hash = "", store = {} }) {
  const els = {};
  const el = id => (els[id] = els[id] || {
    hidden: true, on: {},
    addEventListener(t, fn) { (this.on[t] = this.on[t] || []).push(fn); },
    tap() { (this.on.click || []).forEach(fn => fn()); }
  });
  const page = { hash, store, el };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { userAgent: ua, platform, maxTouchPoints: touch, standalone }
  });
  global.matchMedia = () => ({ matches: standalone });
  global.location = { pathname: "/nymath/", search: "", get hash() { return page.hash; } };
  global.history = { replaceState: (s, t, url) => { const i = url.indexOf("#"); page.hash = i < 0 ? "" : url.slice(i); } };
  global.document = { getElementById: el };
  global.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  const got = (0, eval)(read("js/save.js") + "\n;" + read("js/keep.js") + "\n;({ Save, Keep })");
  page.Save = got.Save;
  page.Keep = got.Keep;
  return page;
}

/* ---- in Safari on her iPhone ---------------------------------------------- */

const phone = {};
let p = load({ ua: IPHONE, store: phone });
p.Save.setName("Wren");
p.Save.at(2, 1);
ok(p.Keep.carrying, "an iPhone in Safari carries her save");
ok(/^#save=1\./.test(p.hash), "the address holds her save after any write: " + p.hash.slice(0, 16) + "...");
const afterLesson = p.hash;
p.Save.taught("first-nest");
ok(p.hash !== afterLesson, "and keeps up with the latest of it");

p.Keep.offer();
ok(p.el("keepTip").hidden === false, "the den shows her the tip");
p.el("keepTipOk").tap();
ok(p.el("keepTip").hidden === true, "'Got it' puts it away");
const carried = p.hash.slice("#save=".length);

p = load({ ua: IPHONE, store: phone });
p.Keep.offer();
ok(p.el("keepTip").hidden === true, "and it stays away next time");
ok(p.hash.startsWith("#save="), "but the address still carries her save, so a grown-up can add it later");

/* ---- the home-screen app, first open -------------------------------------- */

const app = {};
p = load({ ua: IPHONE, standalone: true, hash: "#save=" + carried, store: app });
ok(p.Save.get().name === "Wren" && p.Save.get().lesson === 2 && p.Save.get().learned.includes("first-nest"),
   "the home-screen app opens holding her save");
ok(p.hash === "", "and tidies the address once it has it");
ok(p.Save.started(), "so its door says 'Back to Ember', not 'Go and meet her'");
ok(!p.Keep.carrying, "an installed app does not carry anything");
p.Keep.offer();
ok(p.el("keepTip").hidden === true, "and never shows the tip — she already did it");
p.Save.at(3, 0);
ok(p.hash === "", "writes in the app leave the address alone");

p = load({ ua: IPHONE, standalone: true, store: app });
ok(p.Save.get().lesson === 3, "next open, the app has its own save and keeps it");

/* An old code must never overwrite what she has done since. */
p = load({ ua: IPHONE, standalone: true, hash: "#save=" + carried, store: app });
ok(p.Save.get().lesson === 3, "a code arriving at an app with progress is refused");

/* ---- an iPad, which says it is a Mac -------------------------------------- */

p = load({ ua: IPAD_AS_MAC, platform: "MacIntel", touch: 5, store: {} });
ok(p.Keep.carrying, "an iPad is treated as the iPhone it behaves like");

p = load({ ua: IPAD_AS_MAC, platform: "MacIntel", touch: 0, store: {} });
ok(!p.Keep.carrying, "a real Mac is not");

/* ---- not an iPhone -------------------------------------------------------- */

p = load({ ua: ANDROID, store: {} });
p.Save.setName("Wren");
p.Keep.offer();
ok(!p.Keep.carrying && p.hash === "", "anywhere else the address is left alone");
ok(p.el("keepTip").hidden === true, "and there is no tip");

console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
process.exit(fails ? 1 : 0);
