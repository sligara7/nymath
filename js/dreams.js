/* EMBER'S DREAMS — her own idea.

   She asked for a jigsaw to do once Ember is tucked in. Night stays closed
   (js/bedtime.js), so it lives in the daytime NAP from the den: Ember falls
   asleep, and her dream is a 10-piece jigsaw. Each piece snaps in when she
   answers one of her flash cards (js/cards.js), so a finished picture is ten
   facts she has built. The pictures are Ember's dreams of growing up and
   flying, a story in seven pictures, told in order:

     her wings growing · a first hop · a first glide · over the mountains ·
     past the castles · the prince and princess and their baby · home at sunset

   After the seventh the story starts again, and her dream book stays full.

   What this file is careful about:

   NO CLOCK. The next dream comes when she finishes one, not after a wait.
   Nothing counts down; nothing here reads the time at all.

   A NAP HAS AN END. Two dreams, then Ember wakes up happy. An endless loop is
   exactly what con:no-manipulative-design is there to stop.

   NOTHING IS LOST. Wake Ember mid-dream and the pieces stay where they are;
   that dream is waiting at the next nap.

   NO COINS. Her owner chose it (dec:inc3b-how-it-is-built): the picture in
   her dream book is the prize, and only teaching fills the hoard.

   Every picture is our own drawing: no borrowed characters, names or art. */

const Dreams = (function () {

  const COLS = 5, ROWS = 2, CELL = 50;          /* the picture is 250 x 100 */
  const PIECES = COLS * ROWS;
  const PER_NAP = 2;

  /* ---- the pictures --------------------------------------------------------
     Each draws into a 250 x 100 box. `u` keeps its gradient ids its own: the
     same picture can be on the page twice (her dream and her book). */

  const sky = (u, stops) => '<defs><linearGradient id="' + u + 'sky" x1="0" y1="0" x2="0" y2="1">' +
    stops.map((c, i) => '<stop offset="' + (i / (stops.length - 1)) + '" stop-color="' + c + '"/>').join("") +
    '</linearGradient></defs><rect width="250" height="100" fill="url(#' + u + 'sky)"/>';
  const cloud = (x, y, s) => '<path transform="translate(' + x + " " + y + ") scale(" + s + ') translate(-30 -66)" ' +
    'd="M14 70 q0 -9 9 -9 q4 -7 12 -4 q8 -2 10 6 q7 0 7 7 z" fill="#ffffff" opacity="0.92"/>';
  const spark = (x, y, r, c) => '<path d="M' + x + " " + (y - r) + " Q" + x + " " + y + " " + (x + r) + " " + y +
    " Q" + x + " " + y + " " + x + " " + (y + r) + " Q" + x + " " + y + " " + (x - r) + " " + y +
    " Q" + x + " " + y + " " + x + " " + (y - r) + 'Z" fill="' + (c || "#ffe28a") + '"/>';
  const nest = (x, y, w) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + (w * 0.26) + '" fill="#b98a4e"/>' +
    '<ellipse cx="' + x + '" cy="' + (y - 2) + '" rx="' + (w * 0.8) + '" ry="' + (w * 0.15) + '" fill="#8a6232"/>' +
    '<path d="M' + (x - w * 0.8) + " " + (y + 3) + " q" + (w * 0.4) + " -5 " + (w * 0.8) + " 0 t" + (w * 0.8) + ' 0" ' +
    'fill="none" stroke="#e0b46e" stroke-width="1.6" stroke-linecap="round"/>';
  const flower = (x, y, c) => '<circle cx="' + x + '" cy="' + y + '" r="2.2" fill="' + c + '"/><circle cx="' + x + '" cy="' + y + '" r="0.9" fill="#ffd166"/>';
  const heart = (x, y, s) => '<path transform="translate(' + x + " " + y + ") scale(" + s + ')" d="M0 3 C-6 -3 -3 -8 0 -4 C3 -8 6 -3 0 3 Z" fill="#ff8fb1"/>';
  const bird = (x, y) => '<path d="M' + x + " " + y + " q3 -3 6 0 q3 -3 6 0" + '" fill="none" stroke="#6b3f63" stroke-width="1.4" stroke-linecap="round"/>';
  const OUT = 'stroke="#5b3a2e" stroke-width="1.4" stroke-linejoin="round"';
  const flag = (x, y, c) => '<path d="M' + x + " " + y + " v-8" + '" stroke="#5b3a2e" stroke-width="1.2"/>' +
    '<path d="M' + x + " " + (y - 8) + ' l8 3 l-8 3 z" fill="' + c + '"/>';
  /* A crowned figure for the castle balcony, waving. */
  const person = (x, body, hair) =>
    (hair ? '<path d="M' + (x - 5.5) + ' 43 q0 -9 5.5 -9 q5.5 0 5.5 9 v6 h-11 z" fill="' + hair + '"/>' : "") +
    '<path d="M' + (x - 7) + " 63 L" + (x - 3) + " 46 h6 L" + (x + 7) + ' 63 z" fill="' + body + '" ' + OUT + "/>" +
    '<circle cx="' + x + '" cy="41" r="5" fill="#ffd9b8" ' + OUT + "/>" +
    '<path d="M' + (x - 4.5) + " 37 l1.5 -5 l1.5 3 l1.5 -4 l1.5 4 l1.5 -3 l1.5 5 z" + '" fill="#ffd166" ' + OUT + "/>";

  const PICTURES = [
    { name: "Her wings are growing", draw: u =>
      sky(u, ["#232a55", "#5d4a8a"]) +
      '<circle cx="214" cy="22" r="19" fill="#fff6d6" opacity="0.14"/><circle cx="214" cy="22" r="11" fill="#fff6d6"/>' +
      spark(30, 18, 2.5, "#fff6d6") + spark(64, 30, 1.8, "#fff6d6") + spark(176, 14, 2, "#fff6d6") + spark(240, 52, 1.6, "#fff6d6") + spark(16, 50, 1.6, "#fff6d6") +
      '<path d="M0 88 Q60 78 125 84 T250 82 V100 H0 Z" fill="#3a3463"/>' +
      nest(125, 86, 46) +
      Ember.figure("delighted", { x: 125, y: 56, size: 60, wings: 1 }) +
      spark(86, 50, 4) + spark(164, 46, 4) + spark(95, 34, 2.6) + spark(156, 30, 2.6) },

    { name: "Her first hop", draw: u =>
      sky(u, ["#9fd3ff", "#ffe0c2"]) +
      '<circle cx="36" cy="90" r="18" fill="#ffd166"/>' + cloud(205, 24, 0.9) +
      '<path d="M0 86 Q80 80 160 86 T250 84 V100 H0 Z" fill="#8fd18a"/>' +
      nest(98, 90, 34) +
      '<path d="M104 78 q16 7 34 0 M110 84 q10 4 22 0" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9"/>' +
      '<path d="M80 74 l5 -3 M88 68 l2 -5 M150 70 l4 -4" stroke="#e0b46e" stroke-width="1.8" stroke-linecap="round"/>' +
      Ember.figure("delighted", { x: 122, y: 42, size: 48, tilt: -6, wings: 2 }) },

    { name: "A first glide", draw: u =>
      sky(u, ["#8fd0ff", "#dff3ff"]) + cloud(44, 30, 1.1) + cloud(196, 20, 0.8) +
      '<path d="M0 78 Q70 60 140 74 T250 70 V100 H0 Z" fill="#a8dc8c"/>' +
      '<path d="M0 90 Q90 76 180 86 T250 84 V100 H0 Z" fill="#7cc472"/>' +
      flower(22, 92, "#ff8fb1") + flower(48, 88, "#ffffff") + flower(80, 94, "#ffd166") + flower(170, 92, "#ff8fb1") +
      flower(204, 90, "#c9b8f5") + flower(232, 95, "#ffffff") + flower(120, 90, "#ff8fb1") +
      '<path d="M66 40 h28 M74 49 h20 M60 57 h18" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9"/>' +
      Ember.figure("delighted", { x: 150, y: 42, size: 46, tilt: -10, wings: 2 }) },

    { name: "Over the mountains", draw: u =>
      sky(u, ["#6fb6ff", "#cfe9ff"]) + cloud(36, 22, 0.8) +
      '<path d="M-10 100 L45 38 L100 100 Z" fill="#8fa6d6"/><path d="M45 38 L35 50 L41 48 L46 53 L51 48 L56 51 Z" fill="#ffffff"/>' +
      '<path d="M160 100 L218 44 L276 100 Z" fill="#8fa6d6"/><path d="M218 44 L208 55 L214 53 L219 58 L224 53 L229 56 Z" fill="#ffffff"/>' +
      '<path d="M66 100 L134 26 L202 100 Z" fill="#6c82b8"/><path d="M134 26 L121 41 L128 38 L134 45 L140 38 L147 41 Z" fill="#ffffff"/>' +
      cloud(100, 82, 1.3) + cloud(212, 76, 1.1) +
      Ember.figure("delighted", { x: 196, y: 24, size: 38, tilt: -14, wings: 2 }) },

    { name: "Past the castles", draw: u =>
      sky(u, ["#ffc7d9", "#ffe9d6"]) + cloud(200, 18, 0.8) +
      '<path d="M0 84 Q70 70 140 82 T250 80 V100 H0 Z" fill="#9ad18f"/>' +
      '<rect x="52" y="52" width="56" height="34" fill="#efe3f7" ' + OUT + "/>" +
      '<rect x="44" y="38" width="16" height="48" fill="#e6d6f2" ' + OUT + "/>" +
      '<rect x="100" y="38" width="16" height="48" fill="#e6d6f2" ' + OUT + "/>" +
      '<rect x="72" y="30" width="16" height="24" fill="#e6d6f2" ' + OUT + "/>" +
      '<path d="M42 38 L52 20 L62 38 Z" fill="#ff8fb1" ' + OUT + "/>" +
      '<path d="M98 38 L108 20 L118 38 Z" fill="#ff8fb1" ' + OUT + "/>" +
      '<path d="M70 30 L80 13 L90 30 Z" fill="#c9b8f5" ' + OUT + "/>" +
      flag(52, 20, "#ffd166") + flag(108, 20, "#7dd3c8") + flag(80, 13, "#ffd166") +
      '<path d="M74 86 v-12 a6 6 0 0 1 12 0 v12 z" fill="#b98a4e" ' + OUT + "/>" +
      '<rect x="49" y="50" width="6" height="8" rx="3" fill="#5b3a2e"/><rect x="105" y="50" width="6" height="8" rx="3" fill="#5b3a2e"/>' +
      '<rect x="211" y="60" width="22" height="22" fill="#efe3f7" ' + OUT + '/><path d="M208 60 L222 46 L236 60 Z" fill="#ff8fb1" ' + OUT + "/>" +
      Ember.figure("delighted", { x: 166, y: 34, size: 42, tilt: -8, wings: 2 }) },

    { name: "The prince and princess and their baby", draw: u =>
      sky(u, ["#bfe6ff", "#fff1dc"]) + cloud(40, 20, 0.9) +
      '<path d="M0 88 Q60 78 130 86 V100 H0 Z" fill="#9ad18f"/>' +
      '<rect x="146" y="30" width="80" height="70" fill="#efe3f7" ' + OUT + "/>" +
      '<path d="M146 30 v-7 h10 v7 h10 v-7 h10 v7 h10 v-7 h10 v7 h10 v-7 h10 v7 h10 v-7 h10 v7" fill="#efe3f7" ' + OUT + "/>" +
      person(168, "#5aa9e6", "") + person(194, "#ff8fb1", "#7a4a2a") +
      '<path d="M172 49 l8 -9" stroke="#ffd9b8" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse cx="201" cy="53" rx="5.5" ry="4.5" fill="#ffffff" ' + OUT + '/><circle cx="201" cy="50" r="3.2" fill="#ffd9b8" ' + OUT + "/>" +
      '<rect x="140" y="62" width="92" height="8" rx="3" fill="#c9b8f5" ' + OUT + "/>" +
      heart(128, 36, 1) + heart(140, 22, 0.8) + heart(116, 52, 0.7) +
      Ember.figure("delighted", { x: 74, y: 44, size: 46, tilt: -6, wings: 2 }) },

    { name: "Home at sunset", draw: u =>
      sky(u, ["#f58fa0", "#ffb38a", "#ffe2a8"]) +
      '<circle cx="58" cy="88" r="22" fill="#fff1b8" opacity="0.95"/>' +
      bird(30, 30) + bird(52, 22) + bird(214, 26) +
      '<path d="M0 90 Q60 82 120 90 T250 86 V100 H0 Z" fill="#8c5a8a"/>' +
      '<path d="M158 100 Q198 50 250 58 V100 Z" fill="#7a4f7d"/>' +
      '<path d="M196 100 v-14 a12 12 0 0 1 24 0 v14 z" fill="#3b2440"/><circle cx="208" cy="95" r="5" fill="#ffc14d" opacity="0.85"/>' +
      Ember.figure("delighted", { x: 136, y: 44, size: 42, tilt: 4, wings: 2 }) }
  ];

  /* ---- the jigsaw ----------------------------------------------------------
     A 5 x 2 grid of pieces with real tabs, so it reads as a jigsaw. Every
     inner edge has a knob on one side or the other, fixed, so the pieces are
     the same shape every time she comes back to a half-done dream. */

  const TAB_H = [1, -1, 1, -1, 1];                  /* the edge between the rows, per column */
  const TAB_V = [[1, -1, 1, -1], [-1, 1, -1, 1]];   /* the edges between columns, per row */

  /* One edge from (x0,y0) to (x1,y1). `s` 0 is straight; +1 or -1 puts the
     knob on one side or the other. The knob is symmetric, so walking an edge
     backwards with `s` negated draws the same curve. */
  function edge(x0, y0, x1, y1, s) {
    const f = n => Math.round(n * 100) / 100;
    if (!s) return " L" + f(x1) + " " + f(y1);
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    const nx = uy * s, ny = -ux * s;
    const p = (a, b) => f(x0 + ux * a * L + nx * b * L) + " " + f(y0 + uy * a * L + ny * b * L);
    return " L" + p(0.34, 0) + " C" + p(0.40, 0) + " " + p(0.38, 0.10) + " " + p(0.36, 0.14) +
      " C" + p(0.32, 0.24) + " " + p(0.68, 0.24) + " " + p(0.64, 0.14) +
      " C" + p(0.62, 0.10) + " " + p(0.60, 0) + " " + p(0.66, 0) + " L" + f(x1) + " " + f(y1);
  }

  /* The outline of piece i (row-major). */
  function piecePath(i) {
    const r = Math.floor(i / COLS), c = i % COLS, x = c * CELL, y = r * CELL;
    const top = r === 0 ? 0 : TAB_H[c];
    const bottom = r === ROWS - 1 ? 0 : TAB_H[c];
    const left = c === 0 ? 0 : TAB_V[r][c - 1];
    const right = c === COLS - 1 ? 0 : TAB_V[r][c];
    return "M" + x + " " + y +
      edge(x, y, x + CELL, y, top) +
      edge(x + CELL, y, x + CELL, y + CELL, right) +
      edge(x + CELL, y + CELL, x, y + CELL, -bottom) +
      edge(x, y + CELL, x, y, -left) + " Z";
  }
  const PATHS = Array.from({ length: PIECES }, (_, i) => piecePath(i));

  /* The order pieces snap in for each picture: shuffled, but always the same
     shuffle, so a dream she comes back to looks exactly as she left it. */
  function orderOf(k) {
    const o = Array.from({ length: PIECES }, (_, i) => i);
    let seed = 7 + k * 31;
    for (let i = o.length - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const j = seed % (i + 1);
      const t = o[i]; o[i] = o[j]; o[j] = t;
    }
    return o;
  }

  let drawn = 0;

  /* A dream as it stands: the pieces she has placed show the picture, the
     rest are empty, piece-shaped hollows. `fresh` is the piece that has just
     snapped in, which gets its little landing. */
  function frameSvg(k, placed, fresh) {
    const u = "d" + (++drawn) + "-";
    const inPlace = orderOf(k).slice(0, placed);
    let defs = "", body = "";
    PATHS.forEach((d, i) => {
      if (inPlace.includes(i)) {
        defs += '<clipPath id="' + u + "c" + i + '"><path d="' + d + '"/></clipPath>';
        body += '<g class="piece' + (i === fresh ? " new" : "") + '" clip-path="url(#' + u + "c" + i + ')"><use href="#' + u + 'pic"/></g>';
      } else {
        body += '<path class="slot" d="' + d + '"/>';
      }
    });
    const seams = PATHS.map(d => '<path class="seam" d="' + d + '"/>').join("");
    return '<svg class="jigsaw" viewBox="-1 -1 252 102" aria-label="Ember\'s dream, ' + placed + " of " + PIECES + ' pieces">' +
      "<defs>" + defs + '<g id="' + u + 'pic">' + PICTURES[k].draw(u) + "</g></defs>" + body + seams + "</svg>";
  }

  /* A whole picture, for her dream book. */
  function pictureSvg(k) {
    const u = "b" + (++drawn) + "-";
    return '<svg viewBox="0 0 250 100" aria-hidden="true">' + PICTURES[k].draw(u) + "</svg>";
  }

  /* ---- a nap's dreams -------------------------------------------------------- */

  const SAY = {
    dreaming: "Zzz… Ember is dreaming.",
    smiling: "Zzz… she is smiling in her sleep.",
    dreamt: "Ember dreamt: <em>{picture}</em>.",
    next: "Next dream",
    waking: "Ember is waking up"
  };

  let ui = null, hooks = null, wired = false, napCount = 0, lastK = 0;

  const current = () => { const d = Save.dreams(); return { k: d.done % PICTURES.length, placed: d.placed }; };

  function wire() {
    if (wired) return;
    wired = true;
    ui.wake.addEventListener("click", wake);
    ui.next.addEventListener("click", next);
  }

  function paint(k, placed, fresh) {
    ui.frame.innerHTML = frameSvg(k, placed, fresh);
    ui.pieces.textContent = placed + " of " + PIECES + " pieces";
  }

  /* Start the dream that comes next, or carry on with the one she left. */
  function dream() {
    const c = current();
    lastK = c.k;
    ui.done.hidden = true;
    ui.wake.hidden = false;
    Ember.drawSleeping(ui.ember);
    ui.says.innerHTML = Lessons.fill(SAY.dreaming);
    paint(c.k, c.placed, -1);
    if (!Cards.dream(ui.cards, PIECES - c.placed, piece, finished)) { ui.wrap.hidden = true; hooks.woke(); }
  }

  /* She answered a card: the next piece snaps in. The tenth finishes the
     picture, and it goes into her book at once, so waking Ember in the next
     breath cannot lose it. */
  function piece() {
    const c = current();
    const n = c.placed + 1;
    const fresh = orderOf(c.k)[c.placed];
    if (n < PIECES) Save.dreams(d => { d.placed = n; return d; });
    else Save.dreams(d => { d.done = d.done + 1; d.placed = 0; return d; });
    paint(c.k, n, fresh);
    /* After a miss, her model is put away with the card; Ember goes back to
       dreaming. */
    ui.says.innerHTML = Lessons.fill(n < PIECES ? SAY.dreaming : SAY.smiling);
  }

  /* The last card is answered and the picture is whole. She looks at it for
     as long as she likes; the next dream comes when she says. */
  function finished() {
    napCount++;
    ui.wake.hidden = true;
    ui.done.hidden = false;
    ui.caption.innerHTML = SAY.dreamt.replace("{picture}", PICTURES[lastK].name.toLowerCase());
    ui.next.textContent = napCount >= PER_NAP ? SAY.waking : SAY.next;
    Ambience.learned();
    Ambience.say("Ember dreamt: " + PICTURES[lastK].name + ".");
  }

  /* Between dreams is a break, like the end of a stage: if it has turned
     10:30 at night, the night takes over (js/bedtime.js). */
  function next() {
    if (hooks.atBreak && hooks.atBreak()) { ui.wrap.hidden = true; return; }
    if (napCount >= PER_NAP) { ui.wrap.hidden = true; hooks.wokeHappy(); return; }
    dream();
  }

  /* She wakes Ember mid-dream. The pieces stay where they are. */
  function wake() {
    Cards.hide(ui.cards);
    ui.wrap.hidden = true;
    hooks.woke();
  }

  return {
    PICTURES, PIECES, PER_NAP, orderOf, piecePath, frameSvg, pictureSvg,

    /* Whether there is anything to dream with: a fact she has built. */
    ready: () => Object.keys(Save.cards().facts).length > 0,

    /* A nap's worth of dreams. `parts` are the dream screen's elements;
       `h` says what happens when she wakes Ember (woke), when the nap ends
       with Ember waking up happy (wokeHappy), and whether the night has
       taken over at a break (atBreak, true if it has). */
    nap(parts, h) {
      ui = parts; hooks = h; wire();
      napCount = 0;
      ui.wrap.hidden = false;
      dream();
    },

    /* Her dream book: every picture she has finished, in the order of the
       story, and an empty frame for each one still to dream. */
    bookHtml() {
      const have = Math.min(Save.dreams().done, PICTURES.length);
      return PICTURES.map((p, k) => k < have
        ? '<figure class="book-page">' + pictureSvg(k) + "<figcaption>" + p.name + "</figcaption></figure>"
        : '<figure class="book-page empty"><div class="book-blank"></div><figcaption>&nbsp;</figcaption></figure>').join("");
    },
    finishedCount: () => Save.dreams().done
  };
})();
