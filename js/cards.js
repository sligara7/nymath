/* THE CARDS — quick recall of facts she has already built.

   A fact is never on a card until she has built it in a lesson. Three rows
   of five puts 3 x 5 on her cards, and with it the whole FAMILY: 3 x 5,
   5 x 3, 15 / 3, 15 / 5 are one array looked at four ways, so division
   arrives as something she already holds rather than as new facts to learn.
   Each time a family comes up it asks a different one of its ways.

   What this file is careful about:

   NO CLOCK. Nothing counts down and nothing rewards speed. A card is quick
   because it is one fact.

   A MISS IS NOT A PENALTY. The card flips to HER OWN model, the array or the
   fence she built, and she answers by looking at it. A second miss puts the
   whole sentence under the picture, so she can never be stuck. The only
   thing a miss changes is that the fact comes back sooner.

   NOTHING IS LOST ACROSS DAYS. Spacing uses the calendar only to decide
   which facts are worth asking again: a fact she knew comes back after 1,
   3, 7, then 14 days; one she missed comes back in the very next run. Skip a
   week and they simply wait. The streak counts within one sitting, and only
   her best is kept.

   No card pays coins of its own. The run is the end of teaching a lesson,
   and the lesson pays when it is done. */

const Cards = (function () {

  const GAPS = [0, 1, 3, 7, 14];      /* days until a fact in box 0..4 is due again */
  const MAX = 5, MIN = 3;             /* a run is three to five cards */
  const FROM_LESSON = 3;              /* the lesson's own facts come first, up to this many */

  let today = () => Save.today();
  let streak = 0;                     /* this sitting only */

  /* ---- facts and families ------------------------------------------------ */

  /* One id per family whichever way round it was built: 3 x 8 and 8 x 3 are
     the same four questions. */
  const idOf = f => f.op + ":" + Math.min(f.a, f.b) + ":" + Math.max(f.a, f.b);

  /* The ways a family can be asked. `say` is how Ember reads it aloud. */
  function ways(f) {
    const a = f.a, b = f.b, out = [];
    const add = (q, say, answer) => { if (!out.some(w => w.q === q)) out.push({ q, say, answer }); };
    if (f.op === "x") {
      const p = a * b;
      add(a + " × " + b, a + " times " + b, p);
      add(b + " × " + a, b + " times " + a, p);
      add(p + " ÷ " + a, p + " divided by " + a, b);
      add(p + " ÷ " + b, p + " divided by " + b, a);
    } else {
      const s = a + b;
      add(a + " + " + b, a + " plus " + b, s);
      add(b + " + " + a, b + " plus " + a, s);
      add(s + " − " + a, s + " take away " + a, b);
      add(s + " − " + b, s + " take away " + b, a);
    }
    return out;
  }

  /* The whole sentence, for under the picture after a second miss. */
  const sentence = f => (f.op === "x")
    ? f.a + " × " + f.b + " = " + (f.a * f.b)
    : f.a + " + " + f.b + " = " + (f.a + f.b);

  function addDays(day, n) {
    const p = String(day).split("-").map(Number);
    const d = new Date(p[0], (p[1] || 1) - 1, (p[2] || 1) + n);
    const z = v => (v < 10 ? "0" : "") + v;
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  }

  const store = () => Save.cards();

  /* She has just built these in a lesson: they join her cards, due at once.
     One she already had keeps its place in the boxes, and takes on the model
     she built this time. */
  function learn(lessonId, facts) {
    if (!facts || !facts.length) return;
    Save.cards(c => {
      facts.forEach(f => {
        const id = idOf(f), had = c.facts[id];
        c.facts[id] = {
          op: f.op, a: f.a, b: f.b, model: f.model || null, lesson: lessonId,
          box: had ? had.box : 0, due: had ? had.due : today(),
          seen: had ? had.seen : "", asked: had ? had.asked : 0
        };
      });
      return c;
    });
  }

  /* Which cards this lesson ends on. The lesson's own families first, a
     different way each time; then earlier facts that are due, weakest and
     longest-waiting first; and if that is still short of three, whichever
     earlier facts she has gone longest without seeing. */
  function plan(lessonId) {
    const c = store(), day = today();
    const all = Object.keys(c.facts).sort().map(id => Object.assign({ id }, c.facts[id]));
    const mine = all.filter(f => f.lesson === lessonId);
    const others = all.filter(f => f.lesson !== lessonId);
    const out = [], used = {};

    const push = f => {
      const w = ways(f), n = used[f.id] || 0;
      if (n >= w.length) return false;
      used[f.id] = n + 1;
      out.push({ id: f.id, fact: f, way: w[(f.asked + n) % w.length] });
      return true;
    };

    /* Round the lesson's families until three cards, each a new way. */
    for (let round = 0; round < 4 && out.length < FROM_LESSON && mine.length; round++) {
      for (const f of mine) { if (out.length < FROM_LESSON) push(f); }
    }

    const due = others.filter(f => f.due <= day)
      .sort((x, y) => x.box - y.box || (x.due < y.due ? -1 : x.due > y.due ? 1 : 0));
    for (const f of due) { if (out.length < MAX) push(f); }

    if (out.length < MIN) {
      const rest = others.filter(f => !used[f.id])
        .sort((x, y) => (x.seen < y.seen ? -1 : x.seen > y.seen ? 1 : 0));
      for (const f of rest) { if (out.length < MIN) push(f); }
    }
    /* Still short (one small family and nothing else, or a lesson with no
       facts of its own and few earlier ones): ask what there is more ways. */
    const pool = mine.concat(others);
    for (let round = 0; round < 4 && out.length < MIN && pool.length; round++) {
      for (const f of pool) { if (out.length < MIN) push(f); }
    }
    return out;
  }

  /* Write down how a card went. Right first time moves the fact up a box;
     a miss sends it back to the first, to be asked again next run. */
  function record(id, firstTry) {
    Save.cards(c => {
      const f = c.facts[id];
      if (!f) return c;
      f.box = firstTry ? Math.min(GAPS.length - 1, f.box + 1) : 0;
      f.due = addDays(today(), GAPS[f.box]);
      f.seen = today();
      f.asked = (f.asked + 1) % 1000;
      if (firstTry) { streak++; if (streak > c.best) c.best = streak; } else streak = 0;
      return c;
    });
  }

  /* ---- her own model, for when a card is missed --------------------------- */

  const dots = (n, cls) => { let s = ""; for (let i = 0; i < n; i++) s += "<i" + (cls ? ' class="' + cls + '"' : "") + "></i>"; return s; };

  function modelHtml(f) {
    const m = f.model || (f.op === "x" ? { kind: "array", rows: f.a, cols: f.b } : { kind: "bar", a: f.a, b: f.b });
    let rows = "";
    if (m.kind === "array") {
      for (let r = 0; r < m.rows; r++) rows += '<div class="dotrow">' + dots(m.cols) + "</div>";
    } else if (m.kind === "split") {
      /* The piece Ember knew and the piece she added, side by side. */
      for (let r = 0; r < m.rows; r++) rows += '<div class="dotrow">' + dots(m.colsA, "kept") + '<b class="gap"></b>' + dots(m.colsB) + "</div>";
    } else {
      /* Two sides of her fence, end to end. */
      rows = '<div class="dotrow twigs">' + dots(m.a, "twig-a") + '<b class="gap"></b>' + dots(m.b, "twig-b") + "</div>";
    }
    /* Tall models get smaller stones, so the picture never pushes the
       number pad off the screen. */
    const tall = m.kind === "bar" ? 1 : m.rows;
    const wide = m.kind === "split" ? m.colsA + m.colsB + 1 : (m.cols || 1);
    const d = Math.max(8, Math.min(18, Math.floor(104 / tall) - 4, Math.floor(280 / wide) - 4));
    return '<div class="dots" style="--d:' + d + 'px">' + rows + "</div>";
  }

  /* ---- the run ------------------------------------------------------------ */

  let ui = null, deck = [], at = 0, typed = "", tries = 0, done = null, padBuilt = false, busy = false;

  function buildPad() {
    if (padBuilt) return;
    padBuilt = true;
    const key = (label, cls, fn) => {
      const b = document.createElement("button");
      b.className = "key" + (cls ? " " + cls : "");
      b.textContent = label;
      b.addEventListener("click", fn);
      ui.pad.appendChild(b);
      return b;
    };
    ["1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach(d => key(d, "", () => press(d)));
    key("⌫", "soft", () => { if (!busy) { typed = typed.slice(0, -1); paint(); } });
    key("0", "", () => press("0"));
    ui.ok = key("Tell Ember", "go", submit);
  }

  function press(d) {
    if (busy || typed.length >= 3) return;
    typed += d;
    Ambience.stone();
    paint();
  }

  function paint() {
    const c = deck[at];
    ui.q.textContent = c.way.q;
    ui.a.textContent = typed;
    ui.a.className = "card-a" + (typed ? " has" : "");
    if (ui.ok) ui.ok.disabled = !typed;
    const best = store().best;
    ui.streak.innerHTML = streak > 1
      ? "<b>" + streak + "</b> in a row" + (best > streak ? " · best <b>" + best + "</b>" : "")
      : "";
    ui.count.textContent = (at + 1) + " of " + deck.length;
  }

  function show() {
    typed = ""; tries = 0; busy = false;
    ui.model.hidden = true;
    ui.model.innerHTML = "";
    ui.card.className = "card";
    paint();
    Ambience.say(deck[at].way.say);
  }

  function submit() {
    if (busy || !typed) return;
    const c = deck[at];
    if (Number(typed) === c.way.answer) {
      if (tries === 0) record(c.id, true);
      busy = true;
      ui.card.className = "card right";
      Ambience.count(Math.max(1, Math.min(8, streak)));
      paint();
      setTimeout(() => {
        at++;
        if (at >= deck.length) { finish(); return; }
        show();
      }, 520);
      return;
    }
    /* Not that. Nothing is said about being wrong: her own picture comes
       out and she reads the answer off it. */
    tries++;
    typed = "";
    if (tries === 1) {
      record(c.id, false);
      ui.card.className = "card flipped";
      ui.model.innerHTML = modelHtml(c.fact);
      ui.model.hidden = false;
      ui.says.innerHTML = Lessons.fill("Hmm. Let's look at what you built, {name}.");
      Ambience.say("Let's look at what you built.");
      Ambience.lift();
    } else {
      ui.model.innerHTML = modelHtml(c.fact) + '<p class="model-says">' + sentence(c.fact) + "</p>";
      ui.says.innerHTML = "Here, count it with me.";
      Ambience.say(sentence(c.fact).replace("=", "equals").replace("−", "take away").replace("÷", "divided by"));
    }
    paint();
  }

  function finish() {
    const d = done;
    done = null; deck = [];
    ui.wrap.hidden = true;
    if (d) d();
  }

  return {
    ways, idOf, learn, plan, record, modelHtml, sentence, addDays, GAPS,

    /* Run the cards for the lesson just taught, then call back. With no
       cards to ask (a first lesson that built nothing countable) it calls
       back at once and returns false. */
    run(lessonId, els, onDone) {
      ui = els;
      deck = plan(lessonId);
      if (!deck.length) { ui.wrap.hidden = true; onDone(); return false; }
      done = onDone; at = 0;
      buildPad();
      ui.wrap.hidden = false;
      show();
      return true;
    },

    hide(els) { if (els && els.wrap) els.wrap.hidden = true; done = null; deck = []; },
    streak: () => streak,
    /* For checks: a different calendar, and a fresh sitting. */
    setToday(fn) { today = fn; },
    newSitting() { streak = 0; }
  };
})();
