/* THE LESSON ENGINE.

   Content is data; the rules that judge it live here. Adding a rule is the
   only reason this file should ever grow.

   Three things this file is careful about.

   It never says she is wrong. When what she has built does not satisfy the
   rule yet, the readout describes WHAT IS THERE — "Wobbly! rows of 4, 2, 5, 1,
   not the same yet" — and lets her see the difference herself. Nothing goes
   red, and nothing says "warmer".

   It never shows the arithmetic sentence before she has built the thing.
   The whole design rests on that order.

   And once she HAS built it, she is the one who writes the sentence. The
   model counts as she builds (5, 10, 15), and after a solve Ember asks how
   she knew: she taps her own rows or sides and each drops its number into
   the sum. Nothing is typed and nothing is picked from a list, because either
   of those would be a quiz wearing the model as a costume. */

const Lessons = (function () {

  /* ---- the rules ---------------------------------------------------------
     Each takes what the nest reports plus the numbers from the content, and
     answers one question: has she shown Ember yet? */

  const RULES = {

    /* ---- on the line (fractions). Positions are 24ths of the whole. ---- */

    /* Her cuts make p.parts pieces, every one the same length. */
    equalCuts(rep, p) {
      const L = rep.lines && rep.lines[0];
      if (!L || L.cuts.length !== p.parts - 1) return false;
      const step = 24 / p.parts;
      return L.cuts.every((c, i) => c === step * (i + 1));
    },

    /* Every flag asked for is planted — let go of — exactly at a/b. */
    flagAt(rep, p) {
      return !!rep.lines && p.flags.every(f => {
        const L = rep.lines[f.line];
        return !!L && L.placed && L.flag === 24 * f.a / f.b;
      });
    },

    /* ---- in the nest ---- */

    /* Any solid rectangle of the right size. She chooses the shape — 3 by 4,
       4 by 3, 2 by 6 are all genuinely correct and the reveal reads back
       whichever one she actually built. */
    equalRows(rep, p) {
      const s = rep.shape;
      return s.ok && s.total === p.total &&
             s.rows >= (p.minRows || 2) && s.cols >= (p.minCols || 2);
    },

    exact(rep, p) {
      const s = rep.shape;
      return s.ok && s.rows === p.rows && s.cols === p.cols;
    },

    rim(rep) {
      return rep.rimNeeded > 0 && rep.rim === rep.rimNeeded;
    },

    /* The standard asks, in as many words, for rectangles with the same
       perimeter and different areas. This is that, as a thing she does. */
    samePerimeterLessArea(rep, p) {
      const s = rep.shape;
      if (!s.ok || !s.total) return false;
      return 2 * (s.rows + s.cols) === p.perimeter && s.rows * s.cols < p.lessThan;
    }
  };

  function passes(check, rep) {
    const fn = RULES[check.rule];
    return fn ? !!fn(rep, check) : false;
  }

  /* ---- what the readout says while she works ----------------------------

     The readout has a voice: a few words in front of the numbers, so it
     sounds like the nest rather than a spreadsheet. Two rules keep the voice
     honest. EVERY NUMBER STAYS — the words go around the count, never in
     place of it. And a reaction only ever DESCRIBES what is on the screen; it
     never says how close she is ("warmer!"), because then poking until it
     cheers would win, and that is guessing. Which wobbly-word she gets is
     picked by the stone count, so it changes as she works without meaning
     anything. */

  const SAY = {
    wobbly: ["Wobbly!", "Lumpy-bumpy!", "Higgledy-piggledy!", "What a jumble!", "Wonky!"],
    oneRow: "all in one long line",
    rectangle: ["Neat rows!", "Tidy as a pin!", "Look at that!", "Ooh, smart!"],
    square: "A perfect square!",
    noodle: "A long skinny noodle!",
    empty: "All empty! Tap a hollow to lay a stone.",
    noTwigs: "No fence yet! Tap an edge to lay a twig.",
    someTwigs: "Twig, twig, twig…",
    lumpy: "Lumpy!",
    noFlag: "Drag the flag along the fish, or tap where it goes.",
    fair: ["Fair and square!", "Perfectly fair!", "Same, same, same!"]
  };
  const pickBy = (list, n) => list[n % list.length];
  const voice = w => '<span class="say">' + w + "</span>";

  function chips(rows, cols) {
    let out = "";
    for (let i = 1; i <= rows; i++) {
      out += '<span class="chip' + (i === rows ? " last" : "") + '">' + (i * cols) + "</span>";
    }
    return out;
  }

  /* A running total as chips, the newest one lit: 5, 10, 15. */
  function tally(totals) {
    return totals.map((t, i) =>
      '<span class="chip' + (i === totals.length - 1 ? " last" : "") + '">' + t + "</span>").join("");
  }
  const BREAK = '<span style="width:100%"></span>';

  /* ---- the model counts as she builds -----------------------------------

     Which rows are FINISHED, and the total after each. In a stage that names
     its size ("4 rows of 5") a row is finished when it holds exactly that
     many, side by side; where she is free to choose, the top row sets the
     length and the others are finished when they match it. Finished rows
     must line up under one another, or they are not rows of one array.
     On the rim it is the finished sides, in the order she finished them.

     Returns { rows: [row numbers], totals: [5, 10, 15] }, or null where
     there is nothing to count this way. */
  function counting(check, rep) {
    if (check.rule === "rim") {
      let t = 0;
      return { rows: [], totals: (rep.sides || []).map(sd => (t += sd.len)) };
    }
    if (check.rule !== "exact" && check.rule !== "equalRows") return null;
    if (!rep.rows) return null;
    const rows = rep.rows, none = { rows: [], totals: [] };
    if (!rows.length) return none;
    const width = check.rule === "exact" ? check.cols : rows[0].n;
    if (width < 2) return none;
    const first = rows.find(r => r.solid && r.n === width);
    if (!first) return none;
    const done = rows.filter(r => r.solid && r.n === width && r.c0 === first.c0);
    let t = 0;
    return { width, rows: done.map(r => r.r), totals: done.map(() => (t += width)) };
  }

  /* ---- she shows Ember the arithmetic ------------------------------------

     What Ember asks once the build is right, and the parts of the model she
     taps to answer. One action per solve, never more: this is a bridge from
     the picture to the number, not a worksheet.

       rows    each row drops its count:   5 + 5 + 5, folding to 3 x 5 = 15
       sides   each side drops its length: 4 + 3 + 4 + 3 = 14
       blocks  the part Ember knew and the new part: 30 + 12 = 42

     `task` says where to tap and `nudge` says it again, shorter, if she taps
     the sum instead: the empty places under the nest look like where the
     answer goes, and they are not where she acts.

     Fractions on the line have no such step yet, so they return null. */
  function bridge(stage, rep) {
    const check = stage.check, s = rep.shape;
    if (stage.surface === "line" || !s || !s.ok) return null;

    if (check.rule === "rim" || check.rule === "samePerimeterLessArea") {
      const lens = { t: s.cols, r: s.rows, b: s.cols, l: s.rows };
      return {
        kind: "sides",
        /* In the free-shape stage there is no rim yet: Ember lays one round
           whatever she built, and then asks. */
        needsRim: check.rule !== "rim",
        parts: ["t", "r", "b", "l"].map(sd => ({ id: sd, value: lens[sd], side: sd })),
        ask: check.rule === "rim"
          ? "Hang on, {name}, how many twigs is that? How did you <em>know</em>? Show me!"
          : "Wait, {name}, let me put twigs round yours. How many is that? Show me!",
        task: "Tap each side of twigs to drop its length into the sum.",
        nudge: "Tap a side of the fence!",
        fold(vals) {
          const total = vals.reduce((a, b) => a + b, 0);
          return { html: sum(vals, 0, total), say: vals.join(" plus ") + " equals " + total };
        }
      };
    }

    if (check.rule !== "exact" && check.rule !== "equalRows") return null;

    /* A stage that carried her stones over is about the two PIECES. */
    const f = stage.carry && stage.fill;
    if (f && f.rows === s.rows && f.cols < s.cols && s.r0 === 0 && s.c0 === 0) {
      return {
        kind: "blocks",
        parts: [
          { id: "kept", value: f.rows * f.cols, rect: { r0: 0, c0: 0, rows: f.rows, cols: f.cols } },
          { id: "new", value: s.rows * (s.cols - f.cols), rect: { r0: 0, c0: f.cols, rows: s.rows, cols: s.cols - f.cols } }
        ],
        ask: "So how many is that <em>altogether</em>, {name}? Show me the two bits!",
        task: "Tap the bit she knew, then the bit you added.",
        nudge: "Tap the stones!",
        fold(vals) {
          const total = vals.reduce((a, b) => a + b, 0);
          return { html: sum(vals, 0, total), say: vals.join(" plus ") + " equals " + total };
        }
      };
    }

    const parts = [];
    for (let r = s.r0; r < s.r0 + s.rows; r++) {
      parts.push({ id: "row" + r, value: s.cols, rect: { r0: r, c0: s.c0, rows: 1, cols: s.cols } });
    }
    return {
      kind: "rows",
      parts,
      ask: "Hang on, {name}, how many stones is that? How did you <em>know</em>? Show me!",
      task: "Tap each row of stones to drop its count into the sum.",
      nudge: "Tap a row of stones!",
      fold(vals) {
        return {
          html: sum(vals, 0) + BREAK +
            '<span class="sum folded"><b>' + s.rows + '</b><span class="op">×</span><b>' + s.cols +
            '</b><span class="op">=</span><b>' + s.total + "</b></span>",
          say: vals.join(" plus ") + ". " + s.rows + " times " + s.cols + " equals " + s.total
        };
      }
    };
  }

  /* ---- the facts a build puts on her cards -------------------------------

     A fact joins her flash cards only once she has built it (js/cards.js),
     and each carries the model she built so a missed card can show it back
     to her. An array is a multiplication family. A fence is its side pair
     and that pair doubled. An array broken apart is also the sum of its two
     pieces. Fractions put nothing on the cards yet. */
  function facts(stage, rep) {
    const check = stage.check, s = rep.shape;
    if (stage.surface === "line" || !s || !s.ok) return [];

    if (check.rule === "rim" || check.rule === "samePerimeterLessArea") {
      return [
        { op: "+", a: s.cols, b: s.rows, model: { kind: "bar", a: s.cols, b: s.rows } },
        { op: "x", a: 2, b: s.cols + s.rows, model: { kind: "array", rows: 2, cols: s.cols + s.rows } }
      ];
    }
    if (check.rule !== "exact" && check.rule !== "equalRows") return [];

    const out = [{ op: "x", a: s.rows, b: s.cols, model: { kind: "array", rows: s.rows, cols: s.cols } }];
    const f = stage.carry && stage.fill;
    if (f && f.rows === s.rows && f.cols < s.cols) {
      out.push({
        op: "+", a: f.rows * f.cols, b: s.rows * (s.cols - f.cols),
        model: { kind: "split", rows: s.rows, colsA: f.cols, colsB: s.cols - f.cols }
      });
    }
    return out;
  }

  /* The sum as it stands: the numbers she has dropped in, an empty place for
     each one still to come, and the total once it is known. */
  function sum(vals, waiting, total) {
    const bits = vals.map(v => '<b class="term">' + v + "</b>");
    for (let i = 0; i < (waiting || 0); i++) bits.push('<i class="slot"></i>');
    return '<span class="sum">' + bits.join('<span class="op">+</span>') +
      (total != null ? '<span class="op">=</span><b class="term total">' + total + "</b>" : "") + "</span>";
  }

  /* A fraction, stacked the way it is written on paper. */
  const frac = (a, b) => '<span class="frac"><b>' + a + "</b><i>" + b + "</i></span>";

  /* What a flag on a fish says: how many equal pieces from 0, if the fish is
     cut into equal pieces and the flag sits on a cut or the end. */
  function flagWords(L) {
    if (L.flag == null || !L.placed) return "not planted yet";
    const edges = [0].concat(L.cuts, [24]);
    const parts = edges.length - 1, step = 24 / parts;
    const equal = edges.every((e, i) => e === i * step);
    if (equal && L.flag % step === 0) {
      const k = L.flag / step;
      return "<b>" + k + "</b> piece" + (k === 1 ? "" : "s") + " from 0 — " + frac(k, parts);
    }
    return "between two cuts";
  }

  function describe(check, rep) {
    const s = rep.shape;

    if (check.rule === "equalCuts") {
      const L = rep.lines[0];
      const edges = [0].concat(L.cuts, [24]);
      const sizes = edges.slice(1).map((e, i) => e - edges[i]);
      const n = sizes.length;
      if (sizes.every(x => x === sizes[0])) {
        return voice(pickBy(SAY.fair, n)) + "<span><b>" + n + "</b> equal pieces · each is " + frac(1, n) + "</span>";
      }
      return voice(pickBy(SAY.wobbly, L.cuts.reduce((a, b) => a + b, 0))) +
        "<span><b>" + n + "</b> pieces — not all the same size yet</span>";
    }

    if (check.rule === "flagAt") {
      if (rep.lines.length === 1) {
        const L = rep.lines[0];
        if (!L.placed) return voice(SAY.noFlag);
        return "<span>Your flag: " + flagWords(L) + "</span>";
      }
      return rep.lines.map((L, i) =>
        "<span>" + (i ? "Bottom" : "Top") + " fish: " + flagWords(L) + "</span>").join('<span style="width:100%"></span>');
    }

    if (check.rule === "rim") {
      if (!rep.rim) return voice(SAY.noTwigs);
      const sides = counting(check, rep).totals;
      return (sides.length ? tally(sides) + BREAK : "") + voice(SAY.someTwigs) +
        "<span><b>" + rep.rim + "</b> of <b>" + rep.rimNeeded + "</b> twigs round the outside</span>";
    }

    if (!rep.total) return voice(SAY.empty);

    if (check.rule === "samePerimeterLessArea") {
      if (!s.ok) return voice(SAY.lumpy) + "<span><b>" + rep.total + "</b> stones — make it a full rectangle</span>";
      const shape = (s.rows === 1 || s.cols === 1) ? SAY.noodle :
        s.rows === s.cols ? SAY.square : pickBy(SAY.rectangle, s.total);
      return voice(shape) +
        "<span>round the outside <b>" + (2 * (s.rows + s.cols)) + "</b> · inside <b>" + (s.rows * s.cols) + "</b></span>";
    }

    /* Not a rectangle yet: show her the rows as they stand. This is the most
       important line in the file — it is the moment she sees "4, 2, 5, 1" and
       works out for herself what is wrong with it. */
    const c = counting(check, rep);
    const counted = c && c.totals.length ? tally(c.totals) + BREAK : "";

    if (!s.ok) {
      const rc = rep.rowCounts;
      /* One span, because the readout is a flex row and loose text nodes
         between the numbers get the flex gap put in front of every comma. */
      if (rc.length > 1) return counted + voice(pickBy(SAY.wobbly, rep.total)) +
        "<span>rows of <b>" + rc.join("</b>, <b>") + "</b> — not the same yet</span>";
      return counted + "<span><b>" + rep.total + "</b> stones " + SAY.oneRow + "</span>";
    }

    const praise = s.rows === s.cols && s.rows > 1 ? SAY.square : pickBy(SAY.rectangle, s.total);
    return (c ? counted : chips(s.rows, s.cols) + BREAK) +
      voice(praise) +
      "<span><b>" + s.rows + "</b> rows of <b>" + s.cols + "</b> · <b>" + s.total + "</b> stones</span>";
  }

  /* ---- filling the reveal ----------------------------------------------- */

  /* Her name, once she has given it. Ember's lines go into innerHTML, so it
     is escaped here as well as sanitised on the way into storage — belt and
     braces on the one string in this game that a person typed. */
  let playerName = "";
  const esc = t => String(t).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function fill(text, rep) {
    const s = (rep && rep.shape) || { rows: 0, cols: 0, total: 0 };
    return String(text || "")
      /* The comma is eaten along with the placeholder when there is no name,
         so "You're not coming, {name}?" degrades to "You're not coming?"
         rather than to "You're not coming, you?". */
      .replace(/(,\s*)?\{name\}/g, (_, comma) =>
        playerName ? (comma || "") + esc(playerName) : "")
      .replace(/\{rows\}/g, s.rows)
      .replace(/\{cols\}/g, s.cols)
      .replace(/\{total\}/g, s.total)
      .replace(/\{area\}/g, s.rows * s.cols)
      .replace(/\{perimeter\}/g, 2 * (s.rows + s.cols))
      /* "3/4" in any text becomes a stacked fraction, written as on paper. */
      .replace(/\b(\d)\/(\d)\b/g, (_, a, b) => frac(a, b));
  }

  return { RULES, SAY, frac, passes, describe, counting, bridge, facts, sum, fill, chips, setName(n) { playerName = n || ""; } };
})();
