/* Does "Tell Ember" stay on her phone's screen?

   THIS TEST EXISTS BECAUSE OF THE FIRST PHONE-SIZE WALK OF INCREMENT 2
   (2026-11-24). After a miss, her model flips in above the number pad, and on
   an iPhone 13-size Safari screen (390 x 664) the "Tell Ember" key sat below
   the bottom edge: she would have had to scroll to answer, at exactly the
   moment she had just got one wrong. On an SE-size screen it was partly off
   before any miss at all. Two comments in the code said the pad stays on
   screen beside a model; every other test here runs on a stub page with no
   layout, so nothing could see that it did not.

   This one lays the REAL page out in a real browser engine, at the size of
   Safari's screen on each phone with its bars showing. That is Chromium, not
   Safari, and not her phone: fonts differ a little, so it keeps some room in
   hand rather than passing by a pixel. It plays a lesson to its cards with
   an earlier card due (one per model shape: a tall array, a split array, a
   fence), misses every card once, and after each new card and each miss
   checks that every key is on screen, thumb-sized, and that the question has
   not slid up under the bar.

   It walks Ember's dreams too (js/dreams.js): the jigsaw, a card and the
   pad, as a dream opens and after a miss.

   Needs a browser, so it is not one of the no-dependency tests. Once:
       npx -y playwright-core@1.60.0 install chromium
   then:
       node test/fit.browser.js */

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const root = path.join(__dirname, "..");

function playwright() {
  for (const name of ["playwright-core", "playwright"]) { try { return require(name); } catch (e) {} }
  /* Where `npx playwright-core ...` leaves it. */
  const npx = path.join(os.homedir(), ".npm", "_npx");
  try {
    for (const d of fs.readdirSync(npx)) {
      const p = path.join(npx, d, "node_modules", "playwright-core");
      if (fs.existsSync(p)) return require(p);
    }
  } catch (e) {}
  console.log("needs a browser: run  npx -y playwright-core@1.60.0 install chromium  once, then this again.");
  process.exit(2);
}

let fails = 0, checks = 0;
const ok = (cond, what) => { checks++; if (!cond) { fails++; console.log("  FAIL  " + what); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Safari's visible area on each phone, bars showing — the smallest it gets. */
const PHONES = [
  { name: "iPhone SE (2nd/3rd gen)", width: 375, height: 548 },
  { name: "iPhone 13 mini", width: 375, height: 629 },
  { name: "iPhone 13 / 14", width: 390, height: 664 },
  { name: "iPhone 15 / 15 Pro", width: 393, height: 659 },
  { name: "iPhone 15 Pro Max", width: 430, height: 739 }
];

/* An earlier card that is due, for each shape her model can take. */
const DUE = { box: 0, due: "2026-01-01", seen: "2026-01-01", asked: 0 };
const SHAPES = {
  "a tall array (8 rows of 3)": ["x:3:8", Object.assign({ op: "x", a: 8, b: 3, lesson: "g3-turn-it", model: { kind: "array", rows: 8, cols: 3 } }, DUE)],
  "a split array (30 + 12)": ["+:12:30", Object.assign({ op: "+", a: 30, b: 12, lesson: "g3-break-it-apart", model: { kind: "split", rows: 6, colsA: 5, colsB: 2 } }, DUE)],
  "a fence (5 + 2)": ["+:2:5", Object.assign({ op: "+", a: 5, b: 2, lesson: "g3-the-rim", model: { kind: "bar", a: 5, b: 2 } }, DUE)]
};

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

function answerOf(q) {
  const m = /^(\d+) (.) (\d+)$/.exec(q.trim());
  const a = Number(m[1]), b = Number(m[3]);
  return { "×": a * b, "÷": a / b, "+": a + b, "−": a - b }[m[2]];
}

(async () => {
  const pw = playwright();
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await pw.chromium.launch();

  for (const phone of PHONES) for (const shape of Object.keys(SHAPES)) {
    const [id, fact] = SHAPES[shape];
    const ctx = await browser.newContext({ viewport: { width: phone.width, height: phone.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const save = { name: "Sam", lesson: 1, stage: 0, learned: ["g3-ragged-nest"], cards: { best: 0, facts: { [id]: fact } } };
    await ctx.addInitScript(s => { if (!localStorage.getItem("nymath.ember.v1")) localStorage.setItem("nymath.ember.v1", s); }, JSON.stringify(save));
    const page = await ctx.newPage();
    const where = phone.name + ", " + shape;
    await page.goto(url);
    await page.locator("#startBtn").tap();
    await page.waitForSelector("#scene:not([hidden])");

    /* Lesson 2: 4 rows of 5, then its sentence, then the cards. */
    const tap = i => page.evaluate(i => document.querySelectorAll("#surface .cell")[i]
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true })), i);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) await tap(r * 6 + c);
    await sleep(900);
    for (let r = 0; r < 4; r++) await tap(r * 6);
    await page.waitForSelector("#cards:not([hidden])", { timeout: 6000 });
    await sleep(300);

    const fit = async moment => {
      await sleep(700);                     /* let any scroll settle */
      const f = await page.evaluate(() => {
        const keys = [...document.querySelectorAll("#cardPad .key")].map(k => k.getBoundingClientRect());
        return {
          vh: innerHeight,
          padBottom: Math.max(...keys.map(k => k.bottom)),
          minKey: Math.min(...keys.map(k => k.height)),
          cardTop: document.getElementById("card").getBoundingClientRect().top,
          barBottom: document.getElementById("bar").getBoundingClientRect().bottom,
          sideways: document.documentElement.scrollWidth > innerWidth
        };
      });
      ok(f.padBottom <= f.vh, where + ", " + moment + ": every key, \"Tell Ember\" too, is on screen (pad ends at " + Math.round(f.padBottom) + " of " + f.vh + ")");
      ok(f.cardTop >= f.barBottom - 1, where + ", " + moment + ": the question is not under the bar");
      ok(f.minKey >= 44, where + ", " + moment + ": keys stay thumb-sized (" + Math.round(f.minKey) + " px)");
      ok(!f.sideways, where + ", " + moment + ": nothing scrolls sideways");
    };
    const press = async s => {
      for (const ch of String(s)) await page.evaluate(ch => [...document.querySelectorAll("#cardPad .key")].find(k => k.textContent === ch).click(), ch);
      await page.evaluate(() => document.querySelector("#cardPad .key.go").click());
    };

    /* The four questions the due card can be asked as. */
    const t = fact.op === "x" ? fact.a * fact.b : fact.a + fact.b, sym = fact.op === "x" ? ["×", "÷"] : ["+", "−"];
    const itsWays = [fact.a + " " + sym[0] + " " + fact.b, fact.b + " " + sym[0] + " " + fact.a, t + " " + sym[1] + " " + fact.a, t + " " + sym[1] + " " + fact.b];
    let n = 0, sawShape = false;
    while (await page.evaluate(() => !document.getElementById("cards").hidden) && n < 6) {
      n++;
      const q = (await page.locator("#cardQ").innerText()).trim();
      await fit("card " + n);
      await press(999);                     /* never right */
      const flipped = await page.evaluate(() => document.getElementById("card").className.includes("flipped") && !document.getElementById("cardModel").hidden);
      ok(flipped, where + ", card " + n + ": a miss turns up her model");
      if (itsWays.includes(q)) sawShape = true;
      await fit("card " + n + " after a miss");
      await press(answerOf(q));
      await sleep(700);
    }
    ok(n >= 3, where + ": the cards ran (" + n + ")");
    ok(sawShape, where + ": the due card's model was among them");
    await sleep(900);
    const after = await page.evaluate(() => ({ y: scrollY, cls: document.getElementById("scene").className }));
    ok(after.y === 0, where + ": after the cards, the page is back at the top for \"what did I learn today?\" (scrollY " + after.y + ")");
    ok(!/\bcarding\b/.test(after.cls), where + ": and Ember is back to her full size");
    await ctx.close();
  }

  /* Ember's dreams (js/dreams.js): the jigsaw, a card and the whole pad on
     one screen, at the start of a dream and after a miss, with "Wake Ember
     up" reachable without scrolling when the dream opens. */
  for (const phone of PHONES) {
    const where = phone.name + ", a dream";
    const ctx = await browser.newContext({ viewport: { width: phone.width, height: phone.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const facts = { [SHAPES["a tall array (8 rows of 3)"][0]]: SHAPES["a tall array (8 rows of 3)"][1] };
    const save = { name: "Sam", lesson: 1, stage: 0, learned: ["g3-ragged-nest"], cards: { best: 0, facts } };
    await ctx.addInitScript(s => { if (!localStorage.getItem("nymath.ember.v1")) localStorage.setItem("nymath.ember.v1", s); }, JSON.stringify(save));
    const page = await ctx.newPage();
    await page.goto(url);
    /* Daytime, whatever the clock says where this runs: the nap is the point. */
    await page.evaluate(() => Bedtime.setNow(() => new Date(2026, 10, 24, 15, 0)));
    await page.locator("#startBtn").tap();
    await page.waitForSelector("#scene:not([hidden])");
    await page.evaluate(() => document.getElementById("denBtn").click());
    await page.locator("#denBed").tap();
    await page.locator("#nightA").tap();
    await page.waitForSelector("#dream:not([hidden])");

    const fit = async moment => {
      await sleep(700);
      const f = await page.evaluate(() => {
        const keys = [...document.querySelectorAll("#dreamPad .key")].map(k => k.getBoundingClientRect());
        return {
          vh: innerHeight, y: scrollY,
          padBottom: Math.max(...keys.map(k => k.bottom)),
          minKey: Math.min(...keys.map(k => k.height)),
          wakeTop: document.getElementById("dreamWake").getBoundingClientRect().top,
          sideways: document.documentElement.scrollWidth > innerWidth
        };
      });
      ok(f.padBottom <= f.vh, where + ", " + moment + ": every key is on screen (pad ends at " + Math.round(f.padBottom) + " of " + f.vh + ")");
      ok(f.minKey >= 44, where + ", " + moment + ": keys stay thumb-sized (" + Math.round(f.minKey) + " px)");
      ok(!f.sideways, where + ", " + moment + ": nothing scrolls sideways");
      return f;
    };
    const press = async s => {
      for (const ch of String(s)) await page.evaluate(ch => [...document.querySelectorAll("#dreamPad .key")].find(k => k.textContent === ch).click(), ch);
      await page.evaluate(() => document.querySelector("#dreamPad .key.go").click());
    };
    const open = await fit("as the dream opens");
    ok(open.y === 0 && open.wakeTop >= 0, where + ", as the dream opens: no scrolling, and \"Wake Ember up\" is on screen (scrollY " + open.y + ")");
    await press(999);
    await fit("after a miss");
    await press(answerOf(await page.locator("#dreamQ").innerText()));
    await fit("the next card");
    await ctx.close();
  }

  await browser.close();
  server.close();
  console.log((fails ? "FAILED" : "ok") + " — " + (checks - fails) + "/" + checks + " checks");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); server.close(); process.exit(2); });
